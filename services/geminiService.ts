
import { GoogleGenAI, Type } from "@google/genai";
import { Route, SearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const OFFLINE_DB: SearchResult[] = [
  { name: "MERCADO CENTRAL BH", lat: -19.9230, lng: -43.9444, type: "MERCADO" },
  { name: "PRAÇA DA LIBERDADE", lat: -19.9322, lng: -43.9378, type: "PRAÇA" },
  { name: "ESTÁDIO MINEIRÃO", lat: -19.8659, lng: -43.9710, type: "ESTÁDIO" },
  { name: "IGREJINHA DA PAMPULHA", lat: -19.8585, lng: -43.9791, type: "TURISMO" },
  { name: "SAVASSI", lat: -19.9388, lng: -43.9326, type: "CENTRO COMERCIAL" },
  { name: "HOSPITAL JOÃO XXIII", lat: -19.9247, lng: -43.9351, type: "HOSPITAL" },
  { name: "OURO PRETO - CENTRO", lat: -20.3855, lng: -43.5035, type: "HISTÓRICO" },
  { name: "TIRADENTES - MATRIZ", lat: -21.1105, lng: -44.1775, type: "HISTÓRICO" },
  { name: "CAPITÓLIO - CANYONS", lat: -20.6214, lng: -46.2847, type: "NATUREZA" },
  { name: "UBERLÂNDIA - CENTER SHOPPING", lat: -18.9132, lng: -48.2622, type: "SHOPPING" }
];

export async function searchLocations(query: string, userLoc: {lat: number, lng: number}, isOffline: boolean): Promise<SearchResult[]> {
  const normalizedQuery = query.toLowerCase();
  
  if (isOffline) {
    return OFFLINE_DB.filter(item => 
      item.name.toLowerCase().includes(normalizedQuery) || 
      item.type.toLowerCase().includes(normalizedQuery)
    );
  }

  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Minas Gerais, Brasil")}&limit=8&viewbox=-51.01,-14.23,-39.85,-22.92&bounded=1`;
    const geoRes = await fetch(geoUrl, { headers: { 'Accept-Language': 'pt-BR' } });
    const geoData = await geoRes.json();

    if (geoData && geoData.length > 0) {
      return geoData.map((item: any) => ({
        name: item.display_name.split(',')[0].toUpperCase(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: (item.type || 'LOCAL').toUpperCase()
      }));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é o sistema LOC-V1 especialista em Minas Gerais. Busque por "${query}" e retorne JSON com locais reais em MG: name, lat, lng, type.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              type: { type: Type.STRING }
            },
            required: ["name", "lat", "lng", "type"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return OFFLINE_DB.filter(item => item.name.toLowerCase().includes(normalizedQuery));
  }
}

export async function getRoute(start: [number, number], end: [number, number], isOffline: boolean): Promise<Route> {
  if (isOffline) {
    // Para modo offline, como não temos um banco de dados de ruas local no navegador, 
    // indicamos o trajeto direto como "vetor de estimativa".
    return {
      coordinates: [start, end],
      instructions: [],
      totalDistance: "ESTIMADA",
      totalTime: "OFFLINE"
    };
  }

  try {
    // ALTERADO PARA 'driving' para seguir ruas corretamente como no GTA
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    const data = await res.json();

    if (data.code !== 'Ok') throw new Error("Erro no roteamento");

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);

    return {
      coordinates,
      instructions: [],
      totalDistance: (route.distance < 1000) ? `${Math.round(route.distance)}m` : `${(route.distance/1000).toFixed(1)}km`,
      totalTime: `${Math.round(route.duration / 60)} MIN`
    };
  } catch (e) {
    return {
      coordinates: [start, end],
      instructions: [],
      totalDistance: "--",
      totalTime: "--"
    };
  }
}
