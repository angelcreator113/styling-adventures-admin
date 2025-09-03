// File: /js/theme-manager.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

import { firebaseConfig } from "../firebase-config.js"; // Adjust path if needed

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const themesRef = collection(db, "themes");

// Mount node
const root = document.getElementById("theme-manager-root");

function renderConfetti(target) {
  const confetti = document.createElement("div");
  confetti.className = "vote-animation";
  confetti.innerText = "🎉";
  target.appendChild(confetti);
  setTimeout(() => confetti.remove(), 800);
}

function renderThemes(themes) {
  root.innerHTML = `
    <div class="theme-manager">
      <h2>✨ Theme Manager</h2>
      <input id="new-theme-name" type="text" placeholder="Enter a new theme name..." />
      <button id="add-theme-btn">Add Theme</button>
      <div id="theme-list"></div>
    </div>
  `;

  const list = root.querySelector("#theme-list");
  themes.forEach((theme) => {
    const card = document.createElement("div");
    card.className = "theme-card";
    card.innerHTML = `
      <strong>${theme.name}</strong>
      <div class="theme-actions">
        <button data-id="${theme.id}" class="vote-btn">Vote ❤️</button>
        <button data-id="${theme.id}" class="edit-btn">Edit</button>
        <button data-id="${theme.id}" class="delete-btn">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });

  // Add listeners
  root.querySelector("#add-theme-btn").onclick = async () => {
    const input = document.getElementById("new-theme-name");
    const name = input.value.trim();
    if (!name) return;

    await addDoc(themesRef, { name });
    input.value = "";
    loadThemes();
  };

  list.querySelectorAll(".vote-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      renderConfetti(e.target);
    })
  );

  list.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await deleteDoc(doc(themesRef, id));
      loadThemes();
    })
  );

  list.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const newName = prompt("Enter new theme name:");
      if (!newName) return;

      await updateDoc(doc(themesRef, id), { name: newName.trim() });
      loadThemes();
    })
  );
}

async function loadThemes() {
  const snapshot = await getDocs(themesRef);
  const themes = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  renderThemes(themes);
}

loadThemes();
