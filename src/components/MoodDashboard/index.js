(function initMoodDashboard(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});
  const { escapeHtml, formatCheckInDate } = namespace.html;

  function renderMoodDashboard({ checkIns, summary, triggerCounts, triggerInsights, recentReflections, latestPrompt }) {
    return `
      <section class="dashboard-wrap" aria-labelledby="dashboard-title">
        <div class="panel dashboard-panel">
          <h2 class="section-heading" id="dashboard-title">Dashboard</h2>
          <div class="dashboard-grid">
            <article class="metric-card">
              <h3>Mood trend</h3>
              <span class="metric-value teal">${summary.averageMood}/5</span>
              <p>${escapeHtml(summary.moodTrend)}</p>
              ${renderMiniBars(checkIns, "moodScore", "mood")}
            </article>
            <article class="metric-card">
              <h3>Stress trend</h3>
              <span class="metric-value coral">${summary.averageStress}/5</span>
              <p>${escapeHtml(summary.stressTrend)}</p>
              ${renderMiniBars(checkIns, "stressLevel", "stress")}
            </article>
            <article class="metric-card">
              <h3>Most common trigger</h3>
              <span class="metric-value amber trigger-value">${escapeHtml(summary.commonTrigger || "None yet")}</span>
              ${renderCommonTriggers(triggerCounts)}
            </article>
            <article class="metric-card insight-card">
              <h3>Simple insight</h3>
              <p>${escapeHtml(summary.simpleInsight)}</p>
            </article>
            ${namespace.components.TriggerInsights.renderStressTriggerInsights(triggerInsights)}
            ${namespace.components.ReflectionJournal.renderReflectionJournal({ recentReflections, latestPrompt })}
          </div>
        </div>
      </section>
    `;
  }

  function renderMiniBars(checkIns, key, type) {
    const bars = checkIns
      .slice(-7)
      .map((entry) => {
        const height = Math.max(10, entry[key] * 14);
        return `<span class="mini-bar ${type === "stress" ? "stress" : ""}" style="height: ${height}px" title="${formatCheckInDate(entry.date)}: ${entry[key]} out of 5"></span>`;
      })
      .join("");

    return `<div class="mini-bars" aria-label="${type} values for recent check-ins">${bars}</div>`;
  }

  function renderCommonTriggers(counts) {
    const values = Object.values(counts);

    if (!values.length) {
      return `<p>No triggers tracked yet.</p>`;
    }

    const max = Math.max(...values);

    return `
      <ul class="trigger-list">
        ${Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([trigger, count]) => {
            const width = Math.round((count / max) * 100);
            return `
              <li class="trigger-item">
                <div class="trigger-row"><span>${escapeHtml(trigger)}</span><strong>${count}</strong></div>
                <div class="trigger-track" aria-hidden="true"><span class="trigger-fill" style="width: ${width}%"></span></div>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }

  namespace.components = namespace.components || {};
  namespace.components.MoodDashboard = { renderMoodDashboard };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = namespace.components.MoodDashboard;
  }
})(typeof window !== "undefined" ? window : globalThis);
