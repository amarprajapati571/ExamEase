const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const MAX_BODY_BYTES = 24_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const allowedSleepQuality = new Set(["Poor", "Okay", "Good", "Excellent"]);
const allowedTriggers = new Set([
  "Syllabus pressure",
  "Mock test scores",
  "Family expectations",
  "Peer comparison",
  "Fear of failure",
  "Time management",
  "Result uncertainty",
  "Burnout",
  "Lack of motivation",
  "Other",
]);
const allowedSupportPreferences = new Set([
  "Calm me down",
  "Help me focus",
  "Motivate me",
  "Help me plan my day",
  "Help with result anxiety",
  "Help with burnout",
]);

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "emotionalSummary",
    "detectedPattern",
    "triggerInsight",
    "wellnessSuggestions",
    "quickExercise",
    "studyBalanceTip",
    "affirmation",
    "riskLevel",
    "safetyMessage",
    "nextCheckInPrompt",
  ],
  properties: {
    emotionalSummary: { type: "string" },
    detectedPattern: { type: "string" },
    triggerInsight: {
      type: "object",
      additionalProperties: false,
      required: ["mainTrigger", "explanation"],
      properties: {
        mainTrigger: { type: "string" },
        explanation: { type: "string" },
      },
    },
    wellnessSuggestions: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "timeRequired", "category"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          timeRequired: { type: "string", enum: ["2 min", "5 min", "10 min", "15 min"] },
          category: {
            type: "string",
            enum: ["Breathing", "Focus", "Motivation", "Rest", "Planning", "Reflection"],
          },
        },
      },
    },
    quickExercise: {
      type: "object",
      additionalProperties: false,
      required: ["title", "steps", "duration"],
      properties: {
        title: { type: "string" },
        steps: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
        duration: { type: "string" },
      },
    },
    studyBalanceTip: { type: "string" },
    affirmation: { type: "string" },
    riskLevel: { type: "string", enum: ["Low", "Medium", "High"] },
    safetyMessage: { type: "string" },
    nextCheckInPrompt: { type: "string" },
  },
};

function createRateLimiter({ windowMs = RATE_LIMIT_WINDOW_MS, max = RATE_LIMIT_MAX } = {}) {
  const buckets = new Map();

  return function isAllowed(key = "unknown") {
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    return bucket.count <= max;
  };
}

function getRequestClientKey(req) {
  const forwardedFor = req.headers && req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
}

function sendJson(res, statusCode, payload) {
  setSecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function isJsonRequest(req) {
  const contentType = (req.headers && req.headers["content-type"]) || "";
  return contentType.includes("application/json");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body, "utf8") > MAX_BODY_BYTES) {
      throw new Error("Request body is too large");
    }

    return JSON.parse(req.body || "{}");
  }

  return new Promise((resolve, reject) => {
    let body = "";
    let rejected = false;

    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES && !rejected) {
        rejected = true;
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (rejected) {
        return;
      }

      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function normalizeCheckInInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const moodScore = clampScale(value.moodScore);
  const stressLevel = clampScale(value.stressLevel);
  const energyLevel = clampScale(value.energyLevel);
  const sleepQuality = allowedSleepQuality.has(value.sleepQuality) ? value.sleepQuality : "";
  const trigger = normalizeTriggerName(value.trigger || (Array.isArray(value.triggers) ? value.triggers[0] : ""));
  const supportPreference = allowedSupportPreferences.has(value.supportPreference)
    ? value.supportPreference
    : "Calm me down";

  if (!moodScore || !stressLevel || !energyLevel || !sleepQuality || !allowedTriggers.has(trigger)) {
    return null;
  }

  return {
    examType: limitText(value.examType || "Other", 40),
    phase: limitText(value.phase || value.currentPhase || "Preparation", 40),
    moodScore,
    stressLevel,
    energyLevel,
    sleepQuality,
    trigger,
    reflection: limitText(value.reflection || "", 500),
    supportPreference,
  };
}

function normalizeHistoryInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const moodScore = clampScale(value.moodScore);
  const stressLevel = clampScale(value.stressLevel);
  const energyLevel = clampScale(value.energyLevel);
  const trigger = normalizeTriggerName(value.trigger || "");

  if (!moodScore || !stressLevel || !energyLevel || !allowedTriggers.has(trigger)) {
    return null;
  }

  return {
    date: limitText(value.date || "", 40),
    examType: limitText(value.examType || "Other", 40),
    phase: limitText(value.phase || "Preparation", 40),
    moodScore,
    stressLevel,
    energyLevel,
    sleepQuality: allowedSleepQuality.has(value.sleepQuality) ? value.sleepQuality : "Okay",
    trigger,
    supportPreference: allowedSupportPreferences.has(value.supportPreference)
      ? value.supportPreference
      : "Calm me down",
  };
}

function normalizeWellnessPayload(body) {
  const checkInData = normalizeCheckInInput(body && body.checkInData);
  const recentHistory = Array.isArray(body && body.recentHistory)
    ? body.recentHistory.map(normalizeHistoryInput).filter(Boolean).slice(-7)
    : [];

  return { checkInData, recentHistory };
}

async function getWellnessSupport({ checkInData, recentHistory, apiKey, model = DEFAULT_OPENAI_MODEL, fetchImpl = fetch }) {
  if (!apiKey) {
    return {
      source: "fallback",
      support: createFallbackWellnessSupport(checkInData, recentHistory),
    };
  }

  try {
    const support = await requestAiSupport({ checkInData, recentHistory, apiKey, model, fetchImpl });
    return { source: "ai", support: applySafetyOverride(support, checkInData) };
  } catch (error) {
    return {
      source: "fallback",
      support: createFallbackWellnessSupport(checkInData, recentHistory),
    };
  }
}

async function requestAiSupport({ checkInData, recentHistory, apiKey, model, fetchImpl }) {
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: buildPrompt(checkInData, recentHistory),
      text: {
        format: {
          type: "json_schema",
          name: "wellness_support",
          schema: responseSchema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("AI API request failed");
  }

  const data = await response.json();
  const support = JSON.parse(extractOutputText(data));

  if (!isValidWellnessSupport(support)) {
    throw new Error("AI response failed validation");
  }

  return support;
}

function buildPrompt(checkInData, recentHistory) {
  return `Create personalized non-clinical wellness support for an exam-preparing student.

Strict rules:
- Return valid JSON only. Do not include markdown.
- Do not diagnose mental illness.
- Do not give medical advice.
- Do not claim certainty about mental health.
- Do not shame the student.
- Do not give unrealistic motivation.
- Keep suggestions practical, gentle, and student-friendly.
- If moodScore is 1 and stressLevel is 5, or reflection suggests self-harm, set riskLevel to High and recommend immediate help from a trusted adult, counselor, local emergency service, or crisis helpline.
- If stressLevel is 4 or 5, or moodScore is 1 or 2, set riskLevel to Medium unless High applies.
- Use an empty string for safetyMessage only when riskLevel is Low.

Check-in data:
${JSON.stringify(checkInData)}

Recent history:
${JSON.stringify(recentHistory)}`;
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("");
}

function createFallbackWellnessSupport(checkIn, recentHistory = []) {
  const primaryTrigger = getPrimaryTrigger(checkIn);
  const risk = assessRisk(checkIn);
  const riskLevel = risk.level;
  const lowEnergy = checkIn.energyLevel <= 2;
  const poorSleep = checkIn.sleepQuality === "Poor";
  const trend = summarizeRecentTrend(recentHistory);

  return {
    emotionalSummary: riskLevel === "High"
      ? "This check-in sounds very heavy. Your safety and support matter more than any exam task right now."
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
    wellnessSuggestions: riskLevel === "High" ? buildHighRiskSuggestions() : buildSuggestions(checkIn, { lowEnergy, poorSleep }),
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
        ? "Please contact a trusted adult, parent, teacher, counselor, or local emergency service now. If you may hurt yourself or feel unsafe, seek immediate help from local emergency services or a crisis helpline."
        : riskLevel === "Medium"
          ? "This seems like a good time to pause, take a break, reduce today's workload, and talk to someone trusted."
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

function buildHighRiskSuggestions() {
  return [
    {
      title: "Reach Out Now",
      description: "Contact a trusted adult, parent, teacher, counselor, or local emergency service.",
      timeRequired: "2 min",
      category: "Reflection",
    },
    {
      title: "Stay Near Support",
      description: "Move closer to someone safe or a shared space while you wait for help.",
      timeRequired: "2 min",
      category: "Rest",
    },
    {
      title: "Ground For The Moment",
      description: "Name five things you can see and take three slow breaths. This is temporary support while you get help.",
      timeRequired: "2 min",
      category: "Breathing",
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
    ["Low", "Medium", "High"].includes(value.riskLevel) &&
    typeof value.safetyMessage === "string" &&
    isNonEmptyString(value.nextCheckInPrompt)
  );
}

function isValidSuggestion(suggestion) {
  return (
    isPlainObject(suggestion) &&
    isNonEmptyString(suggestion.title) &&
    isNonEmptyString(suggestion.description) &&
    ["2 min", "5 min", "10 min", "15 min"].includes(suggestion.timeRequired) &&
    ["Breathing", "Focus", "Motivation", "Rest", "Planning", "Reflection"].includes(suggestion.category)
  );
}

function applySafetyOverride(support, checkIn) {
  const risk = assessRisk(checkIn);

  if (risk.level === support.riskLevel) {
    return support;
  }

  return {
    ...support,
    riskLevel: risk.level,
    safetyMessage:
      risk.level === "High"
        ? "Please contact a trusted adult, parent, teacher, counselor, or local emergency service now. If you may hurt yourself or feel unsafe, seek immediate help from local emergency services or a crisis helpline."
        : risk.level === "Medium"
          ? "This seems like a good time to pause, take a break, reduce today's workload, and talk to someone trusted."
          : "",
  };
}

function summarizeRecentTrend(recentHistory) {
  if (!recentHistory.length) {
    return "";
  }

  const averageMood = average(recentHistory.map((entry) => entry.moodScore));
  const averageStress = average(recentHistory.map((entry) => entry.stressLevel));

  return `Recent check-ins show average mood around ${averageMood}/5 and stress around ${averageStress}/5, so today's support should stay practical and gentle.`;
}

function assessRisk(checkIn) {
  const moodScore = Number(checkIn.moodScore);
  const stressLevel = Number(checkIn.stressLevel);
  const hasSensitiveReflection = hasHighDistressLanguage(checkIn.reflection);

  if ((moodScore === 1 && stressLevel === 5) || hasSensitiveReflection) {
    return { level: "High", hasSensitiveReflection };
  }

  if (stressLevel === 4 || stressLevel === 5 || moodScore === 1 || moodScore === 2) {
    return { level: "Medium", hasSensitiveReflection };
  }

  return { level: "Low", hasSensitiveReflection };
}

function getPrimaryTrigger(checkIn) {
  if (typeof checkIn.trigger === "string" && checkIn.trigger.trim()) {
    return normalizeTriggerName(checkIn.trigger);
  }

  if (Array.isArray(checkIn.triggers) && typeof checkIn.triggers[0] === "string") {
    return normalizeTriggerName(checkIn.triggers[0]);
  }

  return "Other";
}

function normalizeTriggerName(trigger) {
  const value = String(trigger || "").trim();
  const aliases = {
    "Low mock test score": "Mock test scores",
    "Mock test score": "Mock test scores",
    "Results uncertainty": "Result uncertainty",
  };

  return aliases[value] || value;
}

function clampScale(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 5 ? number : 0;
}

function limitText(value, maxLength) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, maxLength);
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

function average(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

module.exports = {
  DEFAULT_OPENAI_MODEL,
  CONTENT_SECURITY_POLICY,
  MAX_BODY_BYTES,
  createRateLimiter,
  getRequestClientKey,
  setSecurityHeaders,
  sendJson,
  isJsonRequest,
  readJsonBody,
  normalizeCheckInInput,
  normalizeHistoryInput,
  normalizeWellnessPayload,
  getWellnessSupport,
  requestAiSupport,
  buildPrompt,
  extractOutputText,
  createFallbackWellnessSupport,
  buildSuggestions,
  buildHighRiskSuggestions,
  isValidWellnessSupport,
  applySafetyOverride,
  assessRisk,
  normalizeTriggerName,
};
