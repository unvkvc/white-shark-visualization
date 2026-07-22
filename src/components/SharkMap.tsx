import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { SharkPosition } from '../types/SharkPosition';

interface SharkMapProps {
  positions: SharkPosition[];
}

function SharkMap({ positions }: SharkMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-119.5, 34.4],
      zoom: 8,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('shark-positions', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'shark-positions',
        type: 'circle',
        source: 'shark-positions',
        paint: {
          'circle-radius': 3,
          'circle-color': '#e63946',
          'circle-opacity': 0.6,
        },
      });
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

    const updateSource = () => {
      const source = map.getSource(
        'shark-positions',
      ) as maplibregl.GeoJSONSource | undefined;

      source?.setData({
        type: 'FeatureCollection',
        features: positions.map((position) => ({
          type: 'Feature',
          properties: {
            shark: position.shark,
            date: position.DateTimeUTC,
          },
          geometry: {
            type: 'Point',
            coordinates: [position.lon, position.lat],
          },
        })),
      });
    };

    if (map.loaded()) {
      updateSource();
    } else {
      map.once('load', updateSource);
    }
  }, [positions]);

    return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '600px',
      }}
    />
  );
}

export default SharkMap;