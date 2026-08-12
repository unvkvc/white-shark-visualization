import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AgeComparisonMap from "../components/AgeComparisonMap";
import { calculateSharkMovementMetrics } from "../utils/calculateSharkMovementMetrics";
import SharkMap from "../components/SharkMap";
import type { SharkPosition } from "../types/SharkPosition";
import AgeMovementSummary from "../components/AgeMovementSummary";

import "./MovementPage.css";

interface SharkStatistics {
  detections: number;
  validDetections: number;
  invalidDetections: number;
  first: string;
  last: string;
  averageGapHours: number;
  largestGapHours: number;
}

interface MovementPageProps {
  positions: SharkPosition[];
  displayedPositions: SharkPosition[];
  sharkIds: string[];
  selectedShark: string;
  sharkStatistics: SharkStatistics | null;
  onSelectedSharkChange: (sharkId: string) => void;
}

type ExplorationMode = "INDIVIDUAL" | "AGE_COMPARISON";

function MovementPage({
  positions,
  displayedPositions,
  sharkIds,
  selectedShark,
  sharkStatistics,
  onSelectedSharkChange,
}: MovementPageProps) {
  const [searchParams] = useSearchParams();

  const [explorationMode, setExplorationMode] =
    useState<ExplorationMode>("INDIVIDUAL");

  const [selectedAgeClasses, setSelectedAgeClasses] = useState<string[]>([]);

  const movementMetrics = useMemo(
    () => calculateSharkMovementMetrics(positions),
    [positions],
  );

  console.table(movementMetrics);

  useEffect(() => {
    const sharkFromUrl = searchParams.get("shark");

    if (sharkFromUrl && sharkIds.includes(sharkFromUrl)) {
      onSelectedSharkChange(sharkFromUrl);
      setExplorationMode("INDIVIDUAL");
    }
  }, [searchParams, sharkIds, onSelectedSharkChange]);

  const ageClasses = useMemo(() => {
    return Array.from(
      new Set(
        positions
          .map((position) => String(position.ageclass).trim())
          .filter((ageClass) => ageClass !== ""),
      ),
    ).sort((a, b) => {
      if (a === "YOY") {
        return -1;
      }

      if (b === "YOY") {
        return 1;
      }

      return Number(a) - Number(b);
    });
  }, [positions]);

  useEffect(() => {
    if (selectedAgeClasses.length === 0 && ageClasses.length > 0) {
      setSelectedAgeClasses(ageClasses);
    }
  }, [ageClasses, selectedAgeClasses.length]);

  const ageComparisonPositions = useMemo(() => {
    return positions.filter((position) =>
      selectedAgeClasses.includes(String(position.ageclass).trim()),
    );
  }, [positions, selectedAgeClasses]);

  function toggleAgeClass(ageClass: string) {
    setSelectedAgeClasses((currentAgeClasses) => {
      if (currentAgeClasses.includes(ageClass)) {
        return currentAgeClasses.filter(
          (selectedClass) => selectedClass !== ageClass,
        );
      }

      return [...currentAgeClasses, ageClass];
    });
  }

  return (
    <section className="movement-page">
      <header className="movement-header">
        <p className="movement-eyebrow">Spatial and temporal exploration</p>

        <h2>Movement Explorer</h2>

        <p>
          Explore individual shark movements or compare spatial patterns across
          developmental stages.
        </p>
      </header>

      <div className="movement-mode-selector">
        <button
          type="button"
          className={
            explorationMode === "INDIVIDUAL"
              ? "movement-mode-button active"
              : "movement-mode-button"
          }
          onClick={() => setExplorationMode("INDIVIDUAL")}
        >
          Individual shark
        </button>

        <button
          type="button"
          className={
            explorationMode === "AGE_COMPARISON"
              ? "movement-mode-button active"
              : "movement-mode-button"
          }
          onClick={() => setExplorationMode("AGE_COMPARISON")}
        >
          Compare age groups
        </button>
      </div>

      {explorationMode === "INDIVIDUAL" && (
        <>
          <section className="movement-controls-card">
            <label htmlFor="sharkSelect">Select shark</label>

            <select
              id="sharkSelect"
              value={selectedShark}
              onChange={(event) => onSelectedSharkChange(event.target.value)}
            >
              <option value="ALL">Choose an individual shark</option>

              {sharkIds.map((id) => (
                <option key={id} value={id}>
                  Shark {id}
                </option>
              ))}
            </select>
          </section>

          {selectedShark === "ALL" && (
            <section className="movement-empty-state">
              <h3>Select a shark to begin</h3>

              <p>
                The map will display its chronological positions and movement
                animation.
              </p>
            </section>
          )}

          {selectedShark !== "ALL" && sharkStatistics && (
            <div className="movement-compact-summary">
              <span>
                <strong>Shark {selectedShark}</strong>
              </span>

              <span>
                {sharkStatistics.validDetections.toLocaleString()} chronological
                positions
              </span>

              <span>
                {new Date(sharkStatistics.first).toLocaleDateString("en-GB")} –{" "}
                {new Date(sharkStatistics.last).toLocaleDateString("en-GB")}
              </span>

              <span>
                Average gap: {sharkStatistics.averageGapHours.toFixed(2)} h
              </span>
            </div>
          )}

          <section className="movement-map-card">
            <SharkMap
              positions={selectedShark === "ALL" ? [] : displayedPositions}
            />
          </section>
        </>
      )}

      {explorationMode === "AGE_COMPARISON" && (
        <>
          <section className="movement-controls-card age-comparison-controls">
            <div>
              <strong>Age classes</strong>

              <p>
                Select the developmental stages to include in the comparison.
              </p>
            </div>

            <div className="age-class-options">
              {ageClasses.map((ageClass) => (
                <label className="age-class-option" key={ageClass}>
                  <input
                    type="checkbox"
                    checked={selectedAgeClasses.includes(ageClass)}
                    onChange={() => toggleAgeClass(ageClass)}
                  />

                  <span>
                    {ageClass === "YOY"
                      ? "Young of the Year"
                      : `Age class ${ageClass}`}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="movement-compact-summary">
            <span>
              <strong>Age-group comparison</strong>
            </span>

            <span>{selectedAgeClasses.length} selected age classes</span>

            <span>
              {ageComparisonPositions.length.toLocaleString()} positions
            </span>
          </div>

          <section className="movement-map-card">
            <AgeComparisonMap
              positions={ageComparisonPositions}
              selectedAgeClasses={selectedAgeClasses}
            />
          </section>

          <AgeMovementSummary
            metrics={movementMetrics}
            selectedAgeClasses={selectedAgeClasses}
          />
        </>
      )}
    </section>
  );
}

export default MovementPage;
