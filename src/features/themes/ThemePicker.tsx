// src/features/themes/ThemePicker.tsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/utils/init-firebase";
import "@/css/ThemePicker.css";

type ThemeRow = {
  id: string;
  name?: string;
  iconUrl?: string;
  bgUrl?: string;
  ambientEffect?: string | null;
  visibility?: "public" | "private";
  releaseAt?: any;
  expiresAt?: any;
  voteCount?: number;
};

type Props = {
  value?: string | null;
  onChange?: (id: string | null) => void;
  showVotes?: boolean;
};

function toMillis(ts: any): number | null {
  if (!ts) return null;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  if (typeof ts === "number") return ts;
  if (ts instanceof Date) return ts.getTime();
  return null;
}

function isLive(t: ThemeRow): boolean {
  if (t.visibility === "private") return false;
  const now = Date.now();
  const rel = toMillis(t.releaseAt);
  const exp = toMillis(t.expiresAt);
  if (rel && now < rel) return false;
  if (exp && now > exp) return false;
  return true;
}

export default function ThemePicker({ value, onChange, showVotes = true }: Props) {
  const [rows, setRows] = useState<ThemeRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qy = query(collection(db, "themes"), orderBy("name", "asc"));
    const off = onSnapshot(
      qy,
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return off;
  }, []);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = rows.filter(isLive);
    if (!needle) return base;
    return base.filter((r) => (r.name || r.id).toLowerCase().includes(needle));
  }, [rows, q]);

  return (
    <section className="tp" aria-label="Theme picker">
      <header className="tp__header">
        <h3 className="tp__title">Choose a theme</h3>
        <input
          className="tp__search"
          placeholder="Search themes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search themes"
        />
      </header>

      <fieldset className="tp__group" aria-describedby="tp-help">
        <legend className="sr-only">Available themes</legend>
        <p id="tp-help" className="sr-only">
          Use arrow keys to navigate themes. Press space or enter to select.
        </p>

        <ul className="tp__list" role="list">
          {visible.map((t) => {
            const active = value === t.id;
            const preview = t.bgUrl || t.iconUrl || "";

            return (
              <li key={t.id} className="tp__item">
                <label className={`tp__card ${active ? "is-active" : ""}`} data-theme-id={t.id}>
                  <input
                    type="radio"
                    name="theme-picker"
                    className="sr-only"
                    value={t.id}
                    checked={active}
                    onChange={() => onChange?.(t.id)}
                    aria-label={`Select theme ${t.name || t.id}`}
                  />

                  {/* Removed aria-hidden to satisfy axe; not needed here */}
                  <div className="tp__thumb">
                    {preview ? (
                      <img className="tp__img" src={preview} alt={t.name || t.id} />
                    ) : (
                      <span className="tp__placeholder">No preview</span>
                    )}
                  </div>

                  <div className="tp__body">
                    <span className="tp__name">{t.name || t.id}</span>
                    {showVotes && Number.isFinite(t.voteCount as any) && (
                      <span className="tp__meta" aria-label="votes">
                        {(t.voteCount as number) | 0} votes
                      </span>
                    )}
                  </div>
                </label>
              </li>
            );
          })}

          {!loading && visible.length === 0 && (
            <li className="tp__empty muted">No themes available.</li>
          )}
        </ul>
      </fieldset>
    </section>
  );
}
