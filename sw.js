const CACHE_NAME = 'wv-uber-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  // CSS e JS são embutidos no HTML, mas se você tiver arquivos externos adicione aqui
  // Exemplo: './style.css', './app.js'
  // Ícones e imagens do PWA
  './img/wvperfil_novo.png',
  './img/logonome2.png',
  './img/fotobannerwvuber.png',
  './img/Foto1.png',
  './img/foto2.png',
  './img/foto3.jpg',
  './img/Foto4.png'
  // Caso tenha outros arquivos importantes, adicione-os aqui
];

// Instalação – cache dos recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.warn('Erro ao adicionar ao cache:', err))
  );
});

// Ativação – remove caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia de fetch: cache-first para recursos estáticos, network-first para a página principal
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Se for a página principal (index.html) ou navegação, tenta rede primeiro
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza o cache com a versão mais recente
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se falhar, tenta do cache
          return caches.match(event.request)
            .then(cachedResponse => cachedResponse || caches.match('./index.html'));
        })
    );
  } else {
    // Para outros recursos (imagens, etc.) usa cache-first
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(
            networkResponse => {
              // Opcional: cache de novas imagens após carregadas
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseToCache);
                });
              }
              return networkResponse;
            }
          );
        })
    );
  }
});
