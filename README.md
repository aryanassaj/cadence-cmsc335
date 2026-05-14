# Cadence — Cognitive Health Tracker via Typing Patterns

**Submitted by:** Trenton Regis (tregis05) — uploader to submit server\
**Group Members:** Arya Nassaj (anassaj), Trenton Regis (tregis05), Donald Gutierrez (donaldxg) \
**App Description:** Cadence is a full-stack web application that tracks subtle changes in typing behavior over time and uses machine learning to produce a longitudinal cognitive health timeline. \
**YouTube Video Link** https://youtu.be/LjwDRXXC9RM \
**APIs** OpenAlex API (https://openalex.org/) \
**Contact Email** workanassaj@gmail.com\
**Deployed App Link:** https://cadence-cmsc335.onrender.com \
**AI Use:** Claude Code (Anthropic)\

---

## App Description

Cadence is a full-stack web application that tracks subtle changes in typing behavior over time and uses machine learning to produce a longitudinal cognitive health timeline. Users complete periodic typing tests in the browser; Cadence extracts seven keystroke dynamics features per session and scores them against a risk model trained on the TAPPY dataset (a clinically validated corpus of 205 participants with and without Parkinson's disease).

Keystroke dynamics research — published in *npj Digital Medicine* and the *Journal of Alzheimer's Disease* — shows that inter-key intervals, hold times, and error rates diverge from baseline years before clinical symptoms appear. Cadence operationalizes this research in a consumer-grade typing interface.

---

## CMSC335 Requirements Checklist

| Requirement | Status | Where |
|---|---|---|
| `express.Router()` | ✅ | `routes/auth.js`, `routes/test.js`, `routes/analysis.js` |
| Mongoose + MongoDB | ✅ | `models/User.js`, `models/TypingSession.js`, `server.js` |
| 5+ routes (GET/POST) | ✅ | 11 routes total (see Route Map below) |
| At least one HTML form | ✅ | Register (6 fields), Login (2 fields) |
| Standalone CSS + Google Font | ✅ | `public/css/styles.css` + `public/css/landing.css` — DM Serif Display, Inter, Space Mono |
| External API | ✅ | OpenAlex API in `routes/analysis.js` |
| Deployed online | ✅ | https://cadence-cmsc335.onrender.com |
| YouTube video | https://youtu.be/LjwDRXXC9RM |
| README with required fields | ✅ | This file |

---

## Route Map

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Landing page |
| GET | `/dashboard` | Yes | User dashboard with charts and research |
| GET | `/auth/register` | No | Registration form |
| POST | `/auth/register` | No | Create account, hash password, set session |
| GET | `/auth/login` | No | Login form |
| POST | `/auth/login` | No | Verify credentials, set session |
| GET | `/auth/logout` | No | Destroy session, redirect home |
| GET | `/test` | Yes | Typing test page |
| POST | `/test/submit` | Yes | Process keystroke events → extract features → score → save to DB |
| GET | `/analysis/history` | Yes | Return all user sessions as JSON |
| GET | `/analysis/research` | Yes | Fetch Alzheimer's research papers from OpenAlex API |

---

## Project Structure

```
FinalExamProject/
├── server.js               # Express app, MongoDB connection, top-level routes
├── package.json
├── .env                    # MONGO_CONNECTION_STRING, SESSION_SECRET, PORT (not committed)
├── .gitignore
│
├── models/
│   ├── User.js             # username, email, password (bcrypt), age, handedness, education
│   └── TypingSession.js    # userId ref, timestamp, 7 metrics, riskScore, riskLabel, rawKeystrokes
│
├── routes/
│   ├── auth.js             # Register / Login / Logout
│   ├── test.js             # Typing test GET + POST/submit
│   └── analysis.js         # History (DB) + Research (OpenAlex API)
│
├── middleware/
│   └── auth.js             # requireLogin — redirects unauthenticated users to /auth/login
│
├── ml/
│   ├── inference.js        # extractFeatures() + scoreRisk() — pure Node.js, no Python at runtime
│   ├── model.json          # Feature weights, z-score scalers, risk thresholds
│   └── train.py            # TAPPY dataset training scaffold (offline, Python)
│
├── public/
│   ├── css/
│   │   ├── styles.css      # Dark theme for app pages (dashboard, test, auth)
│   │   └── landing.css     # Apple-style landing page CSS (DM Serif Display, GSAP, Lenis)
│   ├── images/             # (reserved for brain video frames when added)
│   └── js/                 # (reserved for extracted JS modules)
│
└── views/                  # EJS templates
    ├── home.ejs            # Landing page — neural canvas hero, pipeline, brain zoom, stats
    ├── register.ejs        # Registration form
    ├── login.ejs           # Login form
    ├── test.ejs            # Typing test — real-time WPM / accuracy / passage highlight
    └── dashboard.ejs       # Chart.js risk + WPM charts, latest session, research papers
```

---

## ML Pipeline

### Feature Extraction (`ml/inference.js → extractFeatures`)
From raw `keydown` / `keyup` events (timestamped at 1ms resolution):

| Feature | Description |
|---------|-------------|
| `mean_iki` | Mean inter-key interval (ms) — baseline typing speed |
| `std_iki` | IKI standard deviation — timing regularity (earliest biomarker) |
| `backspace_rate` | Backspace keypresses / total keypresses — error correction tendency |
| `wpm` | Words per minute — overall speed |
| `pause_freq` | Fraction of IKIs > 1000ms — hesitation frequency |
| `mean_hold` | Mean key dwell time (ms) — motor hold duration |
| `mean_flight` | Mean time between key-up and next key-down (ms) — transition speed |

### Risk Scoring (`ml/inference.js → scoreRisk`)
1. Z-score normalize each feature using TAPPY corpus μ/σ from `model.json`
2. Compute weighted dot product with `feature_importances`
3. Apply sigmoid: `score = 1 / (1 + exp(-weighted_sum))`
4. Classify: Low < 0.33 ≤ Medium < 0.55 ≤ High

### Training the Real Model (optional offline step)
```bash
# Install Python dependencies
pip install pandas numpy scikit-learn

# Download TAPPY dataset from Kaggle
# https://www.kaggle.com/datasets/valkling/tappy-keystroke-data

# Place CSV files in ml/tappy_data/ then run:
python ml/train.py
# Outputs updated model.json with real TAPPY-trained weights
```
The app is fully functional with the placeholder weights in `model.json`. Scores are calibrated to produce reasonable low/medium/high classifications at typical typing speeds.

---

## Database (MongoDB Atlas)

- **Cluster:** Cluster0 on MongoDB Atlas (free tier)
- **Collections:** `users`, `typingsessions`
- **ODM:** Mongoose 8
- **Connection:** Via `MONGO_CONNECTION_STRING` environment variable
- **Network Access:** 0.0.0.0/0 (open for Render deployment)
- **Auth:** Dedicated DB user `anassaj_db_user`

---

## Landing Page Tech Stack

The home page (`views/home.ejs` + `public/css/landing.css`) uses:

- **GSAP 3 + ScrollTrigger** — scroll-driven brain zoom animation (scrub: 1.8), pipeline node lighting, entrance timeline
- **Lenis** — smooth scroll wired into GSAP ticker
- **Canvas API** — neural particle network (hero), dual waveform visualization, anatomical brain drawing with sulci/gyri/cerebellum
- **DM Serif Display** — editorial headlines (Google Fonts)
- **Inter** — body copy
- **Space Mono** — monospace data/labels

The brain section is a 550vh sticky scroll where GSAP tweens CSS `scale` + `translate` on the brain scene element, zooming into four anatomical regions (Frontal → Parietal → Temporal → Cerebellum) with colored glow overlays and info panels that correspond to what Cadence measures in each region.

---

## Running Locally

```bash
cd FinalExamProject
npm install
# Create .env:
echo "MONGO_CONNECTION_STRING=mongodb+srv://..." > .env
echo "SESSION_SECRET=your-secret" >> .env
echo "PORT=3000" >> .env
node server.js
# App runs at http://localhost:3000
```

## Deploying to Render

1. Push to GitHub
2. New Web Service on Render → connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables: `MONGO_CONNECTION_STRING`, `SESSION_SECRET`, `PORT` (Render sets PORT automatically)

## Submitting to Class Submit Server

```bash
# From parent directory, zip without node_modules
zip -r cadence_submission.zip FinalExamProject/ --exclude "*/node_modules/*" --exclude "*/.env"
```

---

## What's Remaining Before Final Submission

- [ ] Record and upload YouTube demo video — add link above
- [x] Deploy to Render — add deployed URL above
- [x] (Optional) Train real model on TAPPY dataset and update `model.json`
- [x] Add partner name/directory ID if applicable
- [x] Submit ZIP to class submit server when it opens
