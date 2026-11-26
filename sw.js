'use strict';
// Offline copy of the map. The first visit saves the page, the data and every photo;
// map tiles are saved as they are viewed (no bulk download, per the tile servers' rules).
const PAGE = 'page-v16', PHOTOS = 'photos-v2', TILES = 'tiles-v2', MAX_TILES = 2000;
const FILES = ['./', 'style.css', 'app.js', 'i18n.js', 'places.json', 'places.en.json', 'vendor/leaflet.css', 'vendor/leaflet.js', 'vendor/MarkerCluster.css', 'vendor/leaflet.markercluster.js'];

addEventListener('install', event => event.waitUntil((async () => {
  await (await caches.open(PAGE)).addAll(FILES);
  const data = await (await caches.match('places.json')).json();
  const photos = await caches.open(PHOTOS);
  await Promise.allSettled(data.places.filter(p => p.image).map(p => photos.add(p.image)));
  await skipWaiting();
})()));

addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (![PAGE, PHOTOS, TILES].includes(key)) await caches.delete(key);
  await clients.claim();
})()));

// Page files and data: the network copy when it answers within 3 s, otherwise the saved one.
async function fresh(request, key) {
  const cache = await caches.open(PAGE);
  const network = fetch(request).then(response => {if (response.ok) cache.put(key, response.clone()); return response;});
  const fast = await Promise.race([network.catch(() => null), new Promise(resolve => setTimeout(resolve, 3000))]);
  return fast || await cache.match(key, {ignoreSearch: true}) || network;
}

// Photos and tiles never change under the same address, so the saved copy goes first.
async function saved(request, name) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(name);
    await cache.put(request, response.clone());
    if (name === TILES && Math.random() < 0.05) {
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, keys.length - MAX_TILES).map(key => cache.delete(key)));
    }
  }
  return response;
}

addEventListener('fetch', event => {
  const {request} = event, url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (url.hostname === 'tile.openstreetmap.org') event.respondWith(saved(request, TILES));
  else if (url.origin !== location.origin) return;
  else if (url.pathname.includes('/photos/')) event.respondWith(saved(request, PHOTOS));
  else event.respondWith(fresh(request, request.mode === 'navigate' ? './' : request));
});
