(function initCacheUtils(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

  function stableStringify(value) {
    if (value === undefined) return "undefined";
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  function createSupportCacheKey(checkIn) {
    return stableStringify({
      examType: checkIn.examType,
      phase: checkIn.phase,
      moodScore: checkIn.moodScore,
      stressLevel: checkIn.stressLevel,
      energyLevel: checkIn.energyLevel,
      sleepQuality: checkIn.sleepQuality,
      trigger: checkIn.trigger,
      reflection: checkIn.reflection,
      supportPreference: checkIn.supportPreference,
    });
  }

  function loadSupportCache(storage, key) {
    try {
      const parsed = JSON.parse(storage.getItem(key) || "[]");
      return new Map(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Map();
    }
  }

  function persistSupportCache(storage, key, supportCache, limit = 20) {
    try {
      storage.setItem(key, JSON.stringify(Array.from(supportCache.entries()).slice(-limit)));
    } catch (error) {
      // In-memory cache still works if storage is unavailable.
    }
  }

  function createCheckInId(cryptoSource) {
    return cryptoSource && typeof cryptoSource.randomUUID === "function"
      ? cryptoSource.randomUUID()
      : `checkin-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const api = { stableStringify, createSupportCacheKey, loadSupportCache, persistSupportCache, createCheckInId };
  namespace.cache = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
