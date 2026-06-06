const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "public");
const requiredFiles = ["index.html", "styles.css", "tracking-utils.js", "app.js"];
const requiredBackendFiles = ["server.js", "api/wellness-support.js"];

for (const file of [...requiredFiles, ...requiredBackendFiles]) {
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

console.log("ExamEase static site is ready for deployment in public/.");
