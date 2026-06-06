(function initValidation(globalScope) {
  const namespace = (globalScope.ExamEase = globalScope.ExamEase || {});

  function createInitialForm() {
    return {
      examType: "",
      currentPhase: "Preparation",
      moodScore: "",
      stressLevel: "",
      energyLevel: "3",
      sleepQuality: "Okay",
      triggers: [],
      reflection: "",
      positiveMoment: "",
      supportPreference: "Calm me down",
    };
  }

  function validateForm(form, options = namespace.triggerSuggestions) {
    const errors = {};

    if (!options.examTypes.includes(form.examType)) errors.examType = "Please choose the exam type you are preparing for.";
    if (!options.currentPhases.includes(form.currentPhase)) errors.currentPhase = "Please choose your current exam phase.";
    if (!form.moodScore) errors.moodScore = "Please select a mood score from 1 to 5.";
    if (!form.stressLevel) errors.stressLevel = "Please select a stress level from 1 to 5.";
    if (!isScaleValue(form.energyLevel)) errors.energyLevel = "Please select an energy level from 1 to 5.";
    if (!options.sleepOptions.includes(form.sleepQuality)) errors.sleepQuality = "Please choose your sleep quality.";

    if (!form.triggers.length) {
      errors.triggers = "Please select at least one stress trigger.";
    } else if (!form.triggers.every((trigger) => options.stressTriggers.includes(trigger))) {
      errors.triggers = "Please choose a listed stress trigger.";
    }

    if (!options.supportPreferences.includes(form.supportPreference)) {
      errors.supportPreference = "Please choose the type of support you want.";
    }

    if (form.reflection.length > 500) errors.reflection = "Please keep your reflection under 500 characters.";
    if (form.positiveMoment.length > 180) {
      errors.positiveMoment = "Please keep the positive moment under 180 characters.";
    }

    return errors;
  }

  function isScaleValue(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 5;
  }

  function normalizeCheckIn(form, idFactory = () => namespace.cache.createCheckInId(globalScope.crypto)) {
    return {
      id: idFactory(),
      date: new Date().toISOString(),
      examType: form.examType,
      phase: form.currentPhase,
      moodScore: Number(form.moodScore),
      stressLevel: Number(form.stressLevel),
      energyLevel: Number(form.energyLevel),
      sleepQuality: form.sleepQuality,
      trigger: form.triggers[0],
      reflection: form.reflection.trim(),
      positiveMoment: form.positiveMoment.trim(),
      supportPreference: form.supportPreference,
    };
  }

  function normalizeStoredCheckIn(checkIn) {
    if (!checkIn || typeof checkIn !== "object") return null;
    const trigger = getPrimaryTrigger(checkIn);
    const phase = checkIn.phase || checkIn.currentPhase;
    if (!trigger || !phase) return null;

    return {
      id: String(checkIn.id || namespace.cache.createCheckInId(globalScope.crypto)),
      date: String(checkIn.date || new Date().toISOString()),
      examType: String(checkIn.examType || "Other"),
      phase: String(phase),
      moodScore: Number(checkIn.moodScore),
      stressLevel: Number(checkIn.stressLevel),
      energyLevel: Number(checkIn.energyLevel || 3),
      sleepQuality: String(checkIn.sleepQuality || "Okay"),
      trigger: normalizeTriggerName(trigger),
      reflection: String(checkIn.reflection || ""),
      positiveMoment: String(checkIn.positiveMoment || ""),
      supportPreference: String(checkIn.supportPreference || "Calm me down"),
    };
  }

  function getPrimaryTrigger(checkIn) {
    if (typeof checkIn.trigger === "string" && checkIn.trigger.trim()) return normalizeTriggerName(checkIn.trigger);
    if (Array.isArray(checkIn.triggers) && typeof checkIn.triggers[0] === "string") {
      return normalizeTriggerName(checkIn.triggers[0]);
    }
    return "Other";
  }

  function normalizeTriggerName(trigger) {
    const aliases = {
      "Low mock test score": "Mock test scores",
      "Mock test score": "Mock test scores",
      "Results uncertainty": "Result uncertainty",
    };
    const value = String(trigger || "").trim();
    return aliases[value] || value;
  }

  const api = {
    createInitialForm,
    validateForm,
    isScaleValue,
    normalizeCheckIn,
    normalizeStoredCheckIn,
    getPrimaryTrigger,
    normalizeTriggerName,
  };

  namespace.validation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
