import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// 🔧 Firebase ayarları
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

// 🔧 Token ayarları
const tokenAddress = "0xYourContractAddressHere"; // Token kontrat adresi
const tokenAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function decimals() public view returns (uint8)",
];

// Firebase başlat
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// DOM yüklendiğinde çalış
document.addEventListener("DOMContentLoaded", () => {
  const newsGrid = document.getElementById("newsGrid");
  const categoryFilter = document.getElementById("categoryFilter");

  const haberRef = ref(database, 'haberler');
  onValue(haberRef, (snapshot) => {
    const haberler = snapshot.val();
    newsGrid.innerHTML = "";
    for (let key in haberler) {
      const news = haberler[key];
      const { title, content, ipfsUrl, sender, confidence, category } = news;

      const selectedCategory = categoryFilter.value;
      if (selectedCategory === "all" || !category || category === selectedCategory) {
        displayNews(key, ipfsUrl, title, content, sender, confidence, category);
      }
    }
  });

  // Haber kartlarını oluşturur
  function displayNews(key, ipfsUrl, title, content, walletAddress, confidence, category) {
    const shortWallet = (typeof walletAddress === 'string' && walletAddress)
      ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
      : "Bilinmiyor";

    const verifiedScore = confidence !== undefined
      ? `%${confidence} Verified`
      : "%?? Verified";

    const card = document.createElement("article");
    card.classList.add("news-card");
    card.innerHTML = `
      <div class="card-header">
        <span class="truth-score medium">${verifiedScore}</span>
        <span class="category">${category || "Bilinmiyor"}</span>
        <span class="bounty">0.5 ETH</span>
      </div>
      <h4><a href="news.html?id=${key}">${title}</a></h4>
      <p>${content}</p>
      <div class="card-footer">
        <div class="author">
          <div class="author-avatar"></div>
          <span>${shortWallet}</span>
        </div>
        <button class="verify-btn" data-key="${key}">Donate</button>
      </div>
    `;
    newsGrid.appendChild(card);
  }

  // Kategori değiştiğinde filtrele
  categoryFilter.addEventListener("change", () => {
    onValue(haberRef, (snapshot) => {
      newsGrid.innerHTML = "";
      const haberler = snapshot.val();

      for (let key in haberler) {
        const news = haberler[key];
        const { title, content, ipfsUrl, sender, confidence, category } = news;

        const selectedCategory = categoryFilter.value;
        if (selectedCategory === "all" || category === selectedCategory) {
          displayNews(key, ipfsUrl, title, content, sender, confidence, category);
        }
      }
    }, { onlyOnce: true });
  });

  checkWalletConnection();
});

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("verify-btn")) {
    const button = e.target;
    const key = button.dataset.key;

    const haberRef = ref(database, `haberler/${key}`);
    onValue(haberRef, async (snapshot) => {
      const newsData = snapshot.val();
      const receiver = newsData.sender;

      const amountInput = prompt("Kaç token göndermek istiyorsunuz?");
      if (!amountInput || isNaN(amountInput)) {
        alert("Geçerli bir miktar girin.");
        return;
      }

      try {
        if (!window.ethereum) {
          alert("MetaMask yüklü değil.");
          return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
        const decimals = await tokenContract.decimals();
        const amountInWei = ethers.utils.parseUnits(amountInput, decimals);

        const tx = await tokenContract.transfer(receiver, amountInWei);
        await tx.wait();

        alert(`Başarıyla ${amountInput} token gönderildi!`);
      } catch (err) {
        console.error("Token gönderimi hatası:", err);
        alert("Token gönderimi başarısız.");
      }
    }, { onlyOnce: true });
  }
});

// Web3 bağlantı kontrolü
async function checkWalletConnection() {
  const connectButton = document.getElementById("connectButton");
  const walletInfo = document.getElementById("walletInfo");
  const walletAddressEl = document.getElementById("walletAddress");
  const walletBalanceEl = document.getElementById("walletBalance");
  const walletStatus = document.getElementById("walletStatus");
  const disconnectButton = document.getElementById("disconnectButton");

  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();

    if (accounts.length > 0) {
      const address = accounts[0];
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);

      connectButton.style.display = "none";
      walletInfo.style.display = "flex";
      walletAddressEl.textContent = address.slice(0, 6) + "..." + address.slice(-4);
      walletBalanceEl.textContent = parseFloat(formattedBalance).toFixed(4) + " ETH";

      disconnectButton.onclick = () => {
        localStorage.removeItem("connectedWallet");
        location.reload();
      };
    } else {
      connectButton.onclick = async () => {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          checkWalletConnection();
        } catch (err) {
          console.error("Cüzdan bağlanamadı:", err);
        }
      };
    }
  } else {
    alert("Web3 tarayıcı uzantısı (ör. MetaMask) bulunamadı.");
  }
}
