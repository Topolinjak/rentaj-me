import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
    trenutnoStanje: 'BREZHIBNO',
  },
  {
    id: 12,
    inventarnaStevilka: 'M-002',
    naziv: 'Multimeter',
    kategorija: MERILNI,
    status: 'V_OKVARI',
    trenutnoStanje: 'POSKODOVANO',
  },
  {
    id: 13,
    inventarnaStevilka: 'O-001',
    naziv: 'Osciloskop',
    kategorija: MERILNI,
    status: 'UMAKNJEN',
    trenutnoStanje: 'OBRABLJENO',
  },
];

function strezi({ odprte = 0, ustvari } = {}) {
  const baza = KOSI.map((k) => ({ ...k }));
  return {
    'GET /api/oprema': ({ iskalni }) => [
      200,
      iskalni.get('vsi') === 'true' ? baza : baza.filter((k) => k.status !== 'UMAKNJEN'),
    ],
    'GET /api/kategorije': () => [200, [MERILNI, MIKRO]],
    'POST /api/oprema':
      ustvari ?? (({ telo }) => [201, { id: 20, status: 'NA_VOLJO', ...telo, kategorija: MIKRO }]),
    'PATCH /api/oprema/:id': ({ parametri, telo }) => {
      const kos = baza.find((k) => k.id === Number(parametri.id));
      Object.assign(kos, telo);
      return [200, { ...kos, odprteRezervacije: odprte }];
    },
  };
}

const vrstice = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const vrstica = (besedilo) => vrstice().find((v) => v.textContent.includes(besedilo));

async function odpri(vloga = 'TEHNIK', moznosti) {
  const r = izrisi('/inventar', { vloga, api: strezi(moznosti) });
  await screen.findByRole('table');
  return r;
}

describe('inventar (US-19)', () => {
  it('prikaže vse kose, tudi umaknjene, s stanjem in statusom', async () => {
    const { fetch } = await odpri();
    expect(vrstice()).toHaveLength(3);
    expect(within(vrstica('Osciloskop')).getByText('Umaknjen')).toBeTruthy();
    expect(within(vrstica('Multimeter')).getByText('Poškodovano')).toBeTruthy();
    expect(fetch.mock.calls.some(([url]) => url === '/api/oprema?vsi=true')).toBe(true);
  });

  it('administrator ima dostop', async () => {
    await odpri('ADMIN');
    expect(vrstice()).toHaveLength(3);
  });

  it('iskanje po kategoriji in filter statusa', async () => {
    const uporabnik = userEvent.setup();
    await odpri();
    await uporabnik.type(screen.getByLabelText('Iskanje'), 'merilni');
    expect(vrstice()).toHaveLength(2);
    await uporabnik.selectOptions(screen.getByLabelText('Status'), 'V_OKVARI');
    expect(vrstice()).toHaveLength(1);
    await uporabnik.selectOptions(screen.getByLabelText('Status'), 'NA_VOLJO');
    expect(screen.getByText('Ni opreme, ki ustreza iskanju')).toBeTruthy();
    await uporabnik.click(screen.getByRole('button', { name: 'Počisti filtre' }));
    expect(vrstice()).toHaveLength(3);
  });

  it('okvara pokaže število odprtih rezervacij (kriterij 3)', async () => {
    const uporabnik = userEvent.setup();
    const { fetch } = await odpri('TEHNIK', { odprte: 2 });

    await uporabnik.click(
      within(vrstica('Arduino')).getByRole('button', {
        name: 'Označi okvaro: Arduino Uno (A-014)',
      }),
    );

    await waitFor(() => expect(within(vrstica('Arduino')).getByText('V okvari')).toBeTruthy());
    const klic = fetch.mock.calls.find(
      ([url, o]) => url === '/api/oprema/11' && o.method === 'PATCH',
    );
    expect(JSON.parse(klic[1].body)).toEqual({ status: 'V_OKVARI' });
    expect(screen.getByRole('status').textContent).toContain(
      '2 odprti rezervaciji vključujeta ta kos',
    );
  });

  it('popravljen kos je spet na voljo (kriterij 5)', async () => {
    const uporabnik = userEvent.setup();
    await odpri();
    await uporabnik.click(
      within(vrstica('Multimeter')).getByRole('button', { name: /Popravljen/ }),
    );
    await waitFor(() => expect(within(vrstica('Multimeter')).getByText('Na voljo')).toBeTruthy());
  });

  it('umik zahteva potrditev (kriterij 4)', async () => {
    const uporabnik = userEvent.setup();
    const { fetch } = await odpri();
    await uporabnik.click(within(vrstica('Arduino')).getByRole('button', { name: /^Umakni/ }));

    const okno = screen.getByRole('dialog', { name: 'Ali res želite umakniti kos?' });
    expect(fetch.mock.calls.some(([, o]) => o?.method === 'PATCH')).toBe(false);
    await uporabnik.click(within(okno).getByRole('button', { name: 'Umakni kos' }));

    await waitFor(() => expect(within(vrstica('Arduino')).getByText('Umaknjen')).toBeTruthy());
    expect(within(vrstica('Arduino')).getByRole('button', { name: /Vrni v uporabo/ })).toBeTruthy();
  });

  it('nov kos: kategorija iz seznama, oddaja s številskim id', async () => {
    const uporabnik = userEvent.setup();
    const { fetch } = await odpri();
    await uporabnik.click(screen.getByRole('button', { name: 'Nov kos' }));
    const okno = screen.getByRole('dialog', { name: 'Nov kos opreme' });

    await uporabnik.type(within(okno).getByLabelText(/Inventarna številka/), 'E-030');
    await uporabnik.type(within(okno).getByLabelText(/^Naziv/), 'ESP32');
    await within(okno).findByRole('option', { name: 'Mikrokrmilniki' });
    await uporabnik.selectOptions(within(okno).getByLabelText(/Kategorija/), 'Mikrokrmilniki');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Dodaj kos' }));

    await waitFor(() => expect(vrstice()).toHaveLength(4));
    const klic = fetch.mock.calls.find(([url, o]) => url === '/api/oprema' && o.method === 'POST');
    expect(JSON.parse(klic[1].body)).toEqual({
      inventarnaStevilka: 'E-030',
      naziv: 'ESP32',
      kategorijaId: 1,
      trenutnoStanje: 'BREZHIBNO',
      opis: '',
    });
  });

  it('nov kos: 409 pri inventarni številki (kriterij 2)', async () => {
    const uporabnik = userEvent.setup();
    await odpri('TEHNIK', {
      ustvari: () => [409, { sporocilo: 'Kos s to inventarno številko že obstaja' }],
    });
    await uporabnik.click(screen.getByRole('button', { name: 'Nov kos' }));
    const okno = screen.getByRole('dialog');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Dodaj kos' }));
    expect(await within(okno).findByText('Kos s to inventarno številko že obstaja')).toBeTruthy();
    expect(
      within(okno)
        .getByLabelText(/Inventarna številka/)
        .getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('študent nima dostopa', async () => {
    const { router } = izrisi('/inventar', { vloga: 'STUDENT', api: strezi() });
    await waitFor(() => expect(router.state.location.pathname).toBe('/katalog'));
  });
});
