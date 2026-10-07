import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, MapPin, Search, Satellite } from 'lucide-react';

interface LoadingStateProps {
  type: 'location' | 'map' | 'places' | 'details';
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type,
  message,
  className = ''
}) => {
  const getLoadingConfig = (loadingType: string) => {
    switch (loadingType) {
      case 'location':
        return {
          icon: MapPin,
          title: 'Getting Your Location',
          defaultMessage: 'Please wait while we determine your current location...',
          color: 'text-blue-500'
        };
      case 'map':
        return {
          icon: Satellite,
          title: 'Loading Map',
          defaultMessage: 'Initializing Google Maps...',
          color: 'text-green-500'
        };
      case 'places':
        return {
          icon: Search,
          title: 'Searching for Gyms',
          defaultMessage: 'Finding nearby fitness facilities...',
          color: 'text-purple-500'
        };
      case 'details':
        return {
          icon: Loader2,
          title: 'Loading Details',
          defaultMessage: 'Getting gym information...',
          color: 'text-orange-500'
        };
      default:
        return {
          icon: Loader2,
          title: 'Loading',
          defaultMessage: 'Please wait...',
          color: 'text-gray-500'
        };
    }
  };

  const config = getLoadingConfig(type);
  const IconComponent = config.icon;

  return (
    <Alert className={className}>
      <IconComponent className={`h-4 w-4 animate-spin ${config.color}`} />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription>
        {message || config.defaultMessage}
      </AlertDescription>
    </Alert>
  );
};

interface MapLoadingSkeletonProps {
  className?: string;
}

export const MapLoadingSkeleton: React.FC<MapLoadingSkeletonProps> = ({
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map skeleton */}
      <div className="lg:col-span-2">
        <Skeleton className="w-full h-[500px] rounded-lg" />
      </div>
      
      {/* Sidebar skeleton */}
      <div className="lg:col-span-1 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-12 w-12 rounded" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface GymListSkeletonProps {
  count?: number;
  className?: string;
}

export const GymListSkeleton: React.FC<GymListSkeletonProps> = ({
  count = 3,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-6 w-8" />
    </div>
    
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
    
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-12 w-12 rounded" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      ))}
    </div>
  </div>
);