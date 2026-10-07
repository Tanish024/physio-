import { useState, useEffect, useCallback } from 'react';
import { LocationService } from '@/services/LocationService';
import { LatLng } from '@/types/maps';

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  fallbackCity?: string;
}

export interface UseGeolocationReturn {
  location: LatLng | null;
  error: string | null;
  loading: boolean;
  supported: boolean;
  requestLocation: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  clearError: () => void;
}

export const useGeolocation = (options: UseGeolocationOptions = {}): UseGeolocationReturn => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const locationService = LocationService.getInstance();
  const supported = locationService.isGeolocationSupported();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestLocation = useCallback(async () => {
    if (!supported) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentLocation = await locationService.getLocationWithFallback(options.fallbackCity);
      setLocation(currentLocation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      
      // Set fallback location even on error
      const fallbackLocation = locationService.getFallbackLocation(options.fallbackCity);
      setLocation(fallbackLocation);
    } finally {
      setLoading(false);
    }
  }, [supported, options.fallbackCity, locationService]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) {
      setError('Geolocation is not supported by this browser');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const hasPermission = await locationService.requestPermission();
      if (hasPermission) {
        await requestLocation();
      } else {
        setError('Location permission denied');
        // Set fallback location when permission is denied
        const fallbackLocation = locationService.getFallbackLocation(options.fallbackCity);
        setLocation(fallbackLocation);
      }
      return hasPermission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request location permission';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, locationService, requestLocation, options.fallbackCity]);

  // Watch position if enabled
  useEffect(() => {
    if (options.watch && supported && location) {
      try {
        const id = locationService.watchPosition((newLocation) => {
          setLocation(newLocation);
        });
        setWatchId(id);

        return () => {
          locationService.clearWatch(id);
          setWatchId(null);
        };
      } catch (err) {
        console.warn('Failed to watch position:', err);
      }
    }
  }, [options.watch, supported, location, locationService]);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        locationService.clearWatch(watchId);
      }
    };
  }, [watchId, locationService]);

  // Auto-request location on mount if not watching
  useEffect(() => {
    if (!options.watch && supported) {
      requestLocation();
    }
  }, [options.watch, supported, requestLocation]);

  return {
    location,
    error,
    loading,
    supported,
    requestLocation,
    requestPermission,
    clearError,
  };
};