import sys
import json
from predict import predict 

if __name__ == "__main__":

    input_data = json.loads(sys.argv[1])

    model_type = input_data.get("model", "lr")

    result = predict(input_data, model_type=model_type)

    print(json.dumps(result))