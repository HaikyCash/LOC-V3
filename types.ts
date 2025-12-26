
export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  category?: 'restaurant' | 'park' | 'landmark' | 'shop' | 'street';
}

export interface WeatherData {
  temp: number;
  condition: string;
  code: number;
}

export interface SystemSettings {
  isOffline: boolean;
  radarZoom: number;
  hudColor: 'green' | 'blue' | 'purple' | 'gold';
  visualFilter: 'standard' | 'high-contrast' | 'night-vision';
  showWeather: boolean;
  notificationsEnabled: boolean;
}

export interface Instruction {
  step: string;
  distance: string;
  direction: 'left' | 'right' | 'straight' | 'arrive';
}

export interface Route {
  coordinates: [number, number][];
  instructions: Instruction[];
  totalDistance: string;
  totalTime: string;
}

export interface SearchResult {
  name: string;
  lat: number;
  lng: number;
  type: string;
}
