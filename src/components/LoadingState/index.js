(function initLoadingState(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

  function renderLoadingState(isLoading) {
    return `<div class="loading-state ${isLoading ? "is-visible" : ""}" role="status" aria-live="polite" aria-atomic="true">Preparing supportive guidance...</div>`;
  }

  namespace.components = namespace.components || {};
  namespace.components.LoadingState = { renderLoadingState };
  if (typeof module !== "undefined" && module.exports) module.exports = namespace.components.LoadingState;
})(typeof window !== "undefined" ? window : globalThis);
