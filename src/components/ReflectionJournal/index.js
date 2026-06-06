(function initReflectionJournal(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const { createStableId, escapeHtml, formatCheckInDate } = namespace.html;

  function renderReflectionJournal({ recentReflections, latestPrompt }) {
    return `
      <article class="reflection-card">
        <div class="journal-heading">
          <div>
            <h3>Reflection Journal</h3>
            <p>Short notes from recent check-ins, without pressure to make them perfect.</p>
          </div>
        </div>
        <div class="privacy-note">
          Your reflections are personal. Avoid entering sensitive personal information if you are using a shared device.
        </div>
        <div class="journal-next-prompt">
          <span>Next prompt</span>
          <p>${escapeHtml(latestPrompt)}</p>
        </div>
        <ul class="reflection-list">
          ${recentReflections
            .map(
              (entry) => `
                <li class="journal-entry" id="${escapeHtml(createStableId("reflection", entry.id))}">
                  <span class="reflection-meta">${escapeHtml(formatCheckInDate(entry.date))} - ${escapeHtml(entry.examType)} - ${escapeHtml(entry.phase)} - ${escapeHtml(entry.trigger)}</span>
                  <p>${entry.reflection ? escapeHtml(entry.reflection) : "No reflection added."}</p>
                  ${
                    entry.positiveMoment
                      ? `<p class="positive-moment"><strong>Positive moment:</strong> ${escapeHtml(entry.positiveMoment)}</p>`
                      : ""
                  }
                </li>
              `,
            )
            .join("")}
        </ul>
      </article>
    `;
  }

  namespace.components = namespace.components || {};
  namespace.components.ReflectionJournal = { renderReflectionJournal };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = namespace.components.ReflectionJournal;
  }
})(typeof window !== "undefined" ? window : globalThis);
