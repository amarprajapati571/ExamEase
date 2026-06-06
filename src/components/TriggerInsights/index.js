(function initTriggerInsights(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const { escapeHtml } = namespace.html;

  function renderResultTriggerInsight(result) {
    return `
      <article class="result-card">
        <h3>Stress trigger insights</h3>
        <p><strong>${escapeHtml(result.triggerInsight.mainTrigger)}:</strong> ${escapeHtml(result.triggerInsight.explanation)}</p>
      </article>
    `;
  }

  function renderStressTriggerInsights(insights) {
    return `
      <article class="trigger-insights-card">
        <div class="trigger-insights-header">
          <div>
            <h3>Stress Trigger Insights</h3>
            <p>Patterns from your check-ins, mapped to practical exam-season coping steps.</p>
          </div>
        </div>
        ${
          insights.length
            ? `
              <ul class="trigger-insight-list">
                ${insights
                  .map(
                    (insight) => `
                      <li class="trigger-insight-item">
                        <div class="trigger-insight-top">
                          <strong>${escapeHtml(insight.name)}</strong>
                          <span>${insight.frequency} ${insight.frequency === 1 ? "time" : "times"}</span>
                        </div>
                        <p>${escapeHtml(insight.explanation)}</p>
                        <div class="coping-suggestion">
                          <span>Coping step</span>
                          <p>${escapeHtml(insight.suggestion)}</p>
                        </div>
                      </li>
                    `,
                  )
                  .join("")}
              </ul>
            `
            : `<p class="subtle-note">Complete a check-in to see which stress triggers appear most often.</p>`
        }
      </article>
    `;
  }

  namespace.components = namespace.components || {};
  namespace.components.TriggerInsights = { renderResultTriggerInsight, renderStressTriggerInsights };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = namespace.components.TriggerInsights;
  }
})(typeof window !== "undefined" ? window : globalThis);
