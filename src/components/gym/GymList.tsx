import React, { useMemo } from 'react';
import { Gym } from '@/types/maps';
import { GymCard } from './GymCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, MapPin } from 'lucide-react';

interface GymListProps {
  gyms: Gym[];
  selectedGymId?: string;
  onGymSelect?: (gym: Gym) => void;
  onSeeReviews?: (gym: Gym) => void;
  onGetDirections?: (gym: Gym) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

type SortOption = 'rating' | 'distance' | 'reviews' | 'name';

export const GymList: React.FC<GymListProps> = ({
  gyms,
  selectedGymId,
  onGymSelect,
  onSeeReviews,
  onGetDirections,
  userLocation,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortOption>('rating');
  const [filterByRating, setFilterByRating] = React.useState<number>(0);

  // Calculate distance from user location
  const calculateDistance = (gym: Gym): number => {
    if (!userLocation) return 0;
    
    const R = 6371; // Earth's radius in km
    const dLat = (gym.location.lat - userLocation.lat) * Math.PI / 180;
    const dLng = (gym.location.lng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(gym.location.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter and sort gyms
  const filteredAndSortedGyms = useMemo(() => {
    let filtered = gyms.filter(gym => {
      const matchesSearch = gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           gym.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = gym.rating >= filterByRating;
      return matchesSearch && matchesRating;
    });

    // Sort gyms
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          if (!userLocation) return 0;
          return calculateDistance(a) - calculateDistance(b);
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [gyms, searchTerm, sortBy, filterByRating, userLocation]);

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Nearby Gyms
          {filteredAndSortedGyms.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {filteredAndSortedGyms.length}
            </Badge>
          )}
        </h2>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search gyms by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="reviews">Reviews</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filterByRating.toString()} 
            onValueChange={(value) => setFilterByRating(Number(value))}
          >
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Ratings</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gym List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAndSortedGyms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-1">No gyms found</p>
            <p className="text-sm">
              {searchTerm || filterByRating > 0 
                ? 'Try adjusting your search or filters'
                : 'Try searching in a different area'
              }
            </p>
          </div>
        ) : (
          filteredAndSortedGyms.map((gym) => (
            <div key={gym.id} className="relative">
              <GymCard
                gym={gym}
                isSelected={gym.id === selectedGymId}
                onSelect={onGymSelect}
                onSeeReviews={onSeeReviews}
                onGetDirections={onGetDirections}
              />
              {userLocation && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    {formatDistance(calculateDistance(gym))}
                  </Badge>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};