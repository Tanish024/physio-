import React, { useState, useEffect } from 'react';
import { MapContainer } from '@/components/maps';
import { GymList } from '@/components/gym';
import { PlacesDebugger } from '@/components/maps/PlacesDebugger';
import { LatLng, Gym } from '@/types/maps';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlaces } from '@/hooks/usePlaces';
import { PlacesService } from '@/services/PlacesService';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, AlertTriangle, Loader2, Search } from 'lucide-react';

const GymLocator: React.FC = () => {
  const {
    location,
    error: locationError,
    loading: locationLoading,
    supported,
    requestLocation,
    requestPermission,
    clearError: clearLocationError
  } = useGeolocation({ fallbackCity: 'new-york' });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    gyms,
    loading: placesLoading,
    error: placesError,
    searchGyms,
    searchInBounds,
    clearError: clearPlacesError
  } = usePlaces(map);

  // Use user location if available, otherwise fallback to NYC
  const center = location || { lat: 40.7128, lng: -74.0060 };

  // Search for gyms when location is available
  useEffect(() => {
    if (location && map && !hasSearched) {
      console.log('Triggering gym search for location:', location);
      // Add a small delay to ensure map is fully ready
      setTimeout(() => {
        searchGyms(location);
      }, 1000);
      setHasSearched(true);
    }
  }, [location, map, searchGyms, hasSearched]);

  const handleMapLoad = async (mapInstance: google.maps.Map) => {
    console.log('Map loaded successfully, setting map instance');
    setMap(mapInstance);
    
    // Initialize Places API
    try {
      const placesService = PlacesService.getInstance();
      placesService.initialize(mapInstance);
      console.log('Places service initialized');
      
      // Test Places API
      const testResult = await placesService.testPlacesAPI(center);
      console.log('Places API test result:', testResult);
      
      if (!testResult) {
        console.error('Places API test failed - check if Places API is enabled in Google Cloud Console');
        clearPlacesError();
        // Try a simple gym search anyway
        console.log('Attempting gym search despite test failure...');
        if (location) {
          await searchGyms(location);
        }
      } else {
        console.log('Places API test passed, ready for gym searches');
      }
    } catch (error) {
      console.error('Error during Places API initialization:', error);
    }
  };

  const handleGymSelect = (gym: Gym) => {
    setSelectedGym(gym);
  };

  const handleMapMove = async (bounds: google.maps.LatLngBounds) => {
    // Temporarily disabled to prevent errors - will re-enable after fixing bounds handling
    console.log('Map move detected but bounds search is disabled');
    return;
  };

  const handleRequestLocation = async () => {
    clearLocationError();
    clearPlacesError();
    await requestLocation();
  };

  const handleRequestPermission = async () => {
    clearLocationError();
    clearPlacesError();
    await requestPermission();
  };

  const handleSearchNearby = async () => {
    if (location) {
      clearPlacesError();
      await searchGyms(location);
    }
  };

  const handleSeeReviews = (gym: Gym) => {
    console.log('Opening reviews for:', gym.name);
  };

  const handleGetDirections = (gym: Gym) => {
    console.log('Getting directions to:', gym.name);
  };

  const isLoading = locationLoading || placesLoading;
  const hasError = locationError || placesError;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Find Local Gyms</h1>
        <p className="text-muted-foreground">
          Discover fitness facilities near you with ratings and reviews
        </p>
      </div>

      {/* Status and Controls */}
      <div className="mb-6">
        {!supported && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Geolocation Not Supported</AlertTitle>
            <AlertDescription>
              Your browser doesn't support location services. Using default location.
            </AlertDescription>
          </Alert>
        )}

        {hasError && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{locationError ? 'Location Error' : 'Search Error'}</AlertTitle>
            <AlertDescription className="mb-3">
              {locationError || placesError}
              {locationError && '. Using fallback location instead.'}
              {placesError && placesError.includes('bounds') && (
                <div className="mt-2 text-sm">
                  <strong>Possible solutions:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Check if Places API is enabled in Google Cloud Console</li>
                    <li>Verify API key has proper permissions</li>
                    <li>Ensure billing is set up for the Google Cloud project</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
            <div className="flex gap-2">
              <Button onClick={handleRequestLocation} variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={handleRequestPermission} variant="outline" size="sm">
                Request Permission
              </Button>
              {placesError && (
                <Button onClick={() => {
                  clearPlacesError();
                  if (location) {
                    searchGyms(location);
                  }
                }} variant="outline" size="sm">
                  Retry Search
                </Button>
              )}
            </div>
          </Alert>
        )}

        {isLoading && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>
              {locationLoading ? 'Getting Your Location' : 'Searching for Gyms'}
            </AlertTitle>
            <AlertDescription>
              {locationLoading 
                ? 'Please wait while we determine your current location...'
                : 'Finding nearby fitness facilities...'
              }
            </AlertDescription>
          </Alert>
        )}

        {location && !hasError && !isLoading && (
          <Alert className="mb-4">
            <MapPin className="h-4 w-4" />
            <AlertTitle>Location Found</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Found {gyms.length} gym{gyms.length !== 1 ? 's' : ''} near your location
              </span>
              <div className="flex gap-2">
                <Button onClick={handleSearchNearby} variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search Again
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Manual search triggered');
                    if (location) {
                      searchGyms(location);
                    }
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Manual Search
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <MapContainer
            center={center}
            gyms={gyms}
            onGymSelect={handleGymSelect}
            onMapMove={handleMapMove}
            onMapLoad={handleMapLoad}
          />
        </div>

        {/* Sidebar for gym list */}
        <div className="lg:col-span-1">
          {/* Debug component - remove in production */}
          {process.env.NODE_ENV === 'development' && map && (
            <div className="mb-4">
              <PlacesDebugger map={map} location={center} />
            </div>
          )}
          
          <div className="bg-card rounded-lg border p-4">
            <GymList
              gyms={gyms}
              selectedGymId={selectedGym?.id}
              onGymSelect={handleGymSelect}
              onSeeReviews={handleSeeReviews}
              onGetDirections={handleGetDirections}
              userLocation={location}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymLocator;