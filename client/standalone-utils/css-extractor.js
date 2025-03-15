import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { spawn } from 'child_process';
import { createServer } from 'http';

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
export async function extractCssFromBrowser(projectRoot) {
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