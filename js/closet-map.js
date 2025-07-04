// closet-map.js
export const closetMap = {
  outfit: ['pants', 'dress', 'swimsuit', 'skirt', 'shirt'],
  shoes: ['boots', 'sandals', 'heels'],
  jewelry: ['necklace', 'earrings', 'bracelet', 'ring'],
  perfume: ['floral'],
  accessories: ['hat', 'gloves'],
  purse: ['handbag', 'mini-bag']
};

export function addClosetCategory(name) {
  if (!closetMap[name]) closetMap[name] = [];
}

export function addClosetSubcategory(category, subcategory) {
  if (closetMap[category] && !closetMap[category].includes(subcategory)) {
    closetMap[category].push(subcategory);
  }
}

export function removeClosetSubcategory(category, subcategory) {
  if (closetMap[category]) {
    closetMap[category] = closetMap[category].filter(sub => sub !== subcategory);
  }
}