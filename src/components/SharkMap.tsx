import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { FeatureCollection, Point } from 'geojson';
import type { SharkPosition } from '../types/SharkPosition';

interface SharkMapProps {
  positions: SharkPosition[];
}

function SharkMap({ positions }: SharkMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current) {
      return;
    }

    const sharkGeoJson: FeatureCollection<
      Point,
      {
        shark: string;
        sex: string;
      }
    > = {
      type: 'FeatureCollection',
      features: positions.map((position) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [position.lon, position.lat],
        },
        properties: {
          shark: position.shark,
          sex: position.sex,
        },
      })),
    };

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-119.5, 34.4],
      zoom: 7,
    });

    map.addControl(new maplibregl.NavigationControl());

    map.on('load', () => {
      map.addSource('sharks', {
        type: 'geojson',
        data: sharkGeoJson,
      });

      map.addLayer({
        id: 'sharks',
        type: 'circle',
        source: 'sharks',
        paint: {
          'circle-radius': 2,
          'circle-color': '#ff3333',
          'circle-opacity': 0.5,
        },
      });
    });

    return () => {
      map.remove();
    };
  }, [positions]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '600px',
      }}
    />
  );
}

export default SharkMap;