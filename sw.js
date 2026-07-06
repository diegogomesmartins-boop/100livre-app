self.addEventListener('fetch', function(event) {
  const url = event.request.url;
  if (url.includes('/firebase/firebase-app.js') || url.includes('/firebase/firebase-firestore.js')) {
    // Serve the correct relative path
    event.respondWith(fetch(event.request));
  }
});
