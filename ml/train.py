# CogniType - ML Training Script
# Dataset: TAPPY (download from https://www.kaggle.com/datasets/valkling/tappy-keystroke-data)
# Features: mean_iki, std_iki, backspace_rate, wpm, pause_freq, mean_hold, mean_flight
# Target: 0 = healthy, 1 = cognitive decline indicators

import pandas as pd
import numpy as np
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

# ── 1. Load Data ──────────────────────────────────────────────────────────────
# Place TAPPY dataset files in ml/data/
# df = pd.read_csv("data/tappy_data.csv")

# ── 2. Feature Engineering ───────────────────────────────────────────────────
FEATURES = [
    "mean_iki",       # mean inter-key interval (ms)
    "std_iki",        # rhythm consistency
    "backspace_rate", # error correction frequency
    "wpm",            # words per minute
    "pause_freq",     # pauses > 1000ms / total keys
    "mean_hold",      # avg key hold duration
    "mean_flight",    # avg time between key-up and next key-down
]

# ── 3. Train Model ───────────────────────────────────────────────────────────
# X = df[FEATURES]
# y = df["label"]  # 0 = healthy, 1 = decline
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
#
# scaler = StandardScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)
#
# clf = RandomForestClassifier(n_estimators=100, random_state=42)
# clf.fit(X_train_scaled, y_train)
#
# scores = cross_val_score(clf, X_train_scaled, y_train, cv=5)
# print(f"CV Accuracy: {scores.mean():.3f} ± {scores.std():.3f}")
# print(classification_report(y_test, clf.predict(X_test_scaled)))

# ── 4. Export Model to JSON ──────────────────────────────────────────────────
# Export thresholds and feature importance for Node.js inference
# model_data = {
#     "feature_names": FEATURES,
#     "feature_importances": clf.feature_importances_.tolist(),
#     "scaler_mean": scaler.mean_.tolist(),
#     "scaler_std": scaler.scale_.tolist(),
#     "trees": [export_tree(est) for est in clf.estimators_]  # simplified
# }
# with open("model.json", "w") as f:
#     json.dump(model_data, f, indent=2)

print("Training script ready. Download TAPPY dataset and uncomment sections above.")
print("Feature set:", FEATURES)
