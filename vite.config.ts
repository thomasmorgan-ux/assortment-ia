import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Pick up saves reliably when native file events are flaky (some editors / tools).
      usePolling: true,
      interval: 300,
    },
  },
})
