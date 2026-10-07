import React, { useEffect, useRef } from 'react';
import { Gym } from '@/types/maps';

interface MarkerClustererProps {
  map: google.maps.Map;
  gyms: Gym[];
  onGymClick: (gym: Gym) => void;
  selectedGymId?: string;
}

export const MarkerClusterer: React.FC<MarkerClustererProps> = ({
  map,
  gyms,
  onGymClick,
  selectedGymId
}) => {
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<any>(null);

  // Create marker icon based on gym rating and selection
  const createMarkerIcon = (gym: Gym, isSelected: boolean) => {
    const baseColor = isSelected ? '#ef4444' : '#3b82f6';
    const scale = isSelected ? 1.3 : 1;
    
    // Different colors based on rating
    let color = baseColor;
    if (gym.rating >= 4.5) color = isSelected ? '#ef4444' : '#10b981'; // green for high rating
    else if (gym.rating >= 4.0) color = isSelected ? '#ef4444' : '#f59e0b'; // yellow for good rating
    else if (gym.rating >= 3.0) color = isSelected ? '#ef4444' : '#3b82f6'; // blue for average rating
    else color = isSelected ? '#ef4444' : '#6b7280'; // gray for low rating

    return {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: scale,
      anchor: new google.maps.Point(12, 24),
    };
  };

  // Create markers for all gyms
  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Create new markers
    const newMarkers = gyms.map(gym => {
      const isSelected = gym.id === selectedGymId;
      
      const marker = new google.maps.Marker({
        position: { lat: gym.location.lat, lng: gym.location.lng },
        map,
        title: `${gym.name} (${gym.rating}⭐)`,
        icon: createMarkerIcon(gym, isSelected),
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      // Add click listener
      marker.addListener('click', () => {
        onGymClick(gym);
      });

      // Add hover effects
      marker.addListener('mouseover', () => {
        marker.setIcon({
          ...createMarkerIcon(gym, isSelected),
          scale: isSelected ? 1.4 : 1.1,
        });
      });

      marker.addListener('mouseout', () => {
        marker.setIcon(createMarkerIcon(gym, isSelected));
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Initialize marker clusterer if available
    if (window.google?.maps?.marker && gyms.length > 10) {
      try {
        // This would require @googlemaps/markerclusterer package
        // For now, we'll just use regular markers
        console.log('Marker clustering would be applied for', gyms.length, 'markers');
      } catch (error) {
        console.warn('Marker clustering not available:', error);
      }
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, [map, gyms, onGymClick, selectedGymId]);

  // Update selected marker animation
  useEffect(() => {
    markersRef.current.forEach((marker, index) => {
      const gym = gyms[index];
      const isSelected = gym.id === selectedGymId;
      
      marker.setIcon(createMarkerIcon(gym, isSelected));
      
      if (isSelected) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 1500);
      } else {
        marker.setAnimation(null);
      }
    });
  }, [selectedGymId, gyms]);

  return null;
};