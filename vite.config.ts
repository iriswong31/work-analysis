import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api/webhook': {
        target: 'https://qyapi.weixin.qq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, '/cgi-bin/webhook'),
      },
    },
  }
})
