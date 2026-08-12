import { useMemo } from "react";

import type { SharkMovementMetrics } from "../utils/calculateSharkMovementMetrics";

interface AgeMovementSummaryProps {
  metrics: SharkMovementMetrics[];
  selectedAgeClasses: string[];
}

interface AgeSummary {
  ageClass: string;
  label: string;
  medianMovementKm: number;
  minMovementKm: number;
  maxMovementKm: number;
  sharkCount: number;
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function ageLabel(ageClass: string) {
  if (ageClass === "YOY") {
    return "Young of the Year";
  }

  return `Age class ${ageClass}`;
}

function AgeMovementSummary({
  metrics,
  selectedAgeClasses,
}: AgeMovementSummaryProps) {
  const summaries = useMemo<AgeSummary[]>(() => {
    return selectedAgeClasses
      .map((ageClass) => {
        const values = metrics
          .filter(
            (metric) =>
              metric.ageClass === ageClass &&
              metric.movementDays > 0 &&
              Number.isFinite(metric.averageDistancePerMovementDayKm),
          )
          .map((metric) => metric.averageDistancePerMovementDayKm);

        if (values.length === 0) {
          return null;
        }

        return {
          ageClass,
          label: ageLabel(ageClass),
          medianMovementKm: median(values),
          minMovementKm: Math.min(...values),
          maxMovementKm: Math.max(...values),
          sharkCount: values.length,
        };
      })
      .filter((summary): summary is AgeSummary => summary !== null)
      .sort((a, b) => {
        if (a.ageClass === "YOY") {
          return -1;
        }

        if (b.ageClass === "YOY") {
          return 1;
        }

        return Number(a.ageClass) - Number(b.ageClass);
      });
  }, [metrics, selectedAgeClasses]);

  const maxMedian = Math.max(
    ...summaries.map((summary) => summary.medianMovementKm),
    1,
  );

  return (
    <section className="age-movement-summary">
      <div className="age-movement-summary-heading">
        <h3>Typical observed movement by age class</h3>

        <p>
          Each bar shows the median movement distance of individual sharks in
          that age class, normalized per tracked movement day.
        </p>
      </div>

      <div className="age-movement-bars">
        {summaries.map((summary) => {
          const width = (summary.medianMovementKm / maxMedian) * 100;

          return (
            <div className="age-movement-row" key={summary.ageClass}>
              <div className="age-movement-row-heading">
                <div>
                  <strong>{summary.label}</strong>
                  <span>
                    {summary.sharkCount}{" "}
                    {summary.sharkCount === 1 ? "shark" : "sharks"}
                  </span>
                </div>

                <strong className="age-movement-value">
                  {summary.medianMovementKm.toFixed(1)} km/day
                </strong>
              </div>

              <div className="age-movement-track">
                <div
                  className="age-movement-bar"
                  style={{ width: `${width}%` }}
                />
              </div>

              <div className="age-movement-range">
                Observed individual range: {summary.minMovementKm.toFixed(1)}–
                {summary.maxMovementKm.toFixed(1)} km/day
              </div>
            </div>
          );
        })}
      </div>

      <p className="age-movement-summary-caption">
        Movement is based on straight-line displacement between consecutive
        valid VPS positions separated by no more than 24 hours.
      </p>
    </section>
  );
}

export default AgeMovementSummary;
