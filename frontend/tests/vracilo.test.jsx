import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { izrisi } from './pomocniki.jsx';

const kos = (id, naziv, inv, stanjeObIzdaji) => ({
  id,
  naziv,
  inventarnaStevilka: inv,
  trenutnoStanje: stanjeObIzdaji,
  stanjeObIzdaji,
  stanjeObVracilu: null,
});

const IZDANA = {
  id: 4,
  status: 'IZDANA',
  od: '2026-11-01',
  do: '2026-11-09',
  namen: 'Vaje',
  uporabnik: { id: 7, ime: 'Bor', priimek: 'Kos', email: 'bor@um.si', vloga: 'STUDENT' },
  kosi: [kos(1, 'Arduino Uno', 'A-014', 'BREZHIBNO'), kos(2, 'Multimeter', 'M-002', 'OBRABLJENO')],
  zamujena: true,
  dniZamude: 3,
};

function odpri({ rezervacija = IZDANA, vracilo } = {}) {
  return izrisi('/tehnik/vracilo/4', {
    vloga: 'TEHNIK',
    api: {
      'GET /api/rezervacije/:id': () => [200, rezervacija],
      'PATCH /api/rezervacije/:id/vracilo':
        vracilo ?? (() => [200, { ...IZDANA, status: 'VRNJENA' }]),
      'GET /api/rezervacije': () => [200, []],
    },
  });
}

const stanje = (naziv) => screen.getByLabelText(new RegExp(`Stanje ob vračilu: ${naziv}`));

describe('vračilo (US-08)', () => {
  it('podatki rezervacije, zamuda, stanje ob izdaji za vsak kos', async () => {
    odpri();
    expect(await screen.findByText('Rok vračila: 9. 11. 2026')).toBeTruthy();
    expect(screen.getByText('Zamujena · 3 dnevi')).toBeTruthy();
    expect(screen.getByText('bor@um.si')).toBeTruthy();
    const vrsticaMultimetra = stanje('Multimeter').closest('li');
    // Značka (span), ne možnost v izbiri stanja.
    expect(within(vrsticaMultimetra).getByText('Obrabljeno', { selector: 'span' })).toBeTruthy();
  });

  it('Prevzemi vračilo je onemogočen, dokler niso izbrana vsa stanja; pri poškodbi še opis', async () => {
    const uporabnik = userEvent.setup();
    odpri();
    await screen.findByText(/Rok vračila/);
    const gumb = screen.getByRole('button', { name: 'Prevzemi vračilo' });
    expect(gumb.disabled).toBe(true);

    await uporabnik.selectOptions(stanje('Arduino'), 'BREZHIBNO');
    await uporabnik.selectOptions(stanje('Multimeter'), 'POSKODOVANO');
    const opis = screen.getByLabelText(/Opis poškodbe: Multimeter/);
    expect(opis.closest('li')).toBe(stanje('Multimeter').closest('li'));
    expect(gumb.disabled).toBe(true);

    await uporabnik.type(opis, 'Počeno ohišje');
    expect(gumb.disabled).toBe(false);
  });

  it('potrditveno okno pove število poškodovanih; oddaja stanja in opis; nato Izdano', async () => {
    const uporabnik = userEvent.setup();
    const { fetch, router } = odpri();
    await screen.findByText(/Rok vračila/);
    await uporabnik.selectOptions(stanje('Arduino'), 'BREZHIBNO');
    await uporabnik.selectOptions(stanje('Multimeter'), 'POSKODOVANO');
    await uporabnik.type(screen.getByLabelText(/Opis poškodbe/), 'Počeno ohišje');
    await uporabnik.click(screen.getByRole('button', { name: 'Prevzemi vračilo' }));

    const okno = screen.getByRole('dialog', { name: 'Prevzem vračila' });
    expect(okno.textContent).toContain('Vračate 2 kosa, od tega 1 poškodovanega.');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Potrdi vračilo' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/tehnik/izdane'));
    const klic = fetch.mock.calls.find(([url]) => url === '/api/rezervacije/4/vracilo');
    expect(JSON.parse(klic[1].body)).toEqual({
      kosi: [
        { id: 1, stanje: 'BREZHIBNO' },
        { id: 2, stanje: 'POSKODOVANO', opisPoskodbe: 'Počeno ohišje' },
      ],
    });
    expect(screen.getByRole('status', { name: 'Obvestila' }).textContent).toContain(
      'Vračilo je prevzeto. Zapisanih poškodb: 1.',
    );
  });

  it('brez poškodb: »noben ni poškodovan«', async () => {
    const uporabnik = userEvent.setup();
    odpri();
    await screen.findByText(/Rok vračila/);
    await uporabnik.selectOptions(stanje('Arduino'), 'BREZHIBNO');
    await uporabnik.selectOptions(stanje('Multimeter'), 'OBRABLJENO');
    await uporabnik.click(screen.getByRole('button', { name: 'Prevzemi vračilo' }));
    expect(screen.getByRole('dialog').textContent).toContain(
      'Vračate 2 kosa, noben ni poškodovan.',
    );
  });

  it('napake 400 pri kosu se pokažejo pri polju', async () => {
    const uporabnik = userEvent.setup();
    odpri({
      vracilo: () => [
        400,
        {
          sporocilo: 'Neveljavni podatki.',
          napake: [{ polje: 'kosi.1.opisPoskodbe', sporocilo: 'Opišite poškodbo.' }],
        },
      ],
    });
    await screen.findByText(/Rok vračila/);
    await uporabnik.selectOptions(stanje('Arduino'), 'BREZHIBNO');
    await uporabnik.selectOptions(stanje('Multimeter'), 'POSKODOVANO');
    await uporabnik.type(screen.getByLabelText(/Opis poškodbe/), ' x');
    await uporabnik.click(screen.getByRole('button', { name: 'Prevzemi vračilo' }));
    await uporabnik.click(screen.getByRole('button', { name: 'Potrdi vračilo' }));

    expect(await screen.findByText('Opišite poškodbo.')).toBeTruthy();
    expect(screen.getByLabelText(/Opis poškodbe/).getAttribute('aria-invalid')).toBe('true');
  });

  it('rezervacija, ki ni izdana, nima obrazca', async () => {
    odpri({ rezervacija: { ...IZDANA, status: 'VRNJENA', zamujena: false, dniZamude: 0 } });
    expect((await screen.findByRole('alert')).textContent).toContain('»Vrnjena«');
    expect(screen.queryByRole('button', { name: 'Prevzemi vračilo' })).toBeNull();
  });

  it('neobstoječa rezervacija: 404 brez ponovnega poskusa', async () => {
    izrisi('/tehnik/vracilo/999', {
      vloga: 'TEHNIK',
      api: { 'GET /api/rezervacije/:id': () => [404, { sporocilo: 'Rezervacija ne obstaja.' }] },
    });
    expect((await screen.findByRole('alert')).textContent).toContain('Rezervacija ne obstaja.');
    expect(screen.queryByRole('button', { name: 'Poskusi znova' })).toBeNull();
  });
});
