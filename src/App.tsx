import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import type { SharkPosition } from "./types/SharkPosition";
import { loadSharkPositions } from "./utils/loadSharks";
import Navigation from "./components/Navigation";
import OverviewPage from "./pages/OverviewPage";
import MovementPage from "./pages/MovementPage";
import AnalysisPage from "./pages/AnalysisPage";

import "maplibre-gl/dist/maplibre-gl.css";

function App() {
  const [positions, setPositions] = useState<SharkPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShark, setSelectedShark] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        const loadedPositions = await loadSharkPositions();
        setPositions(loadedPositions);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "An unknown error occurred";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const statistics = useMemo(() => {
    const uniqueSharks = new Map<string, SharkPosition>();

    for (const position of positions) {
      if (!uniqueSharks.has(position.shark)) {
        uniqueSharks.set(position.shark, position);
      }
    }

    const validTimestampCount = positions.filter(
      (position) => !Number.isNaN(new Date(position.DateTimeUTC).getTime()),
    ).length;

    const sharks = Array.from(uniqueSharks.values());

    const dates = positions
      .map((position) => new Date(position.DateTimeUTC))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      totalPositions: positions.length,
      uniqueSharks: sharks.length,
      femaleSharks: sharks.filter((shark) => shark.sex === "F").length,
      maleSharks: sharks.filter((shark) => shark.sex === "M").length,
      unknownSexSharks: sharks.filter(
        (shark) => shark.sex !== "F" && shark.sex !== "M",
      ).length,
      validTimestamps: validTimestampCount,
      invalidTimestamps: positions.length - validTimestampCount,
      earliestDate: dates[0] ?? null,
      latestDate: dates[dates.length - 1] ?? null,
    };
  }, [positions]);

  const sharkIds = useMemo(() => {
    return Array.from(
      new Set(positions.map((position) => position.shark)),
    ).sort();
  }, [positions]);

  const displayedPositions = useMemo(() => {
    if (selectedShark === "ALL") {
      return positions;
    }

    return positions.filter((position) => position.shark === selectedShark);
  }, [positions, selectedShark]);

  const sharkStatistics = useMemo(() => {
    if (selectedShark === "ALL" || displayedPositions.length === 0) {
      return null;
    }

    const sorted = displayedPositions
      .map((position) => ({
        position,
        timestamp: new Date(position.DateTimeUTC).getTime(),
      }))
      .filter((item) => !Number.isNaN(item.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (sorted.length === 0) {
      return null;
    }

    let totalGap = 0;
    let largestGap = 0;

    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].timestamp - sorted[i - 1].timestamp;

      totalGap += gap;

      if (gap > largestGap) {
        largestGap = gap;
      }
    }

    return {
      detections: displayedPositions.length,
      validDetections: sorted.length,
      invalidDetections: displayedPositions.length - sorted.length,
      first: sorted[0].position.DateTimeUTC,
      last: sorted[sorted.length - 1].position.DateTimeUTC,
      averageGapHours:
        sorted.length > 1 ? totalGap / (sorted.length - 1) / 1000 / 60 / 60 : 0,
      largestGapHours: largestGap / 1000 / 60 / 60,
    };
  }, [displayedPositions, selectedShark]);

  if (loading) {
    return <p>Loading shark data...</p>;
  }

  if (error) {
    return (
      <div>
        <h1>White Shark Visualization</h1>
        <p>Could not load the dataset.</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div>
        <Navigation />

        <main>
          <Routes>
            <Route
              path="/"
              element={<OverviewPage statistics={statistics} />}
            />

            <Route
              path="/map"
              element={
                <MovementPage
                  positions={positions}
                  displayedPositions={displayedPositions}
                  sharkIds={sharkIds}
                  selectedShark={selectedShark}
                  sharkStatistics={sharkStatistics}
                  onSelectedSharkChange={setSelectedShark}
                />
              }
            />

            <Route
              path="/analysis"
              element={<AnalysisPage positions={positions} />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
