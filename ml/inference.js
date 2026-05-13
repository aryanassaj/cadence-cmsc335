const model = require("./model.json");

function extractFeatures(events) {
  const keydowns = events.filter(e => e.type === "keydown");
  const keyups   = events.filter(e => e.type === "keyup");

  const ikis = [];
  for (let i = 1; i < keydowns.length; i++) {
    ikis.push(keydowns[i].time - keydowns[i - 1].time);
  }

  const mean_iki = ikis.length ? ikis.reduce((a, b) => a + b, 0) / ikis.length : 0;
  const std_iki  = ikis.length
    ? Math.sqrt(ikis.map(v => (v - mean_iki) ** 2).reduce((a, b) => a + b, 0) / ikis.length)
    : 0;

  const backspaces    = keydowns.filter(e => e.key === "Backspace").length;
  const backspace_rate = keydowns.length ? backspaces / keydowns.length : 0;

  const totalChars = keydowns.filter(e => e.key !== "Backspace").length;
  const duration   = keydowns.length > 1
    ? (keydowns[keydowns.length - 1].time - keydowns[0].time) / 60000
    : 1;
  const wpm = totalChars / 5 / (duration || 1);

  const pauses     = ikis.filter(v => v > 1000).length;
  const pause_freq = ikis.length ? pauses / ikis.length : 0;

  const holds = [];
  keydowns.forEach(kd => {
    const ku = keyups.find(u => u.key === kd.key && u.time >= kd.time);
    if (ku) holds.push(ku.time - kd.time);
  });
  const mean_hold = holds.length ? holds.reduce((a, b) => a + b, 0) / holds.length : 0;

  const flights = [];
  for (let i = 1; i < keydowns.length; i++) {
    const prevUp = keyups.find(u => u.key === keydowns[i - 1].key && u.time >= keydowns[i - 1].time);
    if (prevUp) flights.push(keydowns[i].time - prevUp.time);
  }
  const mean_flight = flights.length ? flights.reduce((a, b) => a + b, 0) / flights.length : 0;

  return { mean_iki, std_iki, backspace_rate, wpm, pause_freq, mean_hold, mean_flight };
}

function scoreRisk(metrics) {
  const { feature_names, scaler_mean, scaler_std, feature_importances, intercept, thresholds } = model;

  // intercept is the logistic regression bias term (0 for placeholder weights)
  let score = intercept || 0;
  feature_names.forEach((name, i) => {
    const z = (metrics[name] - scaler_mean[i]) / (scaler_std[i] || 1);
    // coefficients from trained LR already encode direction (positive = higher risk)
    score += feature_importances[i] * z;
  });

  const probability = 1 / (1 + Math.exp(-score));

  let label = "low";
  if (probability >= thresholds.high_risk)        label = "high";
  else if (probability >= thresholds.medium_risk)  label = "medium";

  return { score: Math.round(probability * 100) / 100, label };
}

module.exports = { extractFeatures, scoreRisk };
