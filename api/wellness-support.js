const {
  DEFAULT_OPENAI_MODEL,
  createRateLimiter,
  getRequestClientKey,
  getWellnessSupport,
  isJsonRequest,
  normalizeWellnessPayload,
  readJsonBody,
  sendJson,
  setSecurityHeaders,
} = require("../lib/wellness-support-core");

const isAllowedRequest = createRateLimiter();

module.exports = async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!isAllowedRequest(getRequestClientKey(req))) {
    sendJson(res, 429, { error: "Too many requests. Please wait a minute and try again." });
    return;
  }

  if (!isJsonRequest(req)) {
    sendJson(res, 415, { error: "Please send JSON check-in data." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: "We could not read that check-in. Please try again." });
    return;
  }

  const { checkInData, recentHistory } = normalizeWellnessPayload(body);

  if (!checkInData) {
    sendJson(res, 400, { error: "Please complete the check-in before generating support." });
    return;
  }

  const result = await getWellnessSupport({
    checkInData,
    recentHistory,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
  });

  sendJson(res, 200, result);
};
