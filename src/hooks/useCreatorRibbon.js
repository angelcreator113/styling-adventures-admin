// src/hooks/useCreatorRibbon.js
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { useUserRole } from "@/hooks/RoleGates";
import { collection, doc, getDoc, addDoc, setDoc } from "firebase/firestore";

const RIBBON_DOC_PATH = "site_settings/creatorRibbon";
const USER_ENGAGE_DOC = (uid) => `users/${uid}/settings/engagement`;

const DEFAULT_CFG = {
  enabled: false,
  message: "",
  ctaLabel: "Upgrade to Creator",
  ctaHref: "/settings/upgrade",
  showEveryHours: 0,
  minClosetItems: 0,
  rolesAllowed: ["fan"],
  variant: "auto",
  startAt: null,
  endAt: null,
};

const DISMISS_HOURS = 6;
const dismissKey = (uid, v) => `creatorRibbon.dismissUntil.${v}.${uid || "anon"}`;

function nowWithin(s, e) {
  const now = Date.now();
  const S = Number(s || 0), E = Number(e || 0);
  if (S && now < S) return false;
  if (E && now > E) return false;
  return true;
}
function seed(s = "") { return Math.abs([...s].reduce((a,c)=>a+c.charCodeAt(0),0)); }
function stableChoiceFromUid(uid, choices) { return choices[seed(uid)%choices.length]; }
function stickyChoiceLS(key, choices) {
  try {
    const ex = localStorage.getItem(key);
    if (ex) return ex;
    const p = choices[Math.floor(Math.random()*choices.length)];
    localStorage.setItem(key, p);
    return p;
  } catch { return choices[0]; }
}
function canShowLocal(key, hrs) {
  if (!hrs || hrs <= 0) return true;
  const last = Number(localStorage.getItem(key) || 0);
  return Date.now() >= last + hrs * 60 * 60 * 1000;
}
function markLocal(key) { try { localStorage.setItem(key, String(Date.now())); } catch {} }
function clearLocalCapsFor(uid) {
  const base = "creatorRibbon.lastShown";
  try {
    localStorage.removeItem(`${base}.A.${uid || "anon"}`);
    localStorage.removeItem(`${base}.B.${uid || "anon"}`);
  } catch {}
}
async function readServerLastShown(uid, v) {
  try {
    const snap = await getDoc(doc(db, USER_ENGAGE_DOC(uid)));
    return Number((snap.exists() ? snap.data()?.lastRibbonShown?.[v] : 0) || 0);
  } catch { return 0; }
}
async function writeServerLastShown(uid, v) {
  try {
    await setDoc(doc(db, USER_ENGAGE_DOC(uid)), { lastRibbonShown: { [v]: Date.now() } }, { merge: true });
  } catch {}
}
export async function resetServerCaps(uid) {
  await setDoc(doc(db, USER_ENGAGE_DOC(uid)), { lastRibbonShown: { A:0, B:0 }, resetToken: Date.now() }, { merge:true });
}

export function useCreatorRibbon({ closet }) {
  const user = auth.currentUser;
  const { effectiveRole } = useUserRole();

  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [variant, setVariant] = useState("A");
  const [show, setShow] = useState(false);
  const [viewLogged, setViewLogged] = useState(false);

  // load config
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, RIBBON_DOC_PATH));
        if (snap.exists()) setCfg((p) => ({ ...DEFAULT_CFG, ...p, ...snap.data() }));
      } catch { setCfg(DEFAULT_CFG); }
    })();
  }, []);

  // choose variant
  useEffect(() => {
    const choices = ["A", "B"];
    setVariant(cfg.variant === "auto"
      ? (user?.uid ? stableChoiceFromUid(user.uid, choices) : stickyChoiceLS("creatorRibbon.variant", choices))
      : cfg.variant
    );
  }, [cfg.variant, user?.uid]);

  // honor admin token to clear local caps
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, USER_ENGAGE_DOC(user.uid)));
        if (!snap.exists()) return;
        const token = String(snap.data()?.resetToken || "");
        const k = `creatorRibbon.resetToken.${user.uid}`;
        const local = localStorage.getItem(k) || "";
        if (token && token !== local) {
          clearLocalCapsFor(user.uid);
          localStorage.setItem(k, token);
        }
      } catch {}
    })();
  }, [user?.uid]);

  // show logic with dismiss cap
  useEffect(() => {
    if (effectiveRole === "admin") return;
    if (!cfg?.enabled) return;
    if (!nowWithin(cfg.startAt, cfg.endAt)) return;

    const roles = cfg.rolesAllowed || ["fan"];
    if (roles.length && !roles.includes(effectiveRole)) return;
    if (cfg.minClosetItems && (closet?.total || 0) < cfg.minClosetItems) return;

    // frequency + dismiss checks
    const freqKey = `creatorRibbon.lastShown.${variant}.${user?.uid || "anon"}`;
    const localOk = canShowLocal(freqKey, cfg.showEveryHours);
    const dismissedUntil = Number(localStorage.getItem(dismissKey(user?.uid, variant)) || 0);
    if (dismissedUntil && Date.now() < dismissedUntil) return;

    (async () => {
      let serverOk = true;
      if (user?.uid && cfg.showEveryHours > 0) {
        const last = await readServerLastShown(user.uid, variant);
        if (last) {
          const allowAt = last + cfg.showEveryHours * 3600000;
          serverOk = Date.now() >= allowAt;
        }
      }
      if (!(localOk && serverOk)) return;

      const t = setTimeout(async () => {
        setShow(true);
        markLocal(freqKey);
        if (user?.uid) await writeServerLastShown(user.uid, variant);
        if (!viewLogged) {
          try {
            await addDoc(collection(db, "analytics/events"), {
              type: "creator_ribbon_view",
              ts: Date.now(),
              userId: user?.uid || null,
              role: effectiveRole,
              variant,
            });
            setViewLogged(true);
          } catch {}
        }
      }, 15000);
      return () => clearTimeout(t);
    })();
  }, [cfg, variant, user?.uid, effectiveRole, closet?.total, viewLogged]);

  const onRibbonClick = async (href) => {
    try {
      await addDoc(collection(db, "analytics/events"), {
        type: "creator_ribbon_click",
        ts: Date.now(),
        userId: auth.currentUser?.uid || null,
        role: effectiveRole,
        variant,
        extra: { href },
      });
    } catch {}
  };

  const onDismissRibbon = () => {
    setShow(false);
    const until = Date.now() + DISMISS_HOURS * 3600000;
    try { localStorage.setItem(dismissKey(user?.uid, variant), String(until)); } catch {}
  };

  const showDebug = effectiveRole === "admin" || new URLSearchParams(location.search).get("debug") === "1";
  const onSelfReset = async () => {
    if (!user?.uid) return;
    await resetServerCaps(user.uid);
    clearLocalCapsFor(user.uid);
    localStorage.setItem(`creatorRibbon.resetToken.${user.uid}`, String(Date.now()));
    setShow(false);
    setViewLogged(false);
  };

  return {
    ribbonCfg: cfg || DEFAULT_CFG,
    showRibbon: !!show,
    variant,
    onRibbonClick,
    onDismissRibbon,
    showDebug,
    onSelfReset,
  };
}
