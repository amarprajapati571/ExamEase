(function initTrackingUtils(globalScope) {
  function calculateAverageMood(checkIns) {
    return calculateAverage(checkIns, "moodScore");
  }

  function calculateAverageStress(checkIns) {
    return calculateAverage(checkIns, "stressLevel");
  }

  function findMostCommonTrigger(checkIns) {
    if (!Array.isArray(checkIns) || checkIns.length === 0) {
      return "";
    }

    const counts = new Map();
    let mostCommon = "";
    let highestCount = 0;

    for (const checkIn of checkIns) {
      const trigger = normalizeTrigger(checkIn);

      if (!trigger) {
        continue;
      }

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

    if (trend > 0) {
      return "Mood is improving";
    }

    if (trend < 0) {
      return "Mood is dipping";
    }

    return "Mood is steady";
  }

  function getStressTrend(checkIns) {
    const trend = compareFirstAndLast(checkIns, "stressLevel");

    if (trend > 0) {
      return "Stress is increasing";
    }

    if (trend < 0) {
      return "Stress is easing";
    }

    return "Stress is steady";
  }

  function calculateAverage(checkIns, key) {
    if (!Array.isArray(checkIns) || checkIns.length === 0) {
      return 0;
    }

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
    if (!Array.isArray(checkIns) || checkIns.length < 2) {
      return 0;
    }

    const recent = checkIns.slice(-7);
    const first = Number(recent[0][key]);
    const last = Number(recent[recent.length - 1][key]);

    if (!Number.isFinite(first) || !Number.isFinite(last)) {
      return 0;
    }

    const delta = last - first;

    if (Math.abs(delta) < 0.5) {
      return 0;
    }

    return delta > 0 ? 1 : -1;
  }

  function normalizeTrigger(checkIn) {
    if (typeof checkIn.trigger === "string") {
      return checkIn.trigger.trim();
    }

    if (Array.isArray(checkIn.triggers) && typeof checkIn.triggers[0] === "string") {
      return checkIn.triggers[0].trim();
    }

    return "";
  }

  const api = {
    calculateAverageMood,
    calculateAverageStress,
    findMostCommonTrigger,
    getMoodTrend,
    getStressTrend,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.trackingUtils = api;
})(typeof window !== "undefined" ? window : globalThis);
