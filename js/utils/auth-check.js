import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "./firebase-client.js"; // or adjust the import path

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // ⛔ Not logged in: redirect — but AFTER page load finishes
    setTimeout(() => {
      window.location.href = "login.html";
    }, 0); // avoids layout flicker
  } else {
    // ✅ Logged in: unlock UI
    document.body.classList.remove("logged-out");
    console.log("✅ Authenticated as:", user.email);
  }
});
