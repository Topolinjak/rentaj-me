// Vite in Vitest. Proxy /api (ADR-0012): brskalnik komunicira le z Vite, ta zahteve na /api
// posreduje backendu, zato CORS ni potreben in piškotek z JWT deluje kot na enem naslovu.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Korenski .env (skupen z backendom in Compose). Ne beremo ga z Vitejevim loadEnv: ta bi iz
// njega prevzel NODE_ENV=development, ki je namenjen backendu, in »npm run build« bi zgradil
// razvojno različico (React za razvoj, import.meta.env.DEV = true). V Compose datoteke ni.
function korenskiEnv() {
  try {
    return parseEnv(readFileSync(new URL('../.env', import.meta.url), 'utf8'));
  } catch {
    return {};
  }
}

export default defineConfig(() => {
  const env = { ...korenskiEnv(), ...process.env };

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
