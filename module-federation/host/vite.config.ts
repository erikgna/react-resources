import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    federation({
      name: 'host',
      remotes: {
        // Define remote app entry point
        // Solution from @module-federation/vite, it's a map of the remote app
        remote_app: 'http://localhost:4173/mf-manifest.json',
      },
      shared: {
        // Shared modules between the host and the remote app it prevents duplicate modules in the final bundle
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
    react(),
  ],
  base: 'http://localhost:4174/',
  build: {
    // Target the latest JavaScript features
    target: 'esnext',
  },
  preview: {
    port: 4174,
  },
})
