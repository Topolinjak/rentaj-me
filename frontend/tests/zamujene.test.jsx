import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { izrisi } from './pomocniki.jsx';

const zamujena = (id, ime, zadnji, dni) => ({
  id,
  status: 'IZDANA',
  od: '2026-10-25',
  do: zadnji,
  namen: 'Vaje',
  uporabnik: {
    id: id + 10,
    ime,
    priimek: 'Kos',
    email: `${ime.toLowerCase()}@um.si`,
    vloga: 'STUDENT',
  },
  kosi: [{ id, naziv: 'Arduino Uno', inventarnaStevilka: `A-0${id}` }],
  zamujena: true,
  dniZamude: dni,
});

const odpri = (seznam) =>
  izrisi('/tehnik/zamujene', {
    vloga: 'TEHNIK',
    api: {
      'GET /api/rezervacije': ({ iskalni }) => [
        200,
        iskalni.get('zamujene') === 'true' ? seznam : [],
      ],
    },
  });

describe('zamujene izposoje (US-09)', () => {
  it('uporabnik, e-pošta, kosi, rok in dni zamude, od največje zamude', async () => {
    const { fetch } = odpri([
      zamujena(1, 'Ana', '2026-11-09', 3),
      zamujena(2, 'Bor', '2026-11-01', 11),
    ]);
    const tabela = await screen.findByRole('table', { name: 'Zamujene izposoje' });
    const vrstice = within(tabela).getAllByRole('row').slice(1);

    expect(vrstice.map((v) => within(v).getAllByRole('cell')[0].textContent)).toEqual([
      'Bor Kos',
      'Ana Kos',
    ]);
    expect(within(vrstice[0]).getByText('11 dni')).toBeTruthy();
    expect(within(vrstice[0]).getByText('1. 11. 2026')).toBeTruthy();
    expect(within(vrstice[0]).getByRole('link', { name: 'bor@um.si' }).getAttribute('href')).toBe(
      'mailto:bor@um.si',
    );
    expect(within(vrstice[1]).getByText('3 dnevi')).toBeTruthy();
    expect(fetch.mock.calls.some(([url]) => url === '/api/rezervacije?zamujene=true')).toBe(true);
  });

  it('vrstica vodi na stran vračila', async () => {
    odpri([zamujena(1, 'Ana', '2026-11-09', 3)]);
    const tabela = await screen.findByRole('table');
    expect(
      within(tabela).getByRole('link', { name: 'Prevzemi vračilo: Ana Kos' }).getAttribute('href'),
    ).toBe('/tehnik/vracilo/1');
  });

  it('brez zamud: prazno stanje', async () => {
    odpri([]);
    expect(await screen.findByText('Ni zamujenih izposoj')).toBeTruthy();
  });

  it('izposojevalec nima dostopa', async () => {
    const { router } = izrisi('/tehnik/zamujene', { vloga: 'STUDENT', api: {} });
    await screen.findByRole('heading', { level: 1 });
    expect(router.state.location.pathname).toBe('/katalog');
  });
});
