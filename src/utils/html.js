(function initHtmlUtils(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function createStableId(prefix, ...parts) {
    const slug = parts
      .filter((part) => part !== undefined && part !== null && String(part).trim())
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    return `${prefix}-${slug || "item"}`;
  }

  function formatCheckInDate(date) {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? String(date)
      : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const api = { escapeHtml, createStableId, formatCheckInDate };
  namespace.html = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
