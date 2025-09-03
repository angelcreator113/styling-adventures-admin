import React, { useEffect, useState } from "react";
import { db } from "@/utils/init-firebase";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ThemeAnalyticsDashboard() {
  const [events, setEvents] = useState([]);
  const [byTheme, setByTheme] = useState({});
  const [dailyCounts, setDailyCounts] = useState([]);
  const [filters, setFilters] = useState({
    theme: "",
    role: "",
    startDate: "",
    endDate: "",
  });
  const [votedToday, setVotedToday] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);

  const getAnonId = () => {
    let id = localStorage.getItem("anonId");
    if (!id) {
      const rnd =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      id = rnd;
      localStorage.setItem("anonId", id);
    }
    return id;
  };

  const votesCol = collection(db, "analytics", "themeVotes", "events");
  const clicksCol = collection(db, "analytics", "themeVotes", "clicks");

  const logThemeVote = async (themeName) => {
    const anonId = getAnonId();
    const today = new Date().toISOString().split("T")[0];

    const qAlready = query(
      votesCol,
      where("anonId", "==", anonId),
      where("date", "==", today),
      where("themeName", "==", themeName)
    );

    const snapshot = await getDocs(qAlready);
    if (!snapshot.empty) {
      toast.error("You already voted for this theme today!");
      return;
    }

    await addDoc(votesCol, {
      anonId,
      themeName,
      date: today,
      timestamp: new Date().toISOString(),
      role: localStorage.getItem("role") || "unknown",
    });

    toast.success("Thanks bestie 💅 Your vote was recorded!");
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

    loadVotes();
  };

  const handleThemeClick = async (theme) => {
    const anonId = getAnonId();
    await addDoc(clicksCol, {
      themeName: theme,
      anonId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  };

  const loadVotes = async () => {
    try {
      const qAll = query(votesCol, orderBy("timestamp"));
      const snap = await getDocs(qAll);
      const raw = snap.docs.map((doc) => doc.data());
      setEvents(raw);

      const anonId = getAnonId();
      const today = new Date().toISOString().split("T")[0];
      const votedThemesToday = raw
        .filter((e) => e.anonId === anonId && e.date === today)
        .map((e) => e.themeName);
      setVotedToday(votedThemesToday);

      const grouped = {};
      const dateMap = {};

      const filtered = raw.filter((e) => {
        const matchesTheme = filters.theme
          ? e.themeName?.toLowerCase().includes(filters.theme.toLowerCase())
          : true;
        const matchesRole = filters.role ? e.role === filters.role : true;
        const matchesStart = filters.startDate ? e.date >= filters.startDate : true;
        const matchesEnd = filters.endDate ? e.date <= filters.endDate : true;
        return matchesTheme && matchesRole && matchesStart && matchesEnd;
      });

      filtered.forEach((e) => {
        const date = e.date;
        const theme = e.themeName || "unknown";

        if (!grouped[theme]) grouped[theme] = 0;
        grouped[theme]++;

        if (!dateMap[date]) dateMap[date] = {};
        if (!dateMap[date][theme]) dateMap[date][theme] = 0;
        dateMap[date][theme]++;
      });

      setByTheme(grouped);
      setTotalVotes(filtered.length);

      const daily = Object.entries(dateMap)
        .map(([date, themes]) => ({ date, ...themes }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyCounts(daily);
    } catch (err) {
      console.warn("[analytics] loadVotes failed", err);
    }
  };

  useEffect(() => {
    loadVotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const themeKeys = Object.keys(byTheme);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>📊 Theme Vote Analytics</h2>

      <div style={{ display: "flex", gap: 12, margin: "24px 0", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Filter by Theme"
          value={filters.theme}
          onChange={(e) => setFilters({ ...filters, theme: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by Role"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        />
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {Object.entries(byTheme).map(([theme, count]) => (
          <div
            key={theme}
            onClick={() => handleThemeClick(theme)}
            style={{
              background: "#2b2630",
              padding: 16,
              borderRadius: 12,
              color: "#fff",
              minWidth: 160,
              cursor: "pointer",
            }}
          >
            <h4 style={{ margin: 0 }}>{theme}</h4>
            <p style={{ fontSize: 18, margin: "4px 0" }}>
              {count} votes <span style={{ opacity: 0.7, fontSize: 14 }}>({totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0}%)</span>
            </p>
            <button
              className="vote-button"
              onClick={(e) => {
                e.stopPropagation();
                logThemeVote(theme);
              }}
              disabled={votedToday.includes(theme)}
              style={{
                opacity: votedToday.includes(theme) ? 0.5 : 1,
                cursor: votedToday.includes(theme) ? "not-allowed" : "pointer",
              }}
            >
              {votedToday.includes(theme) ? "Voted Today" : "Vote"}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 8 }}>🗓️ Votes Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyCounts} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" stroke="#ccc" />
            <YAxis stroke="#ccc" allowDecimals={false} />
            <Tooltip />
            <Legend />
            {themeKeys.map((theme, i) => (
              <Line
                key={theme}
                type="monotone"
                dataKey={theme}
                stroke={`hsl(${(i * 60) % 360}, 70%, 60%)`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}