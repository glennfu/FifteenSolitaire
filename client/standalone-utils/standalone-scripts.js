// Add a script to help with standalone mode
export const fixScript = `
<script>
  // Set a global flag for standalone mode that will be checked by the app
  window.STANDALONE_MODE = true;
  
  // Standalone mode helper
  window.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing standalone mode helper');
    
    // Force hash-based routing for wouter
    window.__WOUTER_HASH_ROUTING__ = true;
    
    // Intercept fetch calls to handle API requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (url.startsWith('/api/') || url.startsWith('api/')) {
        console.log('Standalone mode: API call intercepted', url);
        return Promise.resolve(new Response(JSON.stringify({
          success: true,
          message: 'This is a standalone version. API calls are not available.',
          mockData: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return originalFetch(url, options);
    };
    
    // Force navigation to the home route
    setTimeout(function() {
      if (window.location.hash !== '#/') {
        window.location.hash = '#/';
      }
    }, 100);
    
    // Add iOS standalone class to body when launched from home screen
    if (window.navigator.standalone) {
      document.body.classList.add("ios-standalone");
      
      // Ensure the felt background extends to the top in standalone mode
      document.addEventListener('visibilitychange', function() {
        // When the app becomes visible again, ensure the background is properly applied
        if (document.visibilityState === 'visible') {
          // Force a small reflow to ensure the background is properly applied
          document.body.style.display = 'none';
          setTimeout(function() {
            document.body.style.display = '';
          }, 10);
        }
      });
    }
    
    // Set background color for html and body
    document.documentElement.style.backgroundColor = '#0d5c2e';
    document.body.style.backgroundColor = '#0d5c2e';
  });
</script>
`;

// Add PWA meta tags and service worker registration
export const pwaMetaTags = `
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0d5c2e">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Fifteen">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
`;

// Service worker registration script
export const serviceWorkerScript = `
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
</script>
`; 