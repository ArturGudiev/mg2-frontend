import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Optional same-origin proxy if cookie issues appear across ports
      '/proxy-api': {
        target: 'http://localhost:3033',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-api/, ''),
      },
    },
  },
})
