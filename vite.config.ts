import { defineConfig } from 'vite';

export default defineConfig({
  base: '/hollow-war/',
  build: {
    rollupOptions: {
      input: { home: 'index.html', play: 'play/index.html' },
    },
  },
});
