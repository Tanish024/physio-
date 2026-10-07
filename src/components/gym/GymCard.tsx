import React from 'react';
import { Gym } from '@/types/maps';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, Phone, Globe, Clock, ExternalLink, Navigation } from 'lucide-react';

interface GymCardProps {
  gym: Gym;
  onSeeReviews?: (gym: Gym) => void;
  onGetDirections?: (gym: Gym) => void;
  onSelect?: (gym: Gym) => void;
  isSelected?: boolean;
  className?: string;
}

export const GymCard: React.FC<GymCardProps> = ({
  gym,
  onSeeReviews,
  onGetDirections,
  onSelect,
  isSelected = false,
  className = ''
}) => {
  const handleSeeReviews = () => {
    const reviewsUrl = `https://www.google.com/maps/place/?q=place_id:${gym.placeId}`;
    window.open(reviewsUrl, '_blank', 'noopener,noreferrer');
    onSeeReviews?.(gym);
  };

  const handleGetDirections = () => {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${gym.location.lat},${gym.location.lng}`;
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
    onGetDirections?.(gym);
  };

  const handleCardClick = () => {
    onSelect?.(gym);
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
      } ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-2">{gym.name}</h3>
            <StarRating 
              rating={gym.rating} 
              reviewCount={gym.reviewCount}
              size="sm"
            />
          </div>
          {gym.photos && gym.photos.length > 0 && (
            <img
              src={gym.photos[0]}
              alt={gym.name}
              className="w-16 h-16 object-cover rounded-lg ml-3"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-700 leading-relaxed">{gym.address}</span>
        </div>

        {/* Status and Price */}
        <div className="flex flex-wrap gap-2 mb-4">
          {gym.openNow !== undefined && (
            <Badge variant={gym.openNow ? "default" : "secondary"} className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {gym.openNow ? 'Open Now' : 'Closed'}
            </Badge>
          )}
          {gym.priceLevel !== undefined && (
            <Badge variant="outline" className="text-xs">
              {'$'.repeat(gym.priceLevel + 1)}
            </Badge>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          {gym.phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <a 
                href={`tel:${gym.phoneNumber}`}
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {gym.phoneNumber}
              </a>
            </div>
          )}
          {gym.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <a 
                href={gym.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Visit Website
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleSeeReviews();
            }}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Reviews
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleGetDirections();
            }}
            className="flex-1"
          >
            <Navigation className="h-4 w-4 mr-1" />
            Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};