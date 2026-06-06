const examTypes = ["Board exams", "NEET", "JEE", "CUET", "CAT", "GATE", "UPSC", "Other"];
const currentPhases = [
  "Preparation",
  "Revision",
  "Mock tests",
  "Final exam week",
  "Waiting for results",
  "Result day",
  "After results",
];
const sleepOptions = ["Poor", "Okay", "Good", "Excellent"];
const stressTriggers = [
  "Syllabus pressure",
  "Low mock test score",
  "Family expectations",
  "Peer comparison",
  "Fear of failure",
  "Time management",
  "Results uncertainty",
  "Burnout",
  "Lack of motivation",
  "Other",
];
const supportPreferences = [
  "Calm me down",
  "Help me focus",
  "Motivate me",
  "Help me plan my day",
  "Help with result anxiety",
  "Help with burnout",
];
const suggestionCategories = ["Breathing", "Focus", "Motivation", "Rest", "Planning", "Reflection"];
const timeOptions = ["2 min", "5 min", "10 min", "15 min"];
const riskLevels = ["Low", "Medium", "High"];
const storageKey = "examease.checkIns.v1";
const {
  calculateAverageMood,
  calculateAverageStress,
  findMostCommonTrigger,
  getMoodTrend,
  getStressTrend,
} = window.trackingUtils;

const initialForm = {
  examType: "",
  currentPhase: "Preparation",
  moodScore: "",
  stressLevel: "",
  energyLevel: "3",
  sleepQuality: "Okay",
  triggers: [],
  reflection: "",
  supportPreference: "Calm me down",
};

const mockEntries = [
  {
    id: "sample-1",
    date: "Mon",
    examType: "NEET",
    phase: "Mock tests",
    moodScore: 3,
    stressLevel: 4,
    energyLevel: 3,
    sleepQuality: "Okay",
    trigger: "Low mock test score",
    reflection: "Felt worried after a low score, but revised mistakes calmly.",
    supportPreference: "Help me focus",
  },
  {
    id: "sample-2",
    date: "Tue",
    examType: "JEE",
    phase: "Revision",
    moodScore: 4,
    stressLevel: 3,
    energyLevel: 4,
    sleepQuality: "Good",
    trigger: "Syllabus pressure",
    reflection: "Breaking chapters into smaller blocks helped.",
    supportPreference: "Help me plan my day",
  },
  {
    id: "sample-3",
    date: "Wed",
    examType: "Board exams",
    phase: "Preparation",
    moodScore: 2,
    stressLevel: 5,
    energyLevel: 2,
    sleepQuality: "Poor",
    trigger: "Peer comparison",
    reflection: "Needed a break after checking group chats too often.",
    supportPreference: "Calm me down",
  },
  {
    id: "sample-4",
    date: "Thu",
    examType: "GATE",
    phase: "Revision",
    moodScore: 4,
    stressLevel: 2,
    energyLevel: 4,
    sleepQuality: "Excellent",
    trigger: "Burnout",
    reflection: "Slept earlier and felt more steady during revision.",
    supportPreference: "Help with burnout",
  },
  {
    id: "sample-5",
    date: "Fri",
    examType: "CUET",
    phase: "Waiting for results",
    moodScore: 3,
    stressLevel: 3,
    energyLevel: 3,
    sleepQuality: "Okay",
    trigger: "Results uncertainty",
    reflection: "Talked to a friend and felt less alone.",
    supportPreference: "Help with result anxiety",
  },
];

const savedCheckIns = loadStoredCheckIns();

const state = {
  form: { ...initialForm },
  latestResult: createFallbackWellnessSupport(
    {
      id: "sample-current",
      date: "Today",
      examType: "JEE",
      phase: "Mock tests",
      moodScore: 3,
      stressLevel: 3,
      energyLevel: 3,
      sleepQuality: "Okay",
      trigger: "Syllabus pressure",
      reflection: "I feel behind, but I want to restart with a calmer plan.",
      supportPreference: "Help me plan my day",
    },
    mockEntries,
  ),
  checkIns: savedCheckIns.length ? savedCheckIns : [...mockEntries],
  loading: false,
  errors: {},
};

function App() {
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      ${Header()}
      <main>
        <div class="main-grid">
          ${CheckInForm()}
          ${WellnessResult(state.latestResult)}
        </div>
        ${MoodDashboard(state.checkIns)}
      </main>
    </div>
  `;

  bindFormEvents();
}

function Header() {
  return `
    <header class="page-header">
      <div class="header-inner">
        <div class="brand-block">
          <h1 class="app-name">ExamEase</h1>
          <p class="tagline">A calm daily wellness tracker for students navigating exams, preparation pressure, and result seasons.</p>
        </div>
        <span class="status-pill">Wellness support, not diagnosis</span>
      </div>
    </header>
  `;
}

function CheckInForm() {
  return `
    <section class="panel form-panel" aria-labelledby="checkin-title">
      <h2 class="section-heading" id="checkin-title">Daily Check-In</h2>
      <form class="checkin-form" id="checkin-form" novalidate>
        ${ValidationSummary()}
        <div class="field-grid">
          ${SelectField("examType", "Exam type", examTypes, "Choose exam type", true)}
          ${SelectField("currentPhase", "Current phase", currentPhases, "", true)}
          ${RatingField("moodScore", "Mood score", ["Very low", "Low", "Okay", "Good", "Very good"], true)}
          ${RatingField("stressLevel", "Stress level", ["Low", "Manageable", "Moderate", "High", "Very high"], true)}
          ${RatingField("energyLevel", "Energy level", ["Very low", "Low", "Okay", "Good", "High"], false)}
          ${SelectField("sleepQuality", "Sleep quality", sleepOptions, "", true)}
          ${TriggerCheckboxes()}
          ${ReflectionField()}
          ${SelectField("supportPreference", "Support preference", supportPreferences, "", true)}
        </div>

        <div class="submit-row">
          <button class="primary-button" type="submit" ${state.loading ? "disabled" : ""}>Generate Support</button>
          <p class="subtle-note">Guidance is generated through the backend when configured, with a safe fallback if unavailable.</p>
        </div>
        ${LoadingState()}
      </form>
    </section>
  `;
}

function ValidationSummary() {
  const messages = Object.values(state.errors);

  if (!messages.length) {
    return "";
  }

  return `
    <div class="error-message is-visible" role="alert">
      <strong>Let us complete a few details first:</strong>
      <ul>
        ${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function SelectField(id, label, options, placeholder, required) {
  const value = state.form[id];
  const error = state.errors[id];
  const describedBy = error ? `${id}-error` : "";

  return `
    <div class="field ${error ? "has-error" : ""}">
      <label for="${id}">${label}${required ? " <span aria-hidden=\"true\">*</span>" : ""}</label>
      <select id="${id}" name="${id}" ${required ? "required" : ""} ${error ? 'aria-invalid="true"' : ""} ${describedBy ? `aria-describedby="${describedBy}"` : ""}>
        ${placeholder ? `<option value="">${placeholder}</option>` : ""}
        ${options
          .map(
            (option) =>
              `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`,
          )
          .join("")}
      </select>
      ${InlineError(id)}
    </div>
  `;
}

function RatingField(id, label, labels, required) {
  const value = state.form[id];
  const error = state.errors[id];
  const describedBy = [`${id}-hint`, error ? `${id}-error` : ""].filter(Boolean).join(" ");

  return `
    <fieldset class="field rating-field ${error ? "has-error" : ""}" ${error ? 'aria-invalid="true"' : ""} aria-describedby="${describedBy}">
      <legend>${label}${required ? " <span aria-hidden=\"true\">*</span>" : ""}</legend>
      <p class="field-hint" id="${id}-hint">1 = ${escapeHtml(labels[0])}, 5 = ${escapeHtml(labels[4])}</p>
      <div class="rating-options">
        ${labels
          .map((ratingLabel, index) => {
            const ratingValue = String(index + 1);
            return `
              <label class="rating-option">
                <input type="radio" name="${id}" value="${ratingValue}" ${value === ratingValue ? "checked" : ""} />
                <span>${ratingValue}</span>
                <small>${escapeHtml(ratingLabel)}</small>
              </label>
            `;
          })
          .join("")}
      </div>
      ${InlineError(id)}
    </fieldset>
  `;
}

function TriggerCheckboxes() {
  const error = state.errors.triggers;
  const describedBy = ["triggers-hint", error ? "triggers-error" : ""].filter(Boolean).join(" ");

  return `
    <fieldset class="field full-width trigger-field ${error ? "has-error" : ""}" ${error ? 'aria-invalid="true"' : ""} aria-describedby="${describedBy}">
      <legend>Main stress trigger <span aria-hidden="true">*</span></legend>
      <p class="field-hint" id="triggers-hint">Select at least one trigger that feels relevant today.</p>
      <div class="checkbox-grid">
        ${stressTriggers
          .map(
            (trigger) => `
              <label class="check-option">
                <input type="checkbox" name="triggers" value="${escapeHtml(trigger)}" ${state.form.triggers.includes(trigger) ? "checked" : ""} />
                <span>${escapeHtml(trigger)}</span>
              </label>
            `,
          )
          .join("")}
      </div>
      ${InlineError("triggers")}
    </fieldset>
  `;
}

function ReflectionField() {
  const error = state.errors.reflection;
  const length = state.form.reflection.length;

  return `
    <div class="field full-width ${error ? "has-error" : ""}">
      <label for="reflection">Reflection note</label>
      <textarea id="reflection" name="reflection" maxlength="500" ${error ? 'aria-invalid="true"' : ""} aria-describedby="reflection-help reflection-count ${error ? "reflection-error" : ""}" placeholder="What is one thing you are feeling right now?">${escapeHtml(state.form.reflection)}</textarea>
      <div class="field-footer">
        <p class="field-hint" id="reflection-help">What is one thing you are feeling right now?</p>
        <output id="reflection-count" class="char-count" for="reflection">${length}/500</output>
      </div>
      ${InlineError("reflection")}
    </div>
  `;
}

function InlineError(id) {
  if (!state.errors[id]) {
    return "";
  }

  return `<p class="field-error" id="${id}-error">${escapeHtml(state.errors[id])}</p>`;
}

function WellnessResult(result) {
  return `
    <section class="panel result-panel" aria-labelledby="result-title" aria-live="polite">
      <h2 class="section-heading" id="result-title">Wellness Support</h2>
      <div class="result-stack">
        <article class="result-card">
          <h3>Emotional summary</h3>
          <p>${escapeHtml(result.emotionalSummary)}</p>
        </article>
        <article class="result-card">
          <h3>Detected pattern</h3>
          <p>${escapeHtml(result.detectedPattern)}</p>
        </article>
        ${TriggerInsights(result)}
        ${SupportSuggestions(result.wellnessSuggestions)}
        <article class="result-card">
          <h3>${escapeHtml(result.quickExercise.title)}</h3>
          <ol class="exercise-list">
            ${result.quickExercise.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ol>
          <p class="time-note">${escapeHtml(result.quickExercise.duration)}</p>
        </article>
        <article class="result-card">
          <h3>Study-life balance suggestion</h3>
          <p>${escapeHtml(result.studyBalanceTip)}</p>
        </article>
        <article class="result-card">
          <h3>Positive affirmation</h3>
          <p>${escapeHtml(result.affirmation)}</p>
        </article>
        <article class="result-card risk-card risk-${result.riskLevel.toLowerCase()}">
          <h3>Risk level</h3>
          <p>${escapeHtml(result.riskLevel)}</p>
        </article>
        ${SafetyNotice(result)}
        <article class="result-card">
          <h3>Next check-in prompt</h3>
          <p>${escapeHtml(result.nextCheckInPrompt)}</p>
        </article>
      </div>
    </section>
  `;
}

function TriggerInsights(result) {
  return `
    <article class="result-card">
      <h3>Stress trigger insights</h3>
      <p><strong>${escapeHtml(result.triggerInsight.mainTrigger)}:</strong> ${escapeHtml(result.triggerInsight.explanation)}</p>
    </article>
  `;
}

function SupportSuggestions(suggestions) {
  return `
    <article class="result-card">
      <h3>Personalized wellness suggestions</h3>
      <ul class="suggestion-list">
        ${suggestions
          .map(
            (suggestion) => `
              <li>
                <strong>${escapeHtml(suggestion.title)}</strong>
                <span>${escapeHtml(suggestion.description)}</span>
                <small>${escapeHtml(suggestion.category)} - ${escapeHtml(suggestion.timeRequired)}</small>
              </li>
            `,
          )
          .join("")}
      </ul>
    </article>
  `;
}

function SafetyNotice(result) {
  if (!result.safetyMessage) {
    return "";
  }

  return `
    <article class="result-card safety-notice" role="status">
      <h3>Safety message</h3>
      <p>${escapeHtml(result.safetyMessage)}</p>
    </article>
  `;
}

function LoadingState() {
  return `<div class="loading-state ${state.loading ? "is-visible" : ""}" role="status">Preparing supportive guidance...</div>`;
}

function MoodDashboard(checkIns) {
  const averageMood = calculateAverageMood(checkIns);
  const averageStress = calculateAverageStress(checkIns);
  const commonTrigger = findMostCommonTrigger(checkIns);
  const moodTrend = getMoodTrend(checkIns);
  const stressTrend = getStressTrend(checkIns);
  const simpleInsight = getSimpleInsight(checkIns, { moodTrend, stressTrend, commonTrigger });

  return `
    <section class="dashboard-wrap" aria-labelledby="dashboard-title">
      <div class="panel dashboard-panel">
        <h2 class="section-heading" id="dashboard-title">Dashboard</h2>
        <div class="dashboard-grid">
          <article class="metric-card">
            <h3>Mood trend</h3>
            <span class="metric-value teal">${averageMood}/5</span>
            <p>${escapeHtml(moodTrend)}</p>
            ${MiniBars(checkIns, "moodScore", "mood")}
          </article>
          <article class="metric-card">
            <h3>Stress trend</h3>
            <span class="metric-value coral">${averageStress}/5</span>
            <p>${escapeHtml(stressTrend)}</p>
            ${MiniBars(checkIns, "stressLevel", "stress")}
          </article>
          <article class="metric-card">
            <h3>Most common trigger</h3>
            <span class="metric-value amber trigger-value">${escapeHtml(commonTrigger || "None yet")}</span>
            ${CommonTriggers(checkIns)}
          </article>
          <article class="metric-card insight-card">
            <h3>Simple insight</h3>
            <p>${escapeHtml(simpleInsight)}</p>
          </article>
          ${ReflectionJournal(checkIns)}
        </div>
      </div>
    </section>
  `;
}

function MiniBars(checkIns, key, type) {
  const bars = checkIns
    .slice(-7)
    .map((entry) => {
      const height = Math.max(10, entry[key] * 14);
      return `<span class="mini-bar ${type === "stress" ? "stress" : ""}" style="height: ${height}px" title="${formatCheckInDate(entry.date)}: ${entry[key]} out of 5"></span>`;
    })
    .join("");

  return `<div class="mini-bars" aria-label="${type} values for recent check-ins">${bars}</div>`;
}

function CommonTriggers(checkIns) {
  const counts = checkIns.reduce((acc, entry) => {
    acc[entry.trigger] = (acc[entry.trigger] || 0) + 1;
    return acc;
  }, {});

  const values = Object.values(counts);

  if (!values.length) {
    return `<p>No triggers tracked yet.</p>`;
  }

  const max = Math.max(...values);

  return `
    <ul class="trigger-list">
      ${Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([trigger, count]) => {
          const width = Math.round((count / max) * 100);
          return `
            <li class="trigger-item">
              <div class="trigger-row"><span>${escapeHtml(trigger)}</span><strong>${count}</strong></div>
              <div class="trigger-track" aria-hidden="true"><span class="trigger-fill" style="width: ${width}%"></span></div>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

function ReflectionJournal(checkIns) {
  return `
    <article class="reflection-card">
      <h3>Recent check-ins</h3>
      <ul class="reflection-list">
        ${checkIns
          .slice(-5)
          .reverse()
          .map(
            (entry) => `
              <li>
                <span class="reflection-meta">${escapeHtml(formatCheckInDate(entry.date))} - ${escapeHtml(entry.examType)} - ${escapeHtml(entry.phase)} - ${escapeHtml(entry.trigger)}</span>
                ${entry.reflection ? escapeHtml(entry.reflection) : "No reflection added."}
              </li>
            `,
          )
          .join("")}
      </ul>
    </article>
  `;
}

function bindFormEvents() {
  const form = document.querySelector("#checkin-form");
  const reflection = document.querySelector("#reflection");

  form.addEventListener("input", () => {
    captureForm(form);
    if (reflection) {
      document.querySelector("#reflection-count").value = `${reflection.value.length}/500`;
    }
  });

  form.addEventListener("change", () => {
    captureForm(form);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    captureForm(form);

    const errors = validateForm(state.form);
    state.errors = errors;

    if (Object.keys(errors).length) {
      App();
      focusFirstError(errors);
      return;
    }

    const checkIn = normalizeCheckIn(state.form);
    const recentHistory = state.checkIns.slice(-7);

    state.loading = true;
    App();

    const support = await generateWellnessSupport(checkIn, recentHistory);

    state.loading = false;
    state.latestResult = support;
    state.checkIns = [...state.checkIns, checkIn];
    saveStoredCheckIns(state.checkIns);
    App();
  });
}

function captureForm(form) {
  const formData = new FormData(form);

  state.form = {
    examType: String(formData.get("examType") || ""),
    currentPhase: String(formData.get("currentPhase") || ""),
    moodScore: String(formData.get("moodScore") || ""),
    stressLevel: String(formData.get("stressLevel") || ""),
    energyLevel: String(formData.get("energyLevel") || ""),
    sleepQuality: String(formData.get("sleepQuality") || ""),
    triggers: formData.getAll("triggers").map(String),
    reflection: String(formData.get("reflection") || "").slice(0, 500),
    supportPreference: String(formData.get("supportPreference") || ""),
  };
}

function validateForm(form) {
  const errors = {};

  if (!form.examType) {
    errors.examType = "Please choose the exam type you are preparing for.";
  }

  if (!form.moodScore) {
    errors.moodScore = "Please select a mood score from 1 to 5.";
  }

  if (!form.stressLevel) {
    errors.stressLevel = "Please select a stress level from 1 to 5.";
  }

  if (!form.triggers.length) {
    errors.triggers = "Please select at least one stress trigger.";
  }

  if (form.reflection.length > 500) {
    errors.reflection = "Please keep your reflection under 500 characters.";
  }

  return errors;
}

function focusFirstError(errors) {
  const firstKey = Object.keys(errors)[0];
  const field = document.querySelector(`[name="${firstKey}"], #${firstKey}`);

  if (field) {
    field.focus();
  }
}

function normalizeCheckIn(form) {
  return {
    id: createCheckInId(),
    date: new Date().toISOString(),
    examType: form.examType,
    phase: form.currentPhase,
    moodScore: Number(form.moodScore),
    stressLevel: Number(form.stressLevel),
    energyLevel: Number(form.energyLevel),
    sleepQuality: form.sleepQuality,
    trigger: form.triggers[0],
    reflection: form.reflection.trim(),
    supportPreference: form.supportPreference,
  };
}

async function generateWellnessSupport(checkInData, recentHistory) {
  try {
    const response = await fetch("/api/wellness-support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkInData, recentHistory }),
    });

    if (!response.ok) {
      throw new Error("Wellness API is unavailable.");
    }

    const data = await response.json();
    const candidate = data.support || data;

    if (!isValidWellnessSupport(candidate)) {
      throw new Error("Wellness API returned an invalid response.");
    }

    return applySafetyOverride(candidate, checkInData);
  } catch (error) {
    return createFallbackWellnessSupport(checkInData, recentHistory);
  }
}

function createFallbackWellnessSupport(checkIn, recentHistory = []) {
  const primaryTrigger = getPrimaryTrigger(checkIn);
  const highRisk = isHighRiskCheckIn(checkIn);
  const mediumRisk = !highRisk && (checkIn.stressLevel >= 4 || checkIn.moodScore <= 2);
  const riskLevel = highRisk ? "High" : mediumRisk ? "Medium" : "Low";
  const lowEnergy = checkIn.energyLevel <= 2;
  const poorSleep = checkIn.sleepQuality === "Poor";
  const trend = summarizeRecentTrend(recentHistory);

  return {
    emotionalSummary: highRisk
      ? `This check-in sounds very heavy, especially around ${primaryTrigger.toLowerCase()}. You deserve immediate support from someone safe and trusted.`
      : `You named what is affecting you today: ${primaryTrigger.toLowerCase()}. That awareness can make the next step feel clearer.`,
    detectedPattern:
      trend ||
      `Mood is at ${checkIn.moodScore}/5 and stress is at ${checkIn.stressLevel}/5, with ${primaryTrigger.toLowerCase()} as the strongest pressure point today.`,
    triggerInsight: {
      mainTrigger: primaryTrigger,
      explanation: poorSleep
        ? "This trigger may feel stronger because poor sleep can reduce patience, focus, and emotional steadiness."
        : "This trigger can become harder when it stays vague. Turning it into one small next action can reduce the mental load.",
    },
    wellnessSuggestions: buildSuggestions(checkIn, { lowEnergy, poorSleep }),
    quickExercise: {
      title: "Steady Breathing Reset",
      steps: [
        "Place both feet on the floor and relax your shoulders.",
        "Inhale for 4 counts, hold for 2, and exhale for 6.",
        "Repeat 4 rounds, then write one small next step.",
      ],
      duration: "2 min",
    },
    studyBalanceTip:
      "Pair one study target with one recovery target today, such as finishing a short revision block and taking a screen-free break afterward.",
    affirmation:
      "My worth is bigger than one score, one exam, or one uncertain result. I can take the next step with patience.",
    riskLevel,
    safetyMessage:
      riskLevel === "High"
        ? "Your distress may be high right now. Please reach out immediately to a trusted adult, counselor, local emergency service, or crisis helpline, especially if you might harm yourself or feel unsafe."
        : riskLevel === "Medium"
          ? "This seems like a good time to talk to a trusted friend, family member, teacher, counselor, or mentor. Support can make exam pressure easier to carry."
          : "",
    nextCheckInPrompt: "What helped even a little today, and what support would make tomorrow easier?",
  };
}

function buildSuggestions(checkIn, flags) {
  const preferenceSuggestions = {
    "Calm me down": {
      title: "Start With A Reset",
      description: "Pause for a short breathing exercise before opening your books again.",
      timeRequired: "2 min",
      category: "Breathing",
    },
    "Help me focus": {
      title: "Make One Block Visible",
      description: "Choose one topic, one timer, and one notebook page for the next study block.",
      timeRequired: "10 min",
      category: "Focus",
    },
    "Motivate me": {
      title: "Restart Small",
      description: "Write one reason this effort matters, then complete one tiny revision task.",
      timeRequired: "5 min",
      category: "Motivation",
    },
    "Help me plan my day": {
      title: "Three-Part Plan",
      description: "Pick one must-do, one should-do, and one recovery action for today.",
      timeRequired: "5 min",
      category: "Planning",
    },
    "Help with result anxiety": {
      title: "Separate Waiting From Action",
      description: "Write what you are waiting to know, then choose one grounding activity you can do now.",
      timeRequired: "10 min",
      category: "Reflection",
    },
    "Help with burnout": {
      title: "Lower The Load",
      description: "Use a lighter revision task, hydrate, and take a real pause without judging yourself.",
      timeRequired: "15 min",
      category: "Rest",
    },
  };

  return [
    preferenceSuggestions[checkIn.supportPreference],
    flags.lowEnergy
      ? {
          title: "Use A Lighter Study Block",
          description: "Set a 20 minute timer and revise something familiar instead of forcing a long session.",
          timeRequired: "10 min",
          category: "Focus",
        }
      : {
          title: "Protect One Focus Window",
          description: "Study before checking scores, messages, or comparison-heavy spaces.",
          timeRequired: "15 min",
          category: "Focus",
        },
    flags.poorSleep
      ? {
          title: "Protect Tonight's Sleep",
          description: "End intense revision earlier and keep your phone away from bed.",
          timeRequired: "5 min",
          category: "Rest",
        }
      : {
          title: "Name It To Someone",
          description: "Tell one trusted person what felt difficult today so you do not carry it alone.",
          timeRequired: "5 min",
          category: "Reflection",
        },
  ];
}

function isValidWellnessSupport(value) {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.emotionalSummary) &&
    isNonEmptyString(value.detectedPattern) &&
    isPlainObject(value.triggerInsight) &&
    isNonEmptyString(value.triggerInsight.mainTrigger) &&
    isNonEmptyString(value.triggerInsight.explanation) &&
    Array.isArray(value.wellnessSuggestions) &&
    value.wellnessSuggestions.length > 0 &&
    value.wellnessSuggestions.every(isValidSuggestion) &&
    isPlainObject(value.quickExercise) &&
    isNonEmptyString(value.quickExercise.title) &&
    Array.isArray(value.quickExercise.steps) &&
    value.quickExercise.steps.length >= 3 &&
    value.quickExercise.steps.every(isNonEmptyString) &&
    isNonEmptyString(value.quickExercise.duration) &&
    isNonEmptyString(value.studyBalanceTip) &&
    isNonEmptyString(value.affirmation) &&
    riskLevels.includes(value.riskLevel) &&
    typeof value.safetyMessage === "string" &&
    isNonEmptyString(value.nextCheckInPrompt)
  );
}

function isValidSuggestion(suggestion) {
  return (
    isPlainObject(suggestion) &&
    isNonEmptyString(suggestion.title) &&
    isNonEmptyString(suggestion.description) &&
    timeOptions.includes(suggestion.timeRequired) &&
    suggestionCategories.includes(suggestion.category)
  );
}

function applySafetyOverride(support, checkIn) {
  if (!isHighRiskCheckIn(checkIn)) {
    return support;
  }

  return {
    ...support,
    riskLevel: "High",
    safetyMessage:
      "Your distress may be high right now. Please reach out immediately to a trusted adult, counselor, local emergency service, or crisis helpline, especially if you might harm yourself or feel unsafe.",
  };
}

function summarizeRecentTrend(recentHistory) {
  if (!recentHistory.length) {
    return "";
  }

  const averageMood = calculateAverageMood(recentHistory);
  const averageStress = calculateAverageStress(recentHistory);

  return `Recent check-ins show average mood around ${averageMood}/5 and stress around ${averageStress}/5, so today's support should stay practical and gentle.`;
}

function getSimpleInsight(checkIns, trends) {
  const recent = checkIns.slice(-5);

  if (trends.stressTrend === "Stress is increasing") {
    return "Stress is increasing";
  }

  if (trends.moodTrend === "Mood is improving") {
    return "Mood is improving";
  }

  if (recent.length >= 2) {
    const lowSleepWithLowEnergy = recent.filter(
      (entry) => (entry.sleepQuality === "Poor" || entry.sleepQuality === "Okay") && entry.energyLevel <= 2,
    );

    if (lowSleepWithLowEnergy.length >= 2) {
      return "Sleep may be affecting your energy";
    }
  }

  if (trends.commonTrigger && /mock/i.test(trends.commonTrigger)) {
    return "Mock test pressure appears often";
  }

  return trends.commonTrigger
    ? `${trends.commonTrigger} appears most often in recent check-ins`
    : "Complete a check-in to see a pattern";
}

function loadStoredCheckIns() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed) ? parsed.map(normalizeStoredCheckIn).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function saveStoredCheckIns(checkIns) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(checkIns));
  } catch (error) {
    // Session-only state still works if browser storage is unavailable.
  }
}

function normalizeStoredCheckIn(checkIn) {
  if (!checkIn || typeof checkIn !== "object") {
    return null;
  }

  const trigger = getPrimaryTrigger(checkIn);
  const phase = checkIn.phase || checkIn.currentPhase;

  if (!trigger || !phase) {
    return null;
  }

  return {
    id: String(checkIn.id || createCheckInId()),
    date: String(checkIn.date || new Date().toISOString()),
    examType: String(checkIn.examType || "Other"),
    phase: String(phase),
    moodScore: Number(checkIn.moodScore),
    stressLevel: Number(checkIn.stressLevel),
    energyLevel: Number(checkIn.energyLevel || 3),
    sleepQuality: String(checkIn.sleepQuality || "Okay"),
    trigger,
    reflection: String(checkIn.reflection || ""),
    supportPreference: String(checkIn.supportPreference || "Calm me down"),
  };
}

function getPrimaryTrigger(checkIn) {
  if (typeof checkIn.trigger === "string" && checkIn.trigger.trim()) {
    return checkIn.trigger.trim();
  }

  if (Array.isArray(checkIn.triggers) && typeof checkIn.triggers[0] === "string") {
    return checkIn.triggers[0].trim();
  }

  return "Other";
}

function createCheckInId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `checkin-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCheckInDate(date) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isHighRiskCheckIn(checkIn) {
  return checkIn.stressLevel === 5 || checkIn.moodScore === 1 || hasHighDistressLanguage(checkIn.reflection);
}

function hasHighDistressLanguage(reflection) {
  const text = String(reflection || "").toLowerCase();
  const signals = ["harm myself", "hurt myself", "end my life", "do not want to live", "can't go on"];

  return signals.some((signal) => text.includes(signal));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

App();
