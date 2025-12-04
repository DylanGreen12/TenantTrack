import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import Unocss from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), Unocss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5249',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
