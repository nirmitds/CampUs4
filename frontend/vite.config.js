import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth':    'http://localhost:5000',
      '/admin':   'http://localhost:5000',
      '/faculty': 'http://localhost:5000',
      '/student': 'http://localhost:5000',
      '/user':    'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    }
  },
  build: {
    outDir: 'dist',
  }
})
