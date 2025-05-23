import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  base:'./',
  build: {
    outDir: 'dist', // Aseg�rate de que esto coincida con la ruta en main.js
  }
})