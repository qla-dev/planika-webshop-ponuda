import { defineConfig } from 'vite';

export default defineConfig({
  base: '/planika/dist/',
  // Windows file watcher misses some edits; polling keeps the dev server in sync
  server: { watch: { usePolling: true, interval: 300 } },
});
