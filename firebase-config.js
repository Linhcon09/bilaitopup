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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// -------------------- ADMIN CONFIG --------------------
const adminEmails = [
  "gamingtahmid08@gmail.com",
  "kingtahmid046@gmail.com",
  "kingtahmid1973@gmail.com",
  "tahmideditofficial@gmail.com"
];

// -------------------- AUTH HELPERS --------------------

// Sign in with Google popup
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    console.log("✅ Logged in:", result.user.email);
    return result.user;
  } catch (err) {
    console.error("❌ Login failed:", err.message);
    throw err;
  }
}

// Sign out
function logout() {
  auth.signOut();
}

// Check if current user is admin
function isAdmin(user) {
  return user && adminEmails.includes(user.email);
}

// -------------------- USER HELPERS --------------------

// Get user document by UID
async function getUser(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? doc.data() : null;
}

// Create or update user on first login
async function createUserIfNotExists(user) {
  if(!user) return;
  const ref = db.collection("users").doc(user.uid);
  const doc = await ref.get();
  if(!doc.exists){
    await ref.set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      balance: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}

// Update wallet balance
async function updateWallet(uid, amount) {
  const ref = db.collection("users").doc(uid);
  await db.runTransaction(async t=>{
    const doc = await t.get(ref);
    const newBalance = (doc.data().balance || 0) + amount;
    t.update(ref, { balance: newBalance });
  });
}

// -------------------- ORDER HELPERS --------------------

// Create new order
async function createOrder(uid, packageName, price, transactionId) {
  if(!uid || !transactionId) throw new Error("UID or Transaction ID missing");
  await db.collection("orders").add({
    uid,
    packageName,
    price: Number(price),
    transactionId,
    status: "Pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// Update order status
async function updateOrderStatus(orderId, status) {
  await db.collection("orders").doc(orderId).update({ status });
}

// -------------------- DEPOSIT HELPERS --------------------

// Create deposit request
async function createDeposit(uid, amount) {
  if(!uid || !amount) throw new Error("UID or amount missing");
  await db.collection("deposits").add({
    uid,
    amount: Number(amount),
    status: "Pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// Approve deposit and update wallet
async function approveDeposit(depositId) {
  const depositRef = db.collection("deposits").doc(depositId);
  const depositDoc = await depositRef.get();
  if(!depositDoc.exists) throw new Error("Deposit not found");

  const data = depositDoc.data();
  if(data.status === "Complete") return;

  const userRef = db.collection("users").doc(data.uid);
  await db.runTransaction(async t=>{
    const userDoc = await t.get(userRef);
    const newBalance = (userDoc.data().balance || 0) + (data.amount || 0);
    t.update(userRef, { balance: newBalance });
    t.update(depositRef, { status: "Complete" });
  });
}

// Reject deposit
async function rejectDeposit(depositId) {
  await db.collection("deposits").doc(depositId).update({ status: "Rejected" });
}

// -------------------- REALTIME LISTENERS --------------------

// Listen to auth state changes
function onAuthChange(callback) {
  auth.onAuthStateChanged(async user => {
    if(user){
      await createUserIfNotExists(user);
    }
    callback(user);
  });
}

// Listen to user orders in real-time
function onOrdersChange(uid, callback) {
  db.collection("orders").where("uid","==",uid)
    .orderBy("createdAt","desc")
    .onSnapshot(snapshot=>{
      const orders = [];
      snapshot.forEach(doc=>orders.push({ id: doc.id, ...doc.data() }));
      callback(orders);
    });
}

// Listen to deposits in real-time
function onDepositsChange(callback){
  db.collection("deposits").orderBy("createdAt","desc")
    .onSnapshot(snapshot=>{
      const deposits = [];
      snapshot.forEach(doc=>deposits.push({ id: doc.id, ...doc.data() }));
      callback(deposits);
    });
}

// Listen to all users in real-time
function onUsersChange(callback){
  db.collection("users").onSnapshot(snapshot=>{
    const users = [];
    snapshot.forEach(doc=>users.push({ id: doc.id, ...doc.data() }));
    callback(users);
  });
    }
