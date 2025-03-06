import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';

// Find the index.html file
const projectRoot = path.resolve(__dirname, '..');
let indexPath = '';

// Check common locations for index.html
const possiblePaths = [
  path.join(projectRoot, 'index.html'),
  path.join(projectRoot, 'client', 'index.html'),
  path.join(projectRoot, 'public', 'index.html'),
  path.join(projectRoot, 'client', 'public', 'index.html'),
  path.join(projectRoot, 'client', 'src', 'index.html')
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    indexPath = p;
    break;
  }
}

if (!indexPath) {
  console.error('Could not find index.html in any of the expected locations');
  process.exit(1);
}

console.log('Using index.html from:', path.relative(projectRoot, indexPath));

// Get the directory containing index.html
const rootDir = path.dirname(indexPath);

// Standalone build configuration
export default defineConfig({
  // Set the root directory to where your index.html is located
  root: rootDir,
  
  // Add path alias resolution
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@shared': path.resolve(projectRoot, 'shared'),
      // Add any other aliases your project uses
    }
  },
  
  plugins: [
    react(),
    viteSingleFile()
  ],
  
  // Define environment variables
  define: {
    'process.env.STANDALONE_MODE': JSON.stringify('true'),
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  
  build: {
    // Ensure assets are inlined
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    minify: true,
    outDir: path.join(projectRoot, 'dist-standalone'),
    emptyOutDir: true, // Add this to clear the output directory
    rollupOptions: {
      input: indexPath,
      output: {
        inlineDynamicImports: true,
      },
    },
  },
}); 