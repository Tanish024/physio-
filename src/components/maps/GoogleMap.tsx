import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LatLng } from '@/types/maps';
import { getMapOptions, DEFAULT_MAP_SETTINGS } from '@/config/mapConfig';
import { Loader2 } from 'lucide-react';

interface GoogleMapProps {
  center: LatLng;
  zoom?: number;
  theme?: 'default' | 'fitness' | 'minimal' | 'dark';
  onMapLoad?: (map: google.maps.Map) => void;
  onMapMove?: (bounds: google.maps.LatLngBounds) => void;
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  onZoomChanged?: (zoom: number) => void;
  children?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom = DEFAULT_MAP_SETTINGS.defaultZoom,
  theme = 'fitness',
  onMapLoad,
  onMapMove,
  onMapClick,
  onZoomChanged,
  children,
  className = "w-full h-[400px]",
  loading = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced bounds change handler
  const handleBoundsChange = useCallback(() => {
    if (!map || !onMapMove) return;

    // Clear existing timeout
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }

    // Set new timeout for debounced execution
    boundsChangeTimeoutRef.current = setTimeout(() => {
      try {
        const bounds = map.getBounds();
        if (bounds && typeof bounds.getCenter === 'function') {
          onMapMove(bounds);
        } else {
          console.warn('Invalid bounds object from map.getBounds():', bounds);
        }
      } catch (error) {
        console.error('Error getting map bounds:', error);
      }
    }, 500); // 500ms debounce
  }, [map, onMapMove]);

  // Debounced zoom change handler
  const handleZoomChange = useCallback(() => {
    if (!map || !onZoomChanged) return;

    // Clear existing timeout
    if (zoomChangeTimeoutRef.current) {
      clearTimeout(zoomChangeTimeoutRef.current);
    }

    // Set new timeout for debounced execution
    zoomChangeTimeoutRef.current = setTimeout(() => {
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined) {
        onZoomChanged(currentZoom);
      }
    }, 300); // 300ms debounce
  }, [map, onZoomChanged]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }

    try {
      const mapOptions = getMapOptions(theme, {
        defaultCenter: center,
        defaultZoom: zoom,
      });

      const mapInstance = new google.maps.Map(mapRef.current, mapOptions);

      // Wait for map to be fully loaded
      google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        setIsMapReady(true);
        onMapLoad?.(mapInstance);
      });

      // Add bounds change listener with debouncing (disabled temporarily to prevent errors)
      // TODO: Re-enable after fixing bounds handling
      // if (onMapMove) {
      //   mapInstance.addListener('bounds_changed', handleBoundsChange);
      // }

      // Add zoom change listener with debouncing
      if (onZoomChanged) {
        mapInstance.addListener('zoom_changed', handleZoomChange);
      }

      // Add click listener
      if (onMapClick) {
        mapInstance.addListener('click', onMapClick);
      }

      setMap(mapInstance);

    } catch (error) {
      console.error('Failed to initialize Google Map:', error);
    }

    return () => {
      // Cleanup
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
      if (zoomChangeTimeoutRef.current) {
        clearTimeout(zoomChangeTimeoutRef.current);
      }
      if (map) {
        google.maps.event.clearInstanceListeners(map);
      }
    };
  }, [center, zoom, theme, onMapLoad, onMapMove, onMapClick, onZoomChanged, handleBoundsChange, handleZoomChange, map]);

  // Update map center when prop changes
  useEffect(() => {
    if (map && center && isMapReady) {
      map.panTo(center);
    }
  }, [map, center, isMapReady]);

  // Update zoom when prop changes
  useEffect(() => {
    if (map && isMapReady) {
      map.setZoom(zoom);
    }
  }, [map, zoom, isMapReady]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Loading overlay */}
      {(loading || !isMapReady) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading map data...' : 'Initializing map...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Render children only when map is ready */}
      {map && isMapReady && children}
    </div>
  );
};