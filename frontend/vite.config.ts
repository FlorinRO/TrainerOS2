import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const apiProxyTarget = 'http://localhost:3000';

const apiProxyConfig = {
  target: apiProxyTarget,
  changeOrigin: true,
  timeout: 120000,
  proxyTimeout: 120000,
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': apiProxyConfig,
    },
  },

  preview: {
    port: 4173,
    proxy: {
      '/api': apiProxyConfig,
    },
    allowedHosts: [
      'traineros.org',
      '.traineros.org', // allows subdomains like www.traineros.org
    ],
  },
});
