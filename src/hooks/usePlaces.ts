import { useState, useEffect, useCallback } from 'react';
import { PlacesService } from '@/services/PlacesService';
import { LatLng, Gym, GymDetails } from '@/types/maps';
import { gymCache, memoryMonitor } from '@/utils/performanceUtils';
import { useDebounce } from '@/hooks/useDebounce';

export interface UsePlacesOptions {
  autoSearch?: boolean;
  radius?: number;
}

export interface UsePlacesReturn {
  gyms: Gym[];
  loading: boolean;
  error: string | null;
  searchGyms: (location: LatLng, radius?: number) => Promise<void>;
  searchInBounds: (bounds: google.maps.LatLngBounds) => Promise<void>;
  getGymDetails: (placeId: string) => Promise<GymDetails | null>;
  clearError: () => void;
  clearGyms: () => void;
}

export const usePlaces = (
  map: google.maps.Map | null,
  options: UsePlacesOptions = {}
): UsePlacesReturn => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placesService, setPlacesService] = useState<PlacesService | null>(null);

  const { autoSearch = false, radius = 10000 } = options;

  // Initialize Places service when map is available
  useEffect(() => {
    if (map && !placesService) {
      console.log('Initializing Places service with map');
      const service = PlacesService.getInstance();
      service.initialize(map);
      setPlacesService(service);
      console.log('Places service initialized:', service.isAvailable());
    }
  }, [map, placesService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearGyms = useCallback(() => {
    setGyms([]);
  }, []);

  const searchGyms = useCallback(async (location: LatLng, searchRadius?: number) => {
    console.log('searchGyms called with:', { location, searchRadius, placesServiceAvailable: !!placesService });
    
    if (!placesService) {
      console.error('Places service not initialized');
      setError('Places service not initialized');
      return;
    }

    const searchRadiusValue = searchRadius || radius;
    
    // Check cache first
    const cachedResults = gymCache.get(location.lat, location.lng, searchRadiusValue);
    if (cachedResults) {
      setGyms(cachedResults);
      console.log(`Found ${cachedResults.length} gyms from cache`);
      return;
    }

    console.log('Starting gym search...');
    setLoading(true);
    setError(null);

    try {
      const results = await placesService.searchNearbyGyms(location, searchRadiusValue);
      
      // Cache the results
      gymCache.set(location.lat, location.lng, searchRadiusValue, results);
      
      setGyms(results);
      console.log(`Successfully found ${results.length} gyms near location`);
      
      // Log memory usage in development
      if (process.env.NODE_ENV === 'development') {
        memoryMonitor.logMemoryUsage('Gym Search');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search for gyms';
      console.error('Gym search failed:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [placesService, radius]);

  // Debounce bounds search to prevent excessive API calls
  const debouncedSearchInBounds = useCallback(async (bounds: google.maps.LatLngBounds) => {
    if (!placesService) {
      setError('Places service not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await placesService.searchGymsInBounds(bounds);
      setGyms(results);
      console.log(`Found ${results.length} gyms in bounds`);
      
      // Log memory usage in development
      if (process.env.NODE_ENV === 'development') {
        memoryMonitor.logMemoryUsage('Bounds Search');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search for gyms in area';
      setError(errorMessage);
      console.error('Gym bounds search error:', err);
    } finally {
      setLoading(false);
    }
  }, [placesService]);

  const searchInBounds = useDebounce(debouncedSearchInBounds, 1000);

  const getGymDetails = useCallback(async (placeId: string): Promise<GymDetails | null> => {
    if (!placesService) {
      setError('Places service not initialized');
      return null;
    }

    try {
      const details = await placesService.getGymDetails(placeId);
      return details;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get gym details';
      setError(errorMessage);
      console.error('Gym details error:', err);
      return null;
    }
  }, [placesService]);

  return {
    gyms,
    loading,
    error,
    searchGyms,
    searchInBounds,
    getGymDetails,
    clearError,
    clearGyms,
  };
};