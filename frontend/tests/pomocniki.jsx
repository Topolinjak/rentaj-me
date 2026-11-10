// Izris cele aplikacije (poti + kontekst uporabnika) v jsdom z lažnim backendom.
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import UporabnikProvider from '../src/auth/UporabnikProvider.jsx';
import { poti } from '../src/poti.jsx';

export const UPORABNIKI = Object.fromEntries(
  ['STUDENT', 'ASISTENT', 'PROFESOR', 'TEHNIK', 'ADMIN'].map((vloga, i) => [
    vloga,
    { id: i + 1, ime: 'Ana', priimek: 'Novak', email: 'ana@rentaj.test', vloga },
  ]),
);

const json = (status, telo) =>
  new Response(telo === undefined ? null : JSON.stringify(telo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Lažni fetch: /api/auth/jaz vrne uporabnika ali 401, odjava 204.
export function lazniBackend(uporabnik) {
  const fetch = vi.fn(async (pot, { method = 'GET' } = {}) => {
    if (pot === '/api/auth/jaz' && method === 'GET') {
      return uporabnik ? json(200, uporabnik) : json(401, { sporocilo: 'Prijava je obvezna.' });
    }
    if (pot === '/api/auth/odjava' && method === 'POST') return json(204);
    return json(404, { sporocilo: 'Ni najdeno.' });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

// izrisi('/tehnik', { vloga: 'TEHNIK' }) – brez vloge ni nihče prijavljen.
export function izrisi(pot, { vloga } = {}) {
  const fetch = lazniBackend(vloga && UPORABNIKI[vloga]);
  const router = createMemoryRouter(poti, { initialEntries: [pot] });
  render(
    <UporabnikProvider>
      <RouterProvider router={router} />
    </UporabnikProvider>,
  );
  return { router, fetch };
}
