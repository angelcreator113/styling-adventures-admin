import { db } from '../utils/firebase-client.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🧠 Local cache
let closetCache = [];

// 📦 DOM references
const CLOSET_GRID_ID = "closet-dashboard-grid";
const FILTER_INPUT_ID = "closet-filter";
const CLEAR_BTN_ID = "closet-clear-btn";

// 🪄 Render cards into the dashboard grid
function renderClosetGrid(dataList, filter = "") {
  const grid = document.getElementById(CLOSET_GRID_ID);
  if (!grid) return;

  const query = filter.toLowerCase();
  const filtered = dataList.filter(item => {
    return (
      item.filename?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.subcategory?.toLowerCase().includes(query)
    );
  });

  grid.innerHTML = "";

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "closet-card";
    card.innerHTML = `
      <img src="${item.url}" alt="${item.filename}" class="closet-thumb" />
      <div class="title">${item.filename}</div>
    `;
    grid.appendChild(card);
  });
}

// 🔁 Re-render dashboard from Firestore
export async function refreshClosetDashboard() {
  const grid = document.getElementById(CLOSET_GRID_ID);
  const filterInput = document.getElementById(FILTER_INPUT_ID);
  const clearBtn = document.getElementById(CLEAR_BTN_ID);

  if (!grid || !filterInput || !clearBtn) {
    console.warn("⚠️ Missing dashboard elements for Closet");
    return;
  }

  const snapshot = await getDocs(collection(db, "closet"));
  closetCache = snapshot.docs.map(doc => doc.data());

  renderClosetGrid(closetCache);

  filterInput.addEventListener("input", () => {
    renderClosetGrid(closetCache, filterInput.value);
  });

  clearBtn.addEventListener("click", () => {
    filterInput.value = "";
    renderClosetGrid(closetCache);
  });

  console.log("🧥 Closet dashboard loaded.");
}
