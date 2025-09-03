// src/utils/auth-helpers.js

import { getAuth } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/utils/init-firebase.js";

// Helper to get the user's role from Firestore
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().role || "fan" : "fan";
  } catch (e) {
    console.warn("Failed to fetch user role:", e);
    return "fan";
  }
}
