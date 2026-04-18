import joblib
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)

# =========================
# LOAD FILES
# =========================
features = joblib.load(os.path.join(BASE_DIR, "models/features.pkl"))

lr_model = joblib.load(os.path.join(BASE_DIR, "models/lr_model.pkl"))
gb_model = joblib.load(os.path.join(BASE_DIR, "models/gb_model.pkl"))

risk_map = {
    0: "LOW",
    1: "MEDIUM",
    2: "HIGH"
}

# =========================
# MAIN PREDICT FUNCTION
# =========================
def predict(data, model_type="lr"):

    # 🔥 กัน key error
    X = [data.get(f, 0) for f in features]
    X = np.array(X).reshape(1, -1)

    # 🔥 เลือก model
    if model_type == "gb":
        model = gb_model
    else:
        model = lr_model

    # 🔥 ใช้ predict ตรง
    pred = model.predict(X)[0]

    # 🔥 (optional) เอา proba ไว้โชว์
    proba = model.predict_proba(X)

    return {
        "model_used": model_type.upper(),
        "risk_tier": risk_map[int(pred)],
        "probabilities": {
            "LOW": float(proba[0][0]),
            "MED": float(proba[0][1]),
            "HIGH": float(proba[0][2])
        }
    }