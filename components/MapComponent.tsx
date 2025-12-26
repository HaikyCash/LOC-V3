
import React, { useEffect, useRef } from 'react';
import { Place } from '../types';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  userLocation: [number, number] | null;
  places: Place[];
  route: [number, number][] | null;
  onMapClick: (lat: number, lng: number) => void;
  visualFilter: string;
  hudColor: string;
}

const MG_BOUNDS: [[number, number], [number, number]] = [
  [-22.92, -51.01], 
  [-14.23, -39.85]  
];

const MapComponent: React.FC<MapComponentProps> = ({ 
  center, 
  zoom, 
  userLocation, 
  places, 
  route,
  onMapClick,
  visualFilter,
  hudColor
}) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const maskLayerRef = useRef<any>(null);

  const getHudHex = () => {
    switch(hudColor) {
      case 'blue': return '#3b82f6';
      case 'purple': return '#be1adb';
      case 'gold': return '#fbbf24';
      default: return '#22c55e';
    }
  };

  useEffect(() => {
    if ((window as any).L && !mapRef.current && containerRef.current) {
      const L = (window as any).L;
      
      mapRef.current = L.map('map-container', {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        maxBounds: MG_BOUNDS,
        maxBoundsViscosity: 0.8,
      }).setView(center, zoom);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 5,
        className: 'gta-map-tiles'
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
      maskLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // Máscara suave periférica
      const worldCoords = [[-90, -180], [-90, 180], [90, 180], [90, -180]];
      const mgHole = [
        [MG_BOUNDS[0][0], MG_BOUNDS[0][1]], 
        [MG_BOUNDS[0][0], MG_BOUNDS[1][1]], 
        [MG_BOUNDS[1][0], MG_BOUNDS[1][1]], 
        [MG_BOUNDS[1][0], MG_BOUNDS[0][1]]
      ];
      
      L.polygon([worldCoords, mgHole], { 
        color: '#000', 
        fillColor: '#000', 
        fillOpacity: 0.35, 
        weight: 0,
        interactive: false 
      }).addTo(maskLayerRef.current);

      mapRef.current.on('click', (e: any) => onMapClick(e.latlng.lat, e.latlng.lng));

      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom]);

  useEffect(() => {
    if (mapRef.current && userLocation && (window as any).L) {
      const L = (window as any).L;
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(userLocation, {
          zIndexOffset: 1000,
          icon: L.divIcon({
            className: 'player-blip',
            html: `<div class="relative flex items-center justify-center">
                    <!-- Brilho de Albedo (Aura Expandida) -->
                    <div class="absolute w-40 h-40 bg-white/5 rounded-full blur-[40px] scale-150"></div>
                    <div class="absolute w-24 h-24 bg-white/10 rounded-full blur-[25px]"></div>
                    <div class="absolute w-12 h-12 bg-white/20 rounded-full blur-[10px] animate-pulse"></div>
                    
                    <!-- Radar Ping -->
                    <div class="absolute w-16 h-16 border border-white/30 rounded-full animate-ping opacity-30"></div>
                    
                    <!-- Ícone Nucleo -->
                    <div class="w-6 h-6 bg-white border-2 border-black rotate-45 shadow-[0_0_40px_12px_rgba(255,255,255,0.9)] z-10"></div>
                   </div>`,
            iconSize: [160, 160],
            iconAnchor: [80, 80]
          })
        }).addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLatLng(userLocation);
      }
    }
  }, [userLocation]);

  useEffect(() => {
    if (routeLayerRef.current && (window as any).L) {
      const L = (window as any).L;
      routeLayerRef.current.clearLayers();
      if (route && route.length > 0) {
        // Linha Neon Superior
        L.polyline(route, {
          color: getHudHex(), 
          weight: 6,
          opacity: 1,
          lineJoin: 'round'
        }).addTo(routeLayerRef.current);
        
        // Brilho de Trajeto
        L.polyline(route, { 
          color: getHudHex(), 
          weight: 16, 
          opacity: 0.15, 
          lineJoin: 'round' 
        }).addTo(routeLayerRef.current);
      }
    }
  }, [route, hudColor]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
        <div id="map-container" className="w-full h-full bg-[#0a0a0a]" />
        <div className="map-border-mask" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1500] pointer-events-none opacity-20">
           <div className="w-[1px] h-32 bg-gradient-to-b from-white to-transparent"></div>
        </div>
    </div>
  );
};

export default MapComponent;
