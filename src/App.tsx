import { useEffect, useMemo, useState } from 'react';
import type { SharkPosition } from './types/SharkPosition';
import { loadSharkPositions } from './utils/loadSharks';
import SharkMap from './components/SharkMap';

function App() {
  const [positions, setPositions] = useState<SharkPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShark, setSelectedShark] = useState<string>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const loadedPositions = await loadSharkPositions();
        setPositions(loadedPositions);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : 'An unknown error occurred';

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

    const sharks = Array.from(uniqueSharks.values());

    const dates = positions
      .map((position) => new Date(position.DateTimeUTC))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      totalPositions: positions.length,
      uniqueSharks: sharks.length,
      femaleSharks: sharks.filter((shark) => shark.sex === 'F').length,
      maleSharks: sharks.filter((shark) => shark.sex === 'M').length,
      unknownSexSharks: sharks.filter(
        (shark) => shark.sex !== 'F' && shark.sex !== 'M',
      ).length,
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
    if (selectedShark === 'ALL') {
      return positions;
    }

    return positions.filter(
      (position) => position.shark === selectedShark,
    );
  }, [positions, selectedShark]);

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
    <main>
      <h1>White Shark Visualization</h1>
      <p>Information Visualization Project</p>

      <h2>Dataset summary</h2>

      <p>Total positions: {statistics.totalPositions.toLocaleString()}</p>
      <p>Unique sharks: {statistics.uniqueSharks}</p>
      <p>Female sharks: {statistics.femaleSharks}</p>
      <p>Male sharks: {statistics.maleSharks}</p>
      <p>Unknown sex: {statistics.unknownSexSharks}</p>

      <p>
        Tracking period:{' '}
        {statistics.earliestDate?.toLocaleDateString()} –{' '}
        {statistics.latestDate?.toLocaleDateString()}
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="sharkSelect">
          <strong>Select shark: </strong>
        </label>

        <select
          id="sharkSelect"
          value={selectedShark}
          onChange={(event) => setSelectedShark(event.target.value)}
        >
          <option value="ALL">All sharks</option>

          {sharkIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <SharkMap positions={displayedPositions} />
    </main>
  );
}

export default App;