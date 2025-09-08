// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSC-6WM5sUi5mMrw4DlO4-9_aFa7fX0Z8",
  authDomain: "bilai-top-up.firebaseapp.com",
  projectId: "bilai-top-up",
  storageBucket: "bilai-top-up.firebasestorage.app",
  messagingSenderId: "576723443646",
  appId: "1:576723443646:web:cb0aea65da0a79a21163ef",
  measurementId: "G-D226N8W6NV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();
  let selectedPackage = null;
  let paymentMethod = "instant"; // default method

  const menuBtn = document.getElementById("menuBtn");
  const menuBox = document.getElementById("menuBox");
  const txnBox = document.getElementById("transactionIdBox");
  const txnInput = document.getElementById("transactionId");
  const balanceEl = document.getElementById("walletBalance");

  /** -------------------------
   * NAV MENU HANDLING
   * ------------------------*/
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willShow = !menuBox.classList.contains("show");
    menuBox.classList.toggle("show", willShow);
    menuBox.setAttribute("aria-hidden", !willShow);
    menuBtn.setAttribute("aria-expanded", willShow);
  });

  document.addEventListener("click", (e) => {
    if (!menuBox.classList.contains("show")) return;
    if (menuBox.contains(e.target) || e.target === menuBtn) return;
    menuBox.classList.remove("show");
    menuBox.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuBox.classList.contains("show")) {
      menuBox.classList.remove("show");
      menuBox.setAttribute("aria-hidden", "true");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  menuBox.querySelectorAll("a, button").forEach(el => {
    el.addEventListener("click", () => {
      menuBox.classList.remove("show");
      menuBox.setAttribute("aria-hidden", "true");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });

  /** -------------------------
   * AUTH & INIT
   * ------------------------*/
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadPackages();
      loadWallet(user.uid);
    }
  });

  /** -------------------------
   * LOAD DIAMOND PACKAGES
   * ------------------------*/
  function loadPackages() {
    const div = document.getElementById("packages");
    div.innerHTML = "";
    const packages = [
      { name: "25 Diamond", price: 24 },
      { name: "50 Diamond", price: 39 },
      { name: "115 Diamond", price: 82 },
      { name: "240 Diamond", price: 159 },
      { name: "355 Diamond", price: 235 },
      { name: "480 Diamond", price: 315 },
      { name: "505 Diamond", price: 349 },
      { name: "610 Diamond", price: 395 },
      { name: "850 Diamond", price: 550 },
      { name: "1090 Diamond", price: 739 },
      { name: "1240 Diamond", price: 787 },
      { name: "2530 Diamond", price: 1592 },
      { name: "5060 Diamond", price: 3178 },
      { name: "10120 Diamond", price: 6299 },
      { name: "12650 Diamond", price: 7872 },
      { name: "Weekly", price: 160 },
      { name: "Monthly", price: 789 },
      { name: "Weekly 2x", price: 315 },
      { name: "Weekly 3x", price: 472 },
      { name: "Weekly Lite", price: 45 },
      { name: "5x Weekly Lite", price: 215 }
    ];

    packages.forEach(p => {
      const card = document.createElement("div");
      card.className = "package-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", "false");
      card.innerHTML = `<h3>${p.name}</h3><p>${p.price} TK</p>`;

      const select = () => {
        selectedPackage = p;
        document.querySelectorAll(".package-card").forEach(c => {
          c.classList.remove("selected");
          c.setAttribute("aria-pressed", "false");
        });
        card.classList.add("selected");
        card.setAttribute("aria-pressed", "true");
        document.getElementById("selectedPrice").textContent = `${p.name} - ${p.price} TK`;
      };

      card.addEventListener("click", select);
      card.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          select();
        }
      });

      div.appendChild(card);
    });
  }

  /** -------------------------
   * REAL-TIME WALLET BALANCE
   * ------------------------*/
  function loadWallet(uid) {
    db.collection("wallets").doc(uid).onSnapshot(doc => {
      if (doc.exists) {
        const balance = doc.data().balance || 0;
        // শুধু সংখ্যা দেখাবে, index.html এ আলাদা "৳" আছে
        balanceEl.textContent = balance;
      } else {
        db.collection("wallets").doc(uid).set({ balance: 0 });
        balanceEl.textContent = "0";
      }
    }, err => {
      console.error("Wallet load error:", err);
      balanceEl.textContent = "0";
    });
  }

  /** -------------------------
   * PAYMENT METHOD HANDLING
   * ------------------------*/
  document.querySelectorAll("input[name='paymentMethod']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      paymentMethod = e.target.value;
      if (txnBox) txnBox.style.display = (paymentMethod === "instant") ? "block" : "none";
    });
  });

  /** -------------------------
   * ORDER SUBMIT
   * ------------------------*/
  document.getElementById("verifyBtn").addEventListener("click", async () => {
    const user = auth.currentUser;
    const ffUid = document.getElementById("ffUid").value.trim();
    const mobileNumber = document.getElementById("mobileNumber").value.trim();
    const transactionId = txnInput ? txnInput.value.trim() : "";

    if (!user) return alert("প্রথমে লগইন করুন!");
    if (!selectedPackage) return alert("একটি প্যাকেজ নির্বাচন করুন!");
    if (!ffUid || !mobileNumber) return alert("সব ফিল্ড পূরণ করুন!");
    if (paymentMethod === "instant" && !transactionId) {
      return alert("Instant Pay এর জন্য Transaction ID প্রয়োজন!");
    }

    const loader = document.getElementById("loader");
    loader.style.display = "block";

    try {
      if (paymentMethod === "wallet") {
        const walletRef = db.collection("wallets").doc(user.uid);
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(walletRef);
          const current = snap.exists ? snap.data().balance || 0 : 0;
          if (current < selectedPackage.price) throw new Error("Insufficient balance");
          transaction.update(walletRef, { balance: current - selectedPackage.price });
        });
      }

      await db.collection("orders").add({
        uid: user.uid,
        ffUid,
        mobileNumber,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        transactionId: paymentMethod === "wallet" ? "WALLET_PAY" : transactionId,
        paymentMethod,
        status: "Pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("✅ অর্ডার সাবমিট হয়েছে! Status: Pending");

      // Reset form
      document.getElementById("ffUid").value = "";
      document.getElementById("mobileNumber").value = "";
      if (txnInput) txnInput.value = "";
      document.getElementById("selectedPrice").textContent = "Select a package";
      selectedPackage = null;
      document.querySelectorAll(".package-card").forEach(c => c.classList.remove("selected"));
    } catch (err) {
      console.error("Order failed:", err);
      alert("❌ অর্ডার সাবমিট করতে ব্যর্থ! পরে আবার চেষ্টা করুন।");
    } finally {
      loader.style.display = "none";
    }
  });

  /** -------------------------
   * LOGOUT
   * ------------------------*/
  window.logout = () => {
    auth.signOut()
      .then(() => window.location.href = "login.html")
      .catch(err => {
        console.error("Logout failed:", err);
        alert("Logout failed. Try again.");
      });
  };
});
