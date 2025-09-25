from flask import Flask, request, jsonify
import joblib
import re
import nltk
from nltk.corpus import stopwords
from flask_cors import CORS

nltk.download("stopwords")
stop_words = set(stopwords.words('english'))

app = Flask(__name__)
CORS(app)  # Frontend'ten istek atabilmek için CORS'u açıyoruz

# Modeli yükle
model = joblib.load("category_model.pkl")

def clean_text(text):
    text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
    return ' '.join([word for word in text.split() if word not in stop_words])

@app.route("/predict-category", methods=["POST"])
def predict_category():
    try:
        data = request.get_json()
        text = data.get("text", "")
        if not text:
            return jsonify({"error": "Boş metin gönderildi"}), 400

        cleaned = clean_text(text)
        prediction = model.predict([cleaned])[0]
        return jsonify({"category": prediction})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=8001, debug=True)
