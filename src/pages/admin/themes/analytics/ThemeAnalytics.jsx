// src/pages/admin/themes/analytics/ThemeAnalytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/utils/init-firebase";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
  Decimation,
} from "chart.js";
import "chartjs-adapter-date-fns";

import Hint from "@/components/ui/Hint.jsx";

// ✅ missing comma added before Decimation
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

const toMillis = (ts) =>
  ts?.toMillis?.() ??
  (typeof ts?.seconds === "number" ? ts.seconds * 1000 : null) ??
  (typeof ts === "number" ? ts : null);

// deterministic pastel; returns stroke + fill
const colorsForKey = (key) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const h = hash % 360;
  const stroke = `hsl(${h} 70% 55%)`;
  const fill = `hsl(${h} 70% 55% / .14)`;
  return { stroke, fill };
};

export default function ThemeAnalytics() {
  const [rawVotesCG, setRawVotesCG] = useState([]);
  const [rawVotesTop, setRawVotesTop] = useState([]);
  const [themesMap, setThemesMap] = useState({});

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
        const parent = d.ref.parent?.parent; // e.g. themeIcons/{themeId}
        const fallbackId = parent?.id || data.themeId || data.theme;
        return {
          themeId: data.themeId || fallbackId,
          themeName: data.themeName || fallbackId,
          ms,
        };
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
            themeId: data.themeId || data.theme,
            themeName: data.themeName || data.theme,
            ms: toMillis(data.timestamp || data.createdAt || data.votedAt),
          };
        });
        setRawVotesTop(rows);
      },
      () => setRawVotesTop([])
    );
    return off;
  }, []);

  // Aggregate daily counts
  const chartData = useMemo(() => {
    const rows = [...rawVotesCG, ...rawVotesTop].filter((r) => r.ms);
    if (!rows.length) return null;

    const labelFor = (r) =>
      (r.themeName && String(r.themeName).trim()) ||
      themesMap[r.themeId] ||
      (r.themeId ? String(r.themeId) : "Unknown");

    const byDate = new Map();
    rows.sort((a, b) => a.ms - b.ms).forEach((r) => {
      const d = new Date(r.ms);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = labelFor(r);
      if (!byDate.has(key)) byDate.set(key, new Map());
      const inner = byDate.get(key);
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

        <Hint k="chartjs-time-tip" style={{ marginTop: 8 }}>
          <strong>Tip:</strong> If the chart looks empty or bunched up, make sure you’ve installed
          <code> chartjs-adapter-date-fns</code> and that your timestamps are in
          <code> milliseconds</code> (use <code>ts.toMillis()</code> or <code>seconds * 1000</code>).
          You can also set <code>spanGaps: true</code> and <code>ticks.precision: 0</code> for nicer scales.
        </Hint>

        <Hint k="chartjs-perf-tip" style={{ marginTop: 8 }}>
          Big datasets? Register the <code>Decimation</code> plugin and set{" "}
          <code>plugins.decimation: &#123; enabled: true, algorithm: 'lttb' &#125;</code> for faster rendering.
        </Hint>

        {chartData?.labels?.length ? (
          <div style={{ height: 380, marginTop: 12 }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                spanGaps: true,
                scales: {
                  x: {
                    type: "time",
                    time: { unit: "day" },
                    title: { display: true, text: "Date" },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    title: { display: true, text: "Votes" },
                  },
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
          <p style={{ marginTop: 24 }}>No vote data yet.</p>
        )}
      </div>
    </section>
  );
}


