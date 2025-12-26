
import React, { useState } from 'react';
import { ArrowLeft, MapPin, Navigation, ChevronRight } from 'lucide-react';

interface NavigationOverlayProps {
  onClose: () => void;
  onPlanRoute: (start: string, end: string) => void;
  isLoading: boolean;
}

const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ onClose, onPlanRoute, isLoading }) => {
  const [start, setStart] = useState('Localização atual');
  const [end, setEnd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (end) onPlanRoute(start, end);
  };

  return (
    <div className="absolute inset-0 bg-black/98 backdrop-blur-xl z-[4000] flex flex-col animate-in slide-in-from-right duration-500">
      <div className="p-8 border-b-2 border-green-500 bg-black/50 flex items-center gap-6">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={32} />
        </button>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter hud-font">PLAN ROTA <span className="text-green-500">MG</span></h1>
          <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">SISTEMA LOC-V1</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Origem</label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-green-500">
              <MapPin size={22} />
            </div>
            <input 
              type="text"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white/5 border-l-2 border-green-500/30 text-white font-bold italic outline-none focus:bg-white/10 focus:border-green-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] ml-1">Destino em BH/MG</label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-green-400">
              <Navigation size={22} />
            </div>
            <input 
              type="text"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="Rua, praça ou estádio..."
              className="w-full pl-14 pr-6 py-5 bg-white/5 border-l-2 border-green-500 text-white font-bold italic outline-none focus:bg-white/10 transition-all text-sm"
              autoFocus
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isLoading || !end}
          className="w-full py-6 bg-green-600 text-black font-black uppercase italic tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-4 hud-font"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>INICIAR TRAJETO MG <ChevronRight size={24} /></>
          )}
        </button>
      </form>

      <div className="px-8 py-4 flex-1 overflow-y-auto no-scrollbar">
        <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-2 text-green-500/50">DESTINOS FREQUENTES BH</h3>
        <div className="space-y-3">
          {['PRAÇA DA LIBERDADE', 'MERCADO CENTRAL', 'MINEIRÃO', 'SAVASSI'].map((place) => (
            <button 
              key={place}
              onClick={() => { setEnd(place); onPlanRoute(start, place); }}
              className="flex items-center gap-5 w-full p-5 bg-white/5 hover:bg-white/10 transition-all text-left border-l-2 border-transparent hover:border-green-500 group"
            >
              <Navigation size={20} className="text-gray-600 group-hover:text-green-500 transition-colors" />
              <div>
                <p className="font-black text-sm text-gray-400 uppercase italic tracking-tight group-hover:text-white transition-colors">{place}</p>
                <p className="text-[8px] text-gray-700 font-bold uppercase">Belo Horizonte, MG</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavigationOverlay;
