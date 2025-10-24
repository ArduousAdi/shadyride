import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon paths so markers (if used) display correctly in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Displays a map with the route polyline.
 * Uses Leaflet through react-leaflet. The map is hidden when no coordinates are provided.
 *
 * @param {{ coordinates: Array<{lat:number, lon:number}> }} props
 */
const MapView = ({ coordinates }) => {
  if (!coordinates || coordinates.length === 0) return null;
  const positions = coordinates.map((pt) => [pt.lat, pt.lon]);
  // Center on the midpoint of the route
  const center = positions[Math.floor(positions.length / 2)];
  return (
    <div className="w-full h-64 mb-4">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full rounded-lg shadow"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        <Polyline positions={positions} />
      </MapContainer>
    </div>
  );
};

export default MapView;