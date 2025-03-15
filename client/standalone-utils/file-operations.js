import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Copy PWA files to the standalone directory
export function copyPwaFiles(projectRoot, sourceDir) {
  console.log('Copying PWA files to dist-standalone directory...');
  
  // Copy manifest.json
  const manifestSource = path.join(sourceDir, 'public', 'manifest.json');
  const manifestDest = path.join(projectRoot, 'dist-standalone', 'manifest.json');
  if (fs.existsSync(manifestSource)) {
    fs.copyFileSync(manifestSource, manifestDest);
    console.log('Copied manifest.json');
  } else {
    console.warn('Warning: manifest.json not found in public directory');
  }
  
  // Copy service-worker.js
  const swSource = path.join(sourceDir, 'public', 'service-worker.js');
  const swDest = path.join(projectRoot, 'dist-standalone', 'service-worker.js');
  if (fs.existsSync(swSource)) {
    fs.copyFileSync(swSource, swDest);
    console.log('Copied service-worker.js');
  } else {
    console.warn('Warning: service-worker.js not found in public directory');
  }
  
  // Copy icon files
  const iconFiles = ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
  iconFiles.forEach(icon => {
    const sourcePath = path.join(sourceDir, 'public', icon);
    const destPath = path.join(projectRoot, 'dist-standalone', icon);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${icon}`);
    } else {
      console.warn(`Warning: ${icon} not found in public directory`);
    }
  });
}

// Build the standalone version
export function buildStandalone(projectRoot) {
  console.log('Building standalone version...');
  try {
    execSync('npm run build:standalone-direct', { 
      stdio: 'inherit',
      cwd: projectRoot
    });
    return true;
  } catch (error) {
    console.error('Error building standalone version:', error.message);
    return false;
  }
}

// Read the standalone HTML file
export function readStandaloneFile(projectRoot) {
  const standaloneFile = path.join(projectRoot, 'dist-standalone', 'index.html');
  if (!fs.existsSync(standaloneFile)) {
    console.error('Error: standalone HTML file not found.');
    return null;
  }
  
  return {
    path: standaloneFile,
    content: fs.readFileSync(standaloneFile, 'utf8')
  };
}

// Write the modified HTML file
export function writeStandaloneFiles(projectRoot, html) {
  const standaloneFile = path.join(projectRoot, 'dist-standalone', 'index.html');
  
  // Write the fixed standalone HTML file
  fs.writeFileSync(standaloneFile, html);
  console.log('Fix applied to standalone HTML file!');
  
  // Create a copy with a more descriptive name
  const fixedFile = path.join(projectRoot, 'dist-standalone', 'fifteen-solitaire.html');
  fs.copyFileSync(standaloneFile, fixedFile);
  console.log(`Created a copy at: ${fixedFile}`);
  
  return true;
} 