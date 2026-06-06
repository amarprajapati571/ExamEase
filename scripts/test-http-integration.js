const assert = require("assert");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = 18_211;
const baseUrl = `http://localhost:${port}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch (error) {
      await wait(100);
    }
  }

  throw new Error("Local server did not start in time.");
}

async function testStaticAssets() {
  const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scriptSources = Array.from(indexSource.matchAll(/<script src="([^"]+)"><\/script>/g), (match) => match[1]);
  const page = await fetch(baseUrl);

  assert.strictEqual(page.status, 200);
  assert.match(page.headers.get("content-security-policy"), /default-src 'self'/);
  assert.match(await page.text(), /Skip to main content/);

  for (const scriptSrc of scriptSources) {
    const response = await fetch(`${baseUrl}/${scriptSrc}`);
    assert.strictEqual(response.status, 200, `${scriptSrc} should be served`);
    assert.match(response.headers.get("content-type") || "", /javascript/);
  }

  assert.strictEqual((await fetch(`${baseUrl}/.env.example`)).status, 404);
  assert.strictEqual((await fetch(`${baseUrl}/server.js`)).status, 404);
  assert.strictEqual((await fetch(`${baseUrl}/lib/wellness-support-core.js`)).status, 404);
}

async function testApi() {
  const missingContentType = await fetch(`${baseUrl}/api/wellness-support`, { method: "POST", body: "{}" });
  assert.strictEqual(missingContentType.status, 415);

  const invalidBody = await fetch(`${baseUrl}/api/wellness-support`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkInData: { moodScore: 99 } }),
  });
  assert.strictEqual(invalidBody.status, 400);

  const validResponse = await fetch(`${baseUrl}/api/wellness-support`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      checkInData: {
        examType: "JEE",
        phase: "Mock tests",
        moodScore: 3,
        stressLevel: 4,
        energyLevel: 3,
        sleepQuality: "Okay",
        trigger: "Mock test scores",
        reflection: "I feel nervous but ready to try one small step.",
        supportPreference: "Help me focus",
      },
      recentHistory: [],
    }),
  });

  assert.strictEqual(validResponse.status, 200);
  assert.match(validResponse.headers.get("cache-control"), /no-store/);
  assert.match(validResponse.headers.get("content-security-policy"), /frame-ancestors 'none'/);

  const payload = await validResponse.json();
  assert.ok(["ai", "fallback"].includes(payload.source));
  assert.strictEqual(payload.support.riskLevel, "Medium");
}

async function run() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), OPENAI_API_KEY: "" },
    stdio: "ignore",
  });

  try {
    await waitForServer();
    await testStaticAssets();
    await testApi();
    console.log("HTTP integration tests passed.");
  } finally {
    child.kill();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
