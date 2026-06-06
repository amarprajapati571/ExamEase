(function initResponseParser(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

  function parseSupportPayload(data) {
    return data && data.support ? data.support : data;
  }

  function isValidWellnessSupport(value) {
    const { riskLevels } = namespace.triggerSuggestions;
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
    const { suggestionCategories, timeOptions } = namespace.triggerSuggestions;
    return (
      isPlainObject(suggestion) &&
      isNonEmptyString(suggestion.title) &&
      isNonEmptyString(suggestion.description) &&
      timeOptions.includes(suggestion.timeRequired) &&
      suggestionCategories.includes(suggestion.category)
    );
  }

  function applySafetyOverride(support, checkIn) {
    const risk = namespace.riskAssessment.assessRisk(checkIn);
    if (risk.level === support.riskLevel) return support;

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

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  const api = { parseSupportPayload, isValidWellnessSupport, isValidSuggestion, applySafetyOverride };
  namespace.responseParser = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
