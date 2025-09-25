import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (id) {
  const haberRef = ref(database, 'haberler/' + id);
  get(haberRef).then((snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    document.getElementById("title").textContent = data.title;
    document.getElementById("content").textContent = data.content;
    document.getElementById("author").textContent = data.sender;
    document.getElementById("confidence").textContent = `%${data.confidence}`;
    document.getElementById("category").textContent = data.category;

    // Özet için API çağrısı
    fetch("http://localhost:7000/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: data.content })
    })
    .then((res) => res.json())
    .then((result) => {
      document.getElementById("summary").textContent = result.summary;
    })
    .catch((err) => {
      document.getElementById("summary").textContent = "Özet alınamadı.";
      console.error(err);
    });
  });
}
