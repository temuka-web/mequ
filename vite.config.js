import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // ensures relative paths for images in public folder
  build: {
    chunkSizeWarningLimit: 1000, // prevent large chunk warnings
  },
});
