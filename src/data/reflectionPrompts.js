(function initReflectionPrompts(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const api = {
    reflectionPrompts: [
      "What is one thing you handled better than yesterday?",
      "What is one worry you can park for later?",
      "What helped you feel slightly calmer today?",
      "What is one small win from your preparation?",
      "What is one thing you want to tell your future self?",
    ],
  };

  namespace.reflectionPrompts = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
