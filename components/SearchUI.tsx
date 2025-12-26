
import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, MapPin, ChevronRight, Target } from 'lucide-react';
import { searchLocations } from '../services/geminiService';
import { SearchResult } from '../types';

interface SearchUIProps {
  onSelect: (target: SearchResult) => void;
  isSearching: boolean;
  isOffline: boolean;
  userLoc: [number, number];
}

const SearchUI: React.FC<SearchUIProps> = ({ onSelect, isSearching, isOffline, userLoc }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      
      const results = await searchLocations(query, { lat: userLoc[0], lng: userLoc[1] }, isOffline);
      setSuggestions(results);
    };

    const timer = setTimeout(fetchSuggestions, 350); 
    return () => clearTimeout(timer);
  }, [query, isOffline, userLoc]);

  const handleSelectSuggestion = (item: SearchResult) => {
    setQuery(item.name);
    setShowSuggestions(false);
    onSelect(item);
  };

  return (
    <div ref={containerRef} className="absolute top-6 left-0 right-0 z-[2000] px-4">
      <div className="max-w-md mx-auto relative">
        <div className="flex items-center bg-black/95 backdrop-blur-xl border-b-4 border-white px-4 py-4 shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
          <button type="button" className="p-1 text-gray-500 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <input 
            type="text"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="DESIGNAR DESTINO..."
            className="flex-1 px-4 py-1 outline-none text-white bg-transparent placeholder-gray-800 font-black italic tracking-tighter text-xl hud-font uppercase"
          />
          <div className="flex items-center gap-3">
            {isSearching ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Target size={24} className="text-white/30" />
            )}
          </div>
        </div>

        {/* Menu de Recomendações Táticas */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-black/98 border-x-4 border-b-4 border-white/20 mt-1 max-h-[60vh] overflow-y-auto no-scrollbar shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-2xl">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Sugeridos por Proximidade</p>
            </div>
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left p-5 border-b border-white/5 hover:bg-white/10 transition-all flex items-center justify-between group active:bg-white/20"
              >
                <div className="flex items-center gap-5">
                  <div className="p-2 bg-white/5 rounded-none border border-white/10 group-hover:border-green-500 group-hover:text-green-500 transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-black text-white italic hud-font truncate uppercase tracking-tight">{item.name}</span>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{item.type} • SETOR_MG</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/10 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUI;
