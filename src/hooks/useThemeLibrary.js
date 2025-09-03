import { useCallback, useEffect, useState } from "react";
import { auth, db, storage } from "@/utils/init-firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,          // added
  getDocs,
  onSnapshot,
  runTransaction,  // added
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

/* ------------------------- constants ------------------------- */
// YouTube aspect + common sizes.
// We accept any 16:9 image >= 1280x720 (HD) with a small tolerance.
const YT_RATIO = 16 / 9;
const YT_MIN_W = 1280;
const YT_MIN_H = 720;
const RATIO_TOL = 0.03; // 3% tolerance

/* ------------------------- helpers ------------------------- */
const toTs = (val) => (val ? Timestamp.fromDate(new Date(val)) : null);
const humanUser = () => {
  const u = auth.currentUser;
  if (!u) return "system";
  return u.email || u.displayName || u.uid;
};
const slug = (s = "") =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

const nameFromFile = (file) =>
  file?.name ? slug(file.name.replace(/\.[^/.]+$/, "")).replace(/-/g, " ") : "Untitled";

/** Read image dimensions without uploading. */
async function readImageSize(file) {
  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = blobUrl;
    });
    return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/** Validate 16:9 and minimum size for YouTube-like backgrounds. */
async function validateYoutubeBackground(file) {
  const { width, height } = await readImageSize(file);
  const ratio = width / height;
  const ratioOk = Math.abs(ratio - YT_RATIO) <= RATIO_TOL;
  const sizeOk = width >= YT_MIN_W && height >= YT_MIN_H;
  const ok = ratioOk && sizeOk;
  return {
    ok,
    width,
    height,
    ratio,
    reason: ok
      ? ""
      : !ratioOk
      ? `Image must be ~16:9. Got ${width}×${height} (ratio ${ratio.toFixed(3)}).`
      : `Image must be at least ${YT_MIN_W}×${YT_MIN_H}. Got ${width}×${height}.`,
  };
}

export default function useThemeLibrary() {
  const [themes, setThemes] = useState([]);
  const [iconMap, setIconMap] = useState({});
  const [loading, setLoading] = useState(true);

  /* ----- live themes ----- */
  useEffect(() => {
    const off = onSnapshot(collection(db, "themes"), (snap) => {
      setThemes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return off;
  }, []);

  /* ----- live icon map ----- */
  useEffect(() => {
    const off = onSnapshot(collection(db, "themeIcons"), (snap) => {
      const m = {};
      snap.docs.forEach((d) => (m[d.id] = d.data()?.iconUrl || null));
      setIconMap(m);
    });
    return off;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const tSnap = await getDocs(collection(db, "themes"));
    setThemes(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    const iSnap = await getDocs(collection(db, "themeIcons"));
    const m = {};
    iSnap.docs.forEach((d) => (m[d.id] = d.data()?.iconUrl || null));
    setIconMap(m);
    setLoading(false);
  }, []);

  /* ----- audit helper ----- */
  const addAudit = useCallback(async (themeId, action, extra = {}) => {
    try {
      await addDoc(collection(db, `themes/${themeId}/audit`), {
        action,
        ...extra,
        actor: humanUser(),
        ts: serverTimestamp(),
      });
    } catch {
      // swallow — auditing must never break UX
    }
  }, []);

  /* ----- create one theme (manual) ----- */
  const createTheme = useCallback(
    async (payload = {}) => {
      const base = {
        name: (payload.name || "Untitled").trim(),
        description: payload.description || "",
        bgUrl: payload.bgUrl || "",
        visibility: payload.visibility || "public",
        tier: payload.tier || "all",
        abRollout: Number(payload.abRollout ?? 100),
        featuredOnLogin: !!payload.featuredOnLogin,
        releaseAt: toTs(payload.releaseAt),
        expiresAt: toTs(payload.expiresAt),
        deleteAt: toTs(payload.deleteAt),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: humanUser(),
      };
      const refDoc = await addDoc(collection(db, "themes"), base);
      await addAudit(refDoc.id, "created theme (manual)", { snapshot: { name: base.name } });
      return refDoc.id;
    },
    [addAudit]
  );

  /* ----- update theme ----- */
  const updateTheme = useCallback(
    async (id, patch = {}) => {
      const data = {
        ...patch,
        ...(patch.releaseAt !== undefined ? { releaseAt: toTs(patch.releaseAt) } : {}),
        ...(patch.expiresAt !== undefined ? { expiresAt: toTs(patch.expiresAt) } : {}),
        ...(patch.deleteAt !== undefined ? { deleteAt: toTs(patch.deleteAt) } : {}),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "themes", id), data, { merge: true });
      await addAudit(id, "updated theme", { fields: Object.keys(patch || {}) });
    },
    [addAudit]
  );

  /* ----- delete theme ----- */
  const deleteTheme = useCallback(
    async (id) => {
      await addAudit(id, "deleted theme");
      await deleteDoc(doc(db, "themes", id));
    },
    [addAudit]
  );

  /* ----- upload / replace background (VALIDATED - clears asset link) ----- */
  const uploadThemeBg = useCallback(
    async (id, file) => {
      // Validate 16:9 and size ≥ 1280×720
      const urlObj = URL.createObjectURL(file);
      try {
        const dims = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = reject;
          img.src = urlObj;
        });
        const ratio = dims.w / dims.h;
        const okRatio = Math.abs(ratio - 16 / 9) < 0.02; // ~2% tolerance
        const okMin = dims.w >= 1280 && dims.h >= 720;
        if (!okRatio || !okMin) {
          throw new Error(
            `Background must be 16:9 and at least 1280×720. Got ${dims.w}×${dims.h}.`
          );
        }
      } finally {
        URL.revokeObjectURL(urlObj);
      }

      const path = `themes/${id}/bg/${Date.now()}_${file.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      await setDoc(
        doc(db, "themes", id),
        { bgUrl: url, bgAssetId: null, updatedAt: serverTimestamp() }, // clear asset link on custom upload
        { merge: true }
      );
      await addAudit(id, "replaced background (upload)", { storagePath: path });
      return url;
    },
    [addAudit]
  );

  /* ----- bulk create drafts from files (VALIDATED) ----- */
  const bulkCreateDraftsFromFiles = useCallback(
    async (filesLike) => {
      const files = Array.from(filesLike || []).filter(Boolean);
      if (files.length === 0) return [];

      const outIds = [];
      const skipped = [];

      for (const f of files) {
        // Validate first — skip invalid files but continue others.
        const check = await validateYoutubeBackground(f);
        if (!check.ok) {
          skipped.push({ file: f.name, reason: check.reason });
          console.warn("[bulkCreateDraftsFromFiles] Skipped:", f.name, check.reason);
          continue;
        }

        // 1) create draft doc
        const draft = {
          name: nameFromFile(f),
          description: "",
          bgUrl: "",
          visibility: "private",
          tier: "all",
          abRollout: 100,
          featuredOnLogin: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: humanUser(),
        };
        const docRef = await addDoc(collection(db, "themes"), draft);

        // 2) upload bg (already validated)
        const path = `themes/${docRef.id}/bg/${Date.now()}_${f.name}`;
        const r = ref(storage, path);
        await uploadBytes(r, f);
        const url = await getDownloadURL(r);

        // 3) patch bgUrl + meta on the theme
        await setDoc(
          doc(db, "themes", docRef.id),
          {
            bgUrl: url,
            bgMeta: { width: check.width, height: check.height, ratio: check.ratio },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 4) audit
        await addAudit(docRef.id, "created draft from upload", {
          storagePath: path,
          filename: f.name,
          width: check.width,
          height: check.height,
          ratio: check.ratio,
        });

        outIds.push(docRef.id);
      }

      // If everything was skipped, throw a single helpful error.
      if (outIds.length === 0) {
        const msg =
          "No drafts created. All files were rejected.\n" +
          skipped.map((s) => `• ${s.file}: ${s.reason}`).join("\n");
        throw new Error(msg);
      }

      // Optional: surface which files were skipped (caller can toast/log)
      if (skipped.length) {
        console.info("Some files were skipped:", skipped);
      }

      return outIds;
    },
    [addAudit]
  );

  /**
   * ✅ Link a background asset to a theme (and maintain usedBy counts)
   * asset = { id, url, type? }
   * - Sets theme.bgUrl + theme.bgAssetId
   * - Decrements old asset.usedBy if previously linked
   * - Increments new asset.usedBy and stores map usedBy.themes[themeId] = true
   */
  const applyBackgroundAsset = useCallback(
    async (themeId, asset) => {
      if (!themeId || !asset?.id || !asset?.url) throw new Error("Bad asset linkage payload");
      const themeRef = doc(db, "themes", themeId);
      const newAssetRef = doc(db, "episodeBackgrounds", asset.id);

      await runTransaction(db, async (t) => {
        const themeSnap = await t.get(themeRef);
        if (!themeSnap.exists()) throw new Error("Theme not found");
        const prev = themeSnap.data() || {};
        const prevAssetId = prev.bgAssetId || null;

        // Ensure new asset exists
        const newAssetSnap = await t.get(newAssetRef);
        if (!newAssetSnap.exists()) throw new Error("Selected background asset not found");
        const newUsedBy = newAssetSnap.data()?.usedBy || {};
        const alreadyListed = !!(newUsedBy.themes && newUsedBy.themes[themeId]);

        // 1) Set theme to use new asset
        t.set(
          themeRef,
          {
            bgUrl: asset.url,
            bgAssetId: asset.id,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 2) Increment new asset usedBy if not already listed
        if (!alreadyListed) {
          t.set(
            newAssetRef,
            {
              usedBy: {
                count: (newAssetSnap.data()?.usedBy?.count || 0) + 1,
                themes: { ...(newUsedBy.themes || {}), [themeId]: true },
                lastUsedAt: serverTimestamp(),
              },
            },
            { merge: true }
          );
        } else {
          t.set(
            newAssetRef,
            { usedBy: { ...newUsedBy, lastUsedAt: serverTimestamp() } },
            { merge: true }
          );
        }

        // 3) Decrement old asset if different
        if (prevAssetId && prevAssetId !== asset.id) {
          const oldRef = doc(db, "episodeBackgrounds", prevAssetId);
          const oldSnap = await t.get(oldRef);
          if (oldSnap.exists()) {
            const o = oldSnap.data() || {};
            const hadTheme = !!(o.usedBy?.themes && o.usedBy.themes[themeId]);
            const oCount = Math.max(0, (o.usedBy?.count || 0) - (hadTheme ? 1 : 0));
            const themesMap = { ...(o.usedBy?.themes || {}) };
            delete themesMap[themeId];
            t.set(
              oldRef,
              { usedBy: { count: oCount, themes: themesMap, lastUsedAt: serverTimestamp() } },
              { merge: true }
            );
          }
        }
      });

      await addAudit(themeId, "applied episode background asset", { assetId: asset.id });
      return asset.url;
    },
    [addAudit]
  );

  return {
    loading,
    themes,
    iconMap,
    refresh,
    createTheme,
    updateTheme,
    deleteTheme,
    bulkCreateDraftsFromFiles,
    uploadThemeBg,
    applyBackgroundAsset, // exported
  };
}
