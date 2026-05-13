require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");

const authRouter = require("./routes/auth");
const testRouter = require("./routes/test");
const analysisRouter = require("./routes/analysis");

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_CONNECTION_STRING)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));
app.use(express.static(path.resolve(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "cadence-secret",
  resave: false,
  saveUninitialized: false,
}));

app.use("/auth", authRouter);
app.use("/test", testRouter);
app.use("/analysis", analysisRouter);

app.get("/", (req, res) => {
  res.render("home", { user: req.session.user || null });
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");
  res.render("dashboard", { user: req.session.user });
});

app.listen(PORT, () => console.log(`Cadence running on http://localhost:${PORT}`));
