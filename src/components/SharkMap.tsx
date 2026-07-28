import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Map as MapLibreMap } from "maplibre-gl";
import type { SharkPosition } from "../types/SharkPosition";

interface SharkMapProps {
  positions: SharkPosition[];
}

interface TimedSharkPosition {
  position: SharkPosition;
  timestamp: number;
}

const ANIMATION_SAMPLE_RATE = 10;
const MAXIMUM_TRAIL_LENGTH = 15;
const MAXIMUM_GAP_HOURS = 12;
const ANIMATION_INTERVAL_MS = 200;

function SharkMap({ positions }: SharkMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [animationIndex, setAnimationIndex] = useState(0);

  /*
   * Parse and sort observations that contain valid full timestamps.
   */
  const timedPositions = useMemo<TimedSharkPosition[]>(
    () =>
      positions
        .map((position) => ({
          position,
          timestamp: new Date(position.DateTimeUTC).getTime(),
        }))
        .filter(
          ({ position, timestamp }) =>
            !Number.isNaN(timestamp) &&
            Number.isFinite(position.lon) &&
            Number.isFinite(position.lat),
        )
        .sort((a, b) => a.timestamp - b.timestamp),
    [positions],
  );

  /*
   * Positions used to display all valid detection points.
   */
  const sortedPositions = useMemo(
    () => timedPositions.map(({ position }) => position),
    [timedPositions],
  );

  /*
   * Use fewer observations for animation.
   *
   * Sampling every 10th point keeps the animation manageable while
   * retaining enough temporal detail to create short movement trails.
   */
  const animationPositions = useMemo(
    () =>
      timedPositions.filter((_, index) => index % ANIMATION_SAMPLE_RATE === 0),
    [timedPositions],
  );

  /*
   * Create the MapLibre map once.
   */
  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-119.5, 34.4],
      zoom: 8,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.addSource("shark-positions", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addSource("shark-trail", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      /*
       * Add the trail before the detection points so that the points
       * remain visible above the line.
       */
      map.addLayer({
        id: "shark-trail",
        type: "line",
        source: "shark-trail",
        paint: {
          "line-width": 4,
          "line-opacity": 0.8,
          "line-color": "#2563eb",
        },
      });

      map.addLayer({
        id: "shark-positions",
        type: "circle",
        source: "shark-positions",
        paint: {
          "circle-radius": 3,
          "circle-color": "#e63946",
          "circle-opacity": 0.6,
        },
      });
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, []);

  /*
   * Update all visible detection points when the selected shark changes.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const updatePositions = () => {
      const pointSource = map.getSource("shark-positions") as
        | maplibregl.GeoJSONSource
        | undefined;

      pointSource?.setData({
        type: "FeatureCollection",
        features: sortedPositions.map((position) => ({
          type: "Feature",
          properties: {
            shark: position.shark,
            date: position.DateTimeUTC,
          },
          geometry: {
            type: "Point",
            coordinates: [position.lon, position.lat],
          },
        })),
      });
    };

    if (map.loaded()) {
      updatePositions();
    } else {
      map.once("load", updatePositions);
    }

    return () => {
      map.off("load", updatePositions);
    };
  }, [sortedPositions]);

  /*
   * Reset the animation when another shark is selected.
   */
  useEffect(() => {
    setAnimationIndex(0);
    setIsPlaying(false);
  }, [positions]);

  /*
   * Ensure the current animation index remains valid when the number
   * of animation positions changes.
   */
  useEffect(() => {
    setAnimationIndex((currentIndex) =>
      Math.min(currentIndex, Math.max(animationPositions.length - 1, 0)),
    );
  }, [animationPositions.length]);

  /*
   * Create and move the animated shark marker.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || animationPositions.length === 0) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const safeIndex = Math.max(
      0,
      Math.min(animationIndex, animationPositions.length - 1),
    );

    const currentItem = animationPositions[safeIndex];

    if (!currentItem) {
      return;
    }

    const { position } = currentItem;

    if (!Number.isFinite(position.lon) || !Number.isFinite(position.lat)) {
      return;
    }

    const coordinates: [number, number] = [position.lon, position.lat];

    if (!markerRef.current) {
      const markerElement = document.createElement("div");

      markerElement.textContent = "🦈";
      markerElement.style.fontSize = "28px";
      markerElement.style.cursor = "pointer";
      markerElement.style.lineHeight = "1";

      markerRef.current = new maplibregl.Marker({
        element: markerElement,
      })
        .setLngLat(coordinates)
        .addTo(map);
    } else {
      markerRef.current.setLngLat(coordinates);
    }
  }, [animationIndex, animationPositions]);

  /*
   * Display a short trail behind the shark.
   *
   * The trail stops at a gap larger than MAXIMUM_GAP_HOURS, preventing
   * a misleading line from being drawn across long periods with no data.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const updateTrail = () => {
      const trailSource = map.getSource("shark-trail") as
        | maplibregl.GeoJSONSource
        | undefined;

      if (!trailSource) {
        return;
      }

      const safeIndex = Math.max(
        0,
        Math.min(animationIndex, animationPositions.length - 1),
      );

      const maximumGapMilliseconds = MAXIMUM_GAP_HOURS * 60 * 60 * 1000;

      const trailItems: TimedSharkPosition[] = [];

      for (let index = safeIndex; index >= 0; index -= 1) {
        const currentItem = animationPositions[index];

        if (!currentItem) {
          break;
        }

        trailItems.unshift(currentItem);

        if (trailItems.length >= MAXIMUM_TRAIL_LENGTH) {
          break;
        }

        const previousItem = animationPositions[index - 1];

        if (!previousItem) {
          break;
        }

        const timeGap = currentItem.timestamp - previousItem.timestamp;

        if (timeGap > maximumGapMilliseconds) {
          break;
        }
      }

      trailSource.setData({
        type: "FeatureCollection",
        features:
          trailItems.length >= 2
            ? [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: trailItems.map(({ position }) => [
                      position.lon,
                      position.lat,
                    ]),
                  },
                },
              ]
            : [],
      });
    };

    if (map.loaded()) {
      updateTrail();
    } else {
      map.once("load", updateTrail);
    }

    return () => {
      map.off("load", updateTrail);
    };
  }, [animationIndex, animationPositions]);

  /*
   * Advance the animation while playback is active.
   */
  useEffect(() => {
    if (!isPlaying || animationPositions.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setAnimationIndex((currentIndex) => {
        if (currentIndex >= animationPositions.length - 1) {
          setIsPlaying(false);
          return currentIndex;
        }

        return currentIndex + 1;
      });
    }, ANIMATION_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, animationPositions.length]);

  const safeAnimationIndex = Math.min(
    animationIndex,
    Math.max(animationPositions.length - 1, 0),
  );

  const currentAnimationItem = animationPositions[safeAnimationIndex];

  const displayedPositionNumber =
    animationPositions.length === 0 ? 0 : safeAnimationIndex + 1;

  const currentDate = currentAnimationItem
    ? new Date(currentAnimationItem.timestamp).toLocaleString()
    : "No valid timestamp";

  return (
    <div>
      <div className="animation-controls">
        <button
          type="button"
          onClick={() => {
            if (
              animationIndex >= animationPositions.length - 1 &&
              animationPositions.length > 0
            ) {
              setAnimationIndex(0);
            }

            setIsPlaying((playing) => !playing);
          }}
          disabled={animationPositions.length === 0}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          type="button"
          onClick={() => {
            setAnimationIndex(0);
            setIsPlaying(false);
          }}
          disabled={animationPositions.length === 0}
        >
          Restart
        </button>

        <input
          type="range"
          min={0}
          max={Math.max(animationPositions.length - 1, 0)}
          value={safeAnimationIndex}
          onChange={(event) => {
            setAnimationIndex(Number(event.target.value));
            setIsPlaying(false);
          }}
          disabled={animationPositions.length === 0}
          aria-label="Shark animation position"
        />

        <span>
          {displayedPositionNumber} / {animationPositions.length}
        </span>

        <span>{currentDate}</span>
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "600px",
        }}
      />
    </div>
  );
}

export default SharkMap;
