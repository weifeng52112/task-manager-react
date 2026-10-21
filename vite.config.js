import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置：开发时把 /api 请求代理到本地 Express 后端(3001)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
