import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { izrisi } from './pomocniki.jsx';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-12T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const UPORABNIK = { id: 7, ime: 'Bor', priimek: 'Kos', email: 'bor@um.si', vloga: 'STUDENT' };
const kosA = {
  id: 1,
  naziv: 'Arduino Uno',
  inventarnaStevilka: 'A-014',
  trenutnoStanje: 'OBRABLJENO',
  stanjeObIzdaji: null,
  stanjeObVracilu: null,
};
const kosB = {
  id: 2,
  naziv: 'Multimeter',
  inventarnaStevilka: 'M-002',
  trenutnoStanje: 'BREZHIBNO',
  stanjeObIzdaji: null,
  stanjeObVracilu: null,
};

const rez = (id, status, od, zadnji, ostalo = {}) => ({
  id,
  status,
  od,
  do: zadnji,
  namen: 'Vaje',
  uporabnik: UPORABNIK,
  kosi: [kosA, kosB],
  zamujena: false,
  dniZamude: 0,
  steviloZamud: 0,
  steviloNeporavnanihPoskodb: 0,
  izdanoOb: null,
  ...ostalo,
});

const nastavi = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

function strezi({ izdaja } = {}) {
  let odobrene = [
    rez(1, 'ODOBRENA', '2026-11-15', '2026-11-18'),
    rez(2, 'ODOBRENA', '2026-11-12', '2026-11-13'),
  ];
  return {
    'GET /api/rezervacije': ({ iskalni }) => {
      if (iskalni.get('status') === 'ODOBRENA') return [200, odobrene];
      return [
        200,
        [
          rez(3, 'IZDANA', '2026-11-10', '2026-11-20', { izdanoOb: '2026-11-10T08:00:00.000Z' }),
          rez(4, 'IZDANA', '2026-11-01', '2026-11-09', {
            izdanoOb: '2026-11-01T08:00:00.000Z',
            zamujena: true,
            dniZamude: 3,
          }),
        ],
      ];
    },
    'PATCH /api/rezervacije/:id/izdaja':
      izdaja ??
      (({ parametri }) => {
        odobrene = odobrene.filter((r) => r.id !== Number(parametri.id));
        return [200, { id: Number(parametri.id), status: 'IZDANA' }];
      }),
  };
}

const kartica = (besedilo) =>
  screen.getAllByRole('article').find((a) => a.textContent.includes(besedilo));

describe('izdaja (US-07)', () => {
  it('odobrene po začetku termina, z informacijo o prevzemu', async () => {
    izrisi('/tehnik/odobrene', { vloga: 'TEHNIK', api: strezi() });
    const kartice = await screen.findAllByRole('article');
    expect(kartice[0].textContent).toContain('Prevzem že mogoč.');
    expect(kartice[1].textContent).toContain('Prevzem od 15. 11. 2026.');
  });

  it('za vsak kos izbira stanja, privzeto trenutno stanje; oddaja stanj in obvestilo', async () => {
    const uporabnik = nastavi();
    const { fetch } = izrisi('/tehnik/odobrene', { vloga: 'TEHNIK', api: strezi() });
    await screen.findAllByRole('article');
    await uporabnik.click(within(kartica('15. 11.')).getByRole('button', { name: 'Izdaj' }));

    const okno = screen.getByRole('dialog', { name: 'Izdaja opreme' });
    expect(within(okno).getByLabelText(/Arduino Uno \(A-014\)/).value).toBe('OBRABLJENO');
    expect(within(okno).getByLabelText(/Multimeter \(M-002\)/).value).toBe('BREZHIBNO');
    await uporabnik.selectOptions(within(okno).getByLabelText(/Multimeter/), 'POSKODOVANO');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Potrdi izdajo' }));

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    const klic = fetch.mock.calls.find(([url]) => url === '/api/rezervacije/1/izdaja');
    expect(JSON.parse(klic[1].body)).toEqual({
      kosi: [
        { id: 1, stanje: 'OBRABLJENO' },
        { id: 2, stanje: 'POSKODOVANO' },
      ],
    });
    expect(screen.getByRole('status', { name: 'Obvestila' }).textContent).toContain(
      'Oprema je izdana uporabniku Bor Kos',
    );
  });

  it('Potrdi izdajo je onemogočen, dokler niso izbrana vsa stanja', async () => {
    const uporabnik = nastavi();
    izrisi('/tehnik/odobrene', { vloga: 'TEHNIK', api: strezi() });
    await screen.findAllByRole('article');
    await uporabnik.click(within(kartica('15. 11.')).getByRole('button', { name: 'Izdaj' }));
    const okno = screen.getByRole('dialog');
    await uporabnik.selectOptions(within(okno).getByLabelText(/Arduino/), '');
    expect(within(okno).getByRole('button', { name: 'Potrdi izdajo' }).disabled).toBe(true);
  });

  it('napaka API-ja (409) ostane v oknu', async () => {
    const uporabnik = nastavi();
    izrisi('/tehnik/odobrene', {
      vloga: 'TEHNIK',
      api: strezi({
        izdaja: () => [
          409,
          { sporocilo: 'Rezervacije s statusom »Izdana« ni mogoče spremeniti v »Izdana«.' },
        ],
      }),
    });
    await screen.findAllByRole('article');
    await uporabnik.click(within(kartica('15. 11.')).getByRole('button', { name: 'Izdaj' }));
    await uporabnik.click(screen.getByRole('button', { name: 'Potrdi izdajo' }));
    expect((await within(screen.getByRole('dialog')).findByRole('alert')).textContent).toContain(
      'ni mogoče',
    );
  });

  it('brez odobrenih: prazno stanje', async () => {
    izrisi('/tehnik/odobrene', {
      vloga: 'TEHNIK',
      api: { 'GET /api/rezervacije': () => [200, []] },
    });
    expect(await screen.findByText('Ni odobrenih rezervacij')).toBeTruthy();
  });
});

describe('seznam Izdano (US-07)', () => {
  it('uporabnik, oprema, rok vračila, zamujene označene; Prevzemi vračilo vodi na vračilo', async () => {
    izrisi('/tehnik/izdane', { vloga: 'TEHNIK', api: strezi() });
    const tabela = await screen.findByRole('table', { name: 'Izdana oprema' });
    const vrstice = within(tabela).getAllByRole('row').slice(1);
    // Razvrščeno po roku vračila: najprej zamujena.
    expect(within(vrstice[0]).getByText('Zamujena · 3 dnevi')).toBeTruthy();
    expect(within(vrstice[0]).getByText('9. 11. 2026')).toBeTruthy();
    expect(within(vrstice[1]).getByText('Izdana')).toBeTruthy();
    expect(within(vrstice[1]).getByText('20. 11. 2026')).toBeTruthy();
    expect(within(vrstice[1]).getByText('Bor Kos')).toBeTruthy();
    expect(
      within(vrstice[0])
        .getByRole('link', { name: 'Prevzemi vračilo: Bor Kos' })
        .getAttribute('href'),
    ).toBe('/tehnik/vracilo/4');
  });
});
