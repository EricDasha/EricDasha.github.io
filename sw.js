// Service Worker - 博客离线缓存
// 缓存策略：静态资源 Cache First，API 请求 Network First

const CACHE_NAME = 'blog-cache-v1';
const STATIC_CACHE = 'static-cache-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/css/welcome.css',
    '/css/imgloaded.css',
    '/custom/css/schedule.css',
    '/js/welcome.js',
    '/js/imgloaded.js',
    '/custom/js/schedule.js',
    '/custom/js/chineselunar.js'
];

// 需要缓存的 CDN 资源域名
const CACHEABLE_HOSTS = [
    'npm.elemecdn.com',
    'bu.dusays.com',
    'b.bdstatic.com',
    's2.loli.net',
    'www.helloimg.com'
];

// 安装事件：预缓存静态资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] 预缓存静态资源');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.log('[SW] 预缓存失败:', err))
    );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE)
                    .map(name => {
                        console.log('[SW] 清理旧缓存:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// 请求拦截：缓存策略
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 只处理 GET 请求
    if (event.request.method !== 'GET') return;

    // 跳过 API 请求（如 ip-api.com）
    if (url.hostname === 'ip-api.com') return;

    // 判断是否为可缓存的 CDN 资源
    const isCacheableHost = CACHEABLE_HOSTS.some(host => url.hostname.includes(host));

    // 判断是否为本站静态资源
    const isLocalAsset = url.origin === self.location.origin;

    if (isCacheableHost || isLocalAsset) {
        // Cache First 策略：优先读取缓存
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        // 后台更新缓存
                        fetch(event.request)
                            .then(response => {
                                if (response.ok) {
                                    caches.open(CACHE_NAME)
                                        .then(cache => cache.put(event.request, response));
                                }
                            })
                            .catch(() => { });
                        return cachedResponse;
                    }

                    // 无缓存，从网络获取并缓存
                    return fetch(event.request)
                        .then(response => {
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, responseClone));
                            }
                            return response;
                        });
                })
        );
    }
});

// 后台同步（可选功能）
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
