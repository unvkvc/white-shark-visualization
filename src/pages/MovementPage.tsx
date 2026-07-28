import type { SharkPosition } from "../types/SharkPosition";
import SharkMap from "../components/SharkMap";

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
  displayedPositions: SharkPosition[];
  sharkIds: string[];
  selectedShark: string;
  sharkStatistics: SharkStatistics | null;
  onSelectedSharkChange: (sharkId: string) => void;
}

function MovementPage({
  displayedPositions,
  sharkIds,
  selectedShark,
  sharkStatistics,
  onSelectedSharkChange,
}: MovementPageProps) {
  return (
    <section>
      <h2>Movement Explorer</h2>

      <p>
        Select an individual shark and explore its recorded locations through
        time.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="sharkSelect">
          <strong>Select shark: </strong>
        </label>

        <select
          id="sharkSelect"
          value={selectedShark}
          onChange={(event) => onSelectedSharkChange(event.target.value)}
        >
          <option value="ALL">All sharks</option>

          {sharkIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {selectedShark === "ALL" && (
        <p>Select a shark to display its movement animation.</p>
      )}

      {selectedShark !== "ALL" && sharkStatistics && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Selected shark statistics</h3>

          <p>Detections: {sharkStatistics.detections.toLocaleString()}</p>

          <p>
            Valid timestamps: {sharkStatistics.validDetections.toLocaleString()}
          </p>

          <p>
            Invalid timestamps:{" "}
            {sharkStatistics.invalidDetections.toLocaleString()}
          </p>

          <p>
            First detection: {new Date(sharkStatistics.first).toLocaleString()}
          </p>

          <p>
            Last detection: {new Date(sharkStatistics.last).toLocaleString()}
          </p>

          <p>Average gap: {sharkStatistics.averageGapHours.toFixed(2)} hours</p>

          <p>Largest gap: {sharkStatistics.largestGapHours.toFixed(2)} hours</p>
        </div>
      )}

      <SharkMap positions={selectedShark === "ALL" ? [] : displayedPositions} />
    </section>
  );
}

export default MovementPage;
