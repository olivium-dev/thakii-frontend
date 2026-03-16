import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // ensure assets load correctly when served from site root (e.g. nginx /var/www/thakii-frontend)
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },
    // Proxy API calls to the REMOTE backend service - DISABLED to prevent automatic requests
    // proxy: {
    //   '/api': {
    //     target: 'http://thakii-02.fanusdigital.site:5001',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Required for top-level await in authAdapter, apiAdapter, websocketAdapter
    target: 'es2022',
  },
  preview: {
    port: 3000,
    host: true,
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore']
  }
})
