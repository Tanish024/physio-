import { LatLng, Gym, GymDetails } from '@/types/maps';
import { GYM_SEARCH_CONFIG } from '@/config/mapConfig';

export interface PlacesServiceInterface {
  searchNearbyGyms(location: LatLng, radius?: number): Promise<Gym[]>;
  getGymDetails(placeId: string): Promise<GymDetails>;
  getGymPhotos(placeId: string): Promise<string[]>;
}

export class PlacesService implements PlacesServiceInterface {
  private static instance: PlacesService;
  private placesService: google.maps.places.PlacesService | null = null;

  public static getInstance(): PlacesService {
    if (!PlacesService.instance) {
      PlacesService.instance = new PlacesService();
    }
    return PlacesService.instance;
  }

  /**
   * Initialize the Places service with a map instance
   */
  public initialize(map: google.maps.Map): void {
    this.placesService = new google.maps.places.PlacesService(map);
  }

  /**
   * Search for nearby gyms using Google Places API
   */
  async searchNearbyGyms(location: LatLng, radius: number = GYM_SEARCH_CONFIG.radius): Promise<Gym[]> {
    if (!this.placesService) {
      throw new Error('PlacesService not initialized. Call initialize() with a map instance first.');
    }

    console.log('Searching for gyms at location:', location, 'with radius:', radius);

    return new Promise((resolve, reject) => {
      // First try with 'gym' type
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        type: 'gym',
        fields: ['place_id', 'name', 'geometry', 'rating', 'user_ratings_total', 'vicinity', 'price_level', 'opening_hours', 'photos']
      };

      this.placesService!.nearbySearch(request, (results, status) => {
        console.log('Places API response:', { status, resultsCount: results?.length || 0 });
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const gyms = this.transformPlacesToGyms(results);
          console.log('Transformed gyms:', gyms.length);
          resolve(gyms);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS || (results && results.length === 0)) {
          // If no gyms found, try searching for fitness-related keywords
          this.searchFitnessKeywords(location, radius)
            .then(resolve)
            .catch(reject);
        } else {
          console.error('Places search failed with status:', status);
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  /**
   * Search for fitness-related places using text search as fallback
   */
  private async searchFitnessKeywords(location: LatLng, radius: number): Promise<Gym[]> {
    if (!this.placesService) {
      throw new Error('PlacesService not initialized.');
    }

    const keywords = ['fitness center', 'health club', 'workout', 'crossfit', 'yoga studio'];
    const allResults: Gym[] = [];

    for (const keyword of keywords) {
      try {
        const results = await this.textSearch(keyword, location, radius);
        allResults.push(...results);
        if (allResults.length >= 10) break; // Limit results
      } catch (error) {
        console.warn(`Failed to search for ${keyword}:`, error);
      }
    }

    // Remove duplicates based on place_id
    const uniqueResults = allResults.filter((gym, index, self) => 
      index === self.findIndex(g => g.placeId === gym.placeId)
    );

    console.log('Found fitness places with keywords:', uniqueResults.length);
    return uniqueResults;
  }

  /**
   * Perform text search for fitness places
   */
  private async textSearch(query: string, location: LatLng, radius: number): Promise<Gym[]> {
    return new Promise((resolve, reject) => {
      const request: google.maps.places.TextSearchRequest = {
        query: `${query} near me`,
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        fields: ['place_id', 'name', 'geometry', 'rating', 'user_ratings_total', 'vicinity', 'price_level', 'opening_hours', 'photos']
      };

      this.placesService!.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const gyms = this.transformPlacesToGyms(results);
          resolve(gyms);
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * Get detailed information about a specific gym
   */
  async getGymDetails(placeId: string): Promise<GymDetails> {
    if (!this.placesService) {
      throw new Error('PlacesService not initialized. Call initialize() with a map instance first.');
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: [
          'place_id', 'name', 'geometry', 'rating', 'user_ratings_total',
          'vicinity', 'formatted_address', 'price_level', 'opening_hours',
          'photos', 'website', 'formatted_phone_number', 'reviews'
        ]
      };

      this.placesService!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const gymDetails = this.transformPlaceToGymDetails(place);
          resolve(gymDetails);
        } else {
          reject(new Error(`Place details request failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get photos for a specific gym
   */
  async getGymPhotos(placeId: string): Promise<string[]> {
    try {
      const gymDetails = await this.getGymDetails(placeId);
      return gymDetails.photos || [];
    } catch (error) {
      console.error('Failed to get gym photos:', error);
      return [];
    }
  }

  /**
   * Transform Google Places results to Gym objects
   */
  private transformPlacesToGyms(places: google.maps.places.PlaceResult[]): Gym[] {
    return places
      .filter(place => place.place_id && place.geometry?.location)
      .map(place => this.transformPlaceToGym(place))
      .filter(gym => gym !== null) as Gym[];
  }

  /**
   * Transform a single Google Place to Gym object
   */
  private transformPlaceToGym(place: google.maps.places.PlaceResult): Gym | null {
    if (!place.place_id || !place.geometry?.location || !place.name) {
      return null;
    }

    const location = place.geometry.location;
    const photos = place.photos?.slice(0, 3).map(photo => 
      photo.getUrl({ maxWidth: 400, maxHeight: 300 })
    ) || [];

    return {
      id: place.place_id,
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity || 'Address not available',
      location: {
        lat: location.lat(),
        lng: location.lng()
      },
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      priceLevel: place.price_level,
      openNow: place.opening_hours?.open_now,
      photos,
      website: place.website,
      phoneNumber: place.formatted_phone_number
    };
  }

  /**
   * Transform Google Place to detailed Gym object
   */
  private transformPlaceToGymDetails(place: google.maps.places.PlaceResult): GymDetails {
    const baseGym = this.transformPlaceToGym(place);
    if (!baseGym) {
      throw new Error('Invalid place data for gym details');
    }

    const reviews = place.reviews?.map(review => ({
      author: review.author_name || 'Anonymous',
      rating: review.rating || 0,
      text: review.text || '',
      time: review.time || 0
    })) || [];

    const openingHours = place.opening_hours?.weekday_text || [];

    return {
      ...baseGym,
      address: place.formatted_address || baseGym.address,
      reviews,
      openingHours,
      amenities: [] // This would need to be extracted from reviews or other sources
    };
  }

  /**
   * Check if Places service is available
   */
  public isAvailable(): boolean {
    return this.placesService !== null;
  }

  /**
   * Test the Places API with a simple search
   */
  public async testPlacesAPI(location: LatLng): Promise<boolean> {
    if (!this.placesService) {
      console.error('Places service not initialized');
      return false;
    }

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 1000,
        type: 'establishment'
      };

      this.placesService!.nearbySearch(request, (results, status) => {
        console.log('Places API test result:', { status, resultsCount: results?.length || 0 });
        resolve(status === google.maps.places.PlacesServiceStatus.OK);
      });
    });
  }

  /**
   * Get the Google Reviews URL for a place
   */
  public getReviewsUrl(placeId: string): string {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  }

  /**
   * Search for gyms in a specific area (bounds)
   */
  async searchGymsInBounds(bounds: google.maps.LatLngBounds): Promise<Gym[]> {
    if (!this.placesService) {
      throw new Error('PlacesService not initialized.');
    }

    try {
      // Validate bounds object
      if (!bounds || typeof bounds.getCenter !== 'function') {
        console.error('Invalid bounds object:', bounds);
        throw new Error('Invalid bounds object provided');
      }

      const center = bounds.getCenter();
      if (!center || typeof center.lat !== 'function' || typeof center.lng !== 'function') {
        console.error('Invalid center from bounds:', center);
        throw new Error('Invalid center from bounds');
      }

      const radius = this.calculateRadiusFromBounds(bounds);

      return this.searchNearbyGyms(
        { lat: center.lat(), lng: center.lng() },
        Math.min(radius, 50000) // Max 50km radius
      );
    } catch (error) {
      console.error('Error in searchGymsInBounds:', error);
      throw error;
    }
  }

  /**
   * Calculate radius from bounds (approximate)
   */
  private calculateRadiusFromBounds(bounds: google.maps.LatLngBounds): number {
    try {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // Calculate distance from center to corner
      const center = bounds.getCenter();
      
      // Check if geometry library is available
      if (!google.maps.geometry?.spherical?.computeDistanceBetween) {
        console.warn('Google Maps Geometry library not loaded, using approximate calculation');
        // Fallback calculation using Haversine formula
        const latDiff = ne.lat() - sw.lat();
        const lngDiff = ne.lng() - sw.lng();
        const avgLat = (ne.lat() + sw.lat()) / 2;
        
        // Approximate distance in meters
        const latDistance = latDiff * 111000; // 1 degree lat ≈ 111km
        const lngDistance = lngDiff * 111000 * Math.cos(avgLat * Math.PI / 180);
        
        return Math.round(Math.sqrt(latDistance * latDistance + lngDistance * lngDistance) / 2);
      }
      
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        center,
        ne
      );
      
      return Math.round(distance);
    } catch (error) {
      console.error('Error calculating radius from bounds:', error);
      return 10000; // Default 10km radius
    }
  }
}