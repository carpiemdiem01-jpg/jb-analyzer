self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("jb-analyzer-cache").then(cache => {
      return cache.addAll([
        "index.html",
        "app.js",
        "manifest.json"
      ]);
    })
  );
});
