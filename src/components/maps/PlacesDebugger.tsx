import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlacesService } from '@/services/PlacesService';
import { LatLng } from '@/types/maps';

interface PlacesDebuggerProps {
  map: google.maps.Map | null;
  location: LatLng;
}

export const PlacesDebugger: React.FC<PlacesDebuggerProps> = ({ map, location }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    if (!map) {
      setDebugInfo({ error: 'Map not available' });
      return;
    }

    setTesting(true);
    const placesService = PlacesService.getInstance();
    
    try {
      // Initialize service
      placesService.initialize(map);
      
      const diagnostics = {
        mapAvailable: !!map,
        placesServiceInitialized: placesService.isAvailable(),
        location,
        apiKeyPresent: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        googleMapsLoaded: typeof google !== 'undefined',
        placesAPILoaded: typeof google?.maps?.places !== 'undefined',
      };

      // Test basic Places API
      const testResult = await placesService.testPlacesAPI(location);
      diagnostics.placesAPITest = testResult;

      // Try a simple gym search
      try {
        const gyms = await placesService.searchNearbyGyms(location, 5000);
        diagnostics.gymSearchResult = {
          success: true,
          count: gyms.length,
          gyms: gyms.slice(0, 3) // First 3 for debugging
        };
      } catch (error) {
        diagnostics.gymSearchResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      setDebugInfo(diagnostics);
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Places API Diagnostics</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runDiagnostics} disabled={testing} className="mb-4">
          {testing ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
        
        {debugInfo && (
          <div className="space-y-2">
            {debugInfo.error ? (
              <Badge variant="destructive">Error: {debugInfo.error}</Badge>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Map Available: <Badge variant={debugInfo.mapAvailable ? "default" : "destructive"}>{debugInfo.mapAvailable ? "Yes" : "No"}</Badge></div>
                  <div>Places Service: <Badge variant={debugInfo.placesServiceInitialized ? "default" : "destructive"}>{debugInfo.placesServiceInitialized ? "Yes" : "No"}</Badge></div>
                  <div>API Key Present: <Badge variant={debugInfo.apiKeyPresent ? "default" : "destructive"}>{debugInfo.apiKeyPresent ? "Yes" : "No"}</Badge></div>
                  <div>Google Maps Loaded: <Badge variant={debugInfo.googleMapsLoaded ? "default" : "destructive"}>{debugInfo.googleMapsLoaded ? "Yes" : "No"}</Badge></div>
                  <div>Places API Loaded: <Badge variant={debugInfo.placesAPILoaded ? "default" : "destructive"}>{debugInfo.placesAPILoaded ? "Yes" : "No"}</Badge></div>
                  <div>Places API Test: <Badge variant={debugInfo.placesAPITest ? "default" : "destructive"}>{debugInfo.placesAPITest ? "Pass" : "Fail"}</Badge></div>
                </div>
                
                {debugInfo.gymSearchResult && (
                  <div className="mt-4">
                    <h4 className="font-medium">Gym Search Result:</h4>
                    {debugInfo.gymSearchResult.success ? (
                      <div>
                        <Badge variant="default">Found {debugInfo.gymSearchResult.count} gyms</Badge>
                        {debugInfo.gymSearchResult.gyms.length > 0 && (
                          <div className="mt-2 text-xs">
                            <strong>Sample gyms:</strong>
                            <ul className="list-disc list-inside">
                              {debugInfo.gymSearchResult.gyms.map((gym: any, index: number) => (
                                <li key={index}>{gym.name} - {gym.address}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="destructive">Failed: {debugInfo.gymSearchResult.error}</Badge>
                    )}
                  </div>
                )}
                
                <div className="mt-4 text-xs text-muted-foreground">
                  <strong>Location:</strong> {debugInfo.location.lat.toFixed(4)}, {debugInfo.location.lng.toFixed(4)}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};