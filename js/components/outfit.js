// js/components/outfit.js

export function generateOutfit() {
  const preview = document.getElementById("generated-outfit-preview");
  if (!preview) {
    console.warn("⚠️ No preview container found for outfit generator.");
    return;
  }

  // Example outfit pieces
  const tops = ["Crop Top", "Blazer", "Sweater", "Corset"];
  const bottoms = ["Jeans", "Skirt", "Trousers", "Cargo Pants"];
  const accessories = ["Pearl Necklace", "Sunglasses", "Scarf", "Chunky Earrings"];
  const shoes = ["Heels", "Boots", "Sneakers", "Sandals"];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const outfit = `
    <div class="outfit-card">
      <p>👚 Top: <strong>${pick(tops)}</strong></p>
      <p>👖 Bottom: <strong>${pick(bottoms)}</strong></p>
      <p>💍 Accessory: <strong>${pick(accessories)}</strong></p>
      <p>👠 Shoes: <strong>${pick(shoes)}</strong></p>
    </div>
  `;

  preview.innerHTML = outfit;
}
