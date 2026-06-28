/**
 * Beam QR decoder cache — service worker.
 * Cache-first for jsQR, ZXing IIFE, and ZXing WASM.
 * These are content-hashed assets so they can be cached indefinitely.
 */
const CACHE = 'beam-decoders-v1'

// Patterns that identify the Beam decoder assets (matched against full URL)
const CACHEABLE = [/jsQR[^/]*\.js$/, /zxing-reader\.iife[^/]*\.js$/, /zxing_reader[^/]*\.wasm$/]

function isBeamAsset(url) {
  return CACHEABLE.some(re => re.test(url))
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', e => {
  if (!isBeamAsset(e.request.url)) return // let everything else pass through
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request)
      if (cached) return cached
      const fresh = await fetch(e.request)
      if (fresh.ok) cache.put(e.request, fresh.clone())
      return fresh
    })
  )
})
