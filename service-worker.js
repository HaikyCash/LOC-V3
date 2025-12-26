
const CACHE_NAME = 'loc-v2-mg-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;700;900&display=swap',
  'https://cdn-icons-png.flaticon.com/512/854/854878.png'
];

// Evento de Instalação: Salva os assets essenciais no cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto. Adicionando assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(err => {
        console.error('Service Worker: Falha ao fazer cache dos assets durante a instalação.', err);
      })
  );
});

// Evento de Ativação: Limpa caches antigos se houver.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Evento de Fetch: Intercepta as requisições.
// Estratégia: Cache-First. Tenta servir do cache, se falhar, busca na rede.
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET (ex: POST para APIs)
  if (event.request.method !== 'GET') {
    return;
  }

  // Para APIs de mapas e clima, sempre vá para a rede primeiro.
  const isApiRequest = event.request.url.includes('openstreetmap.org') ||
                       event.request.url.includes('project-osrm.org') ||
                       event.request.url.includes('open-meteo.com');

  if (isApiRequest) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Se a rede falhar, não há fallback de cache para APIs dinâmicas.
        console.warn(`Service Worker: Falha na requisição de API online: ${event.request.url}`);
      })
    );
    return;
  }
  
  // Para todos os outros assets, use a estratégia Cache-First.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se o recurso estiver no cache, retorna ele.
        if (response) {
          return response;
        }
        
        // Se não, busca na rede.
        return fetch(event.request)
          .then((networkResponse) => {
            // Opcional: Adicionar a nova requisição ao cache para futuras visitas.
            // Isso pode ser útil, mas por enquanto mantemos apenas o cache inicial.
            return networkResponse;
          })
          .catch(() => {
            console.error(`Service Worker: Falha ao buscar recurso na rede e no cache: ${event.request.url}`);
            // Aqui você poderia retornar uma página de fallback offline, se tivesse uma.
          });
      })
  );
});
