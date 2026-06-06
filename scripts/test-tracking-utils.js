const assert = require("assert");
const {
  calculateAverageMood,
  calculateAverageStress,
  findMostCommonTrigger,
  getMoodTrend,
  getStressTrend,
} = require("../tracking-utils");

const checkIns = [
  { moodScore: 2, stressLevel: 5, trigger: "Mock test scores", sleepQuality: "Good", energyLevel: 4 },
  { moodScore: 3, stressLevel: 4, trigger: "Mock test scores", sleepQuality: "Okay", energyLevel: 3 },
  { moodScore: 5, stressLevel: 2, trigger: "Syllabus pressure", sleepQuality: "Poor", energyLevel: 2 },
];

assert.strictEqual(calculateAverageMood(checkIns), 3.3);
assert.strictEqual(calculateAverageStress(checkIns), 3.7);
assert.strictEqual(findMostCommonTrigger(checkIns), "Mock test scores");
assert.strictEqual(getMoodTrend(checkIns), "Mood is improving");
assert.strictEqual(getStressTrend(checkIns), "Stress is easing");
assert.strictEqual(calculateAverageMood([]), 0);
assert.strictEqual(calculateAverageStress([]), 0);
assert.strictEqual(findMostCommonTrigger([]), "");
assert.strictEqual(getMoodTrend([{ moodScore: 3 }]), "Mood is steady");
assert.strictEqual(getStressTrend([{ stressLevel: 3 }]), "Stress is steady");

console.log("Tracking utilities passed.");
