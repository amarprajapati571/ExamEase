(function initCheckInForm(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const { escapeHtml } = namespace.html;

  function renderCheckInForm({ form, errors, loading, latestPrompt }) {
    const data = namespace.triggerSuggestions;
    const hasErrors = Object.keys(errors).length > 0;

    return `
      <section class="panel form-panel" aria-labelledby="checkin-title">
        <h2 class="section-heading" id="checkin-title">Daily Check-In</h2>
        <p class="privacy-disclaimer">This tool is for self-reflection and wellness support. It is not a medical diagnosis or replacement for professional help.</p>
        <form class="checkin-form" id="checkin-form" novalidate ${hasErrors ? 'aria-describedby="validation-summary"' : ""}>
          ${namespace.components.ErrorMessage.renderValidationSummary(errors)}
          <div class="field-grid">
            ${renderSelectField("examType", "Exam type", data.examTypes, "Choose exam type", true, form, errors)}
            ${renderSelectField("currentPhase", "Current phase", data.currentPhases, "", true, form, errors)}
            ${renderRatingField("moodScore", "Mood score", ["Very low", "Low", "Okay", "Good", "Very good"], true, form, errors)}
            ${renderRatingField("stressLevel", "Stress level", ["Low", "Manageable", "Moderate", "High", "Very high"], true, form, errors)}
            ${renderRatingField("energyLevel", "Energy level", ["Very low", "Low", "Okay", "Good", "High"], false, form, errors)}
            ${renderSelectField("sleepQuality", "Sleep quality", data.sleepOptions, "", true, form, errors)}
            ${renderTriggerOptions(form, errors)}
            ${renderReflectionPrompts(latestPrompt)}
            ${renderReflectionField(form, errors)}
            ${renderPositiveMomentField(form, errors)}
            ${renderSelectField("supportPreference", "Support preference", data.supportPreferences, "", true, form, errors)}
          </div>
          <div class="submit-row">
            <button class="primary-button" type="submit" ${loading ? "disabled" : ""}>Generate Support</button>
            <p class="subtle-note">Guidance is generated through the backend when configured, with a safe fallback if unavailable.</p>
          </div>
          ${namespace.components.LoadingState.renderLoadingState(loading)}
        </form>
      </section>
    `;
  }

  function renderSelectField(id, label, options, placeholder, required, form, errors) {
    const value = form[id];
    const error = errors[id];
    const describedBy = error ? `${id}-error` : "";
    return `
      <div class="field ${error ? "has-error" : ""}">
        <label for="${id}">${label}${required ? " <span aria-hidden=\"true\">*</span>" : ""}</label>
        <select id="${id}" name="${id}" ${required ? "required" : ""} ${error ? 'aria-invalid="true"' : ""} ${describedBy ? `aria-describedby="${describedBy}"` : ""}>
          ${placeholder ? `<option value="">${placeholder}</option>` : ""}
          ${options
            .map(
              (option) =>
                `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`,
            )
            .join("")}
        </select>
        ${namespace.components.ErrorMessage.renderInlineError(id, errors)}
      </div>
    `;
  }

  function renderRatingField(id, label, labels, required, form, errors) {
    const value = form[id];
    const error = errors[id];
    const describedBy = [`${id}-hint`, error ? `${id}-error` : ""].filter(Boolean).join(" ");
    return `
      <fieldset class="field rating-field ${error ? "has-error" : ""}" ${error ? 'aria-invalid="true"' : ""} aria-describedby="${describedBy}">
        <legend>${label}${required ? " <span aria-hidden=\"true\">*</span>" : ""}</legend>
        <p class="field-hint" id="${id}-hint">1 = ${escapeHtml(labels[0])}, 5 = ${escapeHtml(labels[4])}</p>
        <div class="rating-options">
          ${labels
            .map((ratingLabel, index) => {
              const ratingValue = String(index + 1);
              return `
                <label class="rating-option">
                  <input type="radio" name="${id}" value="${ratingValue}" ${value === ratingValue ? "checked" : ""} aria-label="${escapeHtml(`${label}: ${ratingValue}, ${ratingLabel}`)}" />
                  <span>${ratingValue}</span>
                  <small>${escapeHtml(ratingLabel)}</small>
                </label>
              `;
            })
            .join("")}
        </div>
        ${namespace.components.ErrorMessage.renderInlineError(id, errors)}
      </fieldset>
    `;
  }

  function renderTriggerOptions(form, errors) {
    const error = errors.triggers;
    const describedBy = ["triggers-hint", error ? "triggers-error" : ""].filter(Boolean).join(" ");
    return `
      <fieldset class="field full-width trigger-field ${error ? "has-error" : ""}" ${error ? 'aria-invalid="true"' : ""} aria-describedby="${describedBy}">
        <legend>Main stress trigger <span aria-hidden="true">*</span></legend>
        <p class="field-hint" id="triggers-hint">Select the one trigger that feels most relevant today.</p>
        <div class="trigger-options-grid">
          ${namespace.triggerSuggestions.stressTriggers
            .map(
              (trigger) => `
                <label class="check-option">
                  <input type="radio" name="triggers" value="${escapeHtml(trigger)}" ${form.triggers.includes(trigger) ? "checked" : ""} aria-label="Main stress trigger: ${escapeHtml(trigger)}" />
                  <span>${escapeHtml(trigger)}</span>
                </label>
              `,
            )
            .join("")}
        </div>
        ${namespace.components.ErrorMessage.renderInlineError("triggers", errors)}
      </fieldset>
    `;
  }

  function renderReflectionPrompts(latestPrompt) {
    const { reflectionPrompts } = namespace.reflectionPrompts;
    return `
      <section class="journal-prompt-panel full-width" aria-labelledby="prompt-title">
        <div class="journal-prompt-header">
          <h3 id="prompt-title">Reflection prompts</h3>
          <p>Pick one if writing feels hard today.</p>
        </div>
        <div class="ai-prompt">
          <span>AI prompt</span>
          <p>${escapeHtml(latestPrompt || reflectionPrompts[0])}</p>
        </div>
        <ul class="prompt-chip-list" aria-label="Exam-focused reflection prompt ideas">
          ${reflectionPrompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderReflectionField(form, errors) {
    const error = errors.reflection;
    return `
      <div class="field full-width ${error ? "has-error" : ""}">
        <label for="reflection">Reflection note</label>
        <textarea id="reflection" name="reflection" maxlength="500" ${error ? 'aria-invalid="true"' : ""} aria-describedby="reflection-help reflection-count ${error ? "reflection-error" : ""}" placeholder="What is one thing you are feeling right now?">${escapeHtml(form.reflection)}</textarea>
        <div class="field-footer">
          <p class="field-hint" id="reflection-help">What is one thing you are feeling right now?</p>
          <output id="reflection-count" class="char-count" for="reflection">${form.reflection.length}/500</output>
        </div>
        ${namespace.components.ErrorMessage.renderInlineError("reflection", errors)}
      </div>
    `;
  }

  function renderPositiveMomentField(form, errors) {
    const error = errors.positiveMoment;
    return `
      <div class="field full-width ${error ? "has-error" : ""}">
        <label for="positiveMoment">One positive moment from today</label>
        <input id="positiveMoment" name="positiveMoment" type="text" maxlength="180" value="${escapeHtml(form.positiveMoment)}" ${error ? 'aria-invalid="true"' : ""} aria-describedby="positiveMoment-help ${error ? "positiveMoment-error" : ""}" placeholder="A small win, kind thought, helpful break, or effort you noticed." />
        ${namespace.components.ErrorMessage.renderInlineError("positiveMoment", errors)}
        <p class="field-hint" id="positiveMoment-help">Small counts. This is just a low-pressure note to your future self.</p>
      </div>
    `;
  }

  namespace.components = namespace.components || {};
  namespace.components.CheckInForm = { renderCheckInForm };
  if (typeof module !== "undefined" && module.exports) module.exports = namespace.components.CheckInForm;
})(typeof window !== "undefined" ? window : globalThis);
