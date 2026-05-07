import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Determine base path based on deployment environment
let basePath = '/'

if (process.env.NODE_ENV === 'production') {
  // For GitHub Pages without custom domain, use the repository name
  // Override with VITE_BASE environment variable if needed
  // Examples:
  // - Custom domain: VITE_BASE='/' (default)
  // - GitHub Pages: VITE_BASE='/japanese-vocab/'
  basePath = process.env.VITE_BASE || '/'
}

export default defineConfig({
  plugins: [vue()],
  base: basePath,
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  // Ensure environment variables are loaded
  // .env.development loaded for dev
  // .env.production loaded for build (NODE_ENV=production)
  define: {
    __ENVIRONMENT__: JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
