import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KLJUC_SHRAMBE } from '../src/izbira/IzbiraProvider.jsx';
import { izrisi } from './pomocniki.jsx';

// »Danes« je 12. 11. 2026 v Ljubljani.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-12T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const MIKRO = { id: 1, naziv: 'Mikrokrmilniki' };
const ARDUINO = {
  id: 11,
  inventarnaStevilka: 'A-014',
  naziv: 'Arduino Uno',
  kategorija: MIKRO,
  status: 'NA_VOLJO',
  trenutnoStanje: 'BREZHIBNO',
  opis: null,
};
const ESP = {
  id: 12,
  inventarnaStevilka: 'E-001',
  naziv: 'ESP32',
  kategorija: MIKRO,
  status: 'NA_VOLJO',
  trenutnoStanje: 'BREZHIBNO',
  opis: null,
};
const PRAVILA = {
  vloga: 'STUDENT',
  maxKosov: 3,
  maxDni: 7,
  dolgorocna: false,
  maxDniDolgorocno: null,
  aktivnihKosov: 0,
};

function api({ oddaja, pravila = PRAVILA } = {}) {
  return {
    'GET /api/oprema': () => [200, [ARDUINO, ESP]],
    'GET /api/oprema/:id': ({ parametri }) => [
      200,
      [ARDUINO, ESP].find((k) => k.id === Number(parametri.id)),
    ],
    'GET /api/oprema/:id/zasedenost': () => [200, []],
    'GET /api/pravila/moje': () => [200, pravila],
    'POST /api/rezervacije': oddaja ?? (({ telo }) => [201, { id: 1, status: 'ODDANA', ...telo }]),
    'GET /api/rezervacije/moje': () => [200, []],
  };
}

const nastavi = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const telesaOddaj = (fetch) =>
  fetch.mock.calls
    .filter(([url, o]) => url === '/api/rezervacije' && o.method === 'POST')
    .map(([, o]) => JSON.parse(o.body));

async function izpolni(
  uporabnik,
  { od = '2026-11-20', zadnji = '2026-11-22', namen = 'Seminarska naloga' } = {},
) {
  // Vnos datuma v jsdom: type="date" sprejme vrednost YYYY-MM-DD.
  await uporabnik.type(screen.getByLabelText(/Prvi dan/), od);
  await uporabnik.type(screen.getByLabelText(/Zadnji dan/), zadnji);
  if (namen) await uporabnik.type(screen.getByLabelText(/Namen izposoje/), namen);
}

describe('rezervacija iz kataloga (US-03, I-24)', () => {
  it('od kataloga do oddaje trije kliki: Rezerviraj, Oddaj; nato Moje izposoje in obvestilo', async () => {
    const uporabnik = nastavi();
    const { router, fetch } = izrisi('/katalog', { vloga: 'STUDENT', api: api() });

    await uporabnik.click(
      await screen.findByRole('button', { name: 'Rezerviraj: Arduino Uno (A-014)' }),
    );
    expect(router.state.location.pathname).toBe('/rezervacija');
    await izpolni(uporabnik);
    expect(screen.getByText(/Trajanje: 3 dnevi \(največ 7\)/)).toBeTruthy();
    await uporabnik.click(screen.getByRole('button', { name: 'Oddaj rezervacijo' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/moje-izposoje'));
    expect(telesaOddaj(fetch)).toEqual([
      { kosi: [11], od: '2026-11-20', do: '2026-11-22', namen: 'Seminarska naloga' },
    ]);
    expect(screen.getByRole('status').textContent).toContain(
      'Rezervacija oddana – čaka na odobritev tehnika',
    );
    // Izbira je po oddaji prazna.
    expect(JSON.parse(sessionStorage.getItem(KLJUC_SHRAMBE))).toEqual([]);
  });

  it('več kosov: Dodaj na karticah, število v glavi, en obrazec za vse', async () => {
    const uporabnik = nastavi();
    const { fetch, router } = izrisi('/katalog', { vloga: 'STUDENT', api: api() });

    await uporabnik.click(
      await screen.findByRole('button', { name: 'Dodaj k rezervaciji: Arduino Uno (A-014)' }),
    );
    await uporabnik.click(
      screen.getByRole('button', { name: 'Dodaj k rezervaciji: ESP32 (E-001)' }),
    );
    const odstrani = screen.getByRole('button', { name: 'Odstrani iz rezervacije: ESP32 (E-001)' });
    expect(odstrani.getAttribute('aria-pressed')).toBe('true');

    const meni = screen.getAllByRole('navigation', { name: 'Glavni meni' })[0];
    const povezava = within(meni).getByRole('link', { name: /Rezervacija/ });
    expect(povezava.textContent).toBe('Rezervacijaizbranih kosov: 2');

    await uporabnik.click(povezava);
    expect(router.state.location.pathname).toBe('/rezervacija');
    const seznam = screen.getByText('Izbrani kosi').nextElementSibling;
    expect(within(seznam).getAllByRole('listitem')).toHaveLength(2);

    await izpolni(uporabnik);
    await uporabnik.click(screen.getByRole('button', { name: 'Oddaj rezervacijo' }));
    await waitFor(() => expect(telesaOddaj(fetch)).toHaveLength(1));
    expect(telesaOddaj(fetch)[0].kosi).toEqual([11, 12]);
  });

  it('izbira ostane ob osvežitvi (sessionStorage) in se odstrani s seznama', async () => {
    const uporabnik = nastavi();
    sessionStorage.setItem(
      KLJUC_SHRAMBE,
      JSON.stringify([
        { id: 11, naziv: 'Arduino Uno', inventarnaStevilka: 'A-014' },
        { id: 12, naziv: 'ESP32', inventarnaStevilka: 'E-001' },
      ]),
    );
    izrisi('/rezervacija', { vloga: 'STUDENT', api: api() });

    await uporabnik.click(
      await screen.findByRole('button', { name: 'Odstrani ESP32 (E-001) iz rezervacije' }),
    );
    expect(screen.queryByText('ESP32')).toBeNull();
    await uporabnik.click(
      screen.getByRole('button', { name: 'Odstrani Arduino Uno (A-014) iz rezervacije' }),
    );
    expect(screen.getByText('Niste izbrali še nobenega kosa')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Na katalog' })).toBeTruthy();
  });

  it('namig vloge je ves čas viden (US-04)', async () => {
    sessionStorage.setItem(
      KLJUC_SHRAMBE,
      JSON.stringify([{ id: 11, naziv: 'Arduino Uno', inventarnaStevilka: 'A-014' }]),
    );
    izrisi('/rezervacija', {
      vloga: 'STUDENT',
      api: api({ pravila: { ...PRAVILA, aktivnihKosov: 2 } }),
    });
    expect(await screen.findByText(/Vaša vloga: največ 3 kosi, 7 dni\./)).toBeTruthy();
    expect(
      screen.getByText(/Trenutno imate 2 kosa v aktivnih rezervacijah, dodate lahko še 1\./),
    ).toBeTruthy();
  });

  it('predolg termin opozori že v obrazcu, odloči pa API (400 nad gumbom)', async () => {
    const uporabnik = nastavi();
    sessionStorage.setItem(
      KLJUC_SHRAMBE,
      JSON.stringify([{ id: 11, naziv: 'Arduino Uno', inventarnaStevilka: 'A-014' }]),
    );
    izrisi('/rezervacija', {
      vloga: 'STUDENT',
      api: api({
        oddaja: () => [400, { sporocilo: 'Najdaljši čas izposoje za vašo vlogo je 7 dni' }],
      }),
    });
    await screen.findByText(/Vaša vloga/);
    await izpolni(uporabnik, { od: '2026-11-20', zadnji: '2026-11-30' });
    expect(screen.getByText(/Termin je daljši, kot ga dovoljuje vaša vloga/)).toBeTruthy();

    await uporabnik.click(screen.getByRole('button', { name: 'Oddaj rezervacijo' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Najdaljši čas izposoje za vašo vlogo je 7 dni',
    );
  });

  it('400 z napakami pri poljih', async () => {
    const uporabnik = nastavi();
    sessionStorage.setItem(
      KLJUC_SHRAMBE,
      JSON.stringify([{ id: 11, naziv: 'Arduino Uno', inventarnaStevilka: 'A-014' }]),
    );
    izrisi('/rezervacija', {
      vloga: 'STUDENT',
      api: api({
        oddaja: () => [
          400,
          {
            sporocilo: 'Neveljavni podatki.',
            napake: [
              { polje: 'od', sporocilo: 'Začetek ne sme biti v preteklosti.' },
              { polje: 'namen', sporocilo: 'Vnesite namen izposoje.' },
            ],
          },
        ],
      }),
    });
    await screen.findByText(/Vaša vloga/);
    await uporabnik.click(screen.getByRole('button', { name: 'Oddaj rezervacijo' }));

    expect(await screen.findByText('Začetek ne sme biti v preteklosti.')).toBeTruthy();
    expect(screen.getByLabelText(/Prvi dan/).getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText(/Namen izposoje/).getAttribute('aria-invalid')).toBe('true');
  });

  it('409: zaseden kos z navedenim terminom nad gumbom; izbira ostane', async () => {
    const uporabnik = nastavi();
    sessionStorage.setItem(
      KLJUC_SHRAMBE,
      JSON.stringify([{ id: 11, naziv: 'Arduino Uno', inventarnaStevilka: 'A-014' }]),
    );
    const { router } = izrisi('/rezervacija', {
      vloga: 'STUDENT',
      api: api({
        oddaja: () => [409, { sporocilo: 'Arduino Uno (A-014) je zaseden od 22. 11. do 27. 11.' }],
      }),
    });
    await screen.findByText(/Vaša vloga/);
    await izpolni(uporabnik);
    await uporabnik.click(screen.getByRole('button', { name: 'Oddaj rezervacijo' }));

    const napaka = await screen.findByRole('alert');
    expect(napaka.textContent).toBe('Arduino Uno (A-014) je zaseden od 22. 11. do 27. 11.');
    // Napaka je nad gumbom za oddajo.
    expect(
      napaka.compareDocumentPosition(screen.getByRole('button', { name: 'Oddaj rezervacijo' })),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(router.state.location.pathname).toBe('/rezervacija');
    expect(JSON.parse(sessionStorage.getItem(KLJUC_SHRAMBE))).toHaveLength(1);
  });

  it('po odjavi se izbira izprazni', async () => {
    const uporabnik = nastavi();
    sessionStorage.setItem(
      KLJUC_SHRAMBE,
      JSON.stringify([{ id: 11, naziv: 'Arduino Uno', inventarnaStevilka: 'A-014' }]),
    );
    izrisi('/rezervacija', { vloga: 'STUDENT', api: api() });
    await screen.findByText('Izbrani kosi');
    await uporabnik.click(screen.getAllByRole('button', { name: 'Odjava' })[0]);
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem(KLJUC_SHRAMBE))).toEqual([]));
  });
});

describe('rezervacija na strani kosa', () => {
  it('klik v koledarju izbere prvi in zadnji dan; kos strani je v obrazcu in ga ni mogoče odstraniti', async () => {
    const uporabnik = nastavi();
    sessionStorage.setItem(
      KLJUC_SHRAMBE,
      JSON.stringify([{ id: 12, naziv: 'ESP32', inventarnaStevilka: 'E-001' }]),
    );
    const { fetch } = izrisi('/oprema/11', { vloga: 'STUDENT', api: api() });
    await screen.findByRole('heading', { level: 1, name: 'Arduino Uno' });
    await screen.findByText(/Vaša vloga/);

    await uporabnik.click(screen.getByRole('button', { name: /^20\. november 2026/ }));
    await uporabnik.click(screen.getByRole('button', { name: /^22\. november 2026/ }));
    expect(screen.getByLabelText(/Prvi dan/).value).toBe('2026-11-20');
    expect(screen.getByLabelText(/Zadnji dan/).value).toBe('2026-11-22');
    expect(
      screen.getByRole('button', { name: /^21\. november 2026/ }).getAttribute('aria-label'),
    ).toContain('izbran');

    const obrazec = screen.getByRole('form', { name: 'Rezervacija' });
    expect(within(obrazec).queryByRole('button', { name: /Odstrani Arduino/ })).toBeNull();
    expect(within(obrazec).getByRole('button', { name: /Odstrani ESP32/ })).toBeTruthy();

    await uporabnik.type(screen.getByLabelText(/Namen izposoje/), 'Vaje');
    await uporabnik.click(screen.getByRole('button', { name: 'Oddaj rezervacijo' }));
    await waitFor(() => expect(telesaOddaj(fetch)).toHaveLength(1));
    expect(telesaOddaj(fetch)[0]).toEqual({
      kosi: [11, 12],
      od: '2026-11-20',
      do: '2026-11-22',
      namen: 'Vaje',
    });
  });

  it('kos v okvari nima obrazca', async () => {
    izrisi('/oprema/11', {
      vloga: 'STUDENT',
      api: { ...api(), 'GET /api/oprema/:id': () => [200, { ...ARDUINO, status: 'V_OKVARI' }] },
    });
    await screen.findByRole('heading', { level: 1, name: 'Arduino Uno' });
    expect(screen.queryByRole('button', { name: 'Oddaj rezervacijo' })).toBeNull();
  });
});
