// -------------------- FIREBASE INIT --------------------
const auth = firebase.auth();
const db = firebase.firestore();

// -------------------- AUTH --------------------
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(async (result) => {
          const user = result.user;
          console.log("✅ Logged in:", user.email);

          // Ensure user document exists
          await db.collection("users").doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            balance: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          window.location.href = "index.html";
        })
        .catch(err => alert("❌ লগইন ব্যর্থ: " + err.message));
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut()
        .then(() => window.location.href = "login.html")
        .catch(err => console.error("Logout error:", err));
    });
  }
});

// -------------------- AUTH STATE --------------------
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("🔐 Logged in as:", user.email);
    document.body.classList.add("logged-in");

    // Load user-related data if present
    if (document.getElementById("packages")) loadPackages();
    if (document.getElementById("walletBalance")) loadWallet(user.uid);
    if (document.getElementById("orderHistory")) loadOrders(user.uid);
    if (document.getElementById("depositHistory")) loadDeposits(user.uid);
  } else {
    console.log("🚪 Not logged in");
    document.body.classList.remove("logged-in");

    // Force redirect if not login page
    if (!window.location.pathname.endsWith("login.html")) {
      window.location.href = "login.html";
    }
  }
});

// -------------------- PACKAGES --------------------
const packages = [
  { name: "25 Diamond", price: 24 }, { name: "50 Diamond", price: 38 },
  { name: "115 Diamond", price: 82 }, { name: "240 Diamond", price: 158 },
  { name: "355 Diamond", price: 235 }, { name: "480 Diamond", price: 312 },
  { name: "610 Diamond", price: 395 }, { name: "505 Diamond", price: 347 },
  { name: "850 Diamond", price: 550 }, { name: "1090 Diamond", price: 738 },
  { name: "1240 Diamond", price: 787 }, { name: "2530 Diamond", price: 1590 },
  { name: "5060 Diamond", price: 3177 }, { name: "10120 Diamond", price: 6297 },
  { name: "12650 Diamond", price: 7870 }, { name: "Weekly", price: 160 },
  { name: "Monthly", price: 779 }, { name: "Weekly 2x", price: 315 },
  { name: "Weekly 3x", price: 471 }, { name: "Weekly Lite", price: 45 },
  { name: "5x Weekly Lite", price: 212 }
];

function loadPackages() {
  const div = document.getElementById("packages");
  if (!div) return;
  div.innerHTML = "";

  packages.forEach(p => {
    const box = document.createElement("div");
    box.className = "package-card";
    box.innerHTML = `
      <h3>${p.name}</h3>
      <p><strong>${p.price} TK</strong></p>
      <button class="orderBtn" data-name="${p.name}" data-price="${p.price}">Order</button>
    `;
    div.appendChild(box);
  });

  document.querySelectorAll(".orderBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("⚠️ প্রথমে লগইন করুন!");
        return window.location.href = "login.html";
      }
      const name = btn.dataset.name;
      const price = Number(btn.dataset.price);
      await createOrder(user.uid, name, price);
    });
  });
}

// -------------------- ORDER SUBMIT --------------------
async function createOrder(uid, packageName, price) {
  const tid = prompt("আপনার Transaction ID লিখুন:");
  if (!tid) return alert("Transaction ID প্রয়োজন!");

  try {
    await db.collection("orders").add({
      uid,
      packageName,
      price: Number(price),
      transactionId: tid,
      status: "Pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("✅ অর্ডার সাবমিট হয়েছে! Status: Pending");
    loadOrders(uid); // reload table
  } catch (err) {
    console.error("❌ Order error:", err);
    alert("অর্ডার সাবমিট করতে ব্যর্থ");
  }
}

// -------------------- DEPOSIT SUBMIT --------------------
async function submitDeposit(uid, amount, transactionId) {
  if (!amount || !transactionId) return alert("Amount and Transaction ID required!");

  try {
    await db.collection("deposits").add({
      uid,
      amount: Number(amount),
      transactionId,
      status: "Pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("💰 Deposit submitted! Status: Pending");
    loadDeposits(uid);
  } catch (err) {
    console.error("Deposit error:", err);
    alert("Deposit submit failed");
  }
}

// -------------------- WALLET --------------------
async function loadWallet(uid) {
  const walletSpan = document.getElementById("walletBalance");
  if (!walletSpan) return;

  try {
    const res = await db.collection("users").doc(uid).get();
    walletSpan.innerText = res.exists ? (res.data().balance || 0) + " TK" : "0 TK";
  } catch (err) {
    console.error("Wallet error:", err);
    walletSpan.innerText = "0 TK";
  }
}

// -------------------- ORDERS --------------------
async function loadOrders(uid) {
  const table = document.getElementById("orderHistory");
  if (!table) return;

  table.innerHTML = `<tr>
    <th>Package</th><th>Price</th><th>Transaction ID</th><th>Status</th>
  </tr>`;

  try {
    const snapshot = await db.collection("orders")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    snapshot.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.packageName || "-"}</td>
        <td>${d.price || "-"}</td>
        <td>${d.transactionId}</td>
        <td><span class="status ${d.status.toLowerCase()}">${d.status}</span></td>
      `;
      table.appendChild(tr);
    });
  } catch (err) {
    console.error("Orders load error:", err);
  }
}

// -------------------- DEPOSITS --------------------
async function loadDeposits(uid) {
  const table = document.getElementById("depositHistory");
  if (!table) return;

  table.innerHTML = `<tr><th>Amount</th><th>Transaction ID</th><th>Status</th></tr>`;

  try {
    const snapshot = await db.collection("deposits")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    snapshot.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.amount || "-"}</td>
        <td>${d.transactionId}</td>
        <td><span class="status ${d.status.toLowerCase()}">${d.status}</span></td>
      `;
      table.appendChild(tr);
    });
  } catch (err) {
    console.error("Deposits load error:", err);
  }
}

// -------------------- LOGOUT --------------------
function logout() {
  auth.signOut()
    .then(() => window.location.href = "login.html")
    .catch(err => console.error("Logout error:", err));
            }
