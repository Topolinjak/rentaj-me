// Izris cele aplikacije (poti + kontekst uporabnika) v jsdom z lažnim backendom.
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import UporabnikProvider from '../src/auth/UporabnikProvider.jsx';
import ObvestilaProvider from '../src/obvestila/ObvestilaProvider.jsx';
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

// Računi za lažno prijavo: <vloga>@rentaj.test / geslo123; deaktiviran@rentaj.test je
// deaktiviran (403). Odgovori posnemajo backend/src/routes/auth.js.
function laznaPrijava(telo) {
  const { email = '', geslo = '' } = JSON.parse(telo ?? '{}');
  const napake = [];
  if (!email) napake.push({ polje: 'email', sporocilo: 'Vnesite e-poštni naslov.' });
  if (!geslo) napake.push({ polje: 'geslo', sporocilo: 'Vnesite geslo.' });
  if (napake.length) return json(400, { sporocilo: 'Neveljavni podatki.', napake });

  const vloga = email.split('@')[0].toUpperCase();
  if (email === 'deaktiviran@rentaj.test' && geslo === 'geslo123') {
    return json(403, { sporocilo: 'Račun je deaktiviran. Obrnite se na administratorja.' });
  }
  if (!UPORABNIKI[vloga] || geslo !== 'geslo123') {
    return json(401, { sporocilo: 'Napačen e-poštni naslov ali geslo' });
  }
  return json(200, { ...UPORABNIKI[vloga], email });
}

// Lažni fetch: /api/auth/jaz vrne uporabnika ali 401, prijava kot zgoraj, odjava 204.
export function lazniBackend(uporabnik) {
  const fetch = vi.fn(async (pot, { method = 'GET', body } = {}) => {
    if (pot === '/api/auth/jaz' && method === 'GET') {
      return uporabnik ? json(200, uporabnik) : json(401, { sporocilo: 'Prijava je obvezna.' });
    }
    if (pot === '/api/auth/prijava' && method === 'POST') return laznaPrijava(body);
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
      <ObvestilaProvider>
        <RouterProvider router={router} />
      </ObvestilaProvider>
    </UporabnikProvider>,
  );
  return { router, fetch };
}
