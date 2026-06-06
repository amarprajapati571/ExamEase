(function initTriggerSuggestions(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const data = {
    examTypes: ["Board exams", "NEET", "JEE", "CUET", "CAT", "GATE", "UPSC", "Other"],
    currentPhases: [
      "Preparation",
      "Revision",
      "Mock tests",
      "Final exam week",
      "Waiting for results",
      "Result day",
      "After results",
    ],
    sleepOptions: ["Poor", "Okay", "Good", "Excellent"],
    stressTriggers: [
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
    ],
    supportPreferences: [
      "Calm me down",
      "Help me focus",
      "Motivate me",
      "Help me plan my day",
      "Help with result anxiety",
      "Help with burnout",
    ],
    suggestionCategories: ["Breathing", "Focus", "Motivation", "Rest", "Planning", "Reflection"],
    timeOptions: ["2 min", "5 min", "10 min", "15 min"],
    riskLevels: ["Low", "Medium", "High"],
    triggerInsightContent: {
      "Syllabus pressure": {
        explanation: "The full syllabus can feel too large when it is held in your head all at once.",
        suggestion: "Break the syllabus into three small priority blocks instead of looking at the full syllabus at once.",
      },
      "Mock test scores": {
        explanation: "Mock scores can feel like final proof, even though they are meant to show what to revise next.",
        suggestion: "Pick two mistake patterns from the mock and revise those before checking another score.",
      },
      "Family expectations": {
        explanation: "Expectations can add pressure when you feel responsible for other people's hopes too.",
        suggestion: "Share one realistic study update and one thing you need, such as quiet time or encouragement.",
      },
      "Peer comparison": {
        explanation: "Comparing with others can make your own progress harder to notice.",
        suggestion: "Try comparing today's effort with yesterday's effort instead of comparing with others.",
      },
      "Fear of failure": {
        explanation: "Fear can make one uncertain outcome feel like it defines everything.",
        suggestion: "Write one fallback option and one next study action so your brain sees more than one path.",
      },
      "Time management": {
        explanation: "Time pressure often grows when tasks are unclear or too large for one sitting.",
        suggestion: "Plan the next two study blocks only, with a start time, topic, and break.",
      },
      "Result uncertainty": {
        explanation: "Waiting for results can feel difficult because the outcome is not fully controllable right now.",
        suggestion:
          "Focus on what is controllable today: rest, documents, backup plans, and talking to someone supportive.",
      },
      Burnout: {
        explanation: "Repeated effort without enough recovery can make even simple tasks feel heavier.",
        suggestion: "Choose a lighter revision task and schedule one real recovery break without guilt.",
      },
      "Lack of motivation": {
        explanation: "Low motivation can appear when goals feel distant or the next step is unclear.",
        suggestion: "Start with a five minute task that is easy to finish, then decide the next step.",
      },
      Other: {
        explanation: "A repeated custom trigger is still useful because it shows where extra support may help.",
        suggestion: "Name the trigger more specifically in your reflection and choose one small action you can control.",
      },
    },
  };

  namespace.triggerSuggestions = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof window !== "undefined" ? window : globalThis);
