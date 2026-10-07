# Design Document

## Overview

The gym locator map feature integrates Google Maps JavaScript API with Google Places API to provide an interactive map experience for discovering local gyms. The solution uses React components with the @googlemaps/react-wrapper library for seamless integration, implements geolocation services for user positioning, and leverages Google Places API for gym search functionality with ratings and reviews.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   Google Maps    │    │  Google Places  │
│                 │    │   JavaScript API │    │      API        │
│  ┌───────────┐  │    │                  │    │                 │
│  │GymLocator │  │◄──►│  - Map Display   │    │ - Gym Search    │
│  │Component  │  │    │  - Markers       │    │ - Ratings       │
│  │           │  │    │  - Info Windows  │    │ - Reviews       │
│  └───────────┘  │    │  - Clustering    │    │                 │
│                 │    └──────────────────┘    └─────────────────┘
└─────────────────┘
        │
        ▼
┌─────────────────┐
│   Geolocation   │
│     Service     │
│                 │
│ - User Location │
│ - Permissions   │
└─────────────────┘
```

### Component Architecture

```
GymLocatorPage
├── MapContainer
│   ├── GoogleMap
│   ├── GymMarker[]
│   └── InfoWindow
├── LocationService
├── PlacesService
└── ErrorBoundary
```

## Components and Interfaces

### Core Components

#### 1. GymLocatorPage
- **Purpose**: Main container component that orchestrates the gym locator feature
- **Responsibilities**: State management, API coordination, error handling
- **Props**: None (top-level page component)
- **State**: 
  - `userLocation: LatLng | null`
  - `gyms: Gym[]`
  - `selectedGym: Gym | null`
  - `loading: boolean`
  - `error: string | null`

#### 2. MapContainer
- **Purpose**: Wrapper for Google Maps integration
- **Responsibilities**: Map initialization, marker management, event handling
- **Props**: 
  - `center: LatLng`
  - `gyms: Gym[]`
  - `onGymSelect: (gym: Gym) => void`
  - `onMapMove: (bounds: LatLngBounds) => void`

#### 3. GymMarker
- **Purpose**: Individual gym marker on the map
- **Responsibilities**: Display gym location, handle click events
- **Props**:
  - `gym: Gym`
  - `onClick: () => void`
  - `isSelected: boolean`

#### 4. GymInfoWindow
- **Purpose**: Detailed gym information popup
- **Responsibilities**: Display gym details, ratings, review links
- **Props**:
  - `gym: Gym`
  - `onClose: () => void`
  - `isOpen: boolean`

### Services

#### 1. LocationService
```typescript
interface LocationService {
  getCurrentLocation(): Promise<LatLng>;
  requestPermission(): Promise<boolean>;
  watchPosition(callback: (position: LatLng) => void): number;
  clearWatch(watchId: number): void;
}
```

#### 2. PlacesService
```typescript
interface PlacesService {
  searchNearbyGyms(location: LatLng, radius: number): Promise<Gym[]>;
  getGymDetails(placeId: string): Promise<GymDetails>;
  getGymPhotos(placeId: string): Promise<string[]>;
}
```

## Data Models

### Gym Interface
```typescript
interface Gym {
  id: string;
  placeId: string;
  name: string;
  address: string;
  location: LatLng;
  rating: number;
  reviewCount: number;
  priceLevel?: number;
  openNow?: boolean;
  photos?: string[];
  website?: string;
  phoneNumber?: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface GymDetails extends Gym {
  reviews: Review[];
  openingHours: string[];
  amenities: string[];
}

interface Review {
  author: string;
  rating: number;
  text: string;
  time: number;
}
```

### Map Configuration
```typescript
interface MapConfig {
  center: LatLng;
  zoom: number;
  styles: MapTypeStyle[];
  options: {
    disableDefaultUI: boolean;
    zoomControl: boolean;
    streetViewControl: boolean;
    fullscreenControl: boolean;
  };
}
```

## API Integration

### Google Maps JavaScript API
- **Map Display**: Initialize and render interactive map
- **Markers**: Display gym locations with custom icons
- **Info Windows**: Show gym details on marker click
- **Clustering**: Group nearby markers to prevent overcrowding
- **Geolocation**: Access user's current location

### Google Places API
- **Nearby Search**: Find gyms within specified radius
- **Place Details**: Get comprehensive gym information
- **Place Photos**: Retrieve gym images
- **Reviews**: Access Google Reviews data

### API Configuration
```typescript
const mapConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  libraries: ['places', 'geometry'],
  version: 'weekly'
};

const placesSearchConfig = {
  type: 'gym',
  radius: 10000, // 10km
  fields: ['place_id', 'name', 'geometry', 'rating', 'user_ratings_total', 'vicinity', 'price_level', 'opening_hours']
};
```

## Error Handling

### Error Types and Responses

1. **Geolocation Errors**
   - Permission denied: Prompt user to enable location or enter manually
   - Position unavailable: Fall back to default city center
   - Timeout: Retry with increased timeout

2. **API Errors**
   - Maps API load failure: Show error message with retry button
   - Places API quota exceeded: Display rate limit message
   - Network errors: Show offline message with retry option

3. **Data Errors**
   - No gyms found: Display "No gyms found in this area" message
   - Invalid gym data: Skip invalid entries, log errors

### Error Boundary Implementation
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class MapErrorBoundary extends Component<Props, ErrorBoundaryState> {
  // Handle component errors gracefully
  // Provide fallback UI for map failures
  // Log errors for debugging
}
```

## Testing Strategy

### Unit Testing
- **Components**: Test rendering, props handling, event callbacks
- **Services**: Mock API calls, test error scenarios
- **Utilities**: Test location calculations, data transformations
- **Hooks**: Test custom hooks for location and places data

### Integration Testing
- **Map Integration**: Test Google Maps API integration
- **Places Search**: Test gym search functionality
- **User Interactions**: Test marker clicks, info window display
- **Error Scenarios**: Test API failures, permission denials

### E2E Testing
- **User Flow**: Complete gym discovery journey
- **Location Permission**: Test permission grant/deny scenarios
- **Map Navigation**: Test pan, zoom, marker interactions
- **Cross-browser**: Ensure compatibility across browsers

### Testing Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **MSW**: API mocking for tests
- **Cypress**: End-to-end testing

## Performance Considerations

### Optimization Strategies
1. **Marker Clustering**: Prevent performance issues with many markers
2. **Lazy Loading**: Load gym details only when needed
3. **Debounced Search**: Limit API calls during map movement
4. **Image Optimization**: Compress and cache gym photos
5. **API Caching**: Cache gym data to reduce API calls

### Loading States
- Map loading spinner during initialization
- Skeleton loaders for gym markers
- Progressive loading of gym details
- Offline state handling

## Security Considerations

### API Key Protection
- Environment variable configuration
- Domain restrictions in Google Cloud Console
- API usage monitoring and alerts

### Data Privacy
- Location permission handling
- No storage of user location data
- Compliance with location privacy regulations

### Input Validation
- Sanitize user input for manual location entry
- Validate API responses before rendering
- Handle malformed data gracefully