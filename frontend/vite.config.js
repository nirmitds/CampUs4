import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth':      'http://localhost:5000',
      '/admin':     'http://localhost:5000',
      '/faculty':   'http://localhost:5000',
      '/student':   'http://localhost:5000',
      '/user':      'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,  // suppress large chunk warnings (not errors)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios:  ['axios'],
          socket: ['socket.io-client'],
        }
      }
    }
  }
})
