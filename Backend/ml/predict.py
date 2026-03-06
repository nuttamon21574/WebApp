import joblib
import sys
import json
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)

model = joblib.load(os.path.join(BASE_DIR,"models/lr_pipeline.pkl"))

feature_order = [
    "installment_to_income",
    "credit_utilization",
    "platform_count",
    "spaylater_missed_installments",
    "lazpaylater_missed_installments"
]

risk_map = {
    0:"LOW",
    1:"MEDIUM",
    2:"HIGH"
}

def predict(data):

    X = [data[f] for f in feature_order]
    X = np.array(X).reshape(1,-1)

    pred = model.predict(X)[0]

    return {
        "risk_tier": risk_map[int(pred)]
    }

if __name__ == "__main__":

    input_data = json.loads(sys.argv[1])

    result = predict(input_data)

    print(json.dumps(result))