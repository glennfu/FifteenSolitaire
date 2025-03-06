import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('Building standalone version...');
console.log('Project root:', projectRoot);

// List files in the project root to help debug
console.log('\nFiles in project root:');
try {
  const files = fs.readdirSync(projectRoot);
  files.forEach(file => {
    const stats = fs.statSync(path.join(projectRoot, file));
    console.log(`- ${file}${stats.isDirectory() ? '/' : ''}`);
  });
} catch (error) {
  console.error('Error listing files:', error.message);
}

// List files in the client directory
console.log('\nFiles in client directory:');
try {
  const clientDir = path.join(projectRoot, 'client');
  if (fs.existsSync(clientDir)) {
    const files = fs.readdirSync(clientDir);
    files.forEach(file => {
      const stats = fs.statSync(path.join(clientDir, file));
      console.log(`- ${file}${stats.isDirectory() ? '/' : ''}`);
    });
  } else {
    console.log('Client directory not found');
  }
} catch (error) {
  console.error('Error listing files:', error.message);
}

try {
  // Run the standalone build
  console.log('\nRunning Vite build...');
  execSync('vite build --config client/vite.standalone.config.ts', { 
    stdio: 'inherit',
    cwd: projectRoot
  });
  
  console.log('Standalone build completed successfully!');
  
  // Check if the output file exists
  const outputDir = path.join(projectRoot, 'dist-standalone');
  if (fs.existsSync(outputDir)) {
    console.log('\nFiles in output directory:');
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
      console.log(`- ${file}`);
    });
    
    // Find the HTML file
    const htmlFile = files.find(file => file.endsWith('.html'));
    if (htmlFile) {
      console.log(`\nStandalone file created: dist-standalone/${htmlFile}`);
    } else {
      console.log('\nNo HTML file found in output directory');
    }
  } else {
    console.log('\nOutput directory not created');
  }
} catch (error) {
  console.error('Error building standalone version:', error.message);
  process.exit(1);
} 