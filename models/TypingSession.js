const mongoose = require("mongoose");

const typingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  metrics: {
    mean_iki:       Number,
    std_iki:        Number,
    backspace_rate: Number,
    wpm:            Number,
    pause_freq:     Number,
    mean_hold:      Number,
    mean_flight:    Number,
  },
  riskScore:     { type: Number, min: 0, max: 1 },
  riskLabel:     { type: String, enum: ["low", "medium", "high"] },
  rawKeystrokes: { type: Array, default: [] },
});

module.exports = mongoose.model("TypingSession", typingSessionSchema);
