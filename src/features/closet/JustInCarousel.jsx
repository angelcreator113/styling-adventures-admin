// src/features/closet/JustInCarousel.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, limit as fbLimit, getDocs } from "firebase/firestore";

export default function JustInCarousel({ limit = 12, className = "" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};

    const load = async (user) => {
      setLoading(true);
      setErr(null);
      if (!user) { if (!cancelled) { setItems([]); setLoading(false); } return; }

      try {
        const q = query(
          collection(db, `users/${user.uid}/closet`),
          orderBy("uploadedAt", "desc"),
          fbLimit(limit)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load(auth.currentUser);
    unsub = onAuthStateChanged(auth, load);
    return () => { cancelled = true; unsub && unsub(); };
  }, [limit]);

  if (loading) return <p className="muted op-70">Loading…</p>;
  if (err) return <p className="muted op-70">Couldn’t load items.</p>;
  if (items.length === 0) return <p className="muted op-70">No recent items found.</p>;

  return (
    <div className={`carousel-row ${className}`}>
      {items.map((it) => (
        <div className="carousel-item" key={it.id}>
          {it.imageUrl ? (
            <img src={it.imageUrl} alt={it.category || "Closet item"} loading="lazy" />
          ) : (
            <div className="carousel-placeholder" aria-hidden />
          )}
          {it.category && <span className="carousel-label">{it.category}</span>}
        </div>
      ))}
    </div>
  );
}
