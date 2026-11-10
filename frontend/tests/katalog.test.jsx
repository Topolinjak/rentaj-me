import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ikonaKategorije } from '../src/utils/kategorije.js';
import { izrisi } from './pomocniki.jsx';

const MIKRO = { id: 1, naziv: 'Mikrokrmilniki' };
const MERILNI = { id: 2, naziv: 'Merilni instrumenti' };
const KOSI = [
  {
    id: 11,
    inventarnaStevilka: 'A-014',
    naziv: 'Arduino Uno',
    kategorija: MIKRO,
    status: 'NA_VOLJO',
  },
  {
    id: 12,
    inventarnaStevilka: 'M-002',
    naziv: 'Multimeter',
    kategorija: MERILNI,
    status: 'V_OKVARI',
  },
  { id: 13, inventarnaStevilka: 'E-001', naziv: 'ESP32', kategorija: MIKRO, status: 'NA_VOLJO' },
];

const odpri = (kosi = KOSI, odgovor) =>
  izrisi('/katalog', {
    vloga: 'STUDENT',
    api: { 'GET /api/oprema': () => odgovor ?? [200, kosi] },
  });

describe('katalog (US-02)', () => {
  it('kartice po kategorijah z nazivom, inventarno številko in statusom', async () => {
    odpri();
    await screen.findByRole('region', { name: 'Mikrokrmilniki' });
    const kategorije = screen.getAllByRole('region').map((r) => r.getAttribute('aria-labelledby'));
    expect(kategorije.map((id) => document.getElementById(id).textContent)).toEqual([
      'Merilni instrumenti',
      'Mikrokrmilniki',
    ]);

    const mikro = screen.getByRole('region', { name: 'Mikrokrmilniki' });
    const kartice = within(mikro).getAllByRole('article');
    expect(kartice).toHaveLength(2);
    expect(within(kartice[0]).getByText('A-014')).toBeTruthy();
    expect(within(kartice[0]).getByText('Na voljo')).toBeTruthy();
  });

  it('kos v okvari: oznaka, onemogočen Rezerviraj in razlog v besedilu', async () => {
    odpri();
    const merilni = await screen.findByRole('region', { name: 'Merilni instrumenti' });
    const kartica = within(merilni).getByRole('article');
    expect(within(kartica).getByText('V okvari')).toBeTruthy();

    const gumb = within(kartica).getByRole('button', { name: 'Rezerviraj' });
    expect(gumb.disabled).toBe(true);
    const razlog = document.getElementById(gumb.getAttribute('aria-describedby'));
    expect(razlog.textContent).toContain('v okvari');
    // Podrobnosti so dostopne tudi za pokvarjen kos.
    expect(
      within(kartica)
        .getByRole('link', { name: /Podrobnosti/ })
        .getAttribute('href'),
    ).toBe('/oprema/12');
  });

  it('Rezerviraj vodi na stran kosa', async () => {
    odpri();
    const povezava = await screen.findByRole('link', { name: 'Rezerviraj: Arduino Uno (A-014)' });
    expect(povezava.getAttribute('href')).toBe('/oprema/11');
  });

  it('prazen katalog in napaka', async () => {
    odpri([]);
    expect(await screen.findByText('V katalogu še ni opreme')).toBeTruthy();
  });

  it('napaka pri nalaganju', async () => {
    odpri(KOSI, [500, { sporocilo: 'Prišlo je do napake.' }]);
    expect((await screen.findByRole('alert')).textContent).toContain('Prišlo je do napake.');
  });

  it('med nalaganjem skeleti', async () => {
    odpri();
    expect(await screen.findByText('Nalaganje …')).toBeTruthy();
  });
});

describe('ikona kategorije', () => {
  it.each([
    ['Mikrokrmilniki', 'cip'],
    ['Merilni instrumenti', 'merilnik'],
    ['Foto/video oprema', 'kamera'],
    ['Računalniška oprema', 'racunalnik'],
    ['Orodje', 'predal'],
  ])('%s → %s', (naziv, ikona) => {
    expect(ikonaKategorije(naziv)).toBe(ikona);
  });
});
