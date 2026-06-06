(function initMockWellnessResponse(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

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
      trigger: "Mock test scores",
      reflection: "Felt worried after a low score, but revised mistakes calmly.",
      positiveMoment: "Reviewed two mistakes without spiraling.",
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
      positiveMoment: "Finished one priority block.",
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
      positiveMoment: "Closed the group chat and took a pause.",
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
      positiveMoment: "Protected sleep instead of doing one more late session.",
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
      trigger: "Result uncertainty",
      reflection: "Talked to a friend and felt less alone.",
      positiveMoment: "Asked for support instead of staying quiet.",
      supportPreference: "Help with result anxiety",
    },
  ];

  const sampleCurrentCheckIn = {
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
    positiveMoment: "I noticed the pressure and still wanted to restart.",
    supportPreference: "Help me plan my day",
  };

  function createFallbackWellnessSupport(checkIn, recentHistory = []) {
    const primaryTrigger = namespace.validation.getPrimaryTrigger(checkIn);
    const risk = namespace.riskAssessment.assessRisk(checkIn);
    const riskLevel = risk.level;
    const lowEnergy = checkIn.energyLevel <= 2;
    const poorSleep = checkIn.sleepQuality === "Poor";
    const trend = namespace.moodAnalytics.summarizeRecentTrend(recentHistory);

    return {
      emotionalSummary:
        riskLevel === "High"
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

  function createPersonalizedWellnessPlan(checkIn) {
    const highStress = checkIn.stressLevel >= 4;
    const lowEnergy = checkIn.energyLevel <= 2;
    const poorSleep = checkIn.sleepQuality === "Poor";
    const resultAnxiety =
      checkIn.trigger === "Result uncertainty" ||
      checkIn.phase === "Waiting for results" ||
      checkIn.phase === "Result day" ||
      checkIn.supportPreference === "Help with result anxiety";
    const burnout =
      checkIn.trigger === "Burnout" || checkIn.supportPreference === "Help with burnout" || (lowEnergy && poorSleep);

    if (resultAnxiety) {
      return {
        calming: "Write down what is and is not in your control for the next few hours.",
        study: "Prepare documents, backup options, or one practical life task calmly.",
        rest: "Avoid refreshing result pages repeatedly; choose two planned check times instead.",
        connection: "Stay near someone supportive or message a person who helps you feel steady.",
        checkIn: "Come back tonight and log what helped you handle the waiting.",
      };
    }
    if (highStress && lowEnergy) {
      return {
        calming: "Try 4-7-8 breathing for 2 minutes.",
        study: "Revise only one small topic for 25 minutes.",
        rest: "Take a 10-minute screen-free break after that topic.",
        connection: "Message a friend or family member with one honest line about how today feels.",
        checkIn: "Come back tonight and log how your stress and energy changed.",
      };
    }
    if (burnout) {
      return {
        calming: "Sit away from your study space for 3 minutes and unclench your shoulders.",
        study: "Choose a light revision task, such as reading marked notes or reviewing one formula list.",
        rest: "Take a real break without calling it wasted time.",
        connection: "Tell someone you are trying a lighter plan today so you do not over-push silently.",
        checkIn: "Check in again after your rest block and note whether your energy shifted.",
      };
    }
    if (checkIn.trigger === "Mock test scores") {
      return {
        calming: "Take 5 slow breaths before looking at the score analysis again.",
        study: "Pick only two mistake types from the mock and revise those first.",
        rest: "Step away from score discussions for 10 minutes after reviewing mistakes.",
        connection: "Ask a teacher, peer, or mentor one specific doubt instead of judging the full score.",
        checkIn: "Return after one correction block and note whether the score feels less personal.",
      };
    }
    if (poorSleep) {
      return {
        calming: "Do one quiet reset: drink water, stretch lightly, and breathe slowly for 2 minutes.",
        study: "Use a shorter focus block with easier material so tiredness does not turn into self-blame.",
        rest: "Plan an earlier wind-down tonight and keep the last hour lighter.",
        connection: "Let someone at home know you are protecting sleep today.",
        checkIn: "Check in before bed and note what helped your body slow down.",
      };
    }
    if (highStress) {
      return {
        calming: "Set a 3-minute timer and breathe out slowly until your shoulders drop.",
        study: "Choose one priority task and stop after one focused block.",
        rest: "Take a short walk, stretch, or sit away from screens for 10 minutes.",
        connection: "Share one specific worry with someone supportive instead of holding the whole thing alone.",
        checkIn: "Come back after your next study block and log whether stress moved up or down.",
      };
    }
    return {
      calming: "Take two slow breaths and name the next action out loud.",
      study: "Work on one clear study task for 25 minutes.",
      rest: "Take a 5 to 10 minute break before switching subjects.",
      connection: "Send one small update or thank-you message to someone supportive.",
      checkIn: "Come back later today and note one thing that felt manageable.",
    };
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
        description:
          "Name five things you can see and take three slow breaths. This is temporary support while you get help.",
        timeRequired: "2 min",
        category: "Breathing",
      },
    ];
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

  const api = { mockEntries, sampleCurrentCheckIn, createFallbackWellnessSupport, createPersonalizedWellnessPlan };
  namespace.mockWellnessResponse = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
