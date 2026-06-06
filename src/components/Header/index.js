(function initHeader(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

  function renderHeader() {
    return `
      <header class="page-header">
        <div class="header-inner">
          <div class="brand-block">
            <h1 class="app-name">ExamEase</h1>
            <p class="tagline">A calm daily wellness tracker for students navigating exams, preparation pressure, and result seasons.</p>
          </div>
          <span class="status-pill">Wellness support, not diagnosis</span>
        </div>
      </header>
    `;
  }

  namespace.components = namespace.components || {};
  namespace.components.Header = { renderHeader };
  if (typeof module !== "undefined" && module.exports) module.exports = namespace.components.Header;
})(typeof window !== "undefined" ? window : globalThis);
