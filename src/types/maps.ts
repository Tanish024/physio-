export interface LatLng {
  lat: number;
  lng: number;
}

export interface Gym {
  id: string;
  placeId: string;
  name: string;
  address: string;
  location: LatLng;
  rating: number;
  reviewCount: number;
  priceLevel?: number;
  openNow?: boolean;
  photos?: string[];
  website?: string;
  phoneNumber?: string;
}

export interface GymDetails extends Gym {
  reviews: Review[];
  openingHours: string[];
  amenities: string[];
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  time: number;
}

export interface MapConfig {
  center: LatLng;
  zoom: number;
  styles?: google.maps.MapTypeStyle[];
  options: {
    disableDefaultUI: boolean;
    zoomControl: boolean;
    streetViewControl: boolean;
    fullscreenControl: boolean;
  };
}

export interface MapContainerProps {
  center: LatLng;
  gyms: Gym[];
  onGymSelect: (gym: Gym) => void;
  onMapMove: (bounds: google.maps.LatLngBounds) => void;
}

export interface GymMarkerProps {
  gym: Gym;
  onClick: () => void;
  isSelected: boolean;
}

export interface GymInfoWindowProps {
  gym: Gym;
  onClose: () => void;
  isOpen: boolean;
}