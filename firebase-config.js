// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCSC-6WM5sUi5mMrw4DlO4-9_aFa7fX0Z8",
  authDomain: "bilai-top-up.firebaseapp.com",
  projectId: "bilai-top-up",
  storageBucket: "bilai-top-up.firebasestorage.app",
  messagingSenderId: "576723443646",
  appId: "1:576723443646:web:cb0aea65da0a79a21163ef",
  measurementId: "G-D226N8W6NV"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();

// ✅ Admin email list
const ADMIN_EMAILS = [
  "gamingtahmid08@gmail.com",
  "kingtahmid046@gmail.com",
  "kingtahmid1973@gmail.com",
  "tahmideditofficial@gmail.com"
];

// ✅ Helper Functions
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

function logout() {
  return auth.signOut();
}

function getCurrentUser() {
  return auth.currentUser;
}

function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

// Listen for auth state
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("✅ Logged in:", user.email, isAdmin(user) ? "(Admin)" : "(User)");
  } else {
    console.log("🚪 Logged out");
  }
});
