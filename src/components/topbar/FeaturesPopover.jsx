// src/components/topbar/FeaturesPopover.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/utils/init-firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";

export default function FeaturesPopover() {
  const [open, setOpen] = useState(false);
  const [fans, setFans] = useState([]);
  const [creators, setCreators] = useState([]);
  const [hideButton, setHideButton] = useState(false); // <- will hide if rules deny
  const btnRef = useRef(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // NOTE: collection must exist at root as "features_topics"
        const q = query(
          collection(db, "features_topics"),
          orderBy("order", "asc"),   // docs without "order" are okay; they’ll sort first
          limit(24)
        );

        const snap = await getDocs(q);
        if (!alive) return;

        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          // tolerate missing fields
          .filter(x => x?.active !== false && (x?.title || x?.id));

        setFans(all.filter(x => (x?.audience || "fans") === "fans"));
        setCreators(all.filter(x => x?.audience === "creators"));
      } catch (e) {
        // If rules block or some other runtime error, just hide the button quietly
        if (e?.code === "permission-denied") {
          console.info("[FeaturesPopover] hidden by rules (permission-denied)");
        } else {
          console.warn("[FeaturesPopover] failed to load topics:", e?.code || e?.message || e);
        }
        setHideButton(true);
        setFans([]);
        setCreators([]);
      }
    })();

    return () => { alive = false; };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      const menu = document.getElementById("features-popover");
      if (!menu) return;
      if (!menu.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // If rules deny or nothing to show, don't render the trigger at all
  const nothingToShow = !fans.length && !creators.length;
  if (hideButton || nothingToShow) return null;

  return (
    <div className="features-wrap">
      <button
        ref={btnRef}
        className={`features-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open ? "true" : "false"}
        aria-haspopup="true"
        aria-controls="features-popover"
        type="button"
      >
        Features
      </button>

      {open && (
        <div
          id="features-popover"
          className="features-popover"
          role="menu"
          aria-label="Features"
        >
          <div className="features-col">
            <div className="features-col__title">Fans</div>
            {fans.length ? fans.map(t => (
              <Link key={t.id} to={t.path || "/"} className="features-link" onClick={() => setOpen(false)}>
                {t.title || t.id}
              </Link>
            )) : <span className="features-link muted">Coming soon…</span>}
          </div>

          <div className="features-col">
            <div className="features-col__title">Content Creators</div>
            {creators.length ? creators.map(t => (
              <Link key={t.id} to={t.path || "/"} className="features-link" onClick={() => setOpen(false)}>
                {t.title || t.id}
              </Link>
            )) : <span className="features-link muted">Coming soon…</span>}
          </div>
        </div>
      )}
    </div>
  );
}
