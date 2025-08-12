// src/pages/home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { auth } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";

import ClosetStatsCard from "@/components/ClosetStatsCard.jsx";
import JustInCarousel from "@/features/closet/JustInCarousel.jsx";
import OutfitPlanner from "@/components/homepage/OutfitPlanner.jsx";

/* ---------------------------------- */
/* Small, file-local building blocks  */
/* ---------------------------------- */

function QuickActions({ user, variant = "default" }) {
  const base = "tb-btn";
  const primary = `${base} primary`;

  return (
    <div
      className={variant === "row" ? "cta-row" : "cta-stack"}
      role="group"
      aria-label="Quick actions"
    >
      <Link to="/planner" className={base}>
        Open Full Planner
      </Link>
      {user && (
        <Link to="/closet/upload" className={primary}>
          Upload New Item
        </Link>
      )}
    </div>
  );
}

function CardSkeleton({ title = "Loading…" }) {
  return (
    <article className="card" aria-busy="true" aria-live="polite">
      <h2 className="section-title">{title}</h2>
      <div className="skeleton-block" style={{ height: 140, borderRadius: 12 }} />
    </article>
  );
}

function CarouselSkeleton() {
  return (
    <article className="card" aria-busy="true" aria-live="polite">
      <h2 className="section-title">Just In 🧾</h2>
      <div
        className="skeleton-row"
        style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-block"
            style={{ aspectRatio: "1 / 1", borderRadius: 12 }}
          />
        ))}
      </div>
    </article>
  );
}

/* -------------------------- */
/*            Page            */
/* -------------------------- */

export default function Home() {
  const [user, setUser] = React.useState(() => auth.currentUser);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
    <main className="home">
      <h1 className="sr-only">Home</h1>

      {/* HERO */}
      <header className="card home-hero" aria-label="Welcome">
        <img
          src="/images/closet-hero.png"
          alt=""
          aria-hidden="true"
          width="1600"
          height="600"
          decoding="async"
          fetchPriority="high"
        />
        <div className="home-hero__overlay">
          <Link to="/planner" className="pill tb-btn">
            Open Full Planner
          </Link>
        </div>
      </header>

      {/* GRID */}
      <section className="home-grid" aria-label="Highlights and planner">
        {/* LEFT column */}
        <div className="stack">
          <article className="card" aria-labelledby="h-stats">
            <h2 id="h-stats" className="section-title">
              Closet Stats 📊
            </h2>
            <React.Suspense
              fallback={
                <div className="skeleton-block" style={{ height: 140, borderRadius: 12 }} />
              }
            >
              <ClosetStatsCard />
            </React.Suspense>
            <div style={{ marginTop: 12 }}>
              <Link to="/closet/upload" className="tb-btn">
                + Add your first item
              </Link>
            </div>
          </article>

          <React.Suspense fallback={<CarouselSkeleton />}>
            <article className="card" aria-labelledby="h-justin">
              <h2 id="h-justin" className="section-title">
                Just In 🧾
              </h2>
              <JustInCarousel limit={12} />
            </article>
          </React.Suspense>

          <article className="card" aria-labelledby="h-tip">
            <h2 id="h-tip" className="section-title">
              <span aria-hidden="true">💡</span> Lala’s Daily Tip
            </h2>
            <p>Don’t sleep on those white jeans—they’re calling for a remix. 😊</p>
          </article>
        </div>

        {/* RIGHT column */}
        <div className="stack">
          <OutfitPlanner />
          <article className="card">
            <QuickActions user={user} variant="row" />
          </article>
        </div>
      </section>
    </main>
  );
}
