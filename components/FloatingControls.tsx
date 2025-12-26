
import React from 'react';
import { Target, Plus, Minus, WifiOff, Wifi } from 'lucide-react';

interface FloatingControlsProps {
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({ 
  onRecenter, 
  onZoomIn, 
  onZoomOut, 
  isOffline, 
  onToggleOffline 
}) => {
  return (
    <div className="absolute right-6 bottom-28 flex flex-col gap-3 z-[2000] items-center">
      {/* Zoom Controls */}
      <div className="flex flex-col bg-black/95 border border-white/10 shadow-xl backdrop-blur-md overflow-hidden">
        <button 
          onClick={onZoomIn}
          className="p-2.5 hover:bg-white hover:text-black text-white/60 border-b border-white/5 transition-all active:scale-90"
          title="Zoom In"
        >
          <Plus size={14} />
        </button>
        <button 
          onClick={onZoomOut}
          className="p-2.5 hover:bg-white hover:text-black text-white/60 transition-all active:scale-90"
          title="Zoom Out"
        >
          <Minus size={14} />
        </button>
      </div>

      {/* Connection Toggle */}
      <button 
        onClick={onToggleOffline}
        className={`p-2.5 shadow-xl border transition-all active:scale-95 backdrop-blur-md ${
          isOffline 
            ? 'bg-orange-600 border-orange-400 text-white' 
            : 'bg-black/95 border-green-500/50 text-green-500'
        }`}
      >
        {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
      </button>

      {/* Recenter Button */}
      <button 
        onClick={onRecenter}
        className="p-5 bg-white text-black border-2 border-black shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-90 transition-all rounded-none"
      >
        <Target size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
};
