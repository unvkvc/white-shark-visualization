import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
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

      <span>{datum.detections.toLocaleString()} recorded detections</span>
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
      detections: sharkPositions.length,
      sex:
        representativePosition.sex === "F"
          ? "Female"
          : representativePosition.sex === "M"
            ? "Male"
            : "Unknown",
      ageClass: representativePosition.ageclass || "Unknown",
      sizeClass: representativePosition.sizeclass || "Unknown",
      firstDetection: validDates[0] ?? null,
      lastDetection: validDates[validDates.length - 1] ?? null,
    };
  }, [positions, selectedShark]);

  function openMovementExplorer() {
    if (!selectedShark) {
      return;
    }

    navigate(`/map?shark=${encodeURIComponent(selectedShark)}`);
  }

  return (
    <section className="analysis-page">
      <header className="analysis-header">
        <p className="analysis-eyebrow">Comparative analysis</p>

        <h2>Detection patterns across tagged sharks</h2>

        <p>
          Compare how frequently each tagged shark was recorded in the
          high-resolution tracking dataset.
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

          <small>Typical detection count across sharks</small>
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

            <p>Distribution of unique tagged sharks by recorded sex.</p>
          </div>

          <div className="analysis-note">
            Each shark is counted once regardless of the number of detections.
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
                  innerRadius={70}
                  outerRadius={115}
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

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="sex-summary-list">
            {sexDistribution.map((entry) => {
              const total = sexDistribution.reduce(
                (sum, item) => sum + item.value,
                0,
              );

              const percentage = total === 0 ? 0 : (entry.value / total) * 100;

              return (
                <div className="sex-summary-item" key={entry.label}>
                  <span
                    className="sex-summary-color"
                    style={{
                      backgroundColor: entry.color,
                    }}
                  />

                  <div>
                    <strong>{entry.label}</strong>

                    <span>
                      {entry.value} sharks ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="analysis-chart-caption">
          {selectedShark
            ? "The chart updates when a shark is selected in the comparison chart. Clear the selection to return to the complete dataset."
            : "Select a bar in the detections-per-shark chart to inspect that individual’s temporal detection pattern."}
        </p>
      </section>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <h3>
              {selectedShark
                ? `Monthly detections for shark ${selectedShark}`
                : "Monthly detections"}
            </h3>

            <p>
              {selectedShark
                ? "Monthly distribution of valid detections for the selected shark."
                : "Number of valid shark detections recorded during each month of the study period."}
            </p>

            <p>
              Number of valid shark detections recorded during each month of the
              study period.
            </p>
          </div>

          <div className="analysis-note">
            Only observations with complete timestamps are included.
          </div>
        </div>

        <div className="timeline-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyDetections}
              margin={{
                top: 20,
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
                  value="Number of detections"
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
                  "Detections",
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
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#0e7490",
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 6,
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
          The line reveals changes in recorded detection activity through time.
          Variation may reflect shark presence, monitoring effort, receiver
          coverage or timestamp availability.
        </p>
      </section>

      <section className="analysis-card">
        <div className="analysis-card-heading">
          <div>
            <h3>Detections per shark</h3>

            <p>
              Each bar represents the number of acoustic detections recorded for
              an individual shark during the study period.
            </p>
          </div>

          <div className="analysis-note">
            Higher values indicate more recorded detections, not necessarily
            greater movement.
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={detectionsPerShark}
              margin={{
                top: 20,
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
                  value="Number of detections"
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
                  fill: "rgba(14, 116, 144, 0.08)",
                }}
              />

              <Bar
                dataKey="detections"
                radius={[6, 6, 0, 0]}
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
          Click a bar to inspect that individual. Detection counts may also
          reflect differences in monitoring duration and receiver coverage.
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
                Clear selection
              </button>
            </div>

            <div className="selected-shark-details">
              <div>
                <span>Recorded detections</span>

                <strong>
                  {selectedSharkDetails.detections.toLocaleString()}
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
                <span>First valid detection</span>

                <strong>
                  {selectedSharkDetails.firstDetection?.toLocaleDateString(
                    "en-GB",
                  ) ?? "Unknown"}
                </strong>
              </div>

              <div>
                <span>Last valid detection</span>

                <strong>
                  {selectedSharkDetails.lastDetection?.toLocaleDateString(
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
              Open in Movement Explorer
            </button>
          </section>
        )}
      </section>
    </section>
  );
}

export default AnalysisPage;
