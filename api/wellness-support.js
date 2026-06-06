const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readBody(req);
    const checkInData = body.checkInData;
    const recentHistory = Array.isArray(body.recentHistory) ? body.recentHistory.slice(-7) : [];

    if (!checkInData || typeof checkInData !== "object") {
      sendJson(res, 400, { error: "Missing check-in data" });
      return;
    }

    if (!OPENAI_API_KEY) {
      sendJson(res, 200, {
        source: "fallback",
        support: createFallbackWellnessSupport(checkInData, recentHistory),
      });
      return;
    }

    try {
      const support = await requestAiSupport(checkInData, recentHistory);
      sendJson(res, 200, { source: "ai", support: applySafetyOverride(support, checkInData) });
    } catch (error) {
      sendJson(res, 200, {
        source: "fallback",
        support: createFallbackWellnessSupport(checkInData, recentHistory),
      });
    }
  } catch (error) {
    sendJson(res, 500, { error: "Server error" });
  }
};

async function requestAiSupport(checkInData, recentHistory) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
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
- If stressLevel is 5, moodScore is 1, or reflection suggests self-harm, set riskLevel to High and recommend immediate help from a trusted adult, counselor, local emergency service, or crisis helpline.
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

async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function createFallbackWellnessSupport(checkIn, recentHistory = []) {
  const primaryTrigger = checkIn.triggers[0];
  const triggerText = checkIn.triggers.join(", ");
  const highRisk = isHighRiskCheckIn(checkIn);
  const mediumRisk = !highRisk && (checkIn.stressLevel >= 4 || checkIn.moodScore <= 2);
  const riskLevel = highRisk ? "High" : mediumRisk ? "Medium" : "Low";
  const lowEnergy = checkIn.energyLevel <= 2;
  const poorSleep = checkIn.sleepQuality === "Poor";
  const trend = summarizeRecentTrend(recentHistory);

  return {
    emotionalSummary: highRisk
      ? `This check-in sounds very heavy, especially around ${primaryTrigger.toLowerCase()}. You deserve immediate support from someone safe and trusted.`
      : `You named what is affecting you today: ${triggerText.toLowerCase()}. That awareness can make the next step feel clearer.`,
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

  const averageMood = average(recentHistory.map((entry) => entry.moodScore));
  const averageStress = average(recentHistory.map((entry) => entry.stressLevel));

  return `Recent check-ins show average mood around ${averageMood}/5 and stress around ${averageStress}/5, so today's support should stay practical and gentle.`;
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

function average(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
