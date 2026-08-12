import type { SharkPosition } from "../types/SharkPosition";

export interface SharkMovementMetrics {
  shark: string;
  ageClass: string;
  sizeClass: string;
  detectionCount: number;
  trackingDurationDays: number;
  totalValidMovementKm: number;
  movementDays: number;
  averageDistancePerMovementDayKm: number;
}

const EARTH_RADIUS_KM = 6371;
const MAX_MOVEMENT_GAP_HOURS = 24;

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const latitudeDifference = degreesToRadians(lat2 - lat1);
  const longitudeDifference = degreesToRadians(lon2 - lon1);

  const firstLatitude = degreesToRadians(lat1);
  const secondLatitude = degreesToRadians(lat2);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function calculateSharkMovementMetrics(
  positions: SharkPosition[],
): SharkMovementMetrics[] {
  const positionsByShark = new Map<string, SharkPosition[]>();

  for (const position of positions) {
    const currentPositions = positionsByShark.get(position.shark) ?? [];

    currentPositions.push(position);
    positionsByShark.set(position.shark, currentPositions);
  }

  return Array.from(positionsByShark.entries()).flatMap(
    ([shark, sharkPositions]) => {
      const chronologicalPositions = sharkPositions
        .map((position) => ({
          position,
          timestamp: new Date(position.DateTimeUTC).getTime(),
        }))
        .filter(
          (item) =>
            !Number.isNaN(item.timestamp) &&
            Number.isFinite(item.position.lat) &&
            Number.isFinite(item.position.lon),
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      if (chronologicalPositions.length === 0) {
        return [];
      }

      const firstPosition = chronologicalPositions[0].position;

      let trackingDurationDays = 0;

      if (chronologicalPositions.length > 1) {
        const firstTimestamp = chronologicalPositions[0].timestamp;
        const lastTimestamp =
          chronologicalPositions[chronologicalPositions.length - 1].timestamp;

        trackingDurationDays =
          (lastTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24);
      }

      let totalValidMovementKm = 0;

      const movementDates = new Set<string>();

      for (let i = 1; i < chronologicalPositions.length; i++) {
        const previous = chronologicalPositions[i - 1];
        const current = chronologicalPositions[i];

        const gapHours =
          (current.timestamp - previous.timestamp) / (1000 * 60 * 60);

        if (gapHours <= 0 || gapHours > MAX_MOVEMENT_GAP_HOURS) {
          continue;
        }

        const distanceKm = calculateDistanceKm(
          previous.position.lat,
          previous.position.lon,
          current.position.lat,
          current.position.lon,
        );

        if (!Number.isFinite(distanceKm)) {
          continue;
        }

        totalValidMovementKm += distanceKm;

        const movementDate = new Date(current.timestamp)
          .toISOString()
          .slice(0, 10);

        movementDates.add(movementDate);
      }

      const movementDays = movementDates.size;

      const averageDistancePerMovementDayKm =
        movementDays > 0 ? totalValidMovementKm / movementDays : 0;

      return [
        {
          shark,
          ageClass: String(firstPosition.ageclass).trim(),
          sizeClass: String(firstPosition.sizeclass).trim(),
          detectionCount: sharkPositions.length,
          trackingDurationDays,
          totalValidMovementKm,
          movementDays,
          averageDistancePerMovementDayKm,
        },
      ];
    },
  );
}
