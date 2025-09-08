// src/pages/admin/themes/analytics/ThemeAnalytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/utils/init-firebase";
import "chartjs-adapter-date-fns";

import Hint from "@/components/ui/Hint.jsx";

/* -------------------- dynamic chart loader -------------------- */
function useChartModules() {
  const [mods, setMods] = useState({ ready: false, Line: null, err: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const chart = await import("chart.js");
        const {
          Chart: ChartJS,
          LineElement,
          PointElement,
          TimeScale,
          LinearScale,
          Tooltip,
          Legend,
          Filler,
          CategoryScale,
          Decimation,
        } = chart;

        ChartJS.register(
          LineElement,
          PointElement,
          TimeScale,
          LinearScale,
          Tooltip,
          Legend,
          Filler,
          CategoryScale,
          Decimation
        );

        const { Line } = await import("react-chartjs-2");
        if (!cancelled) setMods({ ready: true, Line, err: null });
      } catch (e) {
        if (!cancelled) setMods({ ready: false, Line: null, err: e });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return mods;
}

/* -------------------- utils -------------------- */
const toMillis = (ts) =>
  (ts?.toMillis?.() ? ts.toMillis() : null) ??
  (typeof ts?.seconds === "number" ? ts.seconds * 1000 : null) ??
  (typeof ts === "number" ? ts : null);

const colorsForKey = (key) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const h = hash % 360;
  return { stroke: `hsl(${h} 70% 55%)`, fill: `hsl(${h} 70% 55% / .14)` };
};

/* -------------------- component -------------------- */
export default function ThemeAnalytics() {
  const [rawVotesCG, setRawVotesCG] = useState([]);
  const [rawVotesTop, setRawVotesTop] = useState([]);
  const [themesMap, setThemesMap] = useState({}); // id -> name
  const { ready, Line, err } = useChartModules();

  // Live themes -> name map
  useEffect(() => {
    return onSnapshot(collection(db, "themes"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data()?.name || d.id));
      setThemesMap(map);
    });
  }, []);

  // Live votes from collectionGroup('votes')
  useEffect(() => {
    return onSnapshot(collectionGroup(db, "votes"), (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() || {};
        const ms = toMillis(data.timestamp || data.createdAt || data.votedAt);
        const parentThemeId = d.ref.parent?.parent?.id; // themes/{id}/votes/{doc}
        const fallbackId = data.themeId || data.theme || parentThemeId || "unknown";
        return { themeId: fallbackId, themeName: data.themeName || null, ms };
      });
      setRawVotesCG(rows);
    });
  }, []);

  // Live votes from top-level "theme-votes"
  useEffect(() => {
    const qy = query(collection(db, "theme-votes"), orderBy("timestamp", "asc"));
    const off = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            themeId: data.themeId || data.theme || "unknown",
            themeName: data.themeName || null,
            ms: toMillis(data.timestamp || data.createdAt || data.votedAt),
          };
        });
        setRawVotesTop(rows);
      },
      () => setRawVotesTop([])
    );
    return off;
  }, []);

  // Aggregate daily counts per theme
  const chartData = useMemo(() => {
    const rows = [...rawVotesCG, ...rawVotesTop].filter((r) => r.ms);
    if (!rows.length) return null;

    const labelFor = (r) =>
      (r.themeName && String(r.themeName).trim()) ||
      themesMap[r.themeId] ||
      (r.themeId ? String(r.themeId) : "Unknown");

    const byDate = new Map(); // date -> Map(themeLabel -> count)
    rows
      .sort((a, b) => a.ms - b.ms)
      .forEach((r) => {
        const d = new Date(r.ms);
        const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
        const label = labelFor(r);
        if (!byDate.has(dayKey)) byDate.set(dayKey, new Map());
        const inner = byDate.get(dayKey);
        inner.set(label, (inner.get(label) || 0) + 1);
      });

    const dates = Array.from(byDate.keys()).sort();
    const allThemes = new Set();
    byDate.forEach((m) => m.forEach((_, theme) => allThemes.add(theme)));

    const datasets = Array.from(allThemes).map((theme) => {
      const { stroke, fill } = colorsForKey(theme);
      return {
        label: theme,
        data: dates.map((d) => byDate.get(d)?.get(theme) || 0),
        borderColor: stroke,
        backgroundColor: fill,
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        fill: true,
      };
    });

    return { labels: dates, datasets };
  }, [rawVotesCG, rawVotesTop, themesMap]);

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card">
        <h1 style={{ margin: 0 }}>📈 Theme Analytics</h1>

        {!ready && (
          <Hint k="chartjs-loading" style={{ marginTop: 8 }}>
            Loading chart libraries… If this is the first run, install:
            <code style={{ marginLeft: 6 }}>npm i react-chartjs-2 chart.js chartjs-adapter-date-fns date-fns</code>
            {err && <div style={{ color: "#c00", marginTop: 6 }}>Load error: {String(err.message || err)}</div>}
          </Hint>
        )}

        {ready && (
          <>
            <Hint k="chartjs-time-tip" style={{ marginTop: 8 }}>
              <strong>Tip:</strong> Ensure timestamps are in <code>milliseconds</code> (<code>toMillis()</code> or
              <code>seconds * 1000</code>). You can tweak <code>spanGaps</code> and <code>ticks.precision</code> for cleaner scales.
            </Hint>
            <Hint k="chartjs-perf-tip" style={{ marginTop: 8 }}>
              Big datasets? The <code>Decimation</code> plugin is registered — set
              <code> plugins.decimation = &#123; enabled: true, algorithm: 'lttb' &#125;</code>.
            </Hint>
          </>
        )}

        {ready && chartData?.labels?.length ? (
          <div style={{ height: 380, marginTop: 12 }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                spanGaps: true,
                scales: {
                  x: { type: "time", time: { unit: "day" }, title: { display: true, text: "Date" } },
                  y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: "Votes" } },
                },
                plugins: {
                  legend: { position: "top" },
                  tooltip: { mode: "index", intersect: false },
                  decimation: { enabled: true, algorithm: "lttb" },
                },
                interaction: { mode: "index", intersect: false },
                elements: { point: { hitRadius: 6 } },
              }}
            />
          </div>
        ) : (
          <p style={{ marginTop: 24 }}>
            {ready ? "No vote data yet." : "Charts will render once the libraries finish loading…"}
          </p>
        )}
      </div>
    </section>
  );
}



