// src/dev/seedFeaturesTopics.js
import { db } from "@/utils/init-firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const now = Date.now();

const topics = [
  // === Feature education ===
  {
    title: "Bestie Chat (for Fans)",
    body: "Post outfit ideas, ask questions, and react with ❤️ and 💬. Get styling help from the community fast.",
    ctaLabel: "Open Bestie Chat",
    ctaHref: "/community/forum",
    roleTarget: "fan",
    pageMatch: ["home", "forum", "*"],
    order: 10, updatedAt: now, active: true,
  },
  {
    title: "Closet: organize & build looks",
    body: "Upload pieces, auto-tag by category, and build outfits in minutes. Your wardrobe, searchable.",
    ctaLabel: "Start Your Closet",
    ctaHref: "/closet",
    roleTarget: "both",
    pageMatch: ["home", "closet", "*"],
    order: 20, updatedAt: now, active: true,
  },
  {
    title: "Bestie Lounge (VIP)",
    body: "Behind-the-scenes Lala content, AI fantasy fits, badges & special styling events.",
    ctaLabel: "Enter Bestie Lounge",
    ctaHref: "/vip",
    roleTarget: "both",
    pageMatch: ["home", "vip", "*"],
    order: 30, updatedAt: now, active: true,
  },
  {
    title: "Curious about becoming a Creator?",
    body: "Earn from Spaces, access analytics, and use creator tools for campaigns & drops. Start free with 2 Spaces.",
    ctaLabel: "See Creator benefits",
    ctaHref: "/settings/upgrade",
    roleTarget: "fan",
    pageMatch: ["home", "login", "*"],
    order: 40, updatedAt: now, active: true,
  },

  // === Trend prompts (engagement) ===
  { title: "Scandi-Pink Revival", body: "Soft pastel pink is back in minimalist looks. Discussion: statement piece or subtle accent?", roleTarget: "fan", pageMatch: ["home","forum"], order:101, updatedAt: now, active:true },
  { title: "Butter Yellow & Midi Era", body: "Butter yellow, wide buckle belts, midi silhouettes. Discussion: seasonal fad or cozy staple?", roleTarget: "fan", pageMatch: ["home","forum"], order:102, updatedAt: now, active:true },
  { title: "Luxury Boxers as Outerwear?", body: "Silk/cashmere boxers under blazers or swim hybrids. Discussion: would you try it?", roleTarget: "fan", pageMatch: ["home","forum"], order:103, updatedAt: now, active:true },
  { title: "Cow vs Snakeskin Footwear", body: "Fall ’25 loves cow print & snakeskin shoes. Discussion: bold accent or too much?", roleTarget: "fan", pageMatch: ["home","forum"], order:104, updatedAt: now, active:true },
  { title: "Y2K & Nostalgia Reloaded", body: "Skinny jeans, wide belts, micro-shorts, peplums, shield sunnies. Discussion: what will you revisit?", roleTarget: "fan", pageMatch: ["home","forum"], order:105, updatedAt: now, active:true },
  { title: "Vintage-Chic Accessories", body: "Silk headscarves + trench vibes. Discussion: how would you style yours?", roleTarget: "fan", pageMatch: ["home","forum"], order:106, updatedAt: now, active:true },
  { title: "Color Forecast", body: "Barely butter, sky blue, warm tan, seafoam, candy pink, silver. Discussion: your fall palette?", roleTarget: "fan", pageMatch: ["home","forum"], order:107, updatedAt: now, active:true },
  { title: "Castlecore vs Boho-Moto", body: "Medieval romantic vs edgy moto-boho + fuzzy textures. Discussion: which vibe is you?", roleTarget: "fan", pageMatch: ["home","forum"], order:108, updatedAt: now, active:true },
];

export async function seedFeaturesTopics() {
  const col = collection(db, "public/features_topics");
  for (const t of topics) {
    await addDoc(col, { ...t, createdAt: serverTimestamp() });
  }
  console.log(`Seeded ${topics.length} features topics`);
}
