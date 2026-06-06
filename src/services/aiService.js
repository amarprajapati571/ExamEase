(function initAiService(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

  async function generateWellnessSupport(checkInData, recentHistory, options = {}) {
    const {
      fetchImpl = globalScope.fetch,
      supportCache,
      cacheStorage = globalScope.sessionStorage,
      cacheKeyName = "examease.supportCache.v1",
    } = options;
    const cacheKey = namespace.cache.createSupportCacheKey(checkInData);
    const cached = supportCache.get(cacheKey);

    if (cached && namespace.responseParser.isValidWellnessSupport(cached)) {
      return namespace.responseParser.applySafetyOverride(cached, checkInData);
    }

    try {
      const response = await fetchImpl("/api/wellness-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInData, recentHistory }),
      });
      if (!response.ok) throw new Error("Wellness API is unavailable.");
      const candidate = namespace.responseParser.parseSupportPayload(await response.json());
      if (!namespace.responseParser.isValidWellnessSupport(candidate)) {
        throw new Error("Wellness API returned an invalid response.");
      }
      const support = namespace.responseParser.applySafetyOverride(candidate, checkInData);
      setSupportCache(cacheKey, support, supportCache, cacheStorage, cacheKeyName);
      return support;
    } catch (error) {
      const fallback = namespace.mockWellnessResponse.createFallbackWellnessSupport(checkInData, recentHistory);
      setSupportCache(cacheKey, fallback, supportCache, cacheStorage, cacheKeyName);
      return fallback;
    }
  }

  function setSupportCache(key, support, supportCache, cacheStorage, cacheKeyName) {
    supportCache.set(key, support);
    namespace.cache.persistSupportCache(cacheStorage, cacheKeyName, supportCache);
  }

  const api = { generateWellnessSupport };
  namespace.aiService = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
