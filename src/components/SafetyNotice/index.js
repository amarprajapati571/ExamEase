(function initSafetyNotice(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const { escapeHtml } = namespace.html;

  function renderSafetyNotice(result) {
    if (!result.safetyMessage) return "";
    return `
      <article class="result-card safety-notice safety-${result.riskLevel.toLowerCase()}" role="status" aria-live="${result.riskLevel === "High" ? "assertive" : "polite"}">
        <h3>${result.riskLevel === "High" ? "You do not have to handle this alone." : "Safety message"}</h3>
        <p>${escapeHtml(result.safetyMessage)}</p>
      </article>
    `;
  }

  namespace.components = namespace.components || {};
  namespace.components.SafetyNotice = { renderSafetyNotice };
  if (typeof module !== "undefined" && module.exports) module.exports = namespace.components.SafetyNotice;
})(typeof window !== "undefined" ? window : globalThis);
