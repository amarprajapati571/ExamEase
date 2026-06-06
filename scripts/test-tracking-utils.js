const assert = require("assert");
const {
  calculateAverageMood,
  calculateAverageStress,
  findMostCommonTrigger,
  getMoodTrend,
  getStressTrend,
} = require("../tracking-utils");

const checkIns = [
  { moodScore: 2, stressLevel: 2, trigger: "Mock tests", sleepQuality: "Good", energyLevel: 4 },
  { moodScore: 3, stressLevel: 3, trigger: "Mock tests", sleepQuality: "Okay", energyLevel: 3 },
  { moodScore: 5, stressLevel: 5, trigger: "Syllabus pressure", sleepQuality: "Poor", energyLevel: 2 },
];

assert.strictEqual(calculateAverageMood(checkIns), 3.3);
assert.strictEqual(calculateAverageStress(checkIns), 3.3);
assert.strictEqual(findMostCommonTrigger(checkIns), "Mock tests");
assert.strictEqual(getMoodTrend(checkIns), "Mood is improving");
assert.strictEqual(getStressTrend(checkIns), "Stress is increasing");
assert.strictEqual(calculateAverageMood([]), 0);
assert.strictEqual(findMostCommonTrigger([]), "");

console.log("Tracking utilities passed.");
