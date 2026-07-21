import Papa from 'papaparse';
import type { SharkPosition } from '../types/SharkPosition';

type RawSharkPosition = Record<string, string>;

function webMercatorToLonLat(
  x: number,
  y: number,
): { lon: number; lat: number } {
  const earthRadius = 6378137;

  const lon = (x / earthRadius) * (180 / Math.PI);
  const lat =
    (2 * Math.atan(Math.exp(y / earthRadius)) - Math.PI / 2) *
    (180 / Math.PI);

  return { lon, lat };
}

export async function loadSharkPositions(): Promise<SharkPosition[]> {
  const response = await fetch('/data/Logan_et_al_HighRes_VPS_df.csv');

  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.status}`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<RawSharkPosition>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),

      complete: (result) => {
        console.log(result.data.slice(0, 5));

        const positions = result.data
        
          .map((row): SharkPosition => {

          const x = Number(row.X);
          const y = Number(row.Y);
          const precisePosition = webMercatorToLonLat(x, y);

          return {
            DateTimeUTC: row.DateTimeUTC?.trim() ?? '',
            shark: row.shark?.trim() ?? '',
            Transmitter: row.Transmitter?.trim() ?? '',
            lat: precisePosition.lat,
            lon: precisePosition.lon,
            HPE: Number(row.HPE),
            sex: row.sex?.trim() ?? '',
            TNL_cm: Number(row.TNL_cm),
            X: x,
            Y: y,
            age: Number(row.age),
            daily_length: Number(row.daily_length),
            sizeclass: row.sizeclass?.trim() ?? '',
            ageclass: row.ageclass?.trim() ?? '',
            daily_res: Number(row.daily_res),
          };
        })
          .filter(
            (position) =>
              position.shark !== '' &&
              position.DateTimeUTC !== '' &&
              Number.isFinite(position.lat) &&
              Number.isFinite(position.lon),
          );

        resolve(positions);
      },

      error: (error: Error) => {
        reject(error);
      },
    });
  });
}