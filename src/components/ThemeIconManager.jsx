// src/components/ThemeIconManager.jsx
import React, { useEffect, useState } from "react";
import {
  collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, updateDoc, increment
} from "firebase/firestore";
import { db } from "@/utils/init-firebase";

const EMOJI_OPTIONS = [
  "👜","👗","👚","👠","👒","🩷","💅","🕶️","👡","🎀","💖","🌸","👘","🩰","👑","🧥","👓","🌟","✨","🩱"
];

export default function ThemeIconManager() {
  const [themes, setThemes] = useState([]);
  const [newTheme, setNewTheme] = useState({ name: "", emoji: EMOJI_OPTIONS[0] });
  const [voting, setVoting] = useState({});

  // ✅ Use ONE collection everywhere: "themeIcons"
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "themeIcons"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setThemes(list);
    });
    return () => unsub();
  }, []);

  const addTheme = async () => {
    if (!newTheme.name.trim()) return;
    await addDoc(collection(db, "themeIcons"), {
      name: newTheme.name.trim(),
      emoji: newTheme.emoji,
      votes: 0,
      createdAt: Date.now(),
    });
    setNewTheme({ name: "", emoji: EMOJI_OPTIONS[0] });
  };

  const deleteTheme = async (id) => {
    await deleteDoc(doc(db, "themeIcons", id));
  };

  const voteTheme = async (id) => {
    if (voting[id]) return; // prevent spamming
    setVoting((p) => ({ ...p, [id]: true }));
    try {
      // Record a raw vote event (optional analytics stream)
      await addDoc(collection(db, `themeIcons/${id}/votes`), { ts: Date.now() });
      // ✅ Also increment the aggregate count on the parent doc
      await updateDoc(doc(db, "themeIcons", id), { votes: increment(1) });
      confettiBurst();
    } finally {
      setTimeout(() => setVoting((p) => ({ ...p, [id]: false })), 900);
    }
  };

  const confettiBurst = () => {
    const colors = ["#ff69b4","#ffc0cb","#ffb6c1","#f5a9bc","#e75480"];
    for (let i = 0; i < 40; i++) {
      const div = document.createElement("div");
      div.style.position = "fixed";
      div.style.left = Math.random() * 100 + "%";
      div.style.top = Math.random() * 100 + "%";
      div.style.fontSize = "20px";
      div.style.zIndex = 9999;
      div.innerText = "💖";
      div.style.color = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(div);
      setTimeout(() => document.body.removeChild(div), 1200);
    }
  };

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1>Theme Icon Manager</h1>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <h2>Add New Theme</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            placeholder="Theme name"
            value={newTheme.name}
            onChange={(e) => setNewTheme((s) => ({ ...s, name: e.target.value }))}
          />
          <select
            value={newTheme.emoji}
            onChange={(e) => setNewTheme((s) => ({ ...s, emoji: e.target.value }))}
          >
            {EMOJI_OPTIONS.map((emoji) => (
              <option key={emoji} value={emoji}>{emoji}</option>
            ))}
          </select>
          <button className="btn primary" onClick={addTheme}>Add</button>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h2>All Themes</h2>
        <ul style={{ padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
          {themes.map((t) => (
            <li key={t.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 24 }}>{t.emoji || "🎨"}</span>
              <strong>{t.name || t.id}</strong>
              <span>Votes: {t.votes || 0}</span>
              <button
                className="btn sm"
                onClick={() => voteTheme(t.id)}
                disabled={!!voting[t.id]}
              >
                ❤️ Vote
              </button>
              <button
                className="btn sm danger"
                style={{ background: "crimson", color: "white" }}
                onClick={() => deleteTheme(t.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
