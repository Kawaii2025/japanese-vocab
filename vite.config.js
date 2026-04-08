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
    port: 5173
  }
})
