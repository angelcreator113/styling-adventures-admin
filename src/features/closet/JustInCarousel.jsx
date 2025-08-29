// src/features/closet/JustInCarousel.jsx
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, limit as fbLimit, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

/**
 * Props:
 *  - limit: number (default 12)
 *  - className: string
 *  - publicPath: Firestore collection for public feed when not authed (default "public/just_in")
 *
 * Expected item fields:
 *  - imageUrl | url | storagePath | path
 *  - title | fileName | category
 */
export default function JustInCarousel({ limit = 12, className = "", publicPath = "public/just_in" }) {
  const [items, setItems] = useState([]);
  const [urls, setUrls] = useState({}); // storagePath -> resolved URL
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Load recent items: user’s closet if authed, else public feed
  useEffect(() => {
    let cancelled = false;
    let unsubAuth = () => {};

    const loadForUser = async (user) => {
      setLoading(true);
      setErr(null);

      try {
        let q;
        if (user) {
          q = query(
            collection(db, `users/${user.uid}/closet`),
            orderBy("uploadedAt", "desc"),
            fbLimit(limit)
          );
        } else {
          // Public fallback: most recent community/public items
          q = query(
            collection(db, publicPath),
            orderBy("createdAt", "desc"),
            fbLimit(limit)
          );
        }

        const snap = await getDocs(q);
        if (cancelled) return;
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // initial + on auth change
    loadForUser(auth.currentUser);
    unsubAuth = onAuthStateChanged(auth, (u) => loadForUser(u));

    return () => {
      cancelled = true;
      unsubAuth && unsubAuth();
    };
  }, [limit, publicPath]);

  // Resolve download URLs for any items that only have a storage path
  useEffect(() => {
    let alive = true;

    (async () => {
      const toFetch = [];
      for (const it of items) {
        const path = it.path || it.storagePath || "";
        const direct = it.imageUrl || it.url;
        if (!direct && path && !urls[path]) toFetch.push(path);
      }
      for (const path of toFetch) {
        try {
          const u = await getDownloadURL(ref(storage, path));
          if (!alive) return;
          setUrls((prev) => ({ ...prev, [path]: u }));
        } catch {
          // ignore missing/unauthorized — card will show placeholder
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [items, urls]);

  if (loading) return <p className="muted op-70">Loading…</p>;
  if (err) return <p className="muted op-70">Couldn’t load items.</p>;
  if (items.length === 0) return <p className="muted op-70">No recent items found.</p>;

  return (
    <div className={`justin-row ${className}`}>
      {items.map((it) => {
        const path = it.path || it.storagePath || "";
        const src = it.imageUrl || it.url || (path ? urls[path] : "");
        const alt = it.title || it.fileName || it.category || "Closet item";
        return (
          <div className="justin-card" key={it.id} title={alt}>
            {src ? (
              <img src={src} alt={alt} loading="lazy" decoding="async" />
            ) : (
              <div className="justin-skel" aria-hidden />
            )}
            {it.category && <span className="justin-badge">{it.category}</span>}
          </div>
        );
      })}
    </div>
  );
}
