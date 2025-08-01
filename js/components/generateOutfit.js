// js/components/generateOutfit.js

import { db } from "../utils/firebase-client.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function generateOutfit() {
  const display = document.getElementById("outfit-display");
  display.innerHTML = "<p>Loading your look… 👗✨</p>";

  try {
    const snapshot = await getDocs(collection(db, "closet"));
    const items = snapshot.docs.map(doc => doc.data());

    if (items.length === 0) {
      display.innerHTML = "<p>No items found in your closet! 🧺</p>";
      return;
    }

    // Optional: filter or categorize before randomizing
    const outfit = [];
    const count = Math.min(3, items.length); // e.g., Top + Bottom + Accessory

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * items.length);
      outfit.push(items[randomIndex]);
    }

    display.innerHTML = `
      <div class="outfit-preview">
        ${outfit
          .map(item => `<img src="${item.imageUrl}" alt="Outfit Piece" />`)
          .join("")}
      </div>
    `;
  } catch (err) {
    display.innerHTML = "<p>Couldn’t generate outfit 😔</p>";
    console.error(err);
  }
}
