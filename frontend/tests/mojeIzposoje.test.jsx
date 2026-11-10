import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { izrisi } from './pomocniki.jsx';

const kos = (id, naziv, inv) => ({ id, naziv, inventarnaStevilka: inv });
const r = (id, status, od, zadnji, ostalo = {}) => ({
  id,
  status,
  od,
  do: zadnji,
  namen: 'Seminarska naloga',
  kosi: [kos(id, 'Arduino Uno', `A-0${id}`)],
  razlogZavrnitve: null,
  komentarTehnika: null,
  zamujena: false,
  dniZamude: 0,
  ...ostalo,
});

const REZERVACIJE = [
  r(1, 'ODDANA', '2026-11-20', '2026-11-22'),
  r(2, 'IZDANA', '2026-11-01', '2026-11-09', { zamujena: true, dniZamude: 3 }),
  r(3, 'ZAVRNJENA', '2026-10-20', '2026-10-21', {
    razlogZavrnitve: 'POTREBNA_ZA_VAJE',
    komentarTehnika: 'Ta teden je oprema na vajah.',
  }),
  r(4, 'VRNJENA', '2026-10-01', '2026-10-03'),
  r(5, 'ODOBRENA', '2026-11-15', '2026-11-16'),
];

const odpri = (seznam = REZERVACIJE) =>
  izrisi('/moje-izposoje', {
    vloga: 'STUDENT',
    api: { 'GET /api/rezervacije/moje': () => [200, seznam] },
  });

const kartice = () => within(screen.getByRole('tabpanel')).getAllByRole('article');

describe('Moje izposoje (US-10)', () => {
  it('Trenutne: oddane, odobrene in izdane; Pretekle: vrnjene, zavrnjene, preklicane', async () => {
    const uporabnik = userEvent.setup();
    odpri();
    expect(await screen.findByRole('tab', { name: 'Trenutne (3)' })).toBeTruthy();
    expect(
      kartice().map((k) => within(k).getByText(/Oddana|Odobrena|Zamujena|Izdana/).textContent),
    ).toEqual(['Oddana', 'Zamujena · 3 dnevi', 'Odobrena']);

    await uporabnik.click(screen.getByRole('tab', { name: 'Pretekle (2)' }));
    expect(kartice()).toHaveLength(2);
  });

  it('kartica: kosi, termin, namen; zamujena z rokom vračila', async () => {
    odpri();
    const zamujena = (await screen.findAllByRole('article'))[1];
    expect(within(zamujena).getByText('1. 11. – 9. 11. 2026')).toBeTruthy();
    expect(within(zamujena).getByText(/Rok vračila: 9\. 11\. 2026/)).toBeTruthy();
    expect(within(zamujena).getByText('(A-02)')).toBeTruthy();
    expect(within(zamujena).getByText('Seminarska naloga')).toBeTruthy();
  });

  it('zavrnjena pokaže razlog in komentar tehnika', async () => {
    const uporabnik = userEvent.setup();
    odpri();
    await uporabnik.click(await screen.findByRole('tab', { name: /Pretekle/ }));
    const zavrnjena = kartice().find((k) => k.textContent.includes('Zavrnjena'));
    expect(zavrnjena.textContent).toContain('Razlog zavrnitve: Oprema potrebna za izvedbo vaj');
    expect(zavrnjena.textContent).toContain('Komentar tehnika: Ta teden je oprema na vajah.');
  });

  it('brez rezervacij: prazno stanje z gumbom Na katalog', async () => {
    odpri([]);
    expect(await screen.findByText('Nimate še nobene rezervacije')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Na katalog' }).getAttribute('href')).toBe('/katalog');
  });

  it('prazen zavihek ima svoje prazno stanje', async () => {
    odpri([r(4, 'VRNJENA', '2026-10-01', '2026-10-03')]);
    expect(await screen.findByText('Nimate trenutnih izposoj')).toBeTruthy();
  });

  it('gumba Prekliči ni (US-13 ni v MVP)', async () => {
    odpri();
    await screen.findAllByRole('article');
    expect(screen.queryByRole('button', { name: /Prekliči/ })).toBeNull();
  });
});
