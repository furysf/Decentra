import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const contractAddress = "0xYourContractAddressHere";
const contractABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "content", "type": "string" },
      { "internalType": "string", "name": "ipfsUrl", "type": "string" }
    ],
    "name": "submitNews",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const firebaseConfig = {
  apiKey: "your-firebase-api-key",
  authDomain: "your-firebase-auth-domain",
  databaseURL: "your-firebase-db-url",
  projectId: "your-firebase-project-id",
  storageBucket: "your-firebase-storage-bucket",
  messagingSenderId: "your-firebase-msg-id",
  appId: "your-firebase-app-id",
  measurementId: "your-firebase-measurement-id"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
  const connectButton = document.getElementById("connectButton");
  const walletAddressElement = document.getElementById("walletAddress");
  const walletBalanceElement = document.getElementById("walletBalance");
  const walletInfo = document.getElementById("walletInfo");
  const disconnectButton = document.getElementById("disconnectButton");
  const submitNewsButton = document.getElementById("submitNews");
  const newsTitleInput = document.getElementById("newsTitle");
  const newsContentInput = document.getElementById("newsContent");
  const trendHaberler = document.querySelector(".news-grid");

  let currentAccount;
  let contract;

  connectButton.addEventListener("click", async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        currentAccount = accounts[0];

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        walletAddressElement.textContent = "Cüzdan: " + currentAccount.slice(0, 6) + "..." + currentAccount.slice(-4);

        const balance = await provider.getBalance(currentAccount);
        const balanceEth = parseFloat(ethers.utils.formatEther(balance)).toFixed(4);
        walletBalanceElement.textContent = "Bakiye: " + balanceEth + " ETH";

        walletInfo.style.display = "flex";
        connectButton.style.display = "none";
      } catch (error) {
        console.error("Bağlantı reddedildi:", error);
        alert("MetaMask bağlantısı reddedildi!");
      }
    } else {
      alert("MetaMask yüklü değil.");
    }
  });

  disconnectButton.addEventListener("click", () => {
    walletInfo.style.display = "none";
    connectButton.style.display = "inline-block";
    currentAccount = null;
  });

  async function uploadToIPFS(newsData) {
    const formData = new FormData();
    formData.append("file", new Blob([JSON.stringify(newsData)], { type: "application/json" }), "news.json");

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: "your-pinata-api-key",
        pinata_secret_api_key: "your-pinata-secret-key"
      },
      body: formData
    });

    const data = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  }

  async function verifyWithML(title, content, selectedModel) {
    const fullText = title + " " + content;
    
    let endpoint;
    if (selectedModel === "rf") {
        endpoint = "http://localhost:5001/predict";  // Random Forest FastAPI
    } else if (selectedModel === "svm") {
        endpoint = "http://localhost:5002/predict";  // SVM Flask API
    } else if (selectedModel === "naive") {
        endpoint = "http://localhost:5003/predict";  // Naive Bayes Flask API
    } else if (selectedModel === "knn") {
        endpoint = "http://localhost:5004/predict";  // KNN Flask API
    } else {
        endpoint = "http://localhost:5000/predict";  // Logistic Regression Flask API (default)
    }

  
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText })
    });
  
    if (!response.ok) {
      throw new Error("Model API'ye bağlanılamadı");
    }
  
    return await response.json();
  }
  async function getCategoryFromML(title, content) {
    const fullText = title + " " + content;
    const response = await fetch("http://localhost:8001/predict-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText })
    });
  
    if (!response.ok) {
      throw new Error("Kategori API'sine bağlanılamadı");
    }
  
    const data = await response.json();
    return data.category || "other";  
  }
  

  async function submitNews() {
    const newsTitle = newsTitleInput.value.trim();
    const newsContent = newsContentInput.value.trim();
    const selectedModel = document.getElementById("modelSelect").value;
  
    if (!newsTitle || !newsContent || !selectedModel) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }
  
    try {
      const mlResult = await verifyWithML(newsTitle, newsContent, selectedModel);
      const confidence = mlResult.confidence;
  
      const userConfirmed = confirm(`Bu haberin doğruluk puanı: %${confidence}\nDevam etmek ve haberi kaydetmek istiyor musunuz?`);
      if (!userConfirmed) {
        return;
      }
  
      const category = await getCategoryFromML(newsTitle, newsContent);
  
      const newsData = { title: newsTitle, content: newsContent };
      const ipfsUrl = await uploadToIPFS(newsData);
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.submitNews(newsTitle, newsContent, ipfsUrl);
      await tx.wait();
      console.log("Haber eklendi. Tx Hash:", tx.hash);
  
      const fullNewsData = {
        title: newsTitle,
        content: newsContent,
        ipfsUrl: ipfsUrl,
        timestamp: Date.now(),
        sender: currentAccount,
        confidence: confidence,
        category: category,
        model: selectedModel
      };
  
      await push(ref(database, 'haberler'), fullNewsData);
      displayNews(ipfsUrl, newsTitle, newsContent, currentAccount, confidence, category);
  
      newsTitleInput.value = "";
      newsContentInput.value = "";
      alert("Haber başarıyla kaydedildi!");
  
    } catch (err) {
      console.error("Haber gönderilemedi:", err);
      alert("Bir hata oluştu: " + err.message);
    }
  }

  function displayNews(ipfsUrl, title, content, sender, confidence = 90,category = "general") {
    const card = document.createElement("article");
    card.classList.add("news-card");
    const shortSender = sender ? sender.slice(0, 6) + "..." + sender.slice(-4) : "Bilinmiyor";

    const scoreClass = confidence >= 90 ? "high" : confidence >= 75 ? "medium" : "low";

    card.innerHTML = `
      <div class="card-header">
        <span class="truth-score ${scoreClass}">%${confidence} Verified</span>
        <span class="category">${category}</span>
        <span class="bounty">0.5 ETH</span>
      </div>
      <h4><a href="${ipfsUrl}" target="_blank">${title}</a></h4>
      <p>${content}</p>
      <div class="card-footer">
        <div class="author">
          <div class="author-avatar"></div>
          <span>${shortSender}</span>
        </div>
        <button class="verify-btn">Verify</button>
      </div>
    `;

    trendHaberler.appendChild(card);
  }

  function loadSavedNews() {
    const haberRef = ref(database, 'haberler');

    onValue(haberRef, async (snapshot) => {
      trendHaberler.innerHTML = "";
      const haberler = snapshot.val();

      const kontrolEdilenler = await Promise.all(Object.values(haberler).map(async (haber) => {
        const { title, content, ipfsUrl, sender, confidence, category } = haber;
        try {
          const response = await fetch(ipfsUrl, { method: "HEAD" });
          if (response.ok) {
            return { title, content, ipfsUrl, sender, confidence,category };
          }
        } catch (err) {
          console.warn("IPFS bağlantısı başarısız:", ipfsUrl);
        }
        return null;
      }));

      kontrolEdilenler
        .filter(Boolean)
        .sort((a, b) => b.confidence - a.confidence) 
        .slice(0, 2) // Sadece ilk 2
        .forEach(({ title, content, ipfsUrl, sender, confidence, category }) => {
          displayNews(ipfsUrl, title, content, sender, confidence, category);
      });
    });
  }

  loadSavedNews();
  submitNewsButton.addEventListener("click", submitNews);
});
