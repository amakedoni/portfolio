// Service Worker для базового офлайн-режима
const CACHE_NAME = 'portfolio-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/photo.webp',
  '/favicon.webp',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
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
            console.log('Deleting old cache:', cacheName);
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
  
  // Не кешируем запросы к внешним API (опционально)
  // if (url.hostname !== self.location.hostname) {
  //   return false;
  // }
  
  return true;
}

// Стратегия Network First, падаем на Cache
self.addEventListener('fetch', event => {
  // Игнорируем некешируемые запросы
  if (!isCacheable(event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Не кешируем неуспешные ответы или непрозрачные ответы
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        
        // Клонируем ответ для кеша
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            // Дополнительная проверка перед добавлением в кеш
            if (isCacheable(event.request)) {
              cache.put(event.request, responseToCache);
            }
          })
          .catch(error => {
            console.error('Cache put error:', error);
          });
        
        return response;
      })
      .catch(error => {
        console.log('Fetch failed, trying cache:', error);
        
        // Если сеть недоступна, берём из кеша
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Для HTML возвращаем главную страницу
            const acceptHeader = event.request.headers.get('accept');
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
