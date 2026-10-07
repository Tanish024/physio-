import { LatLng } from '@/types/maps';

export interface LocationServiceInterface {
  getCurrentLocation(): Promise<LatLng>;
  requestPermission(): Promise<boolean>;
  watchPosition(callback: (position: LatLng) => void): number;
  clearWatch(watchId: number): void;
}

export class LocationService implements LocationServiceInterface {
  private static instance: LocationService;
  private watchIds: Set<number> = new Set();

  // Singleton pattern to ensure only one instance
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get the user's current location
   * @returns Promise<LatLng> - User's current coordinates
   * @throws Error if geolocation fails or is not supported
   */
  async getCurrentLocation(): Promise<LatLng> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred while retrieving location';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  /**
   * Request location permission from the user
   * @returns Promise<boolean> - true if permission granted, false otherwise
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Try to get current location to trigger permission request
      await this.getCurrentLocation();
      return true;
    } catch (error) {
      console.warn('Location permission denied or failed:', error);
      return false;
    }
  }

  /**
   * Watch the user's position for changes
   * @param callback - Function to call when position changes
   * @returns number - Watch ID for clearing the watch later
   */
  watchPosition(callback: (position: LatLng) => void): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 60000, // 1 minute
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        callback(location);
      },
      (error) => {
        console.error('Watch position error:', error);
        // Continue watching even if there's an error
      },
      options
    );

    this.watchIds.add(watchId);
    return watchId;
  }

  /**
   * Clear a position watch
   * @param watchId - The watch ID returned by watchPosition
   */
  clearWatch(watchId: number): void {
    if (navigator.geolocation && this.watchIds.has(watchId)) {
      navigator.geolocation.clearWatch(watchId);
      this.watchIds.delete(watchId);
    }
  }

  /**
   * Clear all active position watches
   */
  clearAllWatches(): void {
    this.watchIds.forEach((watchId) => {
      if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    });
    this.watchIds.clear();
  }

  /**
   * Get fallback location (major city center) when user location is unavailable
   * @param city - Optional city name for specific fallback
   * @returns LatLng - Fallback coordinates
   */
  getFallbackLocation(city?: string): LatLng {
    const fallbackLocations: Record<string, LatLng> = {
      'new-york': { lat: 40.7128, lng: -74.0060 },
      'los-angeles': { lat: 34.0522, lng: -118.2437 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'houston': { lat: 29.7604, lng: -95.3698 },
      'phoenix': { lat: 33.4484, lng: -112.0740 },
      'philadelphia': { lat: 39.9526, lng: -75.1652 },
      'san-antonio': { lat: 29.4241, lng: -98.4936 },
      'san-diego': { lat: 32.7157, lng: -117.1611 },
      'dallas': { lat: 32.7767, lng: -96.7970 },
      'san-jose': { lat: 37.3382, lng: -121.8863 },
    };

    if (city && fallbackLocations[city]) {
      return fallbackLocations[city];
    }

    // Default to New York City
    return fallbackLocations['new-york'];
  }

  /**
   * Check if geolocation is supported by the browser
   * @returns boolean - true if supported, false otherwise
   */
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get location with fallback handling
   * @param fallbackCity - Optional fallback city
   * @returns Promise<LatLng> - User location or fallback location
   */
  async getLocationWithFallback(fallbackCity?: string): Promise<LatLng> {
    try {
      return await this.getCurrentLocation();
    } catch (error) {
      console.warn('Using fallback location due to error:', error);
      return this.getFallbackLocation(fallbackCity);
    }
  }
}