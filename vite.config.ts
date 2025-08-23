import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import https from 'https';

// Creative build optimization with chunking strategy
const createChunkingStrategy = () => ({
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-components': ['lucide-react'],
  'supabase-client': ['@supabase/supabase-js']
});

export default defineConfig({
  plugins: [
    wasm(),
    react(),
    nodePolyfills({
      include: ['stream', 'buffer', 'crypto', 'events', 'process', 'util']
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: createChunkingStrategy(),
        // Enhanced output configuration for better caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // Additional creative approach: Ensure proper external handling
      external: (id) => {
        // Don't externalize anything for this build
        return false;
      }
    },
    // Creative enhancement: Better source map and minification
    sourcemap: false,
    minify: 'esbuild',
    // Ensure assets are properly handled
    assetsDir: 'assets',
    // Creative approach: Copy public assets explicitly
    copyPublicDir: true
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  // Creative addition: Ensure proper base path resolution
  base: '/',
  // Enhanced server configuration for development
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    proxy: {
      '/api/blockchain': {
        target: 'https://blockchain.info',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/blockchain/, ''),
        secure: false,
        proxyTimeout: 60000, // Timeout for proxy connection
        timeout: 60000, // Timeout for target response
        agent: new https.Agent({ keepAlive: false })
        // Note: Blockchain.info API is a public API that does not require API keys
        // No sensitive credentials are exposed in this proxy configuration
      }
    }
  },
  // Creative approach: Enhanced preview configuration
  preview: {
    port: 4173,
    host: true,
    strictPort: false
  }
});