// -------------------- FIREBASE INIT -------------------- //
const auth = firebase.auth();
const db = firebase.firestore();

// -------------------- AUTH -------------------- //
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        console.log("✅ Logged in:", user.email);

        // Initialize user in Firestore if not exists
        const userRef = db.collection("users").doc(user.uid);
        const doc = await userRef.get();
        if (!doc.exists) {
          await userRef.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            balance: 0
          });
        }

        window.location.href = "index.html";
      } catch (err) {
        alert("❌ লগইন ব্যর্থ: " + err.message);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await auth.signOut();
      console.log("✅ Logged out");
      window.location.href = "login.html";
    });
  }
});

// -------------------- AUTH STATE -------------------- //
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log("🔐 Logged in as:", user.email);
    document.body.classList.add("logged-in");

    // Load user data
    if (document.getElementById("packages")) loadPackages();
    if (document.getElementById("walletBalance")) loadWallet(user.uid);
    if (document.getElementById("orderHistory")) loadOrders(user.uid);
    if (document.getElementById("depositHistory")) loadDeposits(user.uid);
    if (document.getElementById("profilePic")) showProfile(user);
  } else {
    document.body.classList.remove("logged-in");
    if (!window.location.pathname.endsWith("login.html")) {
      window.location.href = "login.html";
    }
  }
});

// -------------------- SHOW PROFILE -------------------- //
function showProfile(user) {
  const pic = document.getElementById("profilePic");
  const name = document.getElementById("profileName");
  const email = document.getElementById("profileEmail");

  if (pic) pic.src = user.photoURL;
  if (name) name.innerText = user.displayName;
  if (email) email.innerText = user.email;
}

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
      <button class="orderBtn" data-name="${p.name}" data-price="${p.price}">
        Order
      </button>
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

// -------------------- CREATE ORDER -------------------- //
async function createOrder(uid, packageName, price) {
  const tid = prompt("আপনার Transaction ID লিখুন:");
  if (!tid) return alert("Transaction ID প্রয়োজন!");

  try {
    await db.collection("orders").add({
      uid,
      packageName,
      price,
      transactionId: tid,
      status: "Pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("✅ অর্ডার সাবমিট হয়েছে! Status: Pending");
  } catch (e) {
    console.error("Order error:", e);
    alert("অর্ডার সাবমিট করতে ব্যর্থ");
  }
}

// -------------------- WALLET -------------------- //
async function loadWallet(uid) {
  const walletSpan = document.getElementById("walletBalance");
  if (!walletSpan) return;

  try {
    const doc = await db.collection("users").doc(uid).get();
    const balance = doc.exists ? doc.data().balance || 0 : 0;
    walletSpan.innerText = balance + " TK";
  } catch (e) {
    console.error("Wallet error:", e);
    walletSpan.innerText = "0 TK";
  }
}

// -------------------- LOAD ORDERS -------------------- //
async function loadOrders(uid) {
  const table = document.getElementById("orderHistory");
  if (!table) return;

  table.innerHTML = `<tr><th>Package</th><th>Price</th><th>TID</th><th>Status</th></tr>`;

  try {
    db.collection("orders")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        table.innerHTML = `<tr><th>Package</th><th>Price</th><th>TID</th><th>Status</th></tr>`;
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
      });
  } catch (e) {
    console.error("Order load error:", e);
  }
}

// -------------------- LOAD DEPOSITS -------------------- //
async function loadDeposits(uid) {
  const table = document.getElementById("depositHistory");
  if (!table) return;

  table.innerHTML = `<tr><th>Amount</th><th>Txn ID</th><th>Status</th></tr>`;

  try {
    db.collection("deposits")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        table.innerHTML = `<tr><th>Amount</th><th>Txn ID</th><th>Status</th></tr>`;
        snapshot.forEach(doc => {
          const d = doc.data();
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${d.amount}</td>
            <td>${d.transactionId}</td>
            <td><span class="status ${d.status.toLowerCase()}">${d.status}</span></td>
          `;
          table.appendChild(tr);
        });
      });
  } catch (e) {
    console.error("Deposit load error:", e);
  }
}

// -------------------- SUBMIT DEPOSIT -------------------- //
async function submitDeposit(uid, amount, transactionId) {
  if (!amount || !transactionId) return alert("Amount & Transaction ID প্রয়োজন!");

  try {
    await db.collection("deposits").add({
      uid,
      amount: Number(amount),
      transactionId,
      status: "Pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("✅ Deposit submitted! Pending approval.");
  } catch (e) {
    console.error("Deposit error:", e);
    alert("Deposit submit করতে ব্যর্থ");
  }
}

// -------------------- LOGOUT -------------------- //
function logout() {
  auth.signOut();
  window.location.href = "login.html";
}
