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
  table.innerHTML = `<tr><th>Email/UID</th><th>Balance</th><th>Action</th></tr>`;

  try {
    const snapshot = await db.collection("users").get();
    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        const u = doc.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${u.email || doc.id}</td>
          <td>${u.balance || 0} TK</td>
          <td>
            <button onclick="changeBalance('${doc.id}', 10)">+10</button>
            <button onclick="changeBalance('${doc.id}', -10)">-10</button>
            <button onclick="customBalance('${doc.id}')">Set</button>
          </td>
        `;
        table.appendChild(tr);
      });
    } else {
      // Fallback: gather users from orders and deposits
      const usersSet = new Set();
      const ordersSnapshot = await db.collection("orders").get();
      ordersSnapshot.forEach(doc => usersSet.add(doc.data().uid));
      const depositsSnapshot = await db.collection("deposits").get();
      depositsSnapshot.forEach(doc => usersSet.add(doc.data().uid));

      usersSet.forEach(uid => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${uid}</td>
          <td>-</td>
          <td><button onclick="promptChangeBalance('${uid}')">Set Balance</button></td>
        `;
        table.appendChild(tr);
      });
    }
  } catch (err) {
    console.error("Load users error:", err);
  }
}

// Change balance by amount
async function changeBalance(uid, amount) {
  try {
    const ref = db.collection("users").doc(uid);
    await db.runTransaction(async t => {
      const doc = await t.get(ref);
      const newBal = (doc.data()?.balance || 0) + amount;
      t.set(ref, { balance: newBal }, { merge: true });
    });
    alert("✅ Balance updated!");
    loadUsers();
  } catch (err) {
    console.error("Change balance error:", err);
    alert("❌ Cannot change balance.");
  }
}

// Set custom balance
async function customBalance(uid) {
  const val = prompt("Enter new balance:");
  if (val !== null && !isNaN(val)) {
    try {
      await db.collection("users").doc(uid).set({ balance: Number(val) }, { merge: true });
      alert("✅ Balance set!");
      loadUsers();
    } catch (err) {
      console.error("Custom balance error:", err);
      alert("❌ Cannot set balance.");
    }
  } else {
    alert("❌ Invalid number!");
  }
}

// Fallback for unknown users
function promptChangeBalance(uid) {
  const val = prompt(`Set balance for user ${uid}:`);
  if (val !== null && !isNaN(val)) {
    db.collection("users").doc(uid).set({ balance: Number(val) }, { merge: true })
      .then(() => { alert("✅ Balance set!"); loadUsers(); })
      .catch(err => { console.error(err); alert("❌ Cannot set balance."); });
  }
}

// -------------------- ORDERS --------------------
async function loadOrders() {
  const table = document.getElementById("ordersTable");
  if (!table) return;
  table.innerHTML = `<tr><th>Txn ID</th><th>User</th><th>Package</th><th>Price</th><th>Status</th><th>Action</th></tr>`;

  try {
    const snapshot = await db.collection("orders").orderBy("createdAt","desc").get();
    snapshot.forEach(doc => {
      const o = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.transactionId}</td>
        <td>${o.uid}</td>
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

async function updateOrder(orderId, status, uid=null, price=0) {
  try {
    await db.collection("orders").doc(orderId).update({ status });
    if (status === "Complete" && uid) {
      const ref = db.collection("users").doc(uid);
      await db.runTransaction(async t => {
        const doc = await t.get(ref);
        const newBal = (doc.data()?.balance || 0) + Number(price);
        t.set(ref, { balance: newBal }, { merge: true });
      });
    }
    alert(`✅ Order ${status}`);
    loadOrders();
    loadUsers();
  } catch (err) {
    console.error(err);
    alert("❌ Cannot update order balance.");
  }
}

// -------------------- DEPOSITS --------------------
async function loadDeposits() {
  const table = document.getElementById("depositsTable");
  if (!table) return;
  table.innerHTML = `<tr><th>User</th><th>Amount</th><th>Transaction ID</th><th>Status</th><th>Action</th></tr>`;

  try {
    const snapshot = await db.collection("deposits").orderBy("createdAt","desc").get();
    snapshot.forEach(doc => {
      const d = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.uid}</td>
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

async function updateDeposit(depositId, status, uid=null, amount=0) {
  try {
    await db.collection("deposits").doc(depositId).update({ status });
    if (status === "Complete" && uid) {
      const ref = db.collection("users").doc(uid);
      await db.runTransaction(async t => {
        const doc = await t.get(ref);
        const newBal = (doc.data()?.balance || 0) + Number(amount);
        t.set(ref, { balance: newBal }, { merge: true });
      });
    }
    alert(`✅ Deposit ${status}`);
    loadDeposits();
    loadUsers();
  } catch (err) {
    console.error(err);
    alert("❌ Cannot update deposit balance.");
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
