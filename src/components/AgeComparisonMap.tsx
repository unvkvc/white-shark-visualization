import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";

import type { SharkPosition } from "../types/SharkPosition";

interface AgeComparisonMapProps {
  positions: SharkPosition[];
  selectedAgeClasses: string[];
}

interface AgeStyle {
  label: string;
  color: string;
}

const ageStyles: Record<string, AgeStyle> = {
  YOY: {
    label: "Young of the Year",
    color: "#2563eb",
  },
  "1": {
    label: "Age class 1",
    color: "#06b6d4",
  },
  "2": {
    label: "Age class 2",
    color: "#10b981",
  },
  "3": {
    label: "Age class 3",
    color: "#84cc16",
  },
  "4": {
    label: "Age class 4",
    color: "#eab308",
  },
  "5": {
    label: "Age class 5",
    color: "#f97316",
  },
  "6": {
    label: "Age class 6",
    color: "#dc2626",
  },
};

function normalizeAgeClass(position: SharkPosition) {
  return String(position.ageclass).trim();
}

function AgeComparisonMap({
  positions,
  selectedAgeClasses,
}: AgeComparisonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const validPositions = useMemo(() => {
    return positions.filter(
      (position) =>
        Number.isFinite(position.lon) &&
        Number.isFinite(position.lat) &&
        selectedAgeClasses.includes(normalizeAgeClass(position)),
    );
  }, [positions, selectedAgeClasses]);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-119.5, 34.4],
      zoom: 9,
    });

    mapRef.current = map;

    map.on("load", () => {
      for (const ageClass of Object.keys(ageStyles)) {
        map.addSource(`age-class-${ageClass}`, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer({
          id: `age-class-${ageClass}`,
          type: "circle",
          source: `age-class-${ageClass}`,
          paint: {
            "circle-radius": 3,
            "circle-color": ageStyles[ageClass].color,
            "circle-opacity": 0.28,
            "circle-stroke-width": 0,
          },
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const updateSources = () => {
      for (const ageClass of Object.keys(ageStyles)) {
        const source = map.getSource(`age-class-${ageClass}`) as
          | maplibregl.GeoJSONSource
          | undefined;

        const agePositions = validPositions.filter(
          (position) => normalizeAgeClass(position) === ageClass,
        );

        source?.setData({
          type: "FeatureCollection",
          features: agePositions.map((position) => ({
            type: "Feature",
            properties: {
              shark: position.shark,
              ageClass,
              date: position.DateTimeUTC,
            },
            geometry: {
              type: "Point",
              coordinates: [position.lon, position.lat],
            },
          })),
        });
      }

      if (validPositions.length === 0) {
        return;
      }

      const bounds = new maplibregl.LngLatBounds();

      for (const position of validPositions) {
        bounds.extend([position.lon, position.lat]);
      }

      map.fitBounds(bounds, {
        padding: 55,
        maxZoom: 13,
        duration: 700,
      });
    };

    if (map.loaded()) {
      updateSources();
    } else {
      map.once("load", updateSources);
    }

    return () => {
      map.off("load", updateSources);
    };
  }, [validPositions]);

  return (
    <div className="age-comparison-map-wrapper">
      <div className="age-comparison-legend">
        {selectedAgeClasses.map((ageClass) => {
          const style = ageStyles[ageClass];

          if (!style) {
            return null;
          }

          return (
            <div className="age-comparison-legend-item" key={ageClass}>
              <span
                className="age-comparison-legend-color"
                style={{ backgroundColor: style.color }}
              />

              <span>{style.label}</span>
            </div>
          );
        })}
      </div>

      <div ref={mapContainerRef} className="age-comparison-map" />
    </div>
  );
}

export default AgeComparisonMap;
