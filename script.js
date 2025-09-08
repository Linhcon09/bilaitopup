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

      const menuBtn = document.getElementById("menuBtn");
      const menuBox = document.getElementById("menuBox");

      // Toggle menu using CSS class (fixed)
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent immediate document click from closing it
        const willShow = !menuBox.classList.contains("show");
        if (willShow) {
          menuBox.classList.add("show");
          menuBox.setAttribute("aria-hidden", "false");
          menuBtn.setAttribute("aria-expanded", "true");
        } else {
          menuBox.classList.remove("show");
          menuBox.setAttribute("aria-hidden", "true");
          menuBtn.setAttribute("aria-expanded", "false");
        }
      });

      // Close menu when clicking outside
      document.addEventListener("click", (e) => {
        // only act if menu is open
        if (!menuBox.classList.contains("show")) return;
        // if click target is menuBox or menuBtn, ignore
        if (menuBox.contains(e.target) || e.target === menuBtn) return;
        menuBox.classList.remove("show");
        menuBox.setAttribute("aria-hidden", "true");
        menuBtn.setAttribute("aria-expanded", "false");
      });

      // Close when pressing Escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menuBox.classList.contains("show")) {
          menuBox.classList.remove("show");
          menuBox.setAttribute("aria-hidden", "true");
          menuBtn.setAttribute("aria-expanded", "false");
        }
      });

      // Auto-close when a link/button inside menu is clicked
      menuBox.querySelectorAll("a, button").forEach(el => {
        el.addEventListener("click", () => {
          menuBox.classList.remove("show");
          menuBox.setAttribute("aria-hidden", "true");
          menuBtn.setAttribute("aria-expanded", "false");
        });
      });

      // Check login status
      auth.onAuthStateChanged(user => {
        if (!user) {
          // not logged in -> go to login page
          window.location.href = "login.html";
        } else {
          loadPackages();
        }
      });

      // Load diamond packages
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
          { name: "610 Diamond", price: 395 },
          { name: "505 Diamond", price: 349 },
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

          // click handler
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
          // keyboard accessibility (Enter / Space)
          card.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              select();
            }
          });

          div.appendChild(card);
        });
      }

      // Verify & submit order
      document.getElementById("verifyBtn").addEventListener("click", async () => {
        const user = auth.currentUser;
        const ffUidInput = document.getElementById("ffUid");
        const mobileInput = document.getElementById("mobileNumber");
        const txnInput = document.getElementById("transactionId");

        const ffUid = (ffUidInput.value || "").trim();
        const mobileNumber = (mobileInput.value || "").trim();
        const transactionId = (txnInput.value || "").trim();

        if (!user) return alert("প্রথমে লগইন করুন!");
        if (!selectedPackage) return alert("একটি প্যাকেজ নির্বাচন করুন!");
        if (!ffUid || !mobileNumber || !transactionId) return alert("সব ফিল্ড পূরণ করুন!");

        const alnumRegex = /^[a-zA-Z0-9]+$/;

        // validation: FF UID numeric and length reasonable
        if (!/^\d+$/.test(ffUid) || ffUid.length > 12) return alert("FF UID অবশ্যই সংখ্যা এবং সর্বোচ্চ 12 সংখ্যা হতে হবে!");
        // mobile number numeric and typical max length 11 (BD)
        if (!/^\d+$/.test(mobileNumber) || mobileNumber.length > 11) return alert("Mobile Number অবশ্যই সংখ্যা এবং সর্বোচ্চ 11 সংখ্যা হতে হবে!");
        // txn id only alphanumeric
        if (!alnumRegex.test(transactionId) || transactionId.length > 20) {
          alert("Transaction ID শুধুমাত্র সংখ্যা ও অক্ষর থাকতে হবে, কোনো special character চলবে না। Order auto-rejected।");
          try {
            await db.collection("orders").add({
              uid: user.uid,
              ffUid: ffUid,
              mobileNumber: mobileNumber,
              packageName: selectedPackage.name,
              price: selectedPackage.price,
              transactionId,
              status: "Rejected",
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          } catch (err) { console.error("Auto-reject failed:", err); }
          return;
        }

        const loader = document.getElementById("loader");
        loader.style.display = "block";

        try {
          await db.collection("orders").add({
            uid: user.uid,
            ffUid: ffUid,
            mobileNumber: mobileNumber,
            packageName: selectedPackage.name,
            price: selectedPackage.price,
            transactionId,
            status: "Pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          alert("✅ অর্ডার সাবমিট হয়েছে! Status: Pending");

          // reset form
          ffUidInput.value = "";
          mobileInput.value = "";
          txnInput.value = "";
          document.getElementById("selectedPrice").textContent = "Select a package";
          selectedPackage = null;
          document.querySelectorAll(".package-card").forEach(c => c.classList.remove("selected"));
        } catch (err) {
          console.error("Order failed:", err);
          alert("অর্ডার সাবমিট করতে ব্যর্থ! পরে আবার চেষ্টা করুন।");
        } finally {
          loader.style.display = "none";
        }
      });

      // Logout function
      window.logout = () => {
        auth.signOut()
          .then(() => window.location.href = "login.html")
          .catch(err => {
            console.error("Logout failed:", err);
            alert("Logout failed. Try again.");
          });
      };

    }); // DOMContentLoaded end
