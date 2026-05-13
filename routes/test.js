const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/auth");
const TypingSession = require("../models/TypingSession");
const { extractFeatures, scoreRisk } = require("../ml/inference");

const PASSAGE = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly.";

router.get("/", requireLogin, (req, res) => {
  res.render("test", { user: req.session.user, passage: PASSAGE });
});

router.post("/submit", requireLogin, async (req, res) => {
  try {
    const { keystrokes } = req.body;
    const events = JSON.parse(keystrokes);
    const metrics = extractFeatures(events);
    const { score, label } = scoreRisk(metrics);

    await TypingSession.create({
      userId:        req.session.user.id,
      metrics,
      riskScore:     score,
      riskLabel:     label,
      rawKeystrokes: events,
    });

    res.json({ success: true, score, label, metrics });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to process session." });
  }
});

module.exports = router;
