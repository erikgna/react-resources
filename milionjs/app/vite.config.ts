import million from 'million/compiler';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // million.vite() is a BUILD-TIME compiler pass, not a runtime library. This is why
  // Million "depends on build compilation" — it rewrites eligible components into Blocks
  // during bundling. `auto: true` tells it to analyze every component and auto-wrap the
  // ones it deems safe, so you get optimization without hand-wrapping each in block().
  // Order matters: million must run before the React plugin to transform JSX first.
  plugins: [million.vite({ auto: true }), react()],
})
