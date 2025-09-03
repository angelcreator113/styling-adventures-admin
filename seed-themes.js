// seed-themes.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 👇 Update this path if your file is named or located differently
import serviceAccount from './styling-admin-service-account.json' with { type: 'json' };

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
});

// Get Firestore instance
const db = getFirestore(app);

// Define the themes you want to seed
const themes = [
  {
    id: "theme1",
    title: "1st episode",
    description: "Our glam intro to the closet!",
    emoji: "💄",
    color: "#FFD1DC",
    iconUrl: "",
  },
  {
    id: "theme2",
    title: "Princess Energy",
    description: "Dreamy, delicate, full of magic",
    emoji: "👑",
    color: "#E4B1EB",
    iconUrl: "",
  },
  {
    id: "theme3",
    title: "Barbiecore",
    description: "Pink on pink on pink",
    emoji: "🎀",
    color: "#FF69B4",
    iconUrl: "",
  },
  {
    id: "theme4",
    title: "Boss Babe",
    description: "Chic, smart, powerful",
    emoji: "👜",
    color: "#B0C4DE",
    iconUrl: "",
  },
];

// Main seeding function
async function seedThemes() {
  const collectionRef = db.collection('themes');

  try {
    for (const theme of themes) {
      const docRef = collectionRef.doc(theme.id);
      await docRef.set(theme);
      console.log(`✅ Added theme: "${theme.title}"`);
    }

    console.log('\n🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding themes:', error);
  }
}

seedThemes();
