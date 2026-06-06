const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "public");
const requiredFiles = ["index.html", "styles.css", "app.js"];
const requiredBackendFiles = ["server.js", "api/wellness-support.js", "lib/wellness-support-core.js"];
const requiredDirs = ["src"];
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const browserScriptFiles = Array.from(indexSource.matchAll(/<script src="([^"]+)"><\/script>/g), (match) => match[1]);

for (const file of [...requiredFiles, ...requiredBackendFiles, ...browserScriptFiles]) {
  const filePath = path.join(root, file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required deployment file: ${file}`);
  }

  const stats = fs.statSync(filePath);

  if (!stats.isFile() || stats.size === 0) {
    throw new Error(`Deployment file is empty or invalid: ${file}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const file of requiredFiles) {
  fs.copyFileSync(path.join(root, file), path.join(outputDir, file));
}

for (const dir of requiredDirs) {
  fs.cpSync(path.join(root, dir), path.join(outputDir, dir), { recursive: true });
}

for (const file of browserScriptFiles) {
  const outputFilePath = path.join(outputDir, file);

  if (!fs.existsSync(outputFilePath)) {
    throw new Error(`Missing built browser script: ${file}`);
  }
}

console.log("ExamEase static site is ready for deployment in public/.");
