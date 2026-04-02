import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    federation({
      name: 'remote_app',
      filename: 'remoteEntry.js',
      // Generate a manifest.json file for the remote app
      manifest: true,
      exposes: {
        './Button': './src/Button',
        './Counter': './src/Counter',
        // Plain TS module — federation can expose any ES module, not just components
        './utils': './src/utils',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
    react(),
  ],
  base: 'http://localhost:4173/',
  build: {
    target: 'esnext',
  },
})
