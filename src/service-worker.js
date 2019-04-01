importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.1.1/workbox-sw.js"
);

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
  // var CACHE_NAME = "static-cache";
  // var urlsToCache = [".", "index.html", "index.css", "index.js"];
  // self.addEventListener("install", function(event) {
  //   event.waitUntil(
  //     caches.open(CACHE_NAME).then(function(cache) {
  //       return cache.addAll(urlsToCache);
  //     })
  //   );
  // });

  // self.addEventListener('fetch', function(event) {
  //   event.respondWith(
  //     caches.match(event.request)
  //     .then(function(response) {
  //       return response || fetchAndCache(event.request);
  //     })
  //   );
  // });

  // function fetchAndCache(url) {
  //   return fetch(url)
  //   .then(function(response) {
  //     // Check if we received a valid response
  //     if (!response.ok) {
  //       throw Error(response.statusText);
  //     }
  //     return caches.open(CACHE_NAME)
  //     .then(function(cache) {
  //       cache.put(url, response.clone());
  //       return response;
  //     });
  //   })
  //   .catch(function(error) {
  //     console.log('Request failed:', error);
  //     // You could return a custom offline 404 page here
  //   });
  // }

  // workbox.routing.registerRoute(
  //   new RegExp(".*.js"),
  //   new workbox.strategies.NetworkFirst()
  // );

  // workbox.routing.registerRoute(
  //   // Cache HTML files.
  //   /\.html$/,
  //   // Use cache but update in the background.
  //   new workbox.strategies.StaleWhileRevalidate({
  //     // Use a custom cache name.
  //     cacheName: "html-cache"
  //   })
  // );

  // workbox.routing.registerRoute(
  //   // Cache CSS files.
  //   /\.css$/,
  //   // Use cache but update in the background.
  //   new workbox.strategies.StaleWhileRevalidate({
  //     // Use a custom cache name.
  //     cacheName: "css-cache"
  //   })
  // );

  // workbox.routing.registerRoute(
  //   // Cache image files.
  //   /\.(?:png|jpg|jpeg|svg|gif)$/,
  //   // Use the cache if it's available.
  //   new workbox.strategies.CacheFirst({
  //     // Use a custom cache name.
  //     cacheName: "image-cache",
  //     plugins: [
  //       new workbox.expiration.Plugin({
  //         // Cache only 20 images.
  //         maxEntries: 20,
  //         // Cache for a maximum of a week.
  //         maxAgeSeconds: 7 * 24 * 60 * 60
  //       })
  //     ]
  //   })
  // );
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}
