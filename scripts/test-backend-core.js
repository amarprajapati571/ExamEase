const assert = require("assert");
const {
  assessRisk,
  buildPrompt,
  createFallbackWellnessSupport,
  createRateLimiter,
  getWellnessSupport,
  isValidWellnessSupport,
  normalizeCheckInInput,
  normalizeHistoryInput,
  normalizeTriggerName,
} = require("../lib/wellness-support-core");

function createCheckIn(overrides = {}) {
  return {
    examType: "JEE",
    phase: "Mock tests",
    moodScore: 3,
    stressLevel: 3,
    energyLevel: 3,
    sleepQuality: "Okay",
    trigger: "Mock test scores",
    reflection: "I feel nervous but ready to try one small step.",
    supportPreference: "Help me focus",
    ...overrides,
  };
}

function createSupport(overrides = {}) {
  return {
    emotionalSummary: "You noticed exam stress and chose one small step.",
    detectedPattern: "Stress is present around mock tests, with steady mood today.",
    triggerInsight: {
      mainTrigger: "Mock test scores",
      explanation: "Mock scores can guide revision planning.",
    },
    wellnessSuggestions: [
      {
        title: "Focus One Block",
        description: "Choose one mistake type and revise it for one short block.",
        timeRequired: "10 min",
        category: "Focus",
      },
      {
        title: "Name It To Someone",
        description: "Tell one trusted person what felt difficult today.",
        timeRequired: "5 min",
        category: "Reflection",
      },
    ],
    quickExercise: {
      title: "Slow Exhale Reset",
      steps: ["Sit upright.", "Breathe in slowly.", "Exhale longer than you inhale."],
      duration: "2 min",
    },
    studyBalanceTip: "Pair one revision block with one screen-free break.",
    affirmation: "I can take the next useful step.",
    riskLevel: "Low",
    safetyMessage: "",
    nextCheckInPrompt: "What helped you feel slightly steadier today?",
    ...overrides,
  };
}

function testNormalization() {
  assert.strictEqual(normalizeTriggerName("Low mock test score"), "Mock test scores");
  assert.strictEqual(normalizeTriggerName("Results uncertainty"), "Result uncertainty");

  const normalized = normalizeCheckInInput({
    ...createCheckIn(),
    trigger: "Low mock test score",
    examType: "JEE ".repeat(30),
    reflection: "I feel   spaced   out.",
  });

  assert.strictEqual(normalized.trigger, "Mock test scores");
  assert.strictEqual(normalized.examType.length, 40);
  assert.strictEqual(normalized.reflection, "I feel spaced out.");
  assert.strictEqual(normalizeCheckInInput(createCheckIn({ moodScore: 8 })), null);
  assert.strictEqual(normalizeCheckInInput(createCheckIn({ sleepQuality: "Terrible" })), null);
  assert.strictEqual(normalizeHistoryInput(createCheckIn({ supportPreference: "Unknown" })).supportPreference, "Calm me down");
}

function testRiskAndFallback() {
  assert.strictEqual(assessRisk(createCheckIn()).level, "Low");
  assert.strictEqual(assessRisk(createCheckIn({ stressLevel: 5 })).level, "Medium");
  assert.strictEqual(assessRisk(createCheckIn({ moodScore: 1, stressLevel: 5 })).level, "High");
  assert.strictEqual(assessRisk(createCheckIn({ reflection: "I might hurt myself." })).hasSensitiveReflection, true);

  const fallback = createFallbackWellnessSupport(createCheckIn({ moodScore: 1, stressLevel: 5 }));
  assert.strictEqual(fallback.riskLevel, "High");
  assert.strictEqual(isValidWellnessSupport(fallback), true);
  assert.match(fallback.safetyMessage, /local emergency service/);
}

async function testGptPathAndSafetyOverride() {
  let requestBody;
  const result = await getWellnessSupport({
    checkInData: createCheckIn({ moodScore: 1, stressLevel: 5 }),
    recentHistory: [],
    apiKey: "test-key",
    model: "gpt-test",
    fetchImpl: async (url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ output_text: JSON.stringify(createSupport()) }),
      };
    },
  });

  assert.strictEqual(result.source, "ai");
  assert.strictEqual(result.support.riskLevel, "High");
  assert.strictEqual(requestBody.model, "gpt-test");
  assert.ok(requestBody.text.format.schema);
  assert.match(buildPrompt(createCheckIn(), []), /Return valid JSON only/);
}

async function testFallbackWhenGptUnavailable() {
  const result = await getWellnessSupport({
    checkInData: createCheckIn(),
    recentHistory: [],
    apiKey: "test-key",
    model: "gpt-test",
    fetchImpl: async () => ({ ok: false }),
  });

  assert.strictEqual(result.source, "fallback");
  assert.strictEqual(isValidWellnessSupport(result.support), true);
}

function testRateLimit() {
  const isAllowed = createRateLimiter({ windowMs: 10_000, max: 2 });

  assert.strictEqual(isAllowed("student"), true);
  assert.strictEqual(isAllowed("student"), true);
  assert.strictEqual(isAllowed("student"), false);
  assert.strictEqual(isAllowed("another-student"), true);
}

async function run() {
  testNormalization();
  testRiskAndFallback();
  await testGptPathAndSafetyOverride();
  await testFallbackWhenGptUnavailable();
  testRateLimit();
  console.log("Backend core tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
