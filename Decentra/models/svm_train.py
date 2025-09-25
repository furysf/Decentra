import joblib
from sklearn.svm import SVC
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.corpus import stopwords
import pandas as pd
from sklearn.model_selection import train_test_split
import nltk

nltk.download('stopwords')

# Veri yükleme ve hazırlama
true_df = pd.read_csv("True.csv")
fake_df = pd.read_csv("Fake.csv")
true_df['label'] = 1
fake_df['label'] = 0
df = pd.concat([true_df, fake_df], axis=0).reset_index(drop=True)
df = df.sample(frac=1).reset_index(drop=True)
df['content'] = df['title'] + " " + df['text']

X = df['content']
y = df['label']

stop_words = stopwords.words('english')
vectorizer = TfidfVectorizer(stop_words=stop_words, max_df=0.7)
X_vectors = vectorizer.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_vectors, y, test_size=0.2, random_state=42)

# Model eğitimi
svm_model = SVC(probability=True, kernel='linear', random_state=42)
svm_model.fit(X_train, y_train)

# Model ve vectorizer kaydet
joblib.dump(svm_model, "svm_model.pkl")
joblib.dump(vectorizer, "svm_vectorizer.pkl")
