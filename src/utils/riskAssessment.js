(function initRiskAssessment(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const riskMemo = new Map();

  function assessRisk(checkInData) {
    const moodScore = Number(checkInData.moodScore);
    const stressLevel = Number(checkInData.stressLevel);
    const key = namespace.cache.stableStringify({ moodScore, stressLevel, reflection: checkInData.reflection || "" });

    if (riskMemo.has(key)) return riskMemo.get(key);

    const hasSensitiveReflection = hasHighDistressLanguage(checkInData.reflection);
    const risk =
      (moodScore === 1 && stressLevel === 5) || hasSensitiveReflection
        ? { level: "High", hasSensitiveReflection }
        : stressLevel === 4 || stressLevel === 5 || moodScore === 1 || moodScore === 2
          ? { level: "Medium", hasSensitiveReflection }
          : { level: "Low", hasSensitiveReflection };

    riskMemo.set(key, risk);
    return risk;
  }

  function sanitizeCheckInForStorage(checkIn, risk) {
    return risk.hasSensitiveReflection ? { ...checkIn, reflection: "High distress reflection withheld for privacy." } : checkIn;
  }

  function hasHighDistressLanguage(reflection) {
    const text = String(reflection || "").toLowerCase();
    return ["harm myself", "hurt myself", "end my life", "do not want to live", "can't go on"].some((signal) =>
      text.includes(signal),
    );
  }

  const api = { assessRisk, sanitizeCheckInForStorage, hasHighDistressLanguage };
  namespace.riskAssessment = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
