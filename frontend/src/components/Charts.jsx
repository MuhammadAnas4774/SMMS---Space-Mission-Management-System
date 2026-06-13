import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

const CHART_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
  "#f472b6",
  "#38bdf8",
  "#4ade80",
  "#facc15",
];

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#94a3b8",
        font: { family: "Inter", size: 11 },
        padding: 14,
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: "rgba(10,14,26,0.92)",
      titleColor: "#e8ecf4",
      bodyColor: "#94a3b8",
      borderColor: "rgba(99,102,241,0.3)",
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12,
      titleFont: { family: "Inter", weight: "600" },
      bodyFont: { family: "Inter" },
    },
  },
};

/** Vertical bar chart for mission status (avoids doughnut canvas sizing glitches / stray arcs). */
export function MissionStatusChart({ missionStatus = [] }) {
  if (!missionStatus.length) return null;

  const data = {
    labels: missionStatus.map((r) => r.status || "Unknown"),
    datasets: [
      {
        label: "Missions",
        data: missionStatus.map((r) => r.count),
        backgroundColor: missionStatus.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + "cc"),
        borderColor: missionStatus.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="chart-host" style={{ height: 240 }}>
      <Bar
        data={data}
        options={{
          ...chartDefaults,
          plugins: {
            ...chartDefaults.plugins,
            legend: { display: false },
          },
          scales: {
            x: {
              grid: { color: "rgba(148,163,184,0.06)" },
              ticks: {
                color: "#94a3b8",
                font: { family: "Inter", size: 10 },
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              grid: { color: "rgba(148,163,184,0.08)" },
              ticks: {
                color: "#64748b",
                font: { family: "JetBrains Mono", size: 10 },
                precision: 0,
              },
            },
          },
        }}
      />
    </div>
  );
}

/** Bar chart for table row counts */
export function EntityBarChart({ tableCounts = {} }) {
  const entries = Object.entries(tableCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12);

  if (!entries.length) return null;

  const data = {
    labels: entries.map(([t]) => t.replace(/_/g, " ")),
    datasets: [
      {
        label: "Records",
        data: entries.map(([, c]) => c),
        backgroundColor: entries.map(
          (_, i) => CHART_COLORS[i % CHART_COLORS.length] + "cc"
        ),
        borderColor: entries.map(
          (_, i) => CHART_COLORS[i % CHART_COLORS.length]
        ),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="chart-host" style={{ height: 260 }}>
      <Bar
        data={data}
        options={{
          ...chartDefaults,
          indexAxis: "y",
          scales: {
            x: {
              grid: { color: "rgba(148,163,184,0.06)" },
              ticks: {
                color: "#64748b",
                font: { family: "JetBrains Mono", size: 10 },
              },
            },
            y: {
              grid: { display: false },
              ticks: {
                color: "#94a3b8",
                font: { family: "JetBrains Mono", size: 10 },
              },
            },
          },
          plugins: {
            ...chartDefaults.plugins,
            legend: { display: false },
          },
        }}
      />
    </div>
  );
}

/** Line chart (faked trend from static data — decorative) */
export function TelemetryLineChart({ alertCount = 0, missionCount = 0 }) {
  // Generate decorative sparkline data from the counts
  const points = 12;
  const gen = (base) =>
    Array.from({ length: points }, (_, i) =>
      Math.max(0, base + Math.sin(i * 0.7) * base * 0.4 + (Math.random() - 0.5) * base * 0.3)
    );

  const data = {
    labels: Array.from({ length: points }, (_, i) => `T-${points - i}`),
    datasets: [
      {
        label: "Mission Activity",
        data: gen(missionCount || 3),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "Alert Volume",
        data: gen(alertCount || 2),
        borderColor: "#fb7185",
        backgroundColor: "rgba(251,113,133,0.06)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="chart-host" style={{ height: 200 }}>
      <Line
        data={data}
        options={{
          ...chartDefaults,
          scales: {
            x: {
              grid: { color: "rgba(148,163,184,0.05)" },
              ticks: {
                color: "#64748b",
                font: { family: "JetBrains Mono", size: 9 },
              },
            },
            y: {
              grid: { color: "rgba(148,163,184,0.06)" },
              ticks: {
                color: "#64748b",
                font: { family: "JetBrains Mono", size: 9 },
              },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}
