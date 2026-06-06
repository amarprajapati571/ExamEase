const fs = require("fs");
const http = require("http");
const path = require("path");
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
} = require("./lib/wellness-support-core");

const PORT = Number(process.env.PORT || 8011);
const PUBLIC_DIR = __dirname;
const isAllowedRequest = createRateLimiter();

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/wellness-support") {
      await handleWellnessSupport(req, res);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`ExamEase running at http://localhost:${PORT}`);
});

async function handleWellnessSupport(req, res) {
  setSecurityHeaders(res);
  res.setHeader("Cache-Control", "no-store");

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
}

function serveStatic(req, res) {
  setSecurityHeaders(res);

  const requestPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(req.method === "HEAD" ? undefined : content);
  });
}

function contentType(filePath) {
  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
  };

  return types[path.extname(filePath)] || "text/plain";
}
