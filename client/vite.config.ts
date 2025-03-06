import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { cartographer } from '@replit/vite-plugin-cartographer';
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal';
import shadcnThemeJson from '@replit/vite-plugin-shadcn-theme-json';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    cartographer(),
    runtimeErrorModal(),
    shadcnThemeJson(),
    viteSingleFile()
  ],
  build: {
    // Ensure assets are inlined
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    // Remove brotliSize as it's deprecated
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: () => 'everything.js',
        inlineDynamicImports: true,
      },
      // Make sure to include all assets
      inlineDynamicImports: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    }
  },
  define: {
    // Provide a default value for process.env.STANDALONE_MODE in development
    'process.env.STANDALONE_MODE': JSON.stringify('false')
  }
}); 