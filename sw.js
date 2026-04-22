// Service Worker для базового офлайн-режима
const CACHE_NAME = 'portfolio-v1.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/assets/images/photo.webp',
  '/assets/images/favicon.webp',
  '/manifest.json',
  '/assets/icons.svg',
  '/assets/images/photo-alt.jpg',
  '/js/translations.js',
  '/js/lang.js',
  '/js/theme.js',
  '/css/a11y.css',
  '/css/mobile.css'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Проверка, можно ли кешировать запрос
function isCacheable(request) {
  const url = new URL(request.url);
  
  // Кешируем только HTTP/HTTPS запросы
  if (!url.protocol.startsWith('http')) {
    return false;
  }
  
  // Не кешируем chrome-extension:// и другие специальные протоколы
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' ||
      url.protocol === 'safari-extension:') {
    return false;
  }
  
  return true;
}

// Стратегия Network First, падаем на Cache
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Кешируем только безопасные GET-запросы к тому же origin
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Дополнительная проверка протокола (chrome-extension и т.д.)
  if (!isCacheable(req)) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(response => {
        // Не кешируем неуспешные ответы или непрозрачные ответы
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        
        // Клонируем ответ для кеша
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(req, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, берём из кеша
        return caches.match(req)
          .then(cached => {
            if (cached) {
              return cached;
            }
            
            // Для HTML возвращаем главную страницу
            const acceptHeader = req.headers.get('accept');
            if (acceptHeader && acceptHeader.includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Возвращаем ошибку, если ничего не найдено
            return new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Обработка сообщений от клиента (опционально)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        return self.clients.matchAll();
      }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      })
    );
  }
});
