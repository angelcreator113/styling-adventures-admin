// src/features/themes/ThemeVoteBar.tsx
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/utils/init-firebase";
import { voteForTheme } from "./vote";

export default function ThemeVoteBar() {
  const [themes, setThemes] = useState<any[]>([]);
  useEffect(() => {
    const off = onSnapshot(collection(db, "themes"), (snap) =>
      setThemes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    return () => off();
  }, []);

  return (
    <div className="flex gap-10 items-center">
      {themes.map(t => (
        <button key={t.id} className="flex items-center gap-2" onClick={() => voteForTheme(t.id)}>
          <img src={t.iconUrl} width={28} height={28} alt="" />
          <span>{t.name}</span>
          {"voteCount" in t ? <span className="text-sm opacity-60">({t.voteCount})</span> : null}
        </button>
      ))}
    </div>
  );
}
