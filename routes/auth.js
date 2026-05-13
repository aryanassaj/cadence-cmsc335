const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

router.post("/register", async (req, res) => {
  const { username, email, password, age, handedness, education } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.render("register", { error: "Username or email already taken." });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed, age, handedness, education });
    req.session.user = { id: user._id, username: user.username };
    res.redirect("/dashboard");
  } catch (e) {
    res.render("register", { error: "Something went wrong. Try again." });
  }
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.render("login", { error: "No account found with that email." });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render("login", { error: "Incorrect password." });
    req.session.user = { id: user._id, username: user.username };
    res.redirect("/dashboard");
  } catch (e) {
    res.render("login", { error: "Something went wrong. Try again." });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
