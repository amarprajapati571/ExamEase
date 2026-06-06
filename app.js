(function initExamEaseApp(globalScope) {
  const namespace = globalScope.ExamEase;
  const storageKey = "examease.checkIns.v1";
  const supportCacheKey = "examease.supportCache.v1";
  const supportCache = namespace.cache.loadSupportCache(globalScope.sessionStorage, supportCacheKey);
  const memoStore = namespace.moodAnalytics.createAnalyticsMemo();
  const savedCheckIns = loadStoredCheckIns();
  const { mockEntries, sampleCurrentCheckIn } = namespace.mockWellnessResponse;

  const state = {
    form: namespace.validation.createInitialForm(),
    latestResult: namespace.mockWellnessResponse.createFallbackWellnessSupport(sampleCurrentCheckIn, mockEntries),
    latestCheckIn: sampleCurrentCheckIn,
    checkIns: savedCheckIns.length ? savedCheckIns : [...mockEntries],
    loading: false,
    errors: {},
    shouldFocusResult: false,
  };

  function App() {
    const latestPrompt = state.latestResult.nextCheckInPrompt || namespace.reflectionPrompts.reflectionPrompts[0];
    const dashboardData = createDashboardViewModel();
    const plan = namespace.moodAnalytics.getMemoizedWellnessPlan(state.latestCheckIn, memoStore);

    document.querySelector("#app").innerHTML = `
      <div class="app-shell">
        ${namespace.components.Header.renderHeader()}
        <main>
          <div class="main-grid">
            ${namespace.components.CheckInForm.renderCheckInForm({
              form: state.form,
              errors: state.errors,
              loading: state.loading,
              latestPrompt,
            })}
            ${namespace.components.WellnessResult.renderWellnessResult({
              result: state.latestResult,
              plan,
              loading: state.loading,
            })}
          </div>
          ${namespace.components.MoodDashboard.renderMoodDashboard({
            ...dashboardData,
            latestPrompt,
          })}
        </main>
      </div>
    `;

    bindFormEvents();
    focusResultIfNeeded();
  }

  function createDashboardViewModel() {
    return {
      checkIns: state.checkIns,
      summary: namespace.moodAnalytics.getMemoizedDashboardSummary(state.checkIns, memoStore),
      triggerCounts: namespace.moodAnalytics.getMemoizedTriggerCounts(state.checkIns, memoStore),
      triggerInsights: namespace.moodAnalytics.getMemoizedStressTriggerInsights(state.checkIns, memoStore),
      recentReflections: namespace.moodAnalytics.getMemoizedRecentReflections(state.checkIns, memoStore),
    };
  }

  function bindFormEvents() {
    const form = document.querySelector("#checkin-form");
    const reflection = document.querySelector("#reflection");

    form.addEventListener("input", () => {
      captureForm(form);
      if (reflection) {
        document.querySelector("#reflection-count").value = `${reflection.value.length}/500`;
      }
    });

    form.addEventListener("change", () => {
      captureForm(form);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      captureForm(form);

      const errors = namespace.validation.validateForm(state.form);
      state.errors = errors;

      if (Object.keys(errors).length) {
        App();
        focusFirstError(errors);
        return;
      }

      const checkIn = namespace.validation.normalizeCheckIn(state.form);
      const risk = namespace.riskAssessment.assessRisk(checkIn);
      const checkInForStorage = namespace.riskAssessment.sanitizeCheckInForStorage(checkIn, risk);
      const recentHistory = namespace.moodAnalytics.createRecentHistorySummary(state.checkIns);

      state.loading = true;
      App();

      const support =
        risk.level === "High" && risk.hasSensitiveReflection
          ? namespace.mockWellnessResponse.createFallbackWellnessSupport(checkIn, recentHistory)
          : await namespace.aiService.generateWellnessSupport(checkIn, recentHistory, {
              supportCache,
              cacheStorage: globalScope.sessionStorage,
              cacheKeyName: supportCacheKey,
            });

      state.loading = false;
      state.latestResult = support;
      state.latestCheckIn = checkIn;
      state.checkIns = [...state.checkIns, checkInForStorage];
      saveStoredCheckIns(state.checkIns);
      state.shouldFocusResult = true;
      App();
    });
  }

  function focusResultIfNeeded() {
    if (!state.shouldFocusResult) {
      return;
    }

    state.shouldFocusResult = false;
    globalScope.requestAnimationFrame(() => {
      const result = document.querySelector("#wellness-result");

      if (result) {
        result.focus({ preventScroll: false });
      }
    });
  }

  function captureForm(form) {
    const formData = new FormData(form);

    state.form = {
      examType: String(formData.get("examType") || ""),
      currentPhase: String(formData.get("currentPhase") || ""),
      moodScore: String(formData.get("moodScore") || ""),
      stressLevel: String(formData.get("stressLevel") || ""),
      energyLevel: String(formData.get("energyLevel") || ""),
      sleepQuality: String(formData.get("sleepQuality") || ""),
      triggers: formData.getAll("triggers").map(String),
      reflection: String(formData.get("reflection") || "").slice(0, 500),
      positiveMoment: String(formData.get("positiveMoment") || "").slice(0, 180),
      supportPreference: String(formData.get("supportPreference") || ""),
    };
  }

  function focusFirstError(errors) {
    const firstKey = Object.keys(errors)[0];
    const field = document.querySelector(`[name="${firstKey}"], #${firstKey}`);

    if (field) {
      field.focus();
    }
  }

  function loadStoredCheckIns() {
    try {
      const stored = globalScope.localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : [];

      return Array.isArray(parsed) ? parsed.map(namespace.validation.normalizeStoredCheckIn).filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function saveStoredCheckIns(checkIns) {
    try {
      globalScope.localStorage.setItem(storageKey, JSON.stringify(checkIns));
    } catch (error) {
      // Session-only state still works if browser storage is unavailable.
    }
  }

  namespace.app = {
    App,
    state,
    createDashboardViewModel,
    loadStoredCheckIns,
    saveStoredCheckIns,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = namespace.app;
  }

  App();
})(typeof window !== "undefined" ? window : globalThis);
