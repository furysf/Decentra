import pandas as pd
import numpy as np
import nltk
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from nltk.corpus import stopwords

# NLTK gerekli indirme
nltk.download('stopwords')

# 1. Veri yükleme
true_df = pd.read_csv("True.csv")
fake_df = pd.read_csv("Fake.csv")

# 2. Etiketleme
true_df['label'] = 1  # Gerçek
fake_df['label'] = 0  # Sahte

# 3. Birleştirme ve karıştırma
df = pd.concat([true_df, fake_df], axis=0).reset_index(drop=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# 4. İçeriği birleştir
df['content'] = df['title'] + " " + df['text']
X = df['content']
y = df['label']

# 5. TF-IDF vektörizer
stop_words = stopwords.words('english')
vectorizer = TfidfVectorizer(stop_words=stop_words, max_df=0.7)
X_vectors = vectorizer.fit_transform(X)

# 6. Eğitim/Test ayır
X_train, X_test, y_train, y_test = train_test_split(X_vectors, y, test_size=0.2, random_state=42)

# 7. Naive Bayes model eğitimi
nb_model = MultinomialNB()
nb_model.fit(X_train, y_train)

# 8. Model ve vectorizer'ı kaydet
joblib.dump(nb_model, "naive_model.pkl")
joblib.dump(vectorizer, "naive_vectorizer.pkl")

print("✅ Naive Bayes modeli ve vectorizer başarıyla kaydedildi.")
