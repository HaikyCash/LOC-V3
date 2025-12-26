
import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapComponent from './components/MapComponent';
import SearchUI from './components/SearchUI';
import FloatingControls from './components/FloatingControls';
import NavigationOverlay from './components/NavigationOverlay';
import { searchLocations, getRoute } from './services/geminiService';
import { Route, SearchResult, SystemSettings, WeatherData } from './types';
import { 
  Map as MapIcon, 
  Compass, 
  Settings, 
  X, 
  Wifi,
  ShieldAlert,
  Instagram,
  Navigation,
  Target
} from 'lucide-react';

const BOOT_LOGS = [
    "> INITIALIZING TACTICAL KERNEL...",
    "> MG-SAT LINK 100% ESTABLISHED",
    "> SECTOR DATA LOADED: MINAS GERAIS",
    "> HUD SYNC COMPLETE",
    "> ACCESS GRANTED: LEONARDO BRASILEIRO"
];

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [heading, setHeading] = useState(0);

  const [center, setCenter] = useState<[number, number]>([-19.9322, -43.9378]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const [settings, setSettings] = useState<SystemSettings>({
    isOffline: false,
    radarZoom: 15,
    hudColor: 'green',
    visualFilter: 'standard',
    showWeather: true,
    notificationsEnabled: true
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNavOverlay, setShowNavOverlay] = useState(false);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);

  const watchId = useRef<number | null>(null);

  const updateTime = useCallback(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
      const data = await res.json();
      if (data.current_weather) {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          condition: "MG Local",
          code: data.current_weather.weathercode
        });
      }
    } catch (e) {
      console.warn("Weather offline");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 2000);
          return 100;
        }
        return prev + 5;
      });
    }, 30);

    const logInterval = setInterval(() => setLogIndex(v => (v + 1) % BOOT_LOGS.length), 400);
    const clockInterval = setInterval(updateTime, 1000);
    updateTime();
    
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (p) => {
          const coords: [number, number] = [p.coords.latitude, p.coords.longitude];
          setUserLocation(coords);
          if (p.coords.heading !== null) setHeading(Math.round(p.coords.heading));
          
          if (!userLocation) {
            setCenter(coords);
            fetchWeather(coords[0], coords[1]);
          }
        },
        (err) => console.error("GPS Signal Lost:", err),
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    }

    return () => {
        clearInterval(interval);
        clearInterval(logInterval);
        clearInterval(clockInterval);
        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [fetchWeather, updateTime, userLocation]);

  const handleRecenter = () => {
    if (userLocation) {
      setCenter(userLocation);
      setSettings(s => ({ ...s, radarZoom: 17 }));
    }
  };

  const handleSelectTarget = async (target: SearchResult) => {
    setIsSearching(true);
    setShowBottomDrawer(false); 
    const startPos = userLocation || center;
    try {
      const routeData = await getRoute(startPos, [target.lat, target.lng], settings.isOffline);
      setActiveRoute(routeData);
      setCenter(startPos);
      setSettings(s => ({...s, radarZoom: 17}));
      setShowBottomDrawer(true);
    } catch (error) {
      console.error("Erro na rota:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getHudColorClass = () => {
    switch(settings.hudColor) {
      case 'blue': return 'text-blue-500 border-blue-500';
      case 'purple': return 'text-purple-500 border-purple-500';
      case 'gold': return 'text-yellow-500 border-yellow-500';
      default: return 'text-green-500 border-green-500';
    }
  };

  const getHudBgClass = () => {
    switch(settings.hudColor) {
      case 'blue': return 'bg-blue-600';
      case 'purple': return 'bg-purple-600';
      case 'gold': return 'bg-yellow-600';
      default: return 'bg-green-600';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-12 overflow-hidden select-none">
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.05), rgba(0, 255, 0, 0.03), rgba(0, 0, 255, 0.05))', backgroundSize: '100% 4px, 4px 100%' }}></div>
        <div className="text-center space-y-10 w-full max-w-sm relative z-10">
          <div className="space-y-6">
            <h1 className="text-8xl font-black italic text-white tracking-tighter hud-font glitch">LOC-V2</h1>
            <div className={`h-2 w-full ${getHudBgClass()} opacity-80 shadow-[0_0_20px_white]`}></div>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.5em]">OPERACIONAL POR</p>
              <p className="text-3xl text-white font-black uppercase tracking-[0.1em] hud-font">LEONARDO BRASILEIRO</p>
            </div>
          </div>
          <div className="w-full h-1 bg-white/5 relative overflow-hidden">
            <div className="h-full bg-white transition-all duration-300" style={{ width: `${loadProgress}%` }}></div>
          </div>
          <p className="text-[11px] text-green-500 font-mono tracking-widest uppercase animate-pulse">{BOOT_LOGS[logIndex]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-black text-white overflow-hidden color-hud-${settings.hudColor}`}>
      {/* HUD SUPERIOR REFINADO - TAMANHO REDUZIDO */}
      <div className="absolute top-0 left-0 right-0 h-14 z-[6000] flex items-end justify-between px-6 pb-2 bg-gradient-to-b from-black via-black/40 to-transparent safe-top pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[7px] font-black hud-font text-white/20 tracking-widest uppercase">Direção</span>
          <span className="text-sm font-black hud-font text-white">{heading}° <span className="text-[8px] opacity-30">AZM</span></span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[7px] font-black hud-font text-white/20 tracking-widest uppercase">Tempo_MG</span>
          <span className="text-sm font-black hud-font text-white">{currentTime}</span>
        </div>
      </div>

      {!showNavOverlay && !showSettings && (
        <SearchUI 
          onSelect={handleSelectTarget} 
          isSearching={isSearching} 
          isOffline={settings.isOffline}
          userLoc={userLocation || center}
        />
      )}

      <MapComponent 
        center={center} 
        zoom={settings.radarZoom} 
        userLocation={userLocation} 
        places={[]}
        route={activeRoute?.coordinates || null}
        onMapClick={(lat, lng) => { 
            handleSelectTarget({ name: "ALVO DESIGNADO", lat, lng, type: "COORD" });
        }}
        visualFilter={settings.visualFilter}
        hudColor={settings.hudColor}
      />

      <FloatingControls 
        onRecenter={handleRecenter}
        onZoomIn={() => setSettings(s => ({...s, radarZoom: Math.min(18, s.radarZoom + 1)}))}
        onZoomOut={() => setSettings(s => ({...s, radarZoom: Math.max(6, s.radarZoom - 1)}))}
        isOffline={settings.isOffline}
        onToggleOffline={() => setSettings(s => ({...s, isOffline: !s.isOffline}))}
      />

      {!activeRoute && (
        <div className="absolute bottom-36 left-8 z-[2000] flex flex-col gap-3">
           {weather && (
             <div className="bg-black/60 px-2 py-1 border-l border-white/20 backdrop-blur-md">
               <p className="text-[6px] font-black text-white/20 uppercase tracking-widest">MG-SAT</p>
               <p className="text-[10px] font-black text-white hud-font">{weather.temp}°C</p>
             </div>
           )}
           <a href="https://instagram.com/almejarei" target="_blank" className="flex flex-col gap-0.5 bg-black/80 px-3 py-2 border-l-2 border-white/20 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <Instagram size={8} className="text-pink-500" />
              <span className="text-[6px] font-black text-white/30 tracking-widest uppercase">ENGINE BY</span>
            </div>
            <span className="text-[9px] font-black text-white tracking-widest uppercase hud-font">@ALMEJAREI</span>
          </a>
        </div>
      )}

      {/* HUD DE NAVEGAÇÃO COMPACTO */}
      <div className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t-4 border-white/5 z-[3000] transition-transform duration-500 safe-bottom ${activeRoute ? 'translate-y-0' : 'translate-y-full'}`}>
        {activeRoute && (
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 ${getHudBgClass()} text-black shadow-lg animate-pulse`}>
                <Navigation size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black italic hud-font tracking-tighter leading-none">{activeRoute.totalTime}</span>
                  <span className={`text-[7px] font-black uppercase ${getHudColorClass().split(' ')[0]} tracking-[0.1em]`}>PREVISÃO</span>
                </div>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.1em] mt-0.5">{activeRoute.totalDistance} • MISSÃO EM CURSO</p>
              </div>
            </div>
            <button 
              onClick={() => { setActiveRoute(null); setShowBottomDrawer(false); }} 
              className="p-3 bg-white/5 hover:bg-red-600 active:scale-90 transition-all border border-white/5"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* BARRA DE MENU PRINCIPAL - Ícones Reduzidos */}
      {!activeRoute && (
        <div className="absolute bottom-0 left-0 right-0 bg-black h-16 flex items-center justify-around border-t border-white/5 z-[4000] safe-bottom">
          <button onClick={() => { setShowBottomDrawer(false); }} className={`${getHudColorClass().split(' ')[0]} flex flex-col items-center gap-1`}>
            <MapIcon size={14} />
            <span className="text-[7px] font-black uppercase">Radar</span>
          </button>
          <button onClick={() => setShowNavOverlay(true)} className="text-white/20 hover:text-white flex flex-col items-center gap-1 transition-colors">
            <Target size={14} />
            <span className="text-[7px] font-black uppercase">Alvo</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="text-white/20 hover:text-white flex flex-col items-center gap-1 transition-colors">
            <Settings size={14} />
            <span className="text-[7px] font-black uppercase">Core</span>
          </button>
        </div>
      )}

      {/* Fix for line 294: Converting array coordinate to required object structure for searchLocations */}
      {showNavOverlay && <NavigationOverlay onClose={() => setShowNavOverlay(false)} onPlanRoute={(s, e) => {
        const loc = userLocation || center;
        searchLocations(e, { lat: loc[0], lng: loc[1] }, settings.isOffline).then(res => {
          if (res.length > 0) handleSelectTarget(res[0]);
          setShowNavOverlay(false);
        });
      }} isLoading={isSearching} />}
      
      {showSettings && (
        <div className="absolute inset-0 bg-black z-[5000] p-8 flex flex-col animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
             <h2 className="text-2xl font-black italic hud-font tracking-tighter uppercase">MG_CORE</h2>
             <button onClick={() => setShowSettings(false)} className="p-2 bg-white/5"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <button onClick={() => setSettings(s => ({...s, isOffline: !s.isOffline}))} className={`w-full p-6 font-black text-left border-l-4 flex justify-between items-center ${settings.isOffline ? 'bg-orange-600/10 border-orange-600 text-orange-500' : 'bg-green-600/10 border-green-600 text-green-500'}`}>
              <div className="flex flex-col">
                <span className="text-sm uppercase tracking-tight">{settings.isOffline ? 'Offline Mode' : 'Sat-Connect'}</span>
                <span className="text-[8px] opacity-40 uppercase font-black tracking-widest">{settings.isOffline ? 'Local Data Only' : 'MG-Link Active'}</span>
              </div>
              <Wifi size={20} />
            </button>
            <div className="p-6 bg-white/5 border-l-4 border-gray-800">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-4">Metadata</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[8px] text-white/20 uppercase font-bold mb-0.5">Lead Developer</p>
                  <p className="font-black text-lg uppercase hud-font text-white">Leonardo Brasileiro</p>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[8px] text-white/20 uppercase font-bold mb-0.5">Architecture</p>
                    <a href="https://instagram.com/almejarei" target="_blank" className="font-black text-[10px] uppercase hud-font text-pink-500">@ALMEJAREI</a>
                  </div>
                  <p className="text-[8px] text-white/10 font-mono">v2.6.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
