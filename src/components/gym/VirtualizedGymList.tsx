import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Gym } from '@/types/maps';
import { GymCard } from './GymCard';
import { calculateVirtualScrollItems } from '@/utils/performanceUtils';

interface VirtualizedGymListProps {
  gyms: Gym[];
  selectedGymId?: string;
  onGymSelect?: (gym: Gym) => void;
  onSeeReviews?: (gym: Gym) => void;
  onGetDirections?: (gym: Gym) => void;
  userLocation?: { lat: number; lng: number };
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

export const VirtualizedGymList: React.FC<VirtualizedGymListProps> = ({
  gyms,
  selectedGymId,
  onGymSelect,
  onSeeReviews,
  onGetDirections,
  userLocation,
  itemHeight = 200,
  containerHeight = 400,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible items using virtual scrolling
  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    return calculateVirtualScrollItems(gyms, scrollTop, {
      itemHeight,
      containerHeight,
      overscan: 3
    });
  }, [gyms, scrollTop, itemHeight, containerHeight]);

  // Handle scroll events
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  // Scroll to selected gym
  useEffect(() => {
    if (selectedGymId && containerRef.current) {
      const selectedIndex = gyms.findIndex(gym => gym.id === selectedGymId);
      if (selectedIndex !== -1) {
        const targetScrollTop = selectedIndex * itemHeight;
        containerRef.current.scrollTop = targetScrollTop;
        setScrollTop(targetScrollTop);
      }
    }
  }, [selectedGymId, gyms, itemHeight]);

  if (gyms.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <div className="text-center">
          <p className="text-lg font-medium mb-1">No gyms found</p>
          <p className="text-sm">Try searching in a different area</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item: gym, index }) => (
            <div
              key={gym.id}
              style={{ height: itemHeight }}
              className="p-2"
            >
              <GymCard
                gym={gym}
                isSelected={gym.id === selectedGymId}
                onSelect={onGymSelect}
                onSeeReviews={onSeeReviews}
                onGetDirections={onGetDirections}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};