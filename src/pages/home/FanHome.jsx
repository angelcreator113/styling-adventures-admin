// src/pages/home/FanHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  getCountFromServer,
  orderBy,
  limit,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/utils/init-firebase";

/* ------------------- small UI bits ------------------- */
function StatCard({ label, value }) {
  return (
    <div
      className="dashboard-card"
      style={{
        padding: 12,
        minWidth: 160,
        textAlign: "center",
        boxShadow: "0 6px 24px rgba(0,0,0,.04)",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 20 }}>{value ?? 0}</div>
      <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
        {label}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div
        style={{
          height: 160,
          borderRadius: 12,
          background: "linear-gradient(180deg,#f2edf8,#efe8f6)",
        }}
      />
      <div className="muted" style={{ marginTop: 8 }}>
        Loading…
      </div>
    </div>
  );
}

/* ------------------- data hooks ------------------- */
function useTopPicks(limitN = 8) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Collection name can be changed here if yours differs
        const q = query(
          collection(db, "spotlights"),
          orderBy("createdAt", "desc"),
          limit(limitN)
        );
        const snap = await getDocs(q);
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [limitN]);

  return { rows, loading };
}

function useFanCounts() {
  const [counts, setCounts] = useState({ pieces: 0, categories: 0, uploads: 0 });

  useEffect(() => {
    (async () => {
      try {
        // Adjust these collection names to your schema if needed
        const [piecesSnap, catsSnap] = await Promise.all([
          getCountFromServer(collection(db, "items")),
          getCountFromServer(collection(db, "categories")),
        ]);

        // “Recent uploads”: items created in the last 7 days.
        const sevenDaysAgo = Timestamp.fromDate(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        const recentQ = query(
          collection(db, "items"),
          where("createdAt", ">=", sevenDaysAgo)
        );
        const recentSnap = await getCountFromServer(recentQ);

        setCounts({
          pieces: piecesSnap.data().count || 0,
          categories: catsSnap.data().count || 0,
          uploads: recentSnap.data().count || 0,
        });
      } catch {
        setCounts({ pieces: 0, categories: 0, uploads: 0 });
      }
    })();
  }, []);

  return counts;
}

/* ------------------- page ------------------- */
export default function FanHome() {
  const counts = useFanCounts();
  const { rows, loading } = useTopPicks(8);

  const gridCols = useMemo(
    () => ({
      display: "grid",
      gap: 16,
      gridTemplateColumns: "repeat(4, 1fr)",
    }),
    []
  );

  return (
    <section className="container" style={{ padding: 16 }}>
      {/* HERO */}
      <div
        className="dashboard-card"
        style={{
          padding: 20,
          marginBottom: 16,
          background:
            "linear-gradient(180deg, rgba(245,237,255,.8), rgba(246,241,250,.8))",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>
          Bestie, welcome to your style adventure!
        </h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Hi Bestie! I’m Lala — let’s upload your fav pieces, browse Top Picks,
          and build looks that feel like <em>you</em>.
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Link to="/closet" className="btn primary">
            Start Your Closet
          </Link>
          <Link to="/community/forum" className="btn">
            Enter the Bestie Lounge
          </Link>
        </div>

        {/* quick stats */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <StatCard label="Total Pieces" value={counts.pieces} />
          <StatCard label="Categories" value={counts.categories} />
          <StatCard label="Recent Uploads" value={counts.uploads} />
        </div>
      </div>

      {/* WEEKLY TOP PICKS */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2 style={{ margin: "0 0 8px 0" }}>Lala’s Weekly Top Picks</h2>
        <Link to="/community/spotlights" className="btn" style={{ padding: "4px 10px" }}>
          Give Suggestions
        </Link>
      </div>

      <div className="dashboard-card">
        <div style={gridCols}>
          {loading &&
            [...Array(4)].map((_, i) => <CardSkeleton key={`s-${i}`} />)}

          {!loading && rows.length === 0 && (
            <div className="muted" style={{ padding: 12 }}>
              Coming soon… (no spotlights yet)
            </div>
          )}

          {!loading &&
            rows.map((r) => (
              <article key={r.id} className="card" style={{ padding: 12 }}>
                <div
                  style={{
                    height: 160,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#f6f1fa",
                  }}
                >
                  {r.img || r.coverUrl ? (
                    <img
                      src={r.img || r.coverUrl}
                      alt={r.title || "Top pick"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        color: "#9a8fb9",
                      }}
                    >
                      No image
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 8, fontWeight: 700 }}>
                  {r.title || "Untitled"}
                </div>
                {!!r.subtitle && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {r.subtitle}
                  </div>
                )}
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}

