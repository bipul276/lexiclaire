import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is the correct proxy configuration for Vite
    proxy: {
      // Any request starting with '/api' will be forwarded to the backend
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    }
  },
  resolve: {
    alias: {
      // This sets up the '@/' import alias to point to your 'src' folder
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
