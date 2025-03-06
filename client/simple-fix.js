import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('Building and fixing standalone version...');

// First, build the standalone version
try {
  execSync('npm run build:standalone-direct', { 
    stdio: 'inherit',
    cwd: projectRoot
  });
} catch (error) {
  console.error('Error building standalone version:', error.message);
  process.exit(1);
}

// Read the standalone HTML file
const standaloneFile = path.join(projectRoot, 'dist-standalone', 'index.html');
if (!fs.existsSync(standaloneFile)) {
  console.error('Error: standalone HTML file not found.');
  process.exit(1);
}

let html = fs.readFileSync(standaloneFile, 'utf8');

// Add a script to help with standalone mode
const fixScript = `
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
  });
</script>
`;

// Add the fix script before the closing head tag
html = html.replace('</head>', fixScript + '</head>');

// Write the fixed standalone HTML file
fs.writeFileSync(standaloneFile, html);
console.log('Fix applied to standalone HTML file!');

// Create a copy with a more descriptive name
const fixedFile = path.join(projectRoot, 'dist-standalone', 'fifteen-solitaire.html');
fs.copyFileSync(standaloneFile, fixedFile);
console.log(`Created a copy at: ${fixedFile}`); 