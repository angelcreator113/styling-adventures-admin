export async function loadStats() {
  const main = document.getElementById("main-content");
  const section = document.createElement("section");
  section.className = "closet-stats-section";
  section.innerHTML = `
    <h2>Closet Stats 📊</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3 id="stat-total">0</h3>
        <p>Total Pieces</p>
      </div>
      <div class="stat-card">
        <h3 id="stat-categories">0</h3>
        <p>Categories</p>
      </div>
      <div class="stat-card">
        <h3 id="stat-recent">0</h3>
        <p>Recent Uploads</p>
      </div>
    </div>
  `;
  main.appendChild(section);

  try {
    const { auth, db } = await import('../utils/firebase-client.js');
    const { collection, getDocs, query, where, Timestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const closetRef = collection(db, `users/${uid}/closet`);
    const snapshot = await getDocs(closetRef);

    const total = snapshot.size;
    const categories = new Set();
    let recent = 0;

    const now = Timestamp.now();
    const oneWeekAgo = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.category) categories.add(data.category);
      if (data.uploadedAt?.seconds > oneWeekAgo.seconds) recent++;
    });

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-categories").textContent = categories.size;
    document.getElementById("stat-recent").textContent = recent;

  } catch (err) {
    console.error("🧨 Failed to load closet stats:", err);
  }
}
