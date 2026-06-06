(function initTrackingUtilsCompatibility(globalScope) {
  if (typeof module !== "undefined" && module.exports) {
    require("./src/data/triggerSuggestions.js");
    require("./src/utils/cache.js");
    require("./src/utils/validation.js");
    module.exports = require("./src/utils/moodAnalytics.js");
    return;
  }

  globalScope.trackingUtils = globalScope.ExamEase && globalScope.ExamEase.moodAnalytics;
})(typeof window !== "undefined" ? window : globalThis);
