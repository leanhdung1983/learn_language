import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Use '.' to specify current directory for loadEnv, avoiding process.cwd() typing issues
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Use path.resolve('./') to point to the root directory, avoiding __dirname issues
        '@': path.resolve('./')
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY)
    },
    server: {
      host: true
    }
  };
});