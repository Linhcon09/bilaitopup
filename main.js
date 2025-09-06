// Firebase init (make sure firebase-config.js is loaded)
const auth = firebase.auth();
const db = firebase.firestore();

// -------------------- AUTH -------------------- //
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(result => {
        console.log("✅ Logged in:", result.user.email);
        window.location.href = "index.html";
      })
      .catch(err => alert("❌ লগইন ব্যর্থ: " + err.message));
  });
}

auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Logged in:", user.email);
    // load user-related data
    loadPackages();
    loadWallet(user.uid);
    loadOrders(user.uid);
    document.body.classList.add("logged-in");
  } else {
    console.log("Not logged in");
    document.body.classList.remove("logged-in");
    // যদি login পেজ না হয়, redirect
    if (!window.location.pathname.endsWith("login.html")) {
      window.location.href = "login.html";
    }
  }
});

// -------------------- PACKAGES -------------------- //
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

  // order button listener
  document.querySelectorAll(".orderBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const user = auth.currentUser;
      if (!user) {
        alert("⚠️ প্রথমে লগইন করুন!");
        return;
      }
      const name = btn.dataset.name;
      const price = btn.dataset.price;
      createOrder(user.uid, name, price);
    });
  });
}

// -------------------- ORDER SUBMIT -------------------- //
async function createOrder(uid, packageName, price) {
  const tid = prompt("আপনার Transaction ID লিখুন:");
  if (!tid) return alert("Transaction ID প্রয়োজন!");

  await db.collection("orders").add({
    uid,
    packageName,
    price: Number(price),
    transactionId: tid,
    status: "Pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("✅ আপনার অর্ডার সাবমিট হয়েছে! Status: Pending");
}

// -------------------- WALLET -------------------- //
async function loadWallet(uid) {
  const walletSpan = document.getElementById("walletBalance");
  if (!walletSpan) return;

  const res = await db.collection("users").doc(uid).get();
  const balance = res.exists ? res.data().balance || 0 : 0;
  walletSpan.innerText = balance;
}

// -------------------- ORDERS -------------------- //
async function loadOrders(uid) {
  const table = document.getElementById("orderHistory");
  if (!table) return;

  table.innerHTML = `<tr><th>Package</th><th>Price</th><th>TID</th><th>Status</th></tr>`;

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
}

// -------------------- LOGOUT -------------------- //
function logout() {
  auth.signOut();
   }
