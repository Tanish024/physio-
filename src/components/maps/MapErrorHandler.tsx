import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, MapPin, Wifi, Clock } from 'lucide-react';

interface MapErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  onRequestPermission?: () => void;
  className?: string;
}

export const MapErrorHandler: React.FC<MapErrorHandlerProps> = ({
  error,
  onRetry,
  onRequestPermission,
  className = ''
}) => {
  if (!error) return null;

  const getErrorDetails = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('permission') || lowerError.includes('denied')) {
      return {
        icon: MapPin,
        title: 'Location Permission Required',
        description: 'We need access to your location to find nearby gyms. Please grant permission and try again.',
        actions: [
          { label: 'Grant Permission', onClick: onRequestPermission, variant: 'default' as const },
          { label: 'Try Again', onClick: onRetry, variant: 'outline' as const }
        ]
      };
    }
    
    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
      return {
        icon: Wifi,
        title: 'Network Connection Error',
        description: 'Unable to connect to Google Maps services. Please check your internet connection.',
        actions: [
          { label: 'Retry', onClick: onRetry, variant: 'default' as const }
        ]
      };
    }
    
    if (lowerError.includes('timeout')) {
      return {
        icon: Clock,
        title: 'Request Timeout',
        description: 'The request took too long to complete. This might be due to slow internet or server issues.',
        actions: [
          { label: 'Try Again', onClick: onRetry, variant: 'default' as const }
        ]
      };
    }
    
    if (lowerError.includes('quota') || lowerError.includes('limit')) {
      return {
        icon: AlertTriangle,
        title: 'Service Temporarily Unavailable',
        description: 'Google Maps API quota has been exceeded. Please try again later.',
        actions: [
          { label: 'Try Again Later', onClick: onRetry, variant: 'outline' as const }
        ]
      };
    }
    
    if (lowerError.includes('api key') || lowerError.includes('authentication')) {
      return {
        icon: AlertTriangle,
        title: 'Configuration Error',
        description: 'There\'s an issue with the Google Maps configuration. Please contact support.',
        actions: []
      };
    }
    
    // Generic error
    return {
      icon: AlertTriangle,
      title: 'Something Went Wrong',
      description: errorMessage,
      actions: onRetry ? [
        { label: 'Try Again', onClick: onRetry, variant: 'default' as const }
      ] : []
    };
  };

  const errorDetails = getErrorDetails(error);
  const IconComponent = errorDetails.icon;

  return (
    <Alert className={`${className}`}>
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{errorDetails.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{errorDetails.description}</p>
        {errorDetails.actions.length > 0 && (
          <div className="flex gap-2">
            {errorDetails.actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant}
                onClick={action.onClick}
              >
                {action.label === 'Try Again' || action.label === 'Retry' ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : action.label === 'Grant Permission' ? (
                  <MapPin className="h-4 w-4 mr-2" />
                ) : null}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};