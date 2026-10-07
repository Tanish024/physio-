import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap } from './GoogleMap';
import { MapWrapper } from './MapWrapper';
import { MarkerClusterer } from './MarkerClusterer';
import { GymInfoWindow } from './GymInfoWindow';
import { MapErrorHandler } from './MapErrorHandler';
import { LatLng, Gym, MapContainerProps } from '@/types/maps';
import { isValidLocation } from '@/utils/locationUtils';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface ExtendedMapContainerProps extends MapContainerProps {
  onMapLoad?: (map: google.maps.Map) => void;
}

export const MapContainer: React.FC<ExtendedMapContainerProps> = ({
  center,
  gyms,
  onGymSelect,
  onMapMove,
  onMapLoad
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  const { error, setError, clearError, retryLastAction } = useErrorHandler();

  // Validate center coordinates
  const validCenter = isValidLocation(center) ? center : { lat: 40.7128, lng: -74.0060 };

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    try {
      setMap(mapInstance);
      setIsLoading(false);
      clearError();
      console.log('Map loaded successfully');
      onMapLoad?.(mapInstance); // Pass map instance to parent
    } catch (err) {
      console.error('Error during map load:', err);
      setError(err instanceof Error ? err : 'Failed to initialize map', 'map');
      setIsLoading(false);
    }
  }, [setError, clearError, onMapLoad]);

  const handleMapMove = useCallback((bounds: google.maps.LatLngBounds) => {
    try {
      onMapMove(bounds);
    } catch (err) {
      console.error('Error handling map move:', err);
      setError(err instanceof Error ? err : 'Failed to handle map movement', 'map');
    }
  }, [onMapMove, setError]);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    // Clear selected gym when clicking on empty map area
    if (event.latLng) {
      console.log('Map clicked at:', event.latLng.toJSON());
      setSelectedGym(null);
      setShowInfoWindow(false);
    }
  }, []);

  const handleGymClick = useCallback((gym: Gym) => {
    setSelectedGym(gym);
    setShowInfoWindow(true);
    onGymSelect(gym);
    
    // Pan to gym location
    if (map) {
      map.panTo({ lat: gym.location.lat, lng: gym.location.lng });
    }
  }, [map, onGymSelect]);

  const handleInfoWindowClose = useCallback(() => {
    setShowInfoWindow(false);
    setSelectedGym(null);
  }, []);

  const handleSeeReviews = useCallback((gym: Gym) => {
    const reviewsUrl = `https://www.google.com/maps/place/?q=place_id:${gym.placeId}`;
    window.open(reviewsUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // Update loading state when center changes
  useEffect(() => {
    if (map && center !== validCenter) {
      setIsLoading(true);
      // Loading will be set to false when map finishes panning
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [center, validCenter, map]);

  if (error) {
    return (
      <div className="w-full h-[500px] rounded-lg border bg-muted flex items-center justify-center p-6">
        <MapErrorHandler
          error={error.message}
          onRetry={retryLastAction}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <MapWrapper>
      <GoogleMap
        center={validCenter}
        zoom={12}
        theme="fitness"
        onMapLoad={handleMapLoad}
        onMapMove={handleMapMove}
        onMapClick={handleMapClick}
        loading={isLoading}
        className="w-full h-[500px] rounded-lg border"
      >
        {/* Render gym markers */}
        {map && (
          <>
            <MarkerClusterer
              map={map}
              gyms={gyms}
              onGymClick={handleGymClick}
              selectedGymId={selectedGym?.id}
            />
            
            {/* Info window for selected gym */}
            {selectedGym && (
              <GymInfoWindow
                gym={selectedGym}
                map={map}
                isOpen={showInfoWindow}
                onClose={handleInfoWindowClose}
                onSeeReviews={handleSeeReviews}
              />
            )}
          </>
        )}
      </GoogleMap>
    </MapWrapper>
  );
};