// Vite in Vitest. Proxy /api (ADR-0012): brskalnik komunicira le z Vite, ta zahteve na /api
// posreduje backendu, zato CORS ni potreben in piškotek z JWT deluje kot na enem naslovu.
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Korenski .env (skupen z backendom in Compose). Prazen prefiks: preberi vse spremenljivke,
  // a v kodo brskalnika gredo le tiste z VITE_ – tu jih uporabimo samo v nastavitvah.
  const env = { ...loadEnv(mode, '..', ''), ...process.env };

  // V Compose je backend dosegljiv kot http://backend:3000 (BACKEND_URL nastavi
  // docker-compose.yml), na gostitelju pa na vratih BACKEND_PORT.
  const backend = env.BACKEND_URL || `http://localhost:${env.BACKEND_PORT || 3000}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': backend },
    },
    test: {
      include: ['tests/**/*.test.{js,jsx}'],
      // Testi komponent tečejo v jsdom (simuliran brskalnik); setup.js po vsakem testu počisti DOM.
      environment: 'jsdom',
      setupFiles: ['tests/setup.js'],
    },
  };
});
