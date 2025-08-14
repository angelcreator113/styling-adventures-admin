// src/pages/home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { auth } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";

// Lazy-load heavy children so this module doesn't execute them on import
const ClosetStatsCard  = React.lazy(() => import("@/components/ClosetStatsCard.jsx"));
const JustInCarousel   = React.lazy(() => import("@/features/closet/JustInCarousel.jsx"));
const OutfitPlanner    = React.lazy(() => import("@/components/homepage/OutfitPlanner.jsx"));

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

/* ---------------------------------- */
/* Local error boundary (catches child errors) */
/* ---------------------------------- */

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // Keep this noisy so we can see the real cause in dev tools
    console.error("[Home] child error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <article className="card">
          <h2 className="section-title">Something went wrong</h2>
          <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </article>
      );
    }
    return this.props.children;
  }
}

/* -------------------------- */
/*            Page            */
/* -------------------------- */

export default function Home() {
  // Be defensive: auth might not be ready during hot reloads
  const [user, setUser] = React.useState(() => {
    try {
      return auth?.currentUser ?? null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    if (!auth) return undefined;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return () => { try { unsub?.(); } catch {} };
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
          onError={(e) => {
            // never crash on broken images
            e.currentTarget.style.display = "none";
          }}
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
            <Boundary>
              <React.Suspense fallback={<CardSkeleton />}>
                <ClosetStatsCard />
              </React.Suspense>
            </Boundary>
            <div style={{ marginTop: 12 }}>
              <Link to="/closet/upload" className="tb-btn">
                + Add your first item
              </Link>
            </div>
          </article>

          <Boundary>
            <React.Suspense fallback={<CarouselSkeleton />}>
              <article className="card" aria-labelledby="h-justin">
                <h2 id="h-justin" className="section-title">
                  Just In 🧾
                </h2>
                {/* Guard props just in case */}
                <JustInCarousel limit={Number.isFinite(12) ? 12 : 0} />
              </article>
            </React.Suspense>
          </Boundary>

          <article className="card" aria-labelledby="h-tip">
            <h2 id="h-tip" className="section-title">
              <span aria-hidden="true">💡</span> Lala’s Daily Tip
            </h2>
            <p>Don’t sleep on those white jeans—they’re calling for a remix. 😊</p>
          </article>
        </div>

        {/* RIGHT column */}
        <div className="stack">
          <Boundary>
            <React.Suspense fallback={<CardSkeleton title="Planner loading…" />}>
              <OutfitPlanner />
            </React.Suspense>
          </Boundary>

          <article className="card">
            <QuickActions user={!!user} variant="row" />
          </article>
        </div>
      </section>
    </main>
  );
}
