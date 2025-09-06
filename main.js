// Google Login
const loginBtn = document.getElementById("loginBtn");
if(loginBtn){
  loginBtn.addEventListener("click",()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  });
}

auth.onAuthStateChanged(user=>{
  if(user){
    console.log("Logged in:",user.email);
    loadPackages();
    loadWallet(user.uid);
    loadOrders(user.uid);
  }else{
    console.log("Not logged in");
  }
});

// Packages
const packages = [
{name:"25 Diamond",price:24},{name:"50 Diamond",price:38},{name:"115 Diamond",price:82},{name:"240 Diamond",price:158},
{name:"355 Diamond",price:235},{name:"480 Diamond",price:312},{name:"610 Diamond",price:395},{name:"505 Diamond",price:347},
{name:"850 Diamond",price:550},{name:"1090 Diamond",price:738},{name:"1240 Diamond",price:787},{name:"2530 Diamond",price:1590},
{name:"5060 Diamond",price:3177},{name:"10120 Diamond",price:6297},{name:"12650 Diamond",price:7870},{name:"Weekly",price:160},
{name:"Monthly",price:779},{name:"Weekly 2x",price:315},{name:"Weekly 3x",price:471},{name:"Weekly Lite",price:45},{name:"5x Weekly Lite",price:212}
];

function loadPackages(){
  const div = document.getElementById("packages");
  if(!div) return;
  packages.forEach(p=>{
    const box = document.createElement("div");
    box.innerHTML=`<strong>${p.name}</strong> - ${p.price} TK`;
    div.appendChild(box);
  });
}

// Deposit & Verify
const verifyBtn = document.getElementById("verifyBtn");
if(verifyBtn){
  verifyBtn.addEventListener("click",async()=>{
    const tid = document.getElementById("transactionId").value;
    const user = auth.currentUser;
    if(!tid || !user) return alert("Login and enter Transaction ID!");
    await db.collection("orders").add({
      uid: user.uid,
      transactionId: tid,
      status: "Pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Order submitted! Pending approval.");
  });
}

// Wallet & Orders (account.html)
async function loadWallet(uid){
  const res = await db.collection("users").doc(uid).get();
  document.getElementById("walletBalance").innerText = res.exists ? res.data().balance||0 : 0;
}

async function loadOrders(uid){
  const table = document.getElementById("orderHistory");
  if(!table) return;
  const snapshot = await db.collection("orders").where("uid","==",uid).orderBy("createdAt","desc").get();
  snapshot.forEach(doc=>{
    const tr = document.createElement("tr");
    tr.innerHTML=`<td>${doc.data().transactionId}</td><td>${doc.data().status}</td>`;
    table.appendChild(tr);
  });
}
