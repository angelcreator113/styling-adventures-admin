// js/components/injectHomeSections.js
import { injectCarousel } from './carousel.js';
import { injectStats } from './stats.js';

export async function injectHomeSections() {
  const main = document.getElementById("main-content");
  if (!main) {
    console.warn("⚠️ #main-content not found");
    return;
  }

  // 🧃 Load Carousel Section
  try {
    await injectCarousel();
    console.log("✅ Carousel section injected");
  } catch (err) {
    console.error("🚫 Failed to load carousel:", err);
  }

  // 📊 Load Closet Stats
  try {
    await injectStats();
    console.log("✅ Stats section injected");
  } catch (err) {
    console.error("🚫 Failed to load closet stats:", err);
  }

  // ✨ Optional: Add outfit generator logic here
  const outfitSection = document.createElement("section");
  outfitSection.className = "dashboard-section";
  outfitSection.innerHTML = `
    <h2>Outfit Generator 💅</h2>
    <div id="outfit-display">
      <p>No outfit yet... tap below to generate!</p>
    </div>
    <button id="generate-outfit-btn">✨ Generate Outfit</button>
  `;
  main.appendChild(outfitSection);

  document.getElementById("generate-outfit-btn").addEventListener("click", () => {
    const phrases = ["Casual Cute 🌸", "Glam Night Out ✨", "Comfy Cozy 🛋️"];
    const pick = phrases[Math.floor(Math.random() * phrases.length)];
    document.getElementById("outfit-display").innerHTML = `<p>${pick}</p>`;
  });
}
