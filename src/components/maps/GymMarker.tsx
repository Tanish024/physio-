import React, { useEffect, useRef, useState } from 'react';
import { Gym } from '@/types/maps';

interface GymMarkerProps {
  gym: Gym;
  map: google.maps.Map;
  onClick: () => void;
  isSelected: boolean;
}

export const GymMarker: React.FC<GymMarkerProps> = ({
  gym,
  map,
  onClick,
  isSelected
}) => {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  // Create custom marker icon
  const createMarkerIcon = (selected: boolean) => {
    const color = selected ? '#ef4444' : '#3b82f6'; // red if selected, blue otherwise
    const scale = selected ? 1.2 : 1;

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8 * scale,
    };
  };

  // Create gym marker
  useEffect(() => {
    if (!map || marker) return;

    const newMarker = new google.maps.Marker({
      position: { lat: gym.location.lat, lng: gym.location.lng },
      map,
      title: gym.name,
      icon: createMarkerIcon(isSelected),
      animation: google.maps.Animation.DROP,
    });

    // Add click listener
    newMarker.addListener('click', onClick);

    setMarker(newMarker);
    markerRef.current = newMarker;

    return () => {
      if (newMarker) {
        newMarker.setMap(null);
      }
    };
  }, [map, gym, onClick, marker]);

  // Update marker appearance when selection changes
  useEffect(() => {
    if (marker) {
      marker.setIcon(createMarkerIcon(isSelected));
      if (isSelected) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 1500);
      }
    }
  }, [marker, isSelected]);

  // Update marker position if gym location changes
  useEffect(() => {
    if (marker) {
      marker.setPosition({ lat: gym.location.lat, lng: gym.location.lng });
    }
  }, [marker, gym.location]);

  return null; // This component doesn't render anything directly
};