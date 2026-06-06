(function initMoodAnalytics(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

  function calculateAverageMood(checkIns) {
    return calculateAverage(checkIns, "moodScore");
  }

  function calculateAverageStress(checkIns) {
    return calculateAverage(checkIns, "stressLevel");
  }

  function findMostCommonTrigger(checkIns) {
    if (!Array.isArray(checkIns) || checkIns.length === 0) return "";
    const counts = new Map();
    let mostCommon = "";
    let highestCount = 0;

    for (const checkIn of checkIns) {
      const trigger = normalizeTrigger(checkIn);
      if (!trigger) continue;
      const count = (counts.get(trigger) || 0) + 1;
      counts.set(trigger, count);
      if (count > highestCount) {
        highestCount = count;
        mostCommon = trigger;
      }
    }

    return mostCommon;
  }

  function getMoodTrend(checkIns) {
    const trend = compareFirstAndLast(checkIns, "moodScore");
    if (trend > 0) return "Mood is improving";
    if (trend < 0) return "Mood is dipping";
    return "Mood is steady";
  }

  function getStressTrend(checkIns) {
    const trend = compareFirstAndLast(checkIns, "stressLevel");
    if (trend > 0) return "Stress is increasing";
    if (trend < 0) return "Stress is easing";
    return "Stress is steady";
  }

  function countTriggers(checkIns) {
    return checkIns.reduce((acc, entry) => {
      const trigger = namespace.validation.normalizeTriggerName(entry.trigger);
      if (trigger) acc[trigger] = (acc[trigger] || 0) + 1;
      return acc;
    }, {});
  }

  function getStressTriggerInsights(checkIns, content = namespace.triggerSuggestions.triggerInsightContent) {
    return Object.entries(countTriggers(checkIns))
      .sort((a, b) => b[1] - a[1])
      .map(([name, frequency]) => ({
        name,
        frequency,
        explanation: (content[name] || content.Other).explanation,
        suggestion: (content[name] || content.Other).suggestion,
      }));
  }

  function getDashboardSummary(checkIns) {
    const commonTrigger = findMostCommonTrigger(checkIns);
    const moodTrend = getMoodTrend(checkIns);
    const stressTrend = getStressTrend(checkIns);
    return {
      averageMood: calculateAverageMood(checkIns),
      averageStress: calculateAverageStress(checkIns),
      commonTrigger,
      moodTrend,
      stressTrend,
      simpleInsight: getSimpleInsight(checkIns, { commonTrigger, moodTrend, stressTrend }),
    };
  }

  function getSimpleInsight(checkIns, trends) {
    const recent = checkIns.slice(-5);
    if (trends.stressTrend === "Stress is increasing") return "Stress is increasing";
    if (trends.moodTrend === "Mood is improving") return "Mood is improving";
    if (
      recent.length >= 2 &&
      recent.filter((entry) => (entry.sleepQuality === "Poor" || entry.sleepQuality === "Okay") && entry.energyLevel <= 2)
        .length >= 2
    ) {
      return "Sleep may be affecting your energy";
    }
    if (trends.commonTrigger && /mock/i.test(trends.commonTrigger)) return "Mock test pressure appears often";
    return trends.commonTrigger
      ? `${trends.commonTrigger} appears most often in recent check-ins`
      : "Complete a check-in to see a pattern";
  }

  function summarizeRecentTrend(recentHistory) {
    if (!recentHistory.length) return "";
    return `Recent check-ins show average mood around ${calculateAverageMood(recentHistory)}/5 and stress around ${calculateAverageStress(recentHistory)}/5, so today's support should stay practical and gentle.`;
  }

  function createRecentHistorySummary(checkIns) {
    return checkIns.slice(-7).map((entry) => ({
      date: entry.date,
      examType: entry.examType,
      phase: entry.phase,
      moodScore: entry.moodScore,
      stressLevel: entry.stressLevel,
      energyLevel: entry.energyLevel,
      sleepQuality: entry.sleepQuality,
      trigger: entry.trigger,
      supportPreference: entry.supportPreference,
    }));
  }

  function getRecentReflections(checkIns) {
    return checkIns.slice(-5).reverse();
  }

  function createAnalyticsMemo() {
    return {
      dashboardSummary: { key: "", value: null },
      recentReflections: { key: "", value: null },
      triggerCounts: { key: "", value: null },
      triggerInsights: { key: "", value: null },
      plan: new Map(),
    };
  }

  function createCheckInsSignature(checkIns) {
    return checkIns
      .map((entry) =>
        [
          entry.id,
          entry.date,
          entry.examType,
          entry.phase,
          entry.moodScore,
          entry.stressLevel,
          entry.energyLevel,
          entry.sleepQuality,
          entry.trigger,
          entry.reflection,
          entry.positiveMoment,
          entry.supportPreference,
        ].join("|"),
      )
      .join("~");
  }

  function memoByCheckIns(checkIns, slot, memoStore, producer) {
    const key = createCheckInsSignature(checkIns);
    if (memoStore[slot].key === key && memoStore[slot].value) return memoStore[slot].value;
    const value = producer();
    memoStore[slot] = { key, value };
    return value;
  }

  function getMemoizedDashboardSummary(checkIns, memoStore) {
    return memoByCheckIns(checkIns, "dashboardSummary", memoStore, () => getDashboardSummary(checkIns));
  }

  function getMemoizedTriggerCounts(checkIns, memoStore) {
    return memoByCheckIns(checkIns, "triggerCounts", memoStore, () => countTriggers(checkIns));
  }

  function getMemoizedStressTriggerInsights(checkIns, memoStore) {
    return memoByCheckIns(checkIns, "triggerInsights", memoStore, () => getStressTriggerInsights(checkIns));
  }

  function getMemoizedRecentReflections(checkIns, memoStore) {
    return memoByCheckIns(checkIns, "recentReflections", memoStore, () => getRecentReflections(checkIns));
  }

  function getMemoizedWellnessPlan(checkIn, memoStore) {
    const key = namespace.cache.stableStringify({
      examType: checkIn.examType,
      phase: checkIn.phase,
      moodScore: checkIn.moodScore,
      stressLevel: checkIn.stressLevel,
      energyLevel: checkIn.energyLevel,
      sleepQuality: checkIn.sleepQuality,
      trigger: checkIn.trigger,
      supportPreference: checkIn.supportPreference,
    });
    if (memoStore.plan.has(key)) return memoStore.plan.get(key);
    const plan = namespace.mockWellnessResponse.createPersonalizedWellnessPlan(checkIn);
    memoStore.plan.set(key, plan);
    return plan;
  }

  function calculateAverage(checkIns, key) {
    if (!Array.isArray(checkIns) || checkIns.length === 0) return 0;
    let total = 0;
    let count = 0;
    for (const checkIn of checkIns) {
      const value = Number(checkIn[key]);
      if (Number.isFinite(value)) {
        total += value;
        count += 1;
      }
    }
    return count === 0 ? 0 : Math.round((total / count) * 10) / 10;
  }

  function compareFirstAndLast(checkIns, key) {
    if (!Array.isArray(checkIns) || checkIns.length < 2) return 0;
    const recent = checkIns.slice(-7);
    const first = Number(recent[0][key]);
    const last = Number(recent[recent.length - 1][key]);
    if (!Number.isFinite(first) || !Number.isFinite(last)) return 0;
    const delta = last - first;
    if (Math.abs(delta) < 0.5) return 0;
    return delta > 0 ? 1 : -1;
  }

  function normalizeTrigger(checkIn) {
    if (typeof checkIn.trigger === "string") return checkIn.trigger.trim();
    if (Array.isArray(checkIn.triggers) && typeof checkIn.triggers[0] === "string") return checkIn.triggers[0].trim();
    return "";
  }

  const api = {
    calculateAverageMood,
    calculateAverageStress,
    findMostCommonTrigger,
    getMoodTrend,
    getStressTrend,
    countTriggers,
    getStressTriggerInsights,
    getDashboardSummary,
    summarizeRecentTrend,
    createRecentHistorySummary,
    getRecentReflections,
    createAnalyticsMemo,
    getMemoizedDashboardSummary,
    getMemoizedTriggerCounts,
    getMemoizedStressTriggerInsights,
    getMemoizedRecentReflections,
    getMemoizedWellnessPlan,
  };
  namespace.moodAnalytics = api;
  globalScope.trackingUtils = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
