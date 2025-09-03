// src/components/ThemeVoteCarousel.jsx
import { useEffect, useState } from "react";
import { db } from "@/utils/init-firebase";
import { collection, getDocs } from "firebase/firestore";
import { saveThemeVote } from "@/utils/theme-vote-utils";
import confetti from "canvas-confetti";

export default function ThemeVoteCarousel() {
  const [themes, setThemes] = useState([]);
  const [votedTheme, setVotedTheme] = useState(localStorage.getItem("votedTheme") || null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    async function fetchThemes() {
      const snap = await getDocs(collection(db, "themeIcons"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setThemes(data);
    }
    fetchThemes();
  }, []);

  const handleVote = async (themeId, themeName, themeIcon) => {
    if (disabled) return;
    setDisabled(true);
    try {
      await saveThemeVote(themeId, themeName, themeIcon);

      // 🎉 Confetti blast!
      confetti();

      setVotedTheme(themeId);
      localStorage.setItem("votedTheme", themeId);
      console.log("Vote saved!");
    } catch (err) {
      console.error("Vote failed:", err?.message || err);
    } finally {
      setDisabled(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>💫 Pick Your Vibe</h3>
      <div style={styles.carousel}>
        {themes.map((t) => {
          const themeId = t.id;
          const themeName = t.name || t.id;          // fallback to doc id if no name field
          const themeIcon = t.iconUrl || t.icon;     // support either iconUrl or icon
          return (
            <div
              key={themeId}
              onClick={() => handleVote(themeId, themeName, themeIcon)}
              style={{
                ...styles.card,
                border: votedTheme === themeId ? "2px solid #a855f7" : "1px solid #444",
                transform: votedTheme === themeId ? "scale(1.05)" : "scale(1)",
                opacity: disabled ? 0.7 : 1,
                pointerEvents: disabled ? "none" : "auto",
              }}
            >
              {themeIcon ? (
                <img src={themeIcon} alt={themeName} style={styles.img} />
              ) : (
                <div style={{ ...styles.img, display: "grid", placeItems: "center", background: "#2b2630" }}>
                  <span style={{ fontSize: 24 }}>{t.emoji || "🎨"}</span>
                </div>
              )}
              <div style={styles.label}>{themeName}</div>
            </div>
          );
        })}
      </div>
      <div style={styles.note}>👆 Vote once per day. Your background matters.</div>
    </div>
  );
}

const styles = {
  wrap: { padding: 20, textAlign: "center", background: "#16141a", color: "#fff" },
  title: { marginBottom: 10, fontSize: "1.2rem" },
  carousel: { display: "flex", gap: 12, overflowX: "auto", padding: 12 },
  card: {
    minWidth: 120,
    padding: 12,
    borderRadius: 12,
    background: "#222",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  img: { width: "100%", height: 88, objectFit: "cover", borderRadius: 8 },
  label: { marginTop: 8, fontSize: 14, textTransform: "capitalize" },
  note: { fontSize: 12, color: "#aaa", marginTop: 8 },
};

