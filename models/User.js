const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  age:         { type: Number, required: true },
  handedness:  { type: String, enum: ["left", "right", "ambidextrous"], required: true },
  education:   { type: String, required: true },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
