// src/features/themes/FanThemeSection.tsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/utils/init-firebase";
import useFanTheme from "@/hooks/useFanTheme";
import "@/css/fan-theme-section.css";

type Row = {
  id: string;
  name?: string;
  iconUrl?: string;
  bgUrl?: string;
  visibility?: "public" | "private";
  releaseAt?: any;
  expiresAt?: any;
};

function toMillis(ts: any): number | null {
  if (!ts) return null;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  if (typeof ts === "number") return ts;
  return null;
}
function isLive(t: Row) {
  if (t.visibility === "private") return false;
  const now = Date.now();
  const rel = toMillis(t.releaseAt);
  const exp = toMillis(t.expiresAt);
  if (rel && now < rel) return false;
  if (exp && now > exp) return false;
  return true;
}

export default function FanThemeSection() {
  const { themeId, chooseTheme } = useFanTheme();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const qy = query(collection(db, "themes"), orderBy("name", "asc"));
    return onSnapshot(qy, (snap) =>
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => isLive(r) && ((r.name || r.id).toLowerCase().includes(t)));
  }, [rows, q]);

  return (
    <section className="fts card">
      <div className="fts__head">
        <h3 className="fts__title">Theme</h3>
        <input
          className="fts__search"
          placeholder="Search themes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search themes"
        />
      </div>

      <ul className="fts__grid" role="list">
        {list.map((t) => {
          const active = t.id === themeId;
          const preview = (t.bgUrl || (t as any).backgroundUrl || t.iconUrl) || "";

          return (
            <li key={t.id} className="fts__item">
              <button
                type="button"
                className={`fts__card ${active ? "is-active" : ""}`}
                role="radio"
                aria-checked={active}           /* boolean, satisfies axe */
                aria-label={`Select theme ${t.name || t.id}`}
                onClick={() => chooseTheme(active ? null : t.id)}
              >
                <div className="fts__thumb" aria-hidden={preview ? undefined : true}>
                  {preview ? (
                    <img className="fts__img" src={preview} alt={t.name || t.id} />
                  ) : (
                    <span className="fts__placeholder">No preview</span>
                  )}
                </div>
                <div className="fts__body">
                  <span className="fts__name">{t.name || t.id}</span>
                  <span className="fts__hint">{active ? "Selected" : "Tap to apply"}</span>
                </div>
              </button>
            </li>
          );
        })}
        {!list.length && <li className="fts__empty muted">No themes found.</li>}
      </ul>
    </section>
  );
}
