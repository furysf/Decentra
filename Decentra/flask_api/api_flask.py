from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Gemini API anahtarı
GOOGLE_API_KEY = "YOUR_API_KEY"
genai.configure(api_key=GOOGLE_API_KEY)

@app.route('/summary', methods=['POST'])
def generate_summary():
    try:
        data = request.get_json()
        content = data.get("content", "")

        if not content or not isinstance(content, str) or len(content.strip()) < 20:
            return jsonify({"error": "Invalid or empty content received."}), 400

        if len(content) > 8000:
            content = content[:8000] + "..."

        # Özetleme isteği
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Summarize the following news article in a concise and informative manner:\n\n{content}"
        response = model.generate_content(prompt)

        if hasattr(response, "text"):
            return jsonify({"summary": response.text.strip()}), 200
        else:
            return jsonify({"error": "Model response did not contain text"}), 500

    except Exception as e:
        print("Gemini hata:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=7000, debug=True)
