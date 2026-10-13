import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const bffTarget = env.VITE_BFF_API_URL || 'https://vitrine-bff-285078287322.us-central1.run.app'
  const ucpTarget = env.VITE_UCP_API_URL || 'https://vitrine-ucp-285078287322.us-central1.run.app'

  return {
    plugins: [react()],
    build: {
      outDir: 'build',
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: bffTarget,
          changeOrigin: true,
          secure: true,
        },
        '/ucp': {
          target: ucpTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
