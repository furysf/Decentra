# train_model.py
import pandas as pd
import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

nltk.download('stopwords')

# Veriyi oku
true_df = pd.read_csv("True.csv")
fake_df = pd.read_csv("Fake.csv")

true_df['label'] = 1
fake_df['label'] = 0

df = pd.concat([true_df, fake_df]).sample(frac=1).reset_index(drop=True)
df['content'] = df['title'] + " " + df['text']

X = df['content']
y = df['label']

# Vektörleştirme
stop_words = stopwords.words('english')
vectorizer = TfidfVectorizer(stop_words=stop_words, max_df=0.7)
X_vectors = vectorizer.fit_transform(X)

# Veri böl
X_train, X_test, y_train, y_test = train_test_split(X_vectors, y, test_size=0.2, random_state=42)

# Model eğit
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Kaydet
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("✅ Model ve vectorizer kaydedildi.")
