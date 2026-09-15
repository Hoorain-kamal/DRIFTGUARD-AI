from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "driftguard_ai_gps_denied_model.pkl"

app = Flask(__name__)
CORS(app)

pack = joblib.load(MODEL_PATH)
model = pack["model"]
names = pack["feature_names"]


def features(d):
    vals = {n: 0.0 for n in names}
    ax = float(d.get("accelerationX", 0) or 0)
    ay = float(d.get("accelerationY", 0) or 0)
    az = float(d.get("accelerationZ", 0) or 0)
    alpha = float(d.get("alpha", 0) or 0)
    beta = float(d.get("beta", 0) or 0)
    gamma = float(d.get("gamma", 0) or 0)
    for n in names:
        u = n.upper()
        if "ACCELEROMETER X" in u: vals[n] = ax
        elif "ACCELEROMETER Y" in u: vals[n] = ay
        elif "ACCELEROMETER Z" in u: vals[n] = az
        elif "ORIENTATION (YAW)" in u: vals[n] = alpha
        elif "ORIENTATION (PITCH)" in u: vals[n] = beta
        elif "ORIENTATION (ROLL" in u: vals[n] = gamma
    return np.asarray([[vals[n] for n in names]], dtype=float)


@app.get("/health")
def health():
    return jsonify({"ok": True, "model_loaded": True, "feature_count": len(names)})


@app.post("/predict")
def predict():
    d = request.get_json(silent=True) or {}
    x = features(d)
    y = np.asarray(model.predict(x))[0]
    return jsonify({"east": float(y[0]), "north": float(y[1]), "source": "sklearn"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
