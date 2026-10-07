import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableThemes } from '@/config/mapConfig';
import { MapPin, Locate, ZoomIn, ZoomOut } from 'lucide-react';

interface MapControlsProps {
  onLocateUser?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onThemeChange?: (theme: string) => void;
  currentTheme?: string;
  isLocating?: boolean;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onLocateUser,
  onZoomIn,
  onZoomOut,
  onThemeChange,
  currentTheme = 'fitness',
  isLocating = false,
  className = ''
}) => {
  const availableThemes = getAvailableThemes();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Locate User Button */}
      {onLocateUser && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLocateUser}
          disabled={isLocating}
          className="flex items-center gap-2"
        >
          {isLocating ? (
            <MapPin className="h-4 w-4 animate-pulse" />
          ) : (
            <Locate className="h-4 w-4" />
          )}
          {isLocating ? 'Locating...' : 'My Location'}
        </Button>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center border rounded-md">
        {onZoomIn && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="rounded-r-none border-r"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        )}
        {onZoomOut && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="rounded-l-none"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Theme Selector */}
      {onThemeChange && (
        <Select value={currentTheme} onValueChange={onThemeChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {availableThemes.map((theme) => (
              <SelectItem key={theme.key} value={theme.key}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};