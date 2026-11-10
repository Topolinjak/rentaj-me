// Izris cele aplikacije (poti + kontekst uporabnika) v jsdom z lažnim backendom.
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import UporabnikProvider from '../src/auth/UporabnikProvider.jsx';
import IzbiraProvider from '../src/izbira/IzbiraProvider.jsx';
import ObvestilaProvider from '../src/obvestila/ObvestilaProvider.jsx';
import { poti } from '../src/poti.jsx';

export const UPORABNIKI = Object.fromEntries(
  ['STUDENT', 'ASISTENT', 'PROFESOR', 'TEHNIK', 'ADMIN'].map((vloga, i) => [
    vloga,
    { id: i + 1, ime: 'Ana', priimek: 'Novak', email: 'ana@rentaj.test', vloga },
  ]),
);

export const json = (status, telo) =>
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
// api: dodatne poti { 'GET /api/uporabniki': ({ telo, iskalni, parametri }) => [status, telo]
// | Response }. Ključ je metoda in pot brez poizvedbe, lahko s parametri (/api/oprema/:id);
// iskalni so parametri poizvedbe (URLSearchParams).
function najdiPot(api, metoda, pot) {
  for (const [kljuc, obdelava] of Object.entries(api)) {
    const [m, vzorec] = kljuc.split(' ');
    if (m !== metoda) continue;
    const imena = [];
    const regex = new RegExp(
      `^${vzorec.replace(/:(\w+)/g, (_, ime) => (imena.push(ime), '([^/]+)'))}$`,
    );
    const ujemanje = regex.exec(pot);
    if (ujemanje) {
      return {
        obdelava,
        parametri: Object.fromEntries(imena.map((ime, i) => [ime, ujemanje[i + 1]])),
      };
    }
  }
  return null;
}

export function lazniBackend(uporabnik, api = {}) {
  const fetch = vi.fn(async (url, { method = 'GET', body } = {}) => {
    const [pot, poizvedba = ''] = url.split('?');
    const najdena = najdiPot(api, method, pot);
    if (najdena) {
      const odgovor = await najdena.obdelava({
        telo: body ? JSON.parse(body) : undefined,
        iskalni: new URLSearchParams(poizvedba),
        parametri: najdena.parametri,
        pot,
      });
      return odgovor instanceof Response ? odgovor : json(...odgovor);
    }
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

// izrisi('/tehnik', { vloga: 'TEHNIK', api }) – brez vloge ni nihče prijavljen.
export function izrisi(pot, { vloga, api } = {}) {
  const fetch = lazniBackend(vloga && UPORABNIKI[vloga], api);
  const router = createMemoryRouter(poti, { initialEntries: [pot] });
  render(
    <UporabnikProvider>
      <IzbiraProvider>
        <ObvestilaProvider>
          <RouterProvider router={router} />
        </ObvestilaProvider>
      </IzbiraProvider>
    </UporabnikProvider>,
  );
  return { router, fetch };
}
