import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationMapProps } from '../types';

const LocationMap: React.FC<LocationMapProps> = ({
  center,
  markerPosition,
  onLocationSelect,
  height = '400px',
  zoom = 13
}) => {
  // Inner component to handle map events
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });

    return markerPosition === null ? null : (
      <Marker position={markerPosition} />
    );
  };

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default LocationMap; 