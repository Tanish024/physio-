import { LatLng } from '@/types/maps';

export interface MapTheme {
  name: string;
  styles: google.maps.MapTypeStyle[];
}

export interface MapSettings {
  defaultCenter: LatLng;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  gestureHandling: 'cooperative' | 'greedy' | 'none' | 'auto';
  mapTypeControl: boolean;
  streetViewControl: boolean;
  fullscreenControl: boolean;
  zoomControl: boolean;
  scaleControl: boolean;
  rotateControl: boolean;
  disableDefaultUI: boolean;
}

// Default map configuration
export const DEFAULT_MAP_SETTINGS: MapSettings = {
  defaultCenter: { lat: 40.7128, lng: -74.0060 }, // New York City
  defaultZoom: 12,
  minZoom: 8,
  maxZoom: 20,
  gestureHandling: 'cooperative',
  mapTypeControl: false,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
  scaleControl: true,
  rotateControl: false,
  disableDefaultUI: false,
};

// Map themes for different use cases
export const MAP_THEMES: Record<string, MapTheme> = {
  default: {
    name: 'Default',
    styles: []
  },
  
  fitness: {
    name: 'Fitness Focus',
    styles: [
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.medical',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.school',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.government',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.place_of_worship',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.attraction',
        stylers: [{ visibility: 'simplified' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels',
        stylers: [{ visibility: 'on' }]
      },
      {
        featureType: 'poi.sports_complex',
        stylers: [{ visibility: 'on' }]
      }
    ]
  },

  minimal: {
    name: 'Minimal',
    styles: [
      {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative.land_parcel',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative.neighborhood',
        stylers: [{ visibility: 'off' }]
      }
    ]
  },

  dark: {
    name: 'Dark Mode',
    styles: [
      {
        elementType: 'geometry',
        stylers: [{ color: '#212121' }]
      },
      {
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#757575' }]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#212121' }]
      },
      {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{ color: '#757575' }]
      },
      {
        featureType: 'administrative.country',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9e9e9e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.fill',
        stylers: [{ color: '#2c2c2c' }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#757575' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#000000' }]
      }
    ]
  }
};

// Gym search configuration
export const GYM_SEARCH_CONFIG = {
  radius: 10000, // 10km in meters
  type: 'gym' as const,
  fields: [
    'place_id',
    'name',
    'geometry',
    'rating',
    'user_ratings_total',
    'vicinity',
    'price_level',
    'opening_hours',
    'photos',
    'website',
    'formatted_phone_number'
  ] as const,
  maxResults: 50,
};

// Map bounds configuration
export const MAP_BOUNDS_CONFIG = {
  padding: 50, // pixels
  maxZoom: 15,
  minZoom: 10,
};

/**
 * Get map options for Google Maps initialization
 * @param theme - Theme name to apply
 * @param customSettings - Custom settings to override defaults
 * @returns Google Maps options object
 */
export function getMapOptions(
  theme: keyof typeof MAP_THEMES = 'fitness',
  customSettings: Partial<MapSettings> = {}
): google.maps.MapOptions {
  const settings = { ...DEFAULT_MAP_SETTINGS, ...customSettings };
  const selectedTheme = MAP_THEMES[theme] || MAP_THEMES.default;

  return {
    center: settings.defaultCenter,
    zoom: settings.defaultZoom,
    minZoom: settings.minZoom,
    maxZoom: settings.maxZoom,
    gestureHandling: settings.gestureHandling,
    mapTypeControl: settings.mapTypeControl,
    streetViewControl: settings.streetViewControl,
    fullscreenControl: settings.fullscreenControl,
    zoomControl: settings.zoomControl,
    scaleControl: settings.scaleControl,
    rotateControl: settings.rotateControl,
    disableDefaultUI: settings.disableDefaultUI,
    styles: selectedTheme.styles,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };
}

/**
 * Get available map themes
 * @returns Array of theme names and display names
 */
export function getAvailableThemes() {
  return Object.entries(MAP_THEMES).map(([key, theme]) => ({
    key,
    name: theme.name
  }));
}