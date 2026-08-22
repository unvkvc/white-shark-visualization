import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SharkPosition } from "../types/SharkPosition";
import "./AnalysisPage.css";

interface AnalysisPageProps {
  positions: SharkPosition[];
}

interface DetectionDatum {
  shark: string;
  detections: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DetectionDatum;
    value: number;
  }>;
}

function DetectionTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const datum = payload[0].payload;

  return (
    <div className="analysis-tooltip">
      <strong>Shark {datum.shark}</strong>
      <span>{datum.detections.toLocaleString()} tracked positions</span>
    </div>
  );
}

function AnalysisPage({ positions }: AnalysisPageProps) {
  const navigate = useNavigate();

  const [selectedShark, setSelectedShark] = useState<string | null>(null);

  const detectionsPerShark = useMemo<DetectionDatum[]>(() => {
    const counts = new Map<string, number>();

    for (const position of positions) {
      counts.set(position.shark, (counts.get(position.shark) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([shark, detections]) => ({
        shark,
        detections,
      }))
      .sort((a, b) => b.detections - a.detections);
  }, [positions]);

  const sexDistribution = useMemo(() => {
    const sharks = new Map<string, SharkPosition>();

    for (const position of positions) {
      if (!sharks.has(position.shark)) {
        sharks.set(position.shark, position);
      }
    }

    const uniqueSharks = Array.from(sharks.values());

    return [
      {
        label: "Female",
        value: uniqueSharks.filter((shark) => shark.sex === "F").length,
        color: "#0e7490",
      },
      {
        label: "Male",
        value: uniqueSharks.filter((shark) => shark.sex === "M").length,
        color: "#38bdf8",
      },
      {
        label: "Unknown",
        value: uniqueSharks.filter(
          (shark) => shark.sex !== "F" && shark.sex !== "M",
        ).length,
        color: "#94a3b8",
      },
    ];
  }, [positions]);

  const monthlyDetections = useMemo(() => {
    const counts = new Map<string, number>();

    const sourcePositions = selectedShark
      ? positions.filter((position) => position.shark === selectedShark)
      : positions;

    for (const position of sourcePositions) {
      const date = new Date(position.DateTimeUTC);

      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([monthKey, detections]) => {
        const [year, month] = monthKey.split("-").map(Number);
        const date = new Date(year, month - 1, 1);

        return {
          monthKey,
          monthLabel: date.toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          }),
          timestamp: date.getTime(),
          detections,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [positions, selectedShark]);

  const chartSummary = useMemo(() => {
    if (detectionsPerShark.length === 0) {
      return {
        highest: null,
        lowest: null,
        median: 0,
      };
    }

    const values = detectionsPerShark
      .map((item) => item.detections)
      .sort((a, b) => a - b);

    const middle = Math.floor(values.length / 2);

    const median =
      values.length % 2 === 0
        ? (values[middle - 1] + values[middle]) / 2
        : values[middle];

    return {
      highest: detectionsPerShark[0],
      lowest: detectionsPerShark[detectionsPerShark.length - 1],
      median,
    };
  }, [detectionsPerShark]);

  const selectedSharkDetails = useMemo(() => {
    if (!selectedShark) {
      return null;
    }

    const sharkPositions = positions.filter(
      (position) => position.shark === selectedShark,
    );

    if (sharkPositions.length === 0) {
      return null;
    }

    const representativePosition = sharkPositions[0];

    const validDates = sharkPositions
      .map((position) => new Date(position.DateTimeUTC))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      id: selectedShark,
      positions: sharkPositions.length,
      sex:
        representativePosition.sex === "F"
          ? "Female"
          : representativePosition.sex === "M"
            ? "Male"
            : "Unknown",
      ageClass: representativePosition.ageclass || "Unknown",
      sizeClass: representativePosition.sizeclass || "Unknown",
      firstPosition: validDates[0] ?? null,
      lastPosition: validDates[validDates.length - 1] ?? null,
    };
  }, [positions, selectedShark]);

  function openMovementExplorer() {
    if (!selectedShark) {
      return;
    }

    navigate(`/map?shark=${encodeURIComponent(selectedShark)}`);
  }

  const sexTotal = sexDistribution.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <section className="analysis-page">
      <header className="analysis-header">
        <p className="analysis-eyebrow">Comparative analysis</p>

        <h2>Patterns across tagged sharks</h2>

        <p>
          Explore differences between individuals and how tracking activity
          changes through time.
        </p>
      </header>

      <section className="analysis-summary-grid">
        <article className="analysis-summary-card">
          <span>Highest count</span>

          <strong>
            {chartSummary.highest?.detections.toLocaleString() ?? "—"}
          </strong>

          <small>
            {chartSummary.highest
              ? `Shark ${chartSummary.highest.shark}`
              : "No data"}
          </small>
        </article>

        <article className="analysis-summary-card">
          <span>Median count</span>

          <strong>{Math.round(chartSummary.median).toLocaleString()}</strong>

          <small>Tracked positions per shark</small>
        </article>

        <article className="analysis-summary-card">
          <span>Lowest count</span>

          <strong>
            {chartSummary.lowest?.detections.toLocaleString() ?? "—"}
          </strong>

          <small>
            {chartSummary.lowest
              ? `Shark ${chartSummary.lowest.shark}`
              : "No data"}
          </small>
        </article>
      </section>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <h3>Tagged shark composition</h3>
            <p>Unique tagged individuals by recorded sex.</p>
          </div>
        </div>

        <div className="donut-chart-layout">
          <div className="donut-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sexDistribution}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={112}
                  paddingAngle={3}
                  stroke="none"
                >
                  {sexDistribution.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [`${value} sharks`, String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="sex-summary-list">
            {sexDistribution.map((entry) => {
              const percentage =
                sexTotal === 0 ? 0 : (entry.value / sexTotal) * 100;

              return (
                <div className="sex-summary-item" key={entry.label}>
                  <span
                    className="sex-summary-color"
                    style={{ backgroundColor: entry.color }}
                  />

                  <div>
                    <strong>{entry.label}</strong>

                    <span>
                      {entry.value} sharks · {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <h3>
              {selectedShark
                ? `Monthly tracked positions · Shark ${selectedShark}`
                : "Monthly tracked positions"}
            </h3>

            <p>
              {selectedShark
                ? "Temporal distribution of valid positions for the selected individual."
                : "Valid tracked positions recorded throughout the study period."}
            </p>
          </div>
        </div>

        <div className="timeline-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyDetections}
              margin={{
                top: 18,
                right: 24,
                bottom: 35,
                left: 38,
              }}
            >
              <CartesianGrid
                stroke="#d7dee7"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="monthLabel"
                tick={{
                  fill: "#475569",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#94a3b8",
                }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
              />

              <YAxis
                domain={[0, "auto"]}
                tick={{
                  fill: "#475569",
                  fontSize: 12,
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => Number(value).toLocaleString()}
              >
                <Label
                  value="Tracked positions"
                  angle={-90}
                  position="insideLeft"
                  style={{
                    fill: "#475569",
                    textAnchor: "middle",
                    fontSize: 12,
                  }}
                />
              </YAxis>

              <Tooltip
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Tracked positions",
                ]}
                labelFormatter={(label) => String(label)}
                cursor={{
                  stroke: "#0e7490",
                  strokeDasharray: "4 4",
                }}
              />

              <Line
                type="monotone"
                dataKey="detections"
                stroke="#0e7490"
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: "#0e7490",
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 5,
                  fill: "#164e63",
                  stroke: "white",
                  strokeWidth: 2,
                }}
                animationDuration={700}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="analysis-chart-caption">
          Only observations with valid timestamps are included.
        </p>
      </section>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <h3>Tracked positions per shark</h3>

            <p>
              Compare the amount of tracking data available for each individual.
            </p>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={detectionsPerShark}
              margin={{
                top: 18,
                right: 20,
                bottom: 75,
                left: 38,
              }}
            >
              <CartesianGrid
                stroke="#d7dee7"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="shark"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={82}
                tick={{
                  fill: "#475569",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#94a3b8",
                }}
                tickLine={false}
              />

              <YAxis
                domain={[0, "auto"]}
                tick={{
                  fill: "#475569",
                  fontSize: 12,
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => Number(value).toLocaleString()}
              >
                <Label
                  value="Tracked positions"
                  angle={-90}
                  position="insideLeft"
                  style={{
                    fill: "#475569",
                    textAnchor: "middle",
                    fontSize: 12,
                  }}
                />
              </YAxis>

              <Tooltip
                content={<DetectionTooltip />}
                cursor={{
                  fill: "rgba(14, 116, 144, 0.06)",
                }}
              />

              <Bar
                dataKey="detections"
                radius={[5, 5, 0, 0]}
                cursor="pointer"
                animationDuration={700}
                onClick={(data) => {
                  const clickedDatum = data?.payload as
                    | DetectionDatum
                    | undefined;

                  if (clickedDatum?.shark) {
                    setSelectedShark(clickedDatum.shark);
                  }
                }}
              >
                {detectionsPerShark.map((datum) => (
                  <Cell
                    key={datum.shark}
                    fill={datum.shark === selectedShark ? "#164e63" : "#0e7490"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="analysis-chart-caption">
          Click a bar to inspect an individual. Position count reflects
          observation availability, not movement distance.
        </p>

        {selectedSharkDetails && (
          <section className="selected-shark-panel">
            <div className="selected-shark-panel-heading">
              <div>
                <p className="selected-shark-eyebrow">Selected individual</p>
                <h3>Shark {selectedSharkDetails.id}</h3>
              </div>

              <button
                type="button"
                className="clear-selection-button"
                onClick={() => setSelectedShark(null)}
              >
                Clear
              </button>
            </div>

            <div className="selected-shark-details">
              <div>
                <span>Tracked positions</span>
                <strong>
                  {selectedSharkDetails.positions.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Sex</span>
                <strong>{selectedSharkDetails.sex}</strong>
              </div>

              <div>
                <span>Age class</span>
                <strong>{selectedSharkDetails.ageClass}</strong>
              </div>

              <div>
                <span>Size class</span>
                <strong>{selectedSharkDetails.sizeClass}</strong>
              </div>

              <div>
                <span>First valid position</span>
                <strong>
                  {selectedSharkDetails.firstPosition?.toLocaleDateString(
                    "en-GB",
                  ) ?? "Unknown"}
                </strong>
              </div>

              <div>
                <span>Last valid position</span>
                <strong>
                  {selectedSharkDetails.lastPosition?.toLocaleDateString(
                    "en-GB",
                  ) ?? "Unknown"}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="open-movement-button"
              onClick={openMovementExplorer}
            >
              Open in Movement Explorer →
            </button>
          </section>
        )}
      </section>
    </section>
  );
}

export default AnalysisPage;
