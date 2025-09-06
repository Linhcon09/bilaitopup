// -------------------- FIREBASE CONFIG --------------------
const firebaseConfig = {
  apiKey: "AIzaSyCSC-6WM5sUi5mMrw4DlO4-9_aFa7fX0Z8",
  authDomain: "bilai-top-up.firebaseapp.com",
  projectId: "bilai-top-up",
  storageBucket: "bilai-top-up.appspot.com",
  messagingSenderId: "576723443646",
  appId: "1:576723443646:web:cb0aea65da0a79a21163ef",
  measurementId: "G-D226N8W6NV"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// -------------------- ADMIN EMAILS --------------------
const adminEmails = [
  "gamingtahmid08@gmail.com",
  "kingtahmid046@gmail.com",
  "kingtahmid1973@gmail.com",
  "tahmideditofficial@gmail.com"
];

// -------------------- AUTH CHECK --------------------
auth.onAuthStateChanged(async (user) => {
  if (!user || !adminEmails.includes(user.email)) {
    alert("Unauthorized! Only admin can access.");
    window.location.href = "login.html";
  } else {
    console.log("✅ Admin logged in:", user.email);
    loadUsers();
    loadOrders();
    loadDeposits();
  }
});

// -------------------- LOGOUT --------------------
function logout() {
  auth.signOut().then(() => window.location.href = "login.html")
    .catch(err => console.error("Logout error:", err));
}

// -------------------- USERS --------------------
async function loadUsers() {
  const table = document.getElementById("usersTable");
  if (!table) return;

  table.innerHTML = `<tr><th>Email</th><th>Balance</th><th>Action</th></tr>`;

  try {
    const snapshot = await db.collection("users").get();
    snapshot.forEach(doc => {
      const u = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.email || 'Unknown'}</td>
        <td>${u.balance || 0} TK</td>
        <td>
          <button onclick="changeBalance('${doc.id}', 10)">+10</button>
          <button onclick="changeBalance('${doc.id}', -10)">-10</button>
          <button onclick="customBalance('${doc.id}')">Set</button>
        </td>
      `;
      table.appendChild(tr);
    });
  } catch (err) {
    console.error("Load users error:", err);
  }
}

async function changeBalance(uid, amount) {
  try {
    const ref = db.collection("users").doc(uid);
    await db.runTransaction(async (t) => {
      const doc = await t.get(ref);
      const newBal = (doc.data().balance || 0) + amount;
      t.update(ref, { balance: newBal });
    });
    alert("✅ Balance updated!");
    loadUsers();
  } catch (err) {
    console.error("Change balance error:", err);
  }
}

async function customBalance(uid) {
  const val = prompt("Enter new balance:");
  if (val !== null && !isNaN(val)) {
    try {
      await db.collection("users").doc(uid).update({ balance: Number(val) });
      alert("✅ Balance set!");
      loadUsers();
    } catch (err) {
      console.error("Custom balance error:", err);
    }
  } else {
    alert("❌ Invalid number!");
  }
}

// -------------------- ORDERS --------------------
async function loadOrders() {
  const table = document.getElementById("ordersTable");
  if (!table) return;

  table.innerHTML = `<tr><th>Txn ID</th><th>User</th><th>Package</th><th>Price</th><th>Status</th><th>Action</th></tr>`;

  try {
    const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
    snapshot.forEach(doc => {
      const o = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.transactionId}</td>
        <td>${o.uid || "Unknown"}</td>
        <td>${o.packageName || "-"}</td>
        <td>${o.price || 0} TK</td>
        <td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td>
        <td>
          ${o.status === "Pending" ? `<button onclick="updateOrder('${doc.id}','Complete','${o.uid}',${o.price})">Approve</button>
          <button onclick="updateOrder('${doc.id}','Rejected')">Reject</button>` : ''}
        </td>
      `;
      table.appendChild(tr);
    });
  } catch (err) {
    console.error("Load orders error:", err);
  }
}

async function updateOrder(orderId, status, uid = null, price = 0) {
  try {
    await db.collection("orders").doc(orderId).update({ status });

    if (status === "Complete" && uid) {
      const ref = db.collection("users").doc(uid);
      await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const newBal = (doc.data().balance || 0) + Number(price);
        t.update(ref, { balance: newBal });
      });
    }

    alert(`✅ Order ${status}`);
    loadOrders();
    if (uid) loadUsers();
  } catch (err) {
    console.error("Update order error:", err);
  }
}

// -------------------- DEPOSITS --------------------
async function loadDeposits() {
  const table = document.getElementById("depositsTable");
  if (!table) return;

  table.innerHTML = `<tr><th>User</th><th>Amount</th><th>Transaction ID</th><th>Status</th><th>Action</th></tr>`;

  try {
    const snapshot = await db.collection("deposits").orderBy("createdAt", "desc").get();
    snapshot.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.uid || "Unknown"}</td>
        <td>${d.amount || 0} TK</td>
        <td>${d.transactionId || "-"}</td>
        <td><span class="status ${d.status.toLowerCase()}">${d.status}</span></td>
        <td>
          ${d.status === "Pending" ? `<button onclick="updateDeposit('${doc.id}','Complete','${d.uid}',${d.amount})">Approve</button>
          <button onclick="updateDeposit('${doc.id}','Rejected')">Reject</button>` : ''}
        </td>
      `;
      table.appendChild(tr);
    });
  } catch (err) {
    console.error("Load deposits error:", err);
  }
}

async function updateDeposit(depositId, status, uid = null, amount = 0) {
  try {
    await db.collection("deposits").doc(depositId).update({ status });

    if (status === "Complete" && uid) {
      const ref = db.collection("users").doc(uid);
      await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const newBal = (doc.data().balance || 0) + Number(amount);
        t.update(ref, { balance: newBal });
      });
    }

    alert(`✅ Deposit ${status}`);
    loadDeposits();
    if (uid) loadUsers();
  } catch (err) {
    console.error("Update deposit error:", err);
  }
}

// -------------------- ORDER SEARCH --------------------
const searchInput = document.getElementById("searchOrder");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const val = searchInput.value.toLowerCase();
    document.querySelectorAll("#ordersTable tr:not(:first-child)").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(val) ? "" : "none";
    });
  });
 }
