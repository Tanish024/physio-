import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Gym } from '@/types/maps';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Globe, Clock } from 'lucide-react';

interface GymInfoWindowProps {
  gym: Gym;
  map: google.maps.Map;
  isOpen: boolean;
  onClose: () => void;
  onSeeReviews?: (gym: Gym) => void;
}

export const GymInfoWindow: React.FC<GymInfoWindowProps> = ({
  gym,
  map,
  isOpen,
  onClose,
  onSeeReviews
}) => {
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  // Create info window content component
  const InfoWindowContent: React.FC<{ gym: Gym }> = ({ gym }) => (
    <div className="p-4 max-w-sm">
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{gym.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          {gym.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{gym.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">({gym.reviewCount} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 mb-3">
        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <span className="text-sm text-gray-700">{gym.address}</span>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {gym.openNow !== undefined && (
          <Badge variant={gym.openNow ? "default" : "secondary"}>
            <Clock className="h-3 w-3 mr-1" />
            {gym.openNow ? 'Open Now' : 'Closed'}
          </Badge>
        )}
        {gym.priceLevel !== undefined && (
          <Badge variant="outline">
            {'$'.repeat(gym.priceLevel + 1)}
          </Badge>
        )}
      </div>

      {/* Contact info */}
      <div className="space-y-2 mb-4">
        {gym.phoneNumber && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <a 
              href={`tel:${gym.phoneNumber}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {gym.phoneNumber}
            </a>
          </div>
        )}
        {gym.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <a 
              href={gym.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Visit Website
            </a>
          </div>
        )}
      </div>

      {/* Photos */}
      {gym.photos && gym.photos.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            {gym.photos.slice(0, 2).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`${gym.name} photo ${index + 1}`}
                className="w-full h-20 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSeeReviews?.(gym)}
          className="flex-1"
        >
          See Reviews
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${gym.location.lat},${gym.location.lng}`;
            window.open(url, '_blank');
          }}
        >
          Directions
        </Button>
      </div>
    </div>
  );

  // Create and manage info window
  useEffect(() => {
    if (!map) return;

    const newInfoWindow = new google.maps.InfoWindow({
      disableAutoPan: false,
      maxWidth: 350,
    });

    // Add close listener
    newInfoWindow.addListener('closeclick', onClose);

    setInfoWindow(newInfoWindow);
    infoWindowRef.current = newInfoWindow;

    return () => {
      if (newInfoWindow) {
        newInfoWindow.close();
      }
    };
  }, [map, onClose]);

  // Handle open/close state
  useEffect(() => {
    if (!infoWindow) return;

    if (isOpen) {
      // Create content container
      const contentDiv = document.createElement('div');
      
      // Render React content into the div
      const root = createRoot(contentDiv);
      root.render(<InfoWindowContent gym={gym} />);

      // Set content and open
      infoWindow.setContent(contentDiv);
      infoWindow.setPosition({ lat: gym.location.lat, lng: gym.location.lng });
      infoWindow.open(map);
    } else {
      infoWindow.close();
    }
  }, [infoWindow, isOpen, gym, map]);

  return null;
};