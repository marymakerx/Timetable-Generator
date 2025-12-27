import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Timetable-Generator/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          howler: ['howler']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
