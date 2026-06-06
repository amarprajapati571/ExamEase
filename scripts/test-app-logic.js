const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

require("../src/data/triggerSuggestions.js");
require("../src/data/reflectionPrompts.js");
require("../src/utils/html.js");
require("../src/utils/cache.js");
require("../src/utils/validation.js");
require("../src/utils/riskAssessment.js");
require("../src/utils/moodAnalytics.js");
require("../src/utils/responseParser.js");
require("../src/data/mockWellnessResponse.js");
require("../src/services/aiService.js");
require("../src/components/Header/index.js");
require("../src/components/ErrorMessage/index.js");
require("../src/components/LoadingState/index.js");
require("../src/components/SafetyNotice/index.js");
require("../src/components/TriggerInsights/index.js");
require("../src/components/ReflectionJournal/index.js");
require("../src/components/MoodDashboard/index.js");
require("../src/components/CheckInForm/index.js");
require("../src/components/WellnessResult/index.js");

const app = globalThis.ExamEase;

function createStorage() {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(String(key), String(value)),
  };
}

function createValidForm(overrides = {}) {
  return {
    examType: "JEE",
    currentPhase: "Mock tests",
    moodScore: "3",
    stressLevel: "3",
    energyLevel: "3",
    sleepQuality: "Okay",
    triggers: ["Mock test scores"],
    reflection: "I feel nervous but ready to try one small step.",
    positiveMoment: "I reviewed one mistake.",
    supportPreference: "Help me focus",
    ...overrides,
  };
}

function createCheckIn(overrides = {}) {
  return {
    id: "checkin-test",
    date: "2026-06-06T06:00:00.000Z",
    examType: "JEE",
    phase: "Mock tests",
    moodScore: 3,
    stressLevel: 3,
    energyLevel: 3,
    sleepQuality: "Okay",
    trigger: "Mock test scores",
    reflection: "I feel nervous but ready to try one small step.",
    positiveMoment: "I reviewed one mistake.",
    supportPreference: "Help me focus",
    ...overrides,
  };
}

function createValidSupport(overrides = {}) {
  return {
    emotionalSummary: "You noticed exam stress and chose a small next step.",
    detectedPattern: "Stress is present around mock tests, with steady mood today.",
    triggerInsight: {
      mainTrigger: "Mock test scores",
      explanation: "Mock scores can feel personal, but they are useful for revision planning.",
    },
    wellnessSuggestions: [
      {
        title: "Focus One Block",
        description: "Choose one mistake type and revise it for one short block.",
        timeRequired: "10 min",
        category: "Focus",
      },
    ],
    quickExercise: {
      title: "Slow Exhale Reset",
      steps: ["Sit upright.", "Breathe in slowly.", "Exhale longer than you inhale."],
      duration: "2 min",
    },
    studyBalanceTip: "Pair one revision block with one screen-free break.",
    affirmation: "I can take the next useful step without judging the whole journey.",
    riskLevel: "Low",
    safetyMessage: "",
    nextCheckInPrompt: "What helped you feel slightly steadier today?",
    ...overrides,
  };
}

function testAssessRisk() {
  assert.ok(app.components);
  assert.strictEqual(typeof app.components.Header.renderHeader, "function");
  assert.strictEqual(typeof app.components.CheckInForm.renderCheckInForm, "function");
  assert.strictEqual(typeof app.components.WellnessResult.renderWellnessResult, "function");
  assert.strictEqual(typeof app.components.MoodDashboard.renderMoodDashboard, "function");

  const lowRisk = app.riskAssessment.assessRisk(createCheckIn({ moodScore: 4, stressLevel: 2 }));
  assert.strictEqual(lowRisk.level, "Low");
  assert.strictEqual(lowRisk.hasSensitiveReflection, false);
  assert.strictEqual(app.riskAssessment.assessRisk(createCheckIn({ stressLevel: 4 })).level, "Medium");
  assert.strictEqual(app.riskAssessment.assessRisk(createCheckIn({ moodScore: 2 })).level, "Medium");
  assert.strictEqual(app.riskAssessment.assessRisk(createCheckIn({ moodScore: 1, stressLevel: 5 })).level, "High");
  assert.strictEqual(app.riskAssessment.assessRisk(createCheckIn({ reflection: "I might hurt myself tonight." })).level, "High");
}

function testValidation() {
  assert.strictEqual(
    app.validation.validateForm(createValidForm({ examType: "" })).examType,
    "Please choose the exam type you are preparing for.",
  );
  assert.strictEqual(
    app.validation.validateForm(createValidForm({ moodScore: "" })).moodScore,
    "Please select a mood score from 1 to 5.",
  );
  assert.strictEqual(
    app.validation.validateForm(createValidForm({ stressLevel: "" })).stressLevel,
    "Please select a stress level from 1 to 5.",
  );
  assert.strictEqual(
    app.validation.validateForm(createValidForm({ reflection: "a".repeat(501) })).reflection,
    "Please keep your reflection under 500 characters.",
  );
  assert.strictEqual(
    app.validation.validateForm(createValidForm({ triggers: [] })).triggers,
    "Please select at least one stress trigger.",
  );
  assert.strictEqual(app.validation.validateForm(createValidForm({ triggers: ["Mock test scores", "Burnout"] })).triggers, undefined);
}

async function testAiResponseValidationAndFallback() {
  assert.strictEqual(app.responseParser.isValidWellnessSupport(createValidSupport()), true);
  assert.strictEqual(app.responseParser.isValidWellnessSupport({ emotionalSummary: "Missing most fields" }), false);

  let support = await app.aiService.generateWellnessSupport(createCheckIn(), [], {
    supportCache: new Map(),
    cacheStorage: createStorage(),
    fetchImpl: async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError("Malformed JSON");
      },
    }),
  });
  assert.strictEqual(app.responseParser.isValidWellnessSupport(support), true);

  support = await app.aiService.generateWellnessSupport(createCheckIn(), [], {
    supportCache: new Map(),
    cacheStorage: createStorage(),
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ support: { emotionalSummary: "Still missing fields" } }),
    }),
  });
  assert.strictEqual(app.responseParser.isValidWellnessSupport(support), true);
  assert.strictEqual(support.triggerInsight.mainTrigger, "Mock test scores");
}

async function testCacheLogic() {
  let calls = 0;
  const supportCache = new Map();
  const fetchImpl = async () => {
    calls += 1;
    return {
      ok: true,
      json: async () => ({ support: createValidSupport({ affirmation: `Generated ${calls}` }) }),
    };
  };

  const first = await app.aiService.generateWellnessSupport(createCheckIn(), [], {
    supportCache,
    cacheStorage: createStorage(),
    fetchImpl,
  });
  const second = await app.aiService.generateWellnessSupport(createCheckIn(), [], {
    supportCache,
    cacheStorage: createStorage(),
    fetchImpl,
  });

  assert.strictEqual(calls, 1);
  assert.strictEqual(second.affirmation, first.affirmation);

  await app.aiService.generateWellnessSupport(createCheckIn({ reflection: "Different reflection input." }), [], {
    supportCache,
    cacheStorage: createStorage(),
    fetchImpl,
  });
  assert.strictEqual(calls, 2);

  const errors = app.validation.validateForm(createValidForm({ examType: "", moodScore: "", stressLevel: "", triggers: [] }));
  assert.ok(Object.keys(errors).length > 0);
}

function testComponentBehavior() {
  const formHtml = app.components.CheckInForm.renderCheckInForm({
    form: app.validation.createInitialForm(),
    errors: {},
    loading: true,
    latestPrompt: "What helped today?",
  });
  assert.match(formHtml, /<button class="primary-button" type="submit" disabled>Generate Support<\/button>/);
  assert.match(formHtml, /type="checkbox" name="triggers"/);

  const highRiskHtml = app.components.WellnessResult.renderWellnessResult({
    result: createValidSupport({
      riskLevel: "High",
      emotionalSummary: "This check-in sounds very heavy.",
      safetyMessage: "Please contact a trusted person now.",
    }),
    plan: app.mockWellnessResponse.createPersonalizedWellnessPlan(createCheckIn()),
    loading: false,
  });
  assert.match(highRiskHtml, /You do not have to handle this alone/);
  assert.match(highRiskHtml, /Temporary grounding exercise/);

  const dashboardHtml = app.components.MoodDashboard.renderMoodDashboard({
    checkIns: [],
    summary: app.moodAnalytics.getDashboardSummary([]),
    triggerCounts: {},
    triggerInsights: [],
    recentReflections: [],
    latestPrompt: "What helped today?",
  });
  assert.match(dashboardHtml, /Dashboard/);

  const journalHtml = app.components.ReflectionJournal.renderReflectionJournal({
    latestPrompt: "What helped today?",
    recentReflections: [
      createCheckIn({
        id: "reflection-1",
        reflection: "I handled one topic better today.",
        positiveMoment: "I asked for help.",
      }),
    ],
  });
  assert.match(journalHtml, /I handled one topic better today/);
  assert.match(journalHtml, /I asked for help/);
}

function testBrowserBootScriptOrder() {
  const root = path.resolve(__dirname, "..");
  const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scriptSources = Array.from(indexSource.matchAll(/<script src="([^"]+)"><\/script>/g), (match) => match[1]);
  const appNode = { innerHTML: "" };
  const formNode = { addEventListener() {} };
  const context = {
    console,
    FormData,
    document: {
      querySelector(selector) {
        if (selector === "#app") {
          return appNode;
        }

        if (selector === "#checkin-form") {
          return formNode;
        }

        return null;
      },
    },
    fetch: async () => ({ ok: false, json: async () => ({}) }),
    localStorage: createStorage(),
    sessionStorage: createStorage(),
    crypto: { randomUUID: () => "browser-test-id" },
    requestAnimationFrame(callback) {
      callback();
    },
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);

  for (const scriptSrc of scriptSources) {
    const source = fs.readFileSync(path.join(root, scriptSrc), "utf8");
    vm.runInContext(source, context, { filename: scriptSrc });
  }

  assert.ok(context.ExamEase.components.Header.renderHeader);
  assert.match(appNode.innerHTML, /ExamEase/);
  assert.match(appNode.innerHTML, /Daily Check-In/);
}

async function run() {
  testAssessRisk();
  testValidation();
  await testAiResponseValidationAndFallback();
  await testCacheLogic();
  testComponentBehavior();
  testBrowserBootScriptOrder();
  console.log("App logic tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
