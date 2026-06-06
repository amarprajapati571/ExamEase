(function initWellnessResult(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const { createStableId, escapeHtml } = namespace.html;

  function renderWellnessResult({ result, plan, loading }) {
    if (result.riskLevel === "High") {
      return `
        <section class="panel result-panel" id="wellness-result" tabindex="-1" aria-labelledby="result-title" aria-live="polite" aria-busy="${loading ? "true" : "false"}">
          <h2 class="section-heading" id="result-title">Wellness Support</h2>
          <div class="result-stack">
            <article class="result-card">
              <h3>Emotional summary</h3>
              <p>${escapeHtml(result.emotionalSummary)}</p>
            </article>
            ${namespace.components.SafetyNotice.renderSafetyNotice(result)}
            ${renderGroundingSupportCard()}
            <article class="result-card">
              <h3>Next check-in prompt</h3>
              <p>${escapeHtml(result.nextCheckInPrompt)}</p>
            </article>
          </div>
        </section>
      `;
    }

    return `
      <section class="panel result-panel" id="wellness-result" tabindex="-1" aria-labelledby="result-title" aria-live="polite" aria-busy="${loading ? "true" : "false"}">
        <h2 class="section-heading" id="result-title">Wellness Support</h2>
        <div class="result-stack">
          <article class="result-card">
            <h3>Emotional summary</h3>
            <p>${escapeHtml(result.emotionalSummary)}</p>
          </article>
          <article class="result-card">
            <h3>Detected pattern</h3>
            <p>${escapeHtml(result.detectedPattern)}</p>
          </article>
          ${namespace.components.TriggerInsights.renderResultTriggerInsight(result)}
          ${result.riskLevel === "Medium" ? renderMediumRiskSupport() : ""}
          ${renderSupportSuggestions(result.wellnessSuggestions)}
          ${renderPersonalizedWellnessPlan(plan)}
          <article class="result-card">
            <h3>${escapeHtml(result.quickExercise.title)}</h3>
            <ol class="exercise-list">
              ${result.quickExercise.steps
                .map(
                  (step) =>
                    `<li id="${escapeHtml(createStableId("exercise", result.quickExercise.title, step))}">${escapeHtml(step)}</li>`,
                )
                .join("")}
            </ol>
            <p class="time-note">${escapeHtml(result.quickExercise.duration)}</p>
          </article>
          <article class="result-card">
            <h3>Study-life balance suggestion</h3>
            <p>${escapeHtml(result.studyBalanceTip)}</p>
          </article>
          <article class="result-card">
            <h3>Positive affirmation</h3>
            <p>${escapeHtml(result.affirmation)}</p>
          </article>
          <article class="result-card risk-card risk-${result.riskLevel.toLowerCase()}">
            <h3>Risk level</h3>
            <p><strong>${escapeHtml(result.riskLevel)}</strong></p>
          </article>
          ${namespace.components.SafetyNotice.renderSafetyNotice(result)}
          <article class="result-card">
            <h3>Next check-in prompt</h3>
            <p>${escapeHtml(result.nextCheckInPrompt)}</p>
          </article>
        </div>
      </section>
    `;
  }

  function renderGroundingSupportCard() {
    return `
      <article class="result-card grounding-card">
        <h3>Temporary grounding exercise</h3>
        <p>This can support you for the moment, but it is not a replacement for getting help.</p>
        <ol class="exercise-list">
          <li id="exercise-grounding-see">Put both feet on the floor and slowly name five things you can see.</li>
          <li id="exercise-grounding-breathe">Take three slow breaths, making the exhale longer than the inhale.</li>
          <li id="exercise-grounding-support">Move closer to a trusted person or contact someone who can help now.</li>
        </ol>
      </article>
    `;
  }

  function renderMediumRiskSupport() {
    const actions = [
      "Try a short calming exercise: breathe in for 4 counts and out for 6 counts, five times.",
      "Take a real break before the next task, even if it is only 10 minutes.",
      "Talk to someone trusted about how today feels.",
      "Reduce today's workload to one small must-do and one recovery action.",
    ];

    return `
      <article class="result-card medium-support-card">
        <h3>Steady support for today</h3>
        <ul class="support-action-list">
          ${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
        </ul>
      </article>
    `;
  }

  function renderSupportSuggestions(suggestions) {
    return `
      <article class="result-card">
        <h3>Personalized wellness suggestions</h3>
        <ul class="suggestion-list">
          ${suggestions
            .map(
              (suggestion) => `
                <li id="${escapeHtml(createStableId("suggestion", suggestion.title, suggestion.description))}">
                  <strong>${escapeHtml(suggestion.title)}</strong>
                  <span>${escapeHtml(suggestion.description)}</span>
                  <small>${escapeHtml(suggestion.category)} - ${escapeHtml(suggestion.timeRequired)}</small>
                </li>
              `,
            )
            .join("")}
        </ul>
      </article>
    `;
  }

  function renderPersonalizedWellnessPlan(plan) {
    return `
      <article class="result-card wellness-plan-card">
        <div class="wellness-plan-header">
          <h3>Plan for the next few hours</h3>
          <p>Small steps, not a perfect schedule.</p>
        </div>
        <ul class="wellness-plan-list">
          ${renderPlanItem("Calming", plan.calming)}
          ${renderPlanItem("Study", plan.study)}
          ${renderPlanItem("Rest", plan.rest)}
          ${renderPlanItem("Connection", plan.connection)}
          ${renderPlanItem("Check-in", plan.checkIn)}
        </ul>
      </article>
    `;
  }

  function renderPlanItem(label, text) {
    return `
      <li>
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(text)}</span>
      </li>
    `;
  }

  namespace.components = namespace.components || {};
  namespace.components.WellnessResult = { renderWellnessResult };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = namespace.components.WellnessResult;
  }
})(typeof window !== "undefined" ? window : globalThis);
