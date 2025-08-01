import { injectSidebar } from '../components/sidebar.js';
import { injectStats } from '../components/stats.js';
import { injectOutfitGenerator } from '../components/outfit.js';
import { injectCarousel } from '../components/carousel.js';
import { auth, db } from '../js/utils/firebase-client.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

injectSidebar();
injectStats();
injectOutfitGenerator();
injectCarousel();

// 📦 Closet Stats
async function loadStats() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const q = query(collection(db, `users/${uid}/closet`));
  const snapshot = await getDocs(q);
  document.getElementById("total-items").textContent = snapshot.size;

  const sorted = [...snapshot.docs].sort((a, b) => b.data().uploadedAt - a.data().uploadedAt);
  const last = sorted[0]?.data()?.uploadedAt?.toDate?.().toLocaleString?.();
  document.getElementById("last-upload").textContent = last || "–";
}

function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : ""}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add("fade-out"), 3000);
  setTimeout(() => toast.remove(), 4000);
}

// 👚 Outfit Generator
window.generateOutfit = () => {
  const outfits = [
    "Pink sweater + floral skirt + pearl earrings 💐",
    "Blush blazer + denim jeans + nude heels 👠",
    "Lavender maxi dress + gold belt ✨",
    "Crop hoodie + plaid pants + chunky boots 🖤",
    "Flowy kimono + pastel tank top 🌸"
  ];
  const box = document.getElementById("outfit-box");
  const random = outfits[Math.floor(Math.random() * outfits.length)];
  box.textContent = random;
};

window.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
});
