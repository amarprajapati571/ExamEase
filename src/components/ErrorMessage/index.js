(function initErrorMessage(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const { escapeHtml } = namespace.html;

  function renderValidationSummary(errors) {
    const messages = Object.values(errors);
    if (!messages.length) return "";
    return `
      <div class="error-message is-visible" id="validation-summary" role="alert" aria-live="assertive">
        <strong>Let us complete a few details first:</strong>
        <ul>${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>
      </div>
    `;
  }

  function renderInlineError(id, errors) {
    return errors[id] ? `<p class="field-error" id="${id}-error">${escapeHtml(errors[id])}</p>` : "";
  }

  namespace.components = namespace.components || {};
  namespace.components.ErrorMessage = { renderValidationSummary, renderInlineError };
  if (typeof module !== "undefined" && module.exports) module.exports = namespace.components.ErrorMessage;
})(typeof window !== "undefined" ? window : globalThis);
