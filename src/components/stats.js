// src/components/stats.js
export async function loadStats() {
  const statsGrid = document.getElementById("closet-stats");
  if (!statsGrid) {
    console.warn("[stats] #closet-stats not found");
    return;
  }

  try {
    // ✅ use the same source as init-firebase.js
    const { auth, db } = await import("../utils/init-firebase.js");
    const { collection, getDocs } = await import("firebase/firestore");

    if (!db) {
      console.error("[stats] Firestore db is undefined – check init-firebase exports");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.warn("[stats] No user logged in");
      return;
    }

    const closetRef = collection(db, `users/${uid}/closet`);
    const snapshot = await getDocs(closetRef);

    const totalPieces = snapshot.size;
    const categories = new Set();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let recentUploads = 0;

    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      if (data.category) categories.add(data.category);
      if (data.uploadedAt?.toMillis && data.uploadedAt.toMillis() >= oneWeekAgo) {
        recentUploads++;
      }
    });

    statsGrid.innerHTML = `
      <div class="stat-block">
        <span class="stat-label">Total Pieces</span>
        <span class="stat-value" id="total-pieces">${totalPieces}</span>
      </div>
      <div class="stat-block">
        <span class="stat-label">Categories</span>
        <span class="stat-value" id="category-count">${categories.size}</span>
      </div>
      <div class="stat-block">
        <span class="stat-label">Recent Uploads</span>
        <span class="stat-value" id="recent-uploads">${recentUploads}</span>
      </div>
    `;
  } catch (err) {
    console.error("🧨 Failed to load closet stats:", err);
    statsGrid.innerHTML = `<p>Failed to load closet stats.</p>`;
  }
}
