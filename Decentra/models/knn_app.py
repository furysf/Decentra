# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import joblib
import traceback

app = Flask(__name__)
CORS(app)  # Tüm rotalara CORS izni verir

# Model ve vectorizer'ı yükle
model = joblib.load("knn_model.pkl")
vectorizer = joblib.load("knn_vectorizer.pkl")

@app.route("/predict", methods=["POST", "OPTIONS"])
@cross_origin()
def predict():
    try:
        data = request.json
        full_text = data["text"]

        vec = vectorizer.transform([full_text])
        label = model.predict(vec)[0]
        confidence = model.predict_proba(vec)[0][1]

        return jsonify({
            "label": int(label),
            "confidence": round(confidence * 100, 2)
        })
    except Exception as e:
        print("❌ Hata:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5004)
