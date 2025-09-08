// src/pages/admin/manage/ThemesAdmin.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { db } from "@/utils/init-firebase";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { BUILTIN_THEMES } from "@/utils/theme-service";

/* ---------------- Canvas helpers ---------------- */
function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
function deg2rad(d) {
  return (d * Math.PI) / 180;
}
function paintPaper(ctx, W, H, theme) {
  const r = clamp(theme.radius ?? 20, 0, 120);
  const sh = clamp(theme.shadow ?? 10, 0, 60);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.10)";
  ctx.shadowBlur = sh;
  ctx.shadowOffsetY = Math.max(2, Math.round(sh / 3));

  // rounded “card”
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(W - r, 0);
  ctx.quadraticCurveTo(W, 0, W, r);
  ctx.lineTo(W, H - r);
  ctx.quadraticCurveTo(W, H, W - r, H);
  ctx.lineTo(r, H);
  ctx.quadraticCurveTo(0, H, 0, H - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.clip();

  if (theme.type === "solid") {
    ctx.fillStyle = theme.colors?.[0] || "#ffffff";
    ctx.fillRect(0, 0, W, H);
  } else {
    const ang = deg2rad(clamp(theme.angle ?? 90, 0, 360));
    const cx = W / 2;
    const cy = H / 2;
    const rx = Math.cos(ang);
    const ry = Math.sin(ang);
    const L = Math.max(W, H) * 0.75;
    const g = ctx.createLinearGradient(
      cx - rx * L,
      cy - ry * L,
      cx + rx * L,
      cy + ry * L
    );
    const cols =
      Array.isArray(theme.colors) && theme.colors.length
        ? theme.colors
        : ["#fafafa", "#f1f1f1"];
    if (cols.length === 1) {
      g.addColorStop(0, cols[0]);
      g.addColorStop(1, cols[0]);
    } else {
      cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}
function drawSample(ctx, W, H, img) {
  const pad = 0.12;
  const maxW = W * (1 - pad * 2);
  const maxH = H * (1 - pad * 2);
  const s = Math.min(maxW / img.width, maxH / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dx, dy, dw, dh);
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, Number(n)));
}
function slugifyLabel(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------------- Component ---------------- */
export default function ThemesAdmin() {
  const [themes, setThemes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    label: "",
    type: "gradient",
    colors: ["#f4ecff", "#eadfff"],
    angle: 90,
    radius: 20,
    shadow: 12,
    marginPct: 0.1,
    biasY: 0.03,
    visibility: "public",
  });
  const [sample, setSample] = useState(null);
  const canvasRef = useRef(null);

  // Live list (top-level /themes)
  useEffect(() => {
    const qy = query(collection(db, "themes"), orderBy("label", "asc"));
    const off = onSnapshot(qy, (snap) => {
      setThemes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return off;
  }, []);

  // Paint preview
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    paintPaper(ctx, c.width, c.height, form);
    if (sample) drawSample(ctx, c.width, c.height, sample);
    else {
      ctx.save();
      ctx.translate(c.width / 2, c.height / 2);
      ctx.fillStyle = "#eee";
      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 18;
      ctx.strokeStyle = "#d7d7d7";
      ctx.stroke();
      ctx.restore();
    }
  }, [form, sample]);

  const selectTheme = useCallback((t) => {
    setEditing(t?.id || null);
    setForm({
      label: t?.label || t?.name || "",
      type: t?.type || "gradient",
      colors:
        Array.isArray(t?.colors) && t.colors.length
          ? t.colors
          : ["#f4ecff", "#eadfff"],
      angle: Number.isFinite(t?.angle) ? t.angle : 90,
      radius: Number.isFinite(t?.radius) ? t.radius : 20,
      shadow: Number.isFinite(t?.shadow) ? t.shadow : 12,
      marginPct: Number.isFinite(t?.marginPct) ? t.marginPct : 0.1,
      biasY: Number.isFinite(t?.biasY) ? t.biasY : 0.03,
      visibility: t?.visibility === "private" ? "private" : "public",
      backgroundUrl: t?.backgroundUrl || t?.bgUrl || "",
      iconUrl: t?.iconUrl || "",
    });
  }, []);

  const saveTheme = useCallback(async () => {
    const label = (form.label || "").trim();
    if (!label) {
      alert("Label is required");
      return;
    }
    const id = slugifyLabel(label) || "theme";
    const payload = {
      ...form,
      label,
      type: form.type === "solid" ? "solid" : "gradient",
      angle: clamp(form.angle, 0, 360),
      radius: clamp(form.radius, 0, 120),
      shadow: clamp(form.shadow, 0, 60),
      marginPct: clamp(form.marginPct, 0, 0.5),
      biasY: clamp(form.biasY, -0.5, 0.5),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "themes", id), payload, { merge: true });
    setEditing(id);
  }, [form]);

  const newTheme = useCallback(() => {
    setEditing(null);
    setForm({
      label: "New Theme",
      type: "gradient",
      colors: ["#ffffff", "#f3f3f3"],
      angle: 90,
      radius: 20,
      shadow: 10,
      marginPct: 0.1,
      biasY: 0.0,
      visibility: "public",
    });
  }, []);

  const removeTheme = useCallback(
    async (id) => {
      if (!id) return;
      if (!confirm("Delete this theme?")) return;
      await deleteDoc(doc(db, "themes", id));
      if (editing === id) setEditing(null);
    },
    [editing]
  );

  const seedDefaults = useCallback(async () => {
    const existing = new Set(
      (await getDocs(collection(db, "themes"))).docs.map((d) => d.id)
    );
    const entries = Object.entries(BUILTIN_THEMES || {});
    for (const [id, data] of entries) {
      if (!existing.has(id)) {
        await setDoc(
          doc(db, "themes", id),
          { ...data, seeded: true, createdAt: serverTimestamp() },
          { merge: true }
        );
      }
    }
    alert("Seeded defaults (if missing).");
  }, []);

  const onPickSample = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // createImageBitmap is fast; provide a fallback just in case
    try {
      const bmp = await createImageBitmap(f);
      setSample(bmp);
    } catch {
      const img = new Image();
      img.onload = () => setSample(img);
      img.src = URL.createObjectURL(f);
    }
  }, []);

  const colorInputs = useMemo(
    () =>
      (form.colors || []).map((c, i) => (
        <div
          key={i}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            aria-label={`Color ${i + 1}`}
            type="color"
            value={c}
            onChange={(e) => {
              const next = [...form.colors];
              next[i] = e.target.value;
              setForm({ ...form, colors: next });
            }}
          />
          <input
            aria-label={`Hex ${i + 1}`}
            value={c}
            onChange={(e) => {
              const next = [...form.colors];
              next[i] = e.target.value;
              setForm({ ...form, colors: next });
            }}
          />
          <button
            type="button"
            onClick={() => {
              const next = [...form.colors];
              next.splice(i, 1);
              setForm({ ...form, colors: next });
            }}
          >
            Remove
          </button>
        </div>
      )),
    [form.colors]
  );

  return (
    <div className="page pad">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Manage Themes</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={newTheme}>New</button>
          <button onClick={seedDefaults}>Seed defaults</button>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* List */}
        <aside
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            background: "#fff",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            {themes.map((t) => (
              <button
                key={t.id}
                className="chip"
                onClick={() => selectTheme(t)}
                style={{
                  textAlign: "left",
                  border: "1px solid #e5e7eb",
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: editing === t.id ? "#f8faff" : "#fff",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {t.label || t.name || t.id}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {t.type}{" "}
                  {Array.isArray(t.colors)
                    ? `(${t.colors.length} colors)`
                    : ""}
                </div>
              </button>
            ))}
            {!themes.length && (
              <div className="muted">No themes yet. Click “Seed defaults”.</div>
            )}
          </div>
        </aside>

        {/* Editor + Preview */}
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(320px, 420px) 1fr",
            gap: 20,
          }}
        >
          {/* Editor */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
              display: "grid",
              gap: 10,
            }}
          >
            <label>
              Label
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </label>

            <label>
              Type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="gradient">gradient</option>
                <option value="solid">solid</option>
              </select>
            </label>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>Colors</strong>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      colors: [...(form.colors || []), "#ffffff"],
                    })
                  }
                >
                  Add color
                </button>
              </div>
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                {colorInputs}
              </div>
            </div>

            {form.type === "gradient" && (
              <label>
                Angle
                <input
                  type="number"
                  value={form.angle}
                  onChange={(e) =>
                    setForm({ ...form, angle: Number(e.target.value) })
                  }
                />
              </label>
            )}

            <label>
              Corner radius
              <input
                type="number"
                value={form.radius}
                onChange={(e) =>
                  setForm({ ...form, radius: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Shadow blur
              <input
                type="number"
                value={form.shadow}
                onChange={(e) =>
                  setForm({ ...form, shadow: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Margin %
              <input
                type="number"
                step="0.01"
                value={form.marginPct}
                onChange={(e) =>
                  setForm({ ...form, marginPct: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Bias Y
              <input
                type="number"
                step="0.01"
                value={form.biasY}
                onChange={(e) =>
                  setForm({ ...form, biasY: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Visibility
              <select
                value={form.visibility}
                onChange={(e) =>
                  setForm({ ...form, visibility: e.target.value })
                }
              >
                <option value="public">public</option>
                <option value="private">private</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveTheme}>Save</button>
              {editing && (
                <button className="danger" onClick={() => removeTheme(editing)}>
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <strong>Preview</strong>
              <input type="file" accept="image/*" onChange={onPickSample} />
            </div>
            <canvas
              ref={canvasRef}
              width={540}
              height={540}
              style={{
                width: "100%",
                maxWidth: 540,
                display: "block",
                borderRadius: 12,
              }}
            />
          </div>
        </main>
      </section>

      <style>{`
        .page.pad { padding: 16px; }
        input, select, button { font: inherit; padding: 6px 8px; border-radius: 8px; border: 1px solid #e5e7eb; }
        button { background:#fff; cursor:pointer; }
        button:hover { background:#f9fafb; }
        button.danger { color:#b91c1c; border-color:#fca5a5; background:#fff5f5; }
        label { display:grid; gap:6px; margin-bottom:6px; font-size: 14px; }
        .muted { color:#6b7280; }
      `}</style>
    </div>
  );
}
