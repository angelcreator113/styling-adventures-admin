export async function loadCarousel() {
  const main = document.getElementById("main-content");
  const section = document.createElement("section");
  section.className = "carousel-section";
  section.innerHTML = `
    <h2>Just In 🧃</h2>
    <div id="just-in-carousel" class="carousel-scroll"></div>
  `;
  main.appendChild(section);

  try {
    const { auth, db } = await import('../utils/firebase-client.js');
    const { collection, query, orderBy, limit, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const carousel = document.getElementById("just-in-carousel");

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, `users/${uid}/closet`),
      orderBy("uploadedAt", "desc"),
      limit(6)
    );

    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const { imageUrl } = doc.data();
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "New Item";
      img.classList.add("carousel-img");
      carousel.appendChild(img);
    });

  } catch (err) {
    console.error("🧨 Failed to load carousel:", err);
  }
}
