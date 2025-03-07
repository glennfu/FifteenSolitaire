import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { spawn } from 'child_process';
import http from 'http';
import https from 'https';
import { createServer } from 'http';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Create a simple HTML file that will extract CSS from the running app
const extractorHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>CSS Extractor</title>
</head>
<body>
  <div id="result"></div>
  <script>
    // Function to extract all CSS from the page
    function extractAllCSS() {
      let allCSS = '';
      
      // Get all stylesheet rules
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          const rules = sheet.cssRules || sheet.rules;
          
          for (let j = 0; j < rules.length; j++) {
            allCSS += rules[j].cssText + '\\n';
          }
        } catch (e) {
          console.error('Error accessing stylesheet', e);
        }
      }
      
      // Get all style elements
      const styleElements = document.querySelectorAll('style');
      for (let i = 0; i < styleElements.length; i++) {
        allCSS += styleElements[i].textContent + '\\n';
      }
      
      return allCSS;
    }
    
    // Wait for styles to load
    setTimeout(() => {
      // Extract CSS
      const css = extractAllCSS();
      
      // Display result
      document.getElementById('result').textContent = css;
      
      // Send to server
      fetch('/extract-css', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: css
      }).then(() => {
        document.getElementById('result').textContent += '\\n\\nCSS sent to server successfully!';
      }).catch(err => {
        document.getElementById('result').textContent += '\\n\\nError sending CSS: ' + err.message;
      });
    }, 2000);
  </script>
</body>
</html>
`;

// Create a simple server to serve the extractor and receive the CSS
async function extractCssFromBrowser() {
  return new Promise((resolve, reject) => {
    let extractedCss = '';
    let serverProcess = null;
    let extractorServer = null;
    
    try {
      // Create a file for the extractor
      const extractorPath = path.join(projectRoot, 'css-extractor.html');
      fs.writeFileSync(extractorPath, extractorHtml);
      
      // Create a server to receive the extracted CSS
      extractorServer = createServer((req, res) => {
        if (req.url === '/extract-css' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            extractedCss = body;
            res.writeHead(200);
            res.end('CSS received');
            
            // Clean up but don't wait for it
            if (serverProcess) {
              try {
                process.kill(-serverProcess.pid);
              } catch (e) {
                // Ignore errors when killing the process
              }
            }
            
            if (extractorServer) {
              extractorServer.close();
            }
            
            if (fs.existsSync(extractorPath)) {
              fs.unlinkSync(extractorPath);
            }
            
            resolve(extractedCss);
          });
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      }).listen(3456);
      
      console.log('CSS extractor server running on port 3456');
      
      // Start the development server if not already running
      console.log('Starting development server...');
      serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: projectRoot,
        detached: true,
        stdio: 'ignore'
      });
      
      // Wait for server to start
      console.log('Waiting for development server to start...');
      setTimeout(() => {
        // Use curl to load the extractor page with the app loaded
        console.log('Extracting CSS from browser...');
        try {
          execSync(`curl -s http://localhost:3000 > ${extractorPath}`);
          
          // Append the extraction script to the HTML
          let appHtml = fs.readFileSync(extractorPath, 'utf8');
          appHtml += `
            <script>
              // Function to extract all CSS from the page
              function extractAllCSS() {
                let allCSS = '';
                
                // Get all stylesheet rules
                for (let i = 0; i < document.styleSheets.length; i++) {
                  try {
                    const sheet = document.styleSheets[i];
                    const rules = sheet.cssRules || sheet.rules;
                    
                    for (let j = 0; j < rules.length; j++) {
                      allCSS += rules[j].cssText + '\\n';
                    }
                  } catch (e) {
                    console.error('Error accessing stylesheet', e);
                  }
                }
                
                // Get all style elements
                const styleElements = document.querySelectorAll('style');
                for (let i = 0; i < styleElements.length; i++) {
                  allCSS += styleElements[i].textContent + '\\n';
                }
                
                return allCSS;
              }
              
              // Wait for styles to load
              setTimeout(() => {
                // Extract CSS
                const css = extractAllCSS();
                
                // Send to server
                fetch('http://localhost:3456/extract-css', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'text/plain'
                  },
                  body: css
                });
              }, 2000);
            </script>
          `;
          fs.writeFileSync(extractorPath, appHtml);
          
          // Open the page in a browser
          const openCommand = process.platform === 'win32' ? 'start' : 
                             process.platform === 'darwin' ? 'open' : 'xdg-open';
          execSync(`${openCommand} ${extractorPath}`);
          
          // Set a timeout to fail if we don't get the CSS
          setTimeout(() => {
            if (!extractedCss) {
              reject(new Error('Timed out waiting for CSS extraction'));
            }
          }, 20000);
        } catch (error) {
          reject(error);
        }
      }, 5000);
    } catch (error) {
      // Clean up
      if (serverProcess) {
        try {
          process.kill(-serverProcess.pid);
        } catch (e) {
          // Ignore errors when killing the process
        }
      }
      
      if (extractorServer) {
        extractorServer.close();
      }
      
      const extractorPath = path.join(projectRoot, 'css-extractor.html');
      if (fs.existsSync(extractorPath)) {
        fs.unlinkSync(extractorPath);
      }
      
      reject(error);
    }
  });
}

// Add CSS variables for radius
const cssVars = `
<style>
  :root {
    --radius: 0.5rem;
  }
</style>
`;

// Main function to get and apply CSS
async function applyStyles() {
  let cssContent = '';
  
  try {
    console.log('Attempting to extract CSS directly from browser...');
    cssContent = await extractCssFromBrowser();
    console.log(`Successfully extracted ${cssContent.length} bytes of CSS from browser`);
  } catch (error) {
    console.warn('Error extracting CSS from browser:', error.message);
    
    // Fallback to minimal CSS
    console.log('Using minimal CSS variables as fallback');
    cssContent = `
      :root {
        --radius: 1rem;
      }
      
      @media (prefers-color-scheme: dark) {
        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
        }
      }
      
      .rounded-lg {
        border-radius: var(--radius);
      }
    `;
  }
  
  // Add the CSS and fix script
  const cssStyle = `<style>${cssContent}</style>`;
  html = html.replace('</head>', cssVars + cssStyle + fixScript + '</head>');
  
  // Write the fixed standalone HTML file
  fs.writeFileSync(standaloneFile, html);
  console.log('Fix applied to standalone HTML file!');
  
  // Create a copy with a more descriptive name
  const fixedFile = path.join(projectRoot, 'dist-standalone', 'fifteen-solitaire.html');
  fs.copyFileSync(standaloneFile, fixedFile);
  console.log(`Created a copy at: ${fixedFile}`);
  
  // Exit immediately after creating the file
  process.exit(0);
}

// Run the main function
applyStyles().catch(error => {
  console.error('Error applying styles:', error);
  process.exit(1);
});

// This code will never run due to the process.exit(0) in applyStyles
// Copy necessary files for PWA
const publicDir = path.join(__dirname, 'public');
const buildDir = path.join(__dirname, 'dist');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy service worker
fs.copyFileSync(
  path.join(publicDir, 'service-worker.js'),
  path.join(buildDir, 'service-worker.js')
);

// Copy manifest
fs.copyFileSync(
  path.join(publicDir, 'manifest.json'),
  path.join(buildDir, 'manifest.json')
);

// Copy icons if they exist
const iconFiles = ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
iconFiles.forEach(icon => {
  const sourcePath = path.join(publicDir, icon);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, path.join(buildDir, icon));
  } else {
    console.warn(`Warning: ${icon} not found in public directory`);
  }
});

console.log("Build completed successfully!"); 