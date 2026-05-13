const express  = require("express");
const router   = express.Router();
const requireLogin = require("../middleware/auth");
const TypingSession = require("../models/TypingSession");
const fetch    = require("node-fetch");
const modelData = require("../ml/model.json");

/* ── helpers ── */
function avg(arr) {
  const clean = arr.filter(v => v != null && !isNaN(v));
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
}

function linearSlope(values) {
  if (values.length < 2) return 0;
  const n = values.length;
  const xm = (n - 1) / 2;
  const ym = avg(values);
  let num = 0, den = 0;
  values.forEach((y, x) => { num += (x - xm) * (y - ym); den += (x - xm) ** 2; });
  return den ? num / den : 0;
}

const FEATURE_LABELS = {
  mean_iki:       "Typing Rhythm (IKI)",
  std_iki:        "Timing Regularity",
  wpm:            "Words Per Minute",
  pause_freq:     "Pause Frequency",
  mean_hold:      "Key Hold Duration",
  mean_flight:    "Key Transition Speed",
  backspace_rate: "Error Rate",
};

const FEATURE_UNITS = {
  mean_iki: "ms", std_iki: "ms", wpm: "wpm",
  pause_freq: "%", mean_hold: "ms", mean_flight: "ms", backspace_rate: "%",
};

function formatValue(feat, val) {
  if (feat === "pause_freq" || feat === "backspace_rate") return (val * 100).toFixed(1) + "%";
  if (feat === "wpm") return Math.round(val) + " wpm";
  return Math.round(val) + " ms";
}

/* ── GET /analysis/history ── */
router.get("/history", requireLogin, async (req, res) => {
  try {
    const sessions = await TypingSession.find({ userId: req.session.user.id })
      .sort({ timestamp: 1 })
      .select("timestamp metrics riskScore riskLabel");

    if (!sessions.length) return res.json({ sessions: [], insight: null });

    /* Baseline: average of first min(3, n) sessions */
    const baselineCount = Math.min(3, sessions.length);
    const baselineSessions = sessions.slice(0, baselineCount);
    const baselineScore = avg(baselineSessions.map(s => s.riskScore));
    const baselineMetrics = {};
    modelData.feature_names.forEach(feat => {
      baselineMetrics[feat] = avg(baselineSessions.map(s => s.metrics?.[feat]));
    });

    /* Latest session */
    const latest = sessions[sessions.length - 1];
    const scoreDelta = latest.riskScore - baselineScore;

    /* Trend: slope of last min(5, n) scores */
    const window = sessions.slice(-Math.min(5, sessions.length));
    const slope  = linearSlope(window.map(s => s.riskScore));
    const trendLabel = slope > 0.005 ? "rising" : slope < -0.005 ? "falling" : "stable";

    /* Per-feature breakdown — weighted by model coefficient */
    const featureBreakdown = modelData.feature_names.map((feat, i) => {
      const coef     = modelData.feature_importances[i];
      const base     = baselineMetrics[feat];
      const current  = latest.metrics?.[feat] ?? base;
      const rawDelta = current - base;
      const pctDelta = base !== 0 ? (rawDelta / Math.abs(base)) * 100 : 0;
      /* positive riskImpact = moving toward higher risk */
      const riskImpact = pctDelta * (coef >= 0 ? 1 : -1);
      return {
        feature:    feat,
        label:      FEATURE_LABELS[feat] || feat,
        coef,
        baseline:   formatValue(feat, base),
        current:    formatValue(feat, current),
        rawBaseline: base,
        rawCurrent:  current,
        pctDelta:   Math.round(pctDelta),
        riskImpact: Math.round(riskImpact * 10) / 10,
      };
    });

    /* Dominant driver: feature with highest absolute risk impact */
    const sorted = [...featureBreakdown].sort((a, b) => Math.abs(b.riskImpact) - Math.abs(a.riskImpact));
    const driver = sorted[0];

    /* Plain-English interpretation */
    let interpretation = "";
    if (sessions.length === 1) {
      interpretation = "This is your first session — it will serve as your personal baseline. Take a few more sessions to unlock trend analysis.";
    } else {
      const deltaStr = Math.abs(Math.round(scoreDelta * 100));
      const dir      = scoreDelta > 0.02 ? "risen" : scoreDelta < -0.02 ? "fallen" : "remained stable";
      interpretation = `Your risk score has ${dir}${deltaStr > 0 ? " " + deltaStr + " points" : ""} from your ${baselineCount}-session baseline of ${Math.round(baselineScore * 100)}.`;
      if (driver && Math.abs(driver.pctDelta) >= 5) {
        const changeDir = driver.pctDelta > 0 ? "increased" : "decreased";
        const goodOrBad = driver.riskImpact > 0 ? "elevated your" : "lowered your";
        interpretation += ` Your ${driver.label.toLowerCase()} has ${changeDir} ${Math.abs(driver.pctDelta)}% — the primary factor that has ${goodOrBad} score.`;
      }
      if (trendLabel === "rising")  interpretation += " The overall trend is upward — consider more frequent monitoring.";
      if (trendLabel === "falling") interpretation += " The overall trend is improving — your patterns are moving in a healthy direction.";
    }

    res.json({
      sessions,
      insight: {
        baselineScore:   Math.round(baselineScore * 100),
        latestScore:     Math.round(latest.riskScore * 100),
        scoreDelta:      Math.round(scoreDelta * 100),
        trendLabel,
        trendSlope:      Math.round(slope * 10000) / 10000,
        sessionCount:    sessions.length,
        baselineCount,
        featureBreakdown,
        interpretation,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});

/* ── GET /analysis/research ── */
router.get("/research", async (req, res) => {
  try {
    const query    = encodeURIComponent("Alzheimer's keystroke typing cognitive decline early detection");
    const url      = `https://api.openalex.org/works?search=${query}&per-page=5&select=title,doi,publication_year,authorships`;
    const response = await fetch(url);
    const data     = await response.json();
    const papers   = data.results.map(p => ({
      title:   p.title,
      year:    p.publication_year,
      doi:     p.doi,
      authors: p.authorships.slice(0, 3).map(a => a.author.display_name),
    }));
    res.json(papers);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch research papers." });
  }
});

module.exports = router;
