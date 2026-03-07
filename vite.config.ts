import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true
  },
  // Importante para SPA
  preview: {
    port: 3001,
    host: true
  }
})