import { fileURLToPath } from 'url';
import path from 'path';

// Import our utility modules
import { extractCssFromBrowser } from './standalone-utils/css-extractor.js';
import { fixScript, pwaMetaTags, serviceWorkerScript } from './standalone-utils/standalone-scripts.js';
import { minimalCss, fallbackCss } from './standalone-utils/standalone-css.js';
import { buildStandalone, readStandaloneFile, writeStandaloneFiles, copyPwaFiles } from './standalone-utils/file-operations.js';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('Building and fixing standalone version...');

// First, build the standalone version
if (!buildStandalone(projectRoot)) {
  process.exit(1);
}

// Read the standalone HTML file
const standaloneFileData = readStandaloneFile(projectRoot);
if (!standaloneFileData) {
  process.exit(1);
}

let html = standaloneFileData.content;

// Main function to get and apply CSS
async function applyStyles() {
  let cssContent = '';
  
  try {
    console.log('Attempting to extract CSS directly from browser...');
    cssContent = await extractCssFromBrowser(projectRoot);
    console.log(`Successfully extracted ${cssContent.length} bytes of CSS from browser`);
  } catch (error) {
    console.warn('Error extracting CSS from browser:', error.message);
    
    // Fallback to minimal CSS
    console.log('Using minimal CSS variables as fallback');
    cssContent = fallbackCss;
  }
  
  // Add the CSS, PWA meta tags, and fix script
  const cssStyle = `<style>${cssContent}</style>`;
  
  // Add PWA meta tags to head
  html = html.replace('<head>', '<head>' + pwaMetaTags);
  
  // Add minimal CSS first, then the extracted CSS, and finally the fix script
  html = html.replace('</head>', minimalCss + cssStyle + fixScript + '</head>');
  
  // Add service worker registration before closing body tag
  html = html.replace('</body>', serviceWorkerScript + '</body>');
  
  // Write the fixed standalone HTML files
  writeStandaloneFiles(projectRoot, html);
  
  // Copy necessary PWA files to dist-standalone directory
  copyPwaFiles(projectRoot, __dirname);
  
  // Exit immediately after creating the file
  process.exit(0);
}

// Run the main function
applyStyles().catch(error => {
  console.error('Error applying styles:', error);
  process.exit(1);
}); 