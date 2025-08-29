// src/pages/home/FanHome.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "@/css/pages/home.css";
import { auth, db } from "@/utils/init-firebase";
import JustInCarousel from "@/features/closet/JustInCarousel.jsx";
import { useUserRole } from "@/hooks/RoleGates.jsx";
import { useCreatorRibbon } from "@/hooks/useCreatorRibbon.js"; // central A/B + frequency logic
import CreatorRibbon from "./components/CreatorRibbon.jsx";    // presentational ribbon
import DebugPanel from "./components/DebugPanel.jsx";          // admin/debug tools
import {
  collection, doc, query, orderBy, limit,
  onSnapshot, getDocs
} from "firebase/firestore";

const TOP_PICKS_PATH  = "public/top_picks";
const SPOTLIGHTS_PATH = "public/spotlights";
const THREADS_PATH    = "public/threads";
const THREAD_SORT     = "updatedAt";

const fmtCount = (n = 0) => (n > 999 ? `${(n / 1000).toFixed(1)}k` : n);
const tiny     = (s = "") => (s.length > 72 ? s.slice(0, 69) + "…" : s);
const seed     = (s = "") => Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0));
const colorFromName = (n = "") => `hsl(${seed(n) % 360} 62% 80%)`;
const greeting = (first = "Bestie") => `Hi ${first}!`;

export default function FanHome() {
  const nav  = useNavigate();
  const user = auth.currentUser;
  const { effectiveRole } = useUserRole();

  const [closet, setCloset]       = useState({ total: 0, categories: 0, recent: 0, last3: [] });
  const [topPicks, setTopPicks]   = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [threads, setThreads]     = useState([]);

  const picksRef = useRef(null);

  // our custom hook gives us: showRibbon, ribbonCfg, variant, analytics handlers, reset fn
  const {
    ribbonCfg,
    showRibbon,
    variant,
    onRibbonClick,
    onDismissRibbon,
    showDebug,
    onSelfReset
  } = useCreatorRibbon({ db, user, effectiveRole, closet });

  /* ---- live closet ---- */
  useEffect(() => {
    if (!user) return;
    const qy = query(collection(db, `users/${user.uid}/closet`), orderBy("uploadedAt", "desc"));
    const off = onSnapshot(qy, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const byCat = new Set();
      let recent  = 0;
      const now   = Date.now();
      const last7 = 7 * 24 * 60 * 60 * 1000;
      docs.forEach((d) => {
        if (d.category) byCat.add((d.category || "").toLowerCase());
        const ts = d.uploadedAt?.toMillis?.() ?? (d.uploadedAt?.seconds ? d.uploadedAt.seconds * 1000 : 0);
        if (ts && now - ts < last7) recent++;
      });
      setCloset({ total: docs.length, categories: byCat.size, recent, last3: docs.slice(0, 3) });
    });
    return off;
  }, [user?.uid]);

  /* ---- public content ---- */
  useEffect(() => { (async () => {
    try {
      const q1 = query(collection(db, TOP_PICKS_PATH), orderBy("rank", "asc"), limit(12));
      const s1 = await getDocs(q1);
      setTopPicks(s1.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setTopPicks([]); }
  })(); }, []);

  useEffect(() => { (async () => {
    try {
      const q2 = query(collection(db, SPOTLIGHTS_PATH), orderBy("featuredAt", "desc"), limit(1));
      const s2 = await getDocs(q2);
      setSpotlight(s2.docs[0]?.data() || null);
    } catch { setSpotlight(null); }
  })(); }, []);

  useEffect(() => { (async () => {
    try {
      const q3 = query(collection(db, THREADS_PATH), orderBy(THREAD_SORT, "desc"), limit(3));
      const s3 = await getDocs(q3);
      setThreads(s3.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setThreads([]); }
  })(); }, []);

  const name = user?.displayName?.split(" ")[0] || "Bestie";

  return (
    <section className="container page page--fan-home" style={{ padding: 16 }}>
      {/* ================================ HERO =============================== */}
      <div className="home-hero dashboard-card">
        <div className="hero-copy">
          <h1 className="hero-title">Bestie, welcome to your style adventure!</h1>
          <p className="hero-sub">
            {greeting(name)} I’m Lala — let’s upload your fav pieces, browse Top Picks,
            and build looks that feel like <em>you</em>.
          </p>
          <div className="hero-actions">
            <Link to="/closet" className="btn primary">Start Your Closet</Link>
            <Link to="/vip" className="btn ghost">Enter the Bestie Lounge</Link>
          </div>
        </div>

        <div className="hero-side">
          <div className="stat-row">
            <div className="stat-pill"><div className="num">{fmtCount(closet.total)}</div><div className="lbl">Total Pieces</div></div>
            <div className="stat-pill"><div className="num">{fmtCount(closet.categories)}</div><div className="lbl">Categories</div></div>
            <div className="stat-pill"><div className="num">{fmtCount(closet.recent)}</div><div className="lbl">Recent Uploads</div></div>
          </div>
        </div>
      </div>

      {/* ============================== TOP PICKS ============================ */}
      <section className="section">
        <header className="section__hd">
          <h2 className="section__title">Lala’s Weekly Top Picks</h2>
          <div className="section__actions"><Link to="/community/forum" className="btn sm">Give Suggestions</Link></div>
        </header>
        <div className="carousel" ref={picksRef}>
          {(topPicks.length ? topPicks : Array.from({ length: 6 })).map((it, i) => (
            <article key={it?.id || `sk-${i}`} className="card">
              <div className="card__thumb">{it?.imageUrl ? <img src={it.imageUrl} alt={it.title || ""} /> : <div className="skel" />}</div>
              <div className="card__body">
                <div className="card__title">{it?.title || "Coming soon…"}</div>
                {it?.note && <div className="muted">{tiny(it.note)}</div>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===================== START YOUR CLOSET + JUST IN =================== */}
      <section className="section">
        <header className="section__hd"><h2 className="section__title">Your Closet, Your Vibe</h2></header>
        <div className="cta-grid">
          <div className="cta-card">
            <p>Upload what you own, tag by category, and watch your wardrobe get organized &amp; gorgeous.</p>
            <div className="row" style={{ gap: 8 }}>
              <Link to="/closet" className="btn primary">Get Started</Link>
              <Link to="/community/top-picks" className="btn ghost">Peek at Top Picks</Link>
            </div>
          </div>
          <div className="mini-feed"><h3 className="mini-feed__title">Just In</h3><JustInCarousel limit={12} /></div>
        </div>
      </section>

      {/* ============================= BESTIE LOUNGE ========================= */}
      <section className="section">
        <header className="section__hd"><h2 className="section__title">The Bestie Lounge</h2></header>
        <div className="lounge">
          <div><div className="badge">VIP</div>
            <p className="muted" style={{ marginTop: 6 }}>Behind-the-scenes Lala content, AI fantasy fits, badges & special styling events.</p>
          </div>
          <Link to="/vip" className="btn primary">Enter the Bestie Lounge</Link>
        </div>
      </section>

      {/* =============================== BESTIE CHAT ========================= */}
      <section className="section">
        <header className="section__hd"><h2 className="section__title">Bestie Chat</h2><div className="section__actions"><Link to="/community/forum" className="btn sm">Browse More Topics</Link></div></header>
        <div className="chat-peek">
          <div className="chat-head">
            <div className="chat-tabs"><span className="tab is-live">#style-help</span><span className="tab">#event-fits</span><span className="tab">#shoe-talk</span></div>
            <Link to="/community/forum" className="btn sm">Add Your Thoughts</Link>
          </div>
          <div className="chat-stream">
            {(threads.length ? threads : [{ id: "t1", title: "Thread loading…", replyCount: 0, author: "evoni" }]).slice(0, 3).map((t, i) => (
              <div className="msg" key={t.id || i}>
                <div className="avatar" style={{ background: colorFromName(t.author || `u${i}`) }} aria-hidden><span className="dot" /></div>
                <div>
                  <div className="meta">
                    <span className="handle">@{t.author || "bestie"}</span><span>in</span><strong>#style-help</strong>
                    <span className="reacts"><span className="react">❤️ {Math.max(0, (t.replyCount || 0) - 1)}</span><span className="react">💬 {t.replyCount || 0}</span></span>
                  </div>
                  <div className="bubble">{t.excerpt || `Y’all are serving LEWKS in here 😍 — “${t.title || "Thread loading…"}”`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ PLAN AN EVENT ========================== */}
      <section className="section">
        <header className="section__hd"><h2 className="section__title">Plan an Event Outfit</h2></header>
        <div className="planner-tease"><p>Tell me your event and the vibe — I’ll help you style it and add it to your calendar.</p><Link to="/planner" className="btn primary">Plan an Outfit</Link></div>
      </section>

      {/* ============================= FAN SPOTLIGHT ========================= */}
      <section className="section">
        <header className="section__hd"><h2 className="section__title">Fan Spotlight</h2><div className="section__actions"><Link to="/community/spotlights" className="btn sm">Submit Your Look</Link></div></header>
        <div className="spotlight">
          <article className="card wide">
            <div className="card__thumb">{spotlight?.imageUrl ? <img src={spotlight.imageUrl} alt={spotlight?.userName || ""} /> : <div className="skel" />}</div>
            <div className="card__body"><div className="card__title">{spotlight?.userName || "Your Name Here"}</div><p className="muted">{spotlight?.quote || "Share your fave fit for a chance to be featured next week!"}</p></div>
          </article>
        </div>
      </section>

      {/* ===================== CREATOR UPGRADE RIBBON ======================== */}
      {ribbonCfg.enabled && showRibbon && (
        <CreatorRibbon cfg={ribbonCfg} onClick={onRibbonClick} onDismiss={onDismissRibbon} />
      )}

      {/* ===================== ADMIN / DEBUG PANEL ========================== */}
      {showDebug && <DebugPanel role={effectiveRole} variant={variant} onReset={onSelfReset} />}
    </section>
  );
}
