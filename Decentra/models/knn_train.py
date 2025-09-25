# model_kaydet.py

import pandas as pd
import nltk
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
import joblib

# NLTK stopwords
nltk.download('stopwords')
from nltk.corpus import stopwords

# Veri setlerini yükle
true_df = pd.read_csv("True.csv")
fake_df = pd.read_csv("Fake.csv")

# Etiket ekle
true_df['label'] = 1
fake_df['label'] = 0

# Birleştir ve karıştır
df = pd.concat([true_df, fake_df], axis=0).sample(frac=1).reset_index(drop=True)
df['content'] = df['title'] + " " + df['text']

# Özellik ve etiket ayır
X = df['content']
y = df['label']

stop_words = stopwords.words('english')
vectorizer = TfidfVectorizer(stop_words=stop_words, max_df=0.7)
X_vectors = vectorizer.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_vectors, y, test_size=0.2, random_state=42)

# KNN modelini eğit
knn_model = KNeighborsClassifier(n_neighbors=5)
knn_model.fit(X_train, y_train)

# Model ve vectorizer'ı kaydet
joblib.dump(knn_model, "knn_model.pkl")
joblib.dump(vectorizer, "knn_vectorizer.pkl")

print("✅ Model ve vectorizer kaydedildi.")
