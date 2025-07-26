import React from 'react';
import { createMapUrl } from '../utils/locationUtils';

interface AddressDisplayProps {
  address?: string;
  lat?: number;
  lng?: number;
  showMapLink?: boolean;
  className?: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  lat,
  lng,
  showMapLink = true,
  className = ''
}) => {
  if (!address && !lat && !lng) {
    return null;
  }

  return (
    <div className={`text-sm text-gray-500 ${className}`}>
      {address && (
        <p><b>Location:</b> {address}</p>
      )}
      {lat && lng && showMapLink && (
        <a
          href={createMapUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
        >
          View on OpenStreetMap
        </a>
      )}
    </div>
  );
};

export default AddressDisplay; 