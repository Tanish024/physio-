import React from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MapErrorBoundary } from './MapErrorBoundary';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MapWrapperProps {
  children: React.ReactNode;
}

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Google Maps...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to Load Maps</AlertTitle>
            <AlertDescription className="mt-2">
              Unable to load Google Maps. Please check:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Your internet connection</li>
                <li>Google Maps API configuration</li>
                <li>API key validity</li>
              </ul>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 w-full"
                variant="outline"
              >
                Reload Page
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    default:
      return null;
  }
};

export const MapWrapper: React.FC<MapWrapperProps> = ({ children }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Google Maps API key is not configured. Please check your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <Wrapper
        apiKey={apiKey}
        render={render}
        libraries={['places', 'geometry']}
        version="weekly"
      >
        {children}
      </Wrapper>
    </MapErrorBoundary>
  );
};