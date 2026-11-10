import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { izrisi } from './pomocniki.jsx';

// Administrator v pomocniki.jsx ima id 5.
const SEZNAM = [
  { id: 5, ime: 'Ana', priimek: 'Novak', email: 'ana@rentaj.test', vloga: 'ADMIN', aktiven: true },
  {
    id: 7,
    ime: 'Bor',
    priimek: 'Kos',
    email: 'bor@student.um.si',
    vloga: 'STUDENT',
    aktiven: true,
  },
  { id: 8, ime: 'Čedo', priimek: 'Žagar', email: 'cedo@um.si', vloga: 'TEHNIK', aktiven: false },
];

function strezi({ seznam = SEZNAM, ustvari, spremeni } = {}) {
  const baza = seznam.map((u) => ({ ...u }));
  return {
    'GET /api/uporabniki': () => [200, baza],
    'POST /api/uporabniki':
      ustvari ?? (({ telo }) => [201, { id: 99, aktiven: true, ...telo, geslo: undefined }]),
    'PATCH /api/uporabniki/:id':
      spremeni ??
      (({ parametri, telo }) => {
        const u = baza.find((x) => x.id === Number(parametri.id));
        Object.assign(u, telo);
        return [200, u];
      }),
  };
}

const vrsticeTabele = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const odpri = async (api) => {
  const rezultat = izrisi('/admin/uporabniki', { vloga: 'ADMIN', api });
  await screen.findByRole('table');
  return rezultat;
};

describe('stran Uporabniki (US-18)', () => {
  it('tabela z imenom, e-pošto, vlogo in statusom, razvrščena po priimku', async () => {
    await odpri(strezi());
    const vrstice = vrsticeTabele();
    expect(vrstice.map((v) => within(v).getAllByRole('cell')[0].textContent)).toEqual([
      'Bor Kos',
      'Ana Novak(vi)',
      'Čedo Žagar',
    ]);
    expect(within(vrstice[2]).getByText('Deaktiviran')).toBeTruthy();
    expect(within(vrstice[2]).getByText('Tehnik')).toBeTruthy();
  });

  it('iskanje po imenu ali e-pošti; brez zadetkov prazno stanje', async () => {
    const uporabnik = userEvent.setup();
    await odpri(strezi());

    await uporabnik.type(screen.getByLabelText('Iskanje'), 'STUDENT.um');
    expect(vrsticeTabele()).toHaveLength(1);

    await uporabnik.clear(screen.getByLabelText('Iskanje'));
    await uporabnik.type(screen.getByLabelText('Iskanje'), 'xyz');
    expect(screen.getByText('Ni uporabnikov, ki ustrezajo iskanju')).toBeTruthy();
    await uporabnik.click(screen.getByRole('button', { name: 'Počisti iskanje' }));
    expect(vrsticeTabele()).toHaveLength(3);
  });

  it('svojega računa ni mogoče deaktivirati', async () => {
    await odpri(strezi());
    const moja = vrsticeTabele().find((v) => v.textContent.includes('(vi)'));
    expect(within(moja).queryByRole('button')).toBeNull();
  });

  it('nov uporabnik: oddaja podatkov, nova vrstica in obvestilo', async () => {
    const uporabnik = userEvent.setup();
    const { fetch } = await odpri(strezi());

    await uporabnik.click(screen.getByRole('button', { name: 'Nov uporabnik' }));
    const okno = screen.getByRole('dialog', { name: 'Nov uporabnik' });
    await uporabnik.type(within(okno).getByLabelText(/^Ime/), 'Dana');
    await uporabnik.type(within(okno).getByLabelText(/^Priimek/), 'Ribič');
    await uporabnik.type(within(okno).getByLabelText(/E-poštni naslov/), 'dana@um.si');
    await uporabnik.selectOptions(within(okno).getByLabelText(/Vloga/), 'ASISTENT');
    await uporabnik.type(within(okno).getByLabelText(/Začetno geslo/), 'geslo1234');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Ustvari uporabnika' }));

    await waitFor(() => expect(vrsticeTabele()).toHaveLength(4));
    const klic = fetch.mock.calls.find(
      ([url, o]) => url === '/api/uporabniki' && o.method === 'POST',
    );
    expect(JSON.parse(klic[1].body)).toEqual({
      ime: 'Dana',
      priimek: 'Ribič',
      email: 'dana@um.si',
      vloga: 'ASISTENT',
      geslo: 'geslo1234',
    });
    expect(screen.getByRole('status').textContent).toContain('Uporabnik Dana Ribič je ustvarjen');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('nov uporabnik: 400 napake pri poljih, 409 pri e-pošti', async () => {
    const uporabnik = userEvent.setup();
    let odgovor = [
      400,
      {
        sporocilo: 'Neveljavni podatki.',
        napake: [
          { polje: 'ime', sporocilo: 'Vnesite ime.' },
          { polje: 'geslo', sporocilo: 'Geslo mora imeti vsaj 8 znakov.' },
        ],
      },
    ];
    await odpri(strezi({ ustvari: () => odgovor }));

    await uporabnik.click(screen.getByRole('button', { name: 'Nov uporabnik' }));
    const okno = screen.getByRole('dialog');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Ustvari uporabnika' }));
    expect(await within(okno).findByText('Vnesite ime.')).toBeTruthy();
    expect(within(okno).getByText('Geslo mora imeti vsaj 8 znakov.')).toBeTruthy();
    expect(within(okno).getByLabelText(/^Ime/).getAttribute('aria-invalid')).toBe('true');

    odgovor = [409, { sporocilo: 'Uporabnik s tem e-poštnim naslovom že obstaja' }];
    await uporabnik.click(within(okno).getByRole('button', { name: 'Ustvari uporabnika' }));
    expect(
      await within(okno).findByText('Uporabnik s tem e-poštnim naslovom že obstaja'),
    ).toBeTruthy();
    expect(
      within(okno)
        .getByLabelText(/E-poštni naslov/)
        .getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('deaktivacija s potrditvijo, aktivacija brez', async () => {
    const uporabnik = userEvent.setup();
    const { fetch } = await odpri(strezi());
    const bor = () => vrsticeTabele().find((v) => v.textContent.includes('Bor Kos'));

    await uporabnik.click(within(bor()).getByRole('button', { name: 'Deaktiviraj' }));
    const okno = screen.getByRole('dialog', { name: 'Ali res želite deaktivirati račun?' });
    expect(okno.textContent).toContain('bor@student.um.si');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Deaktiviraj račun' }));

    await waitFor(() => expect(within(bor()).getByText('Deaktiviran')).toBeTruthy());
    const klic = fetch.mock.calls.find(([url]) => url === '/api/uporabniki/7');
    expect(JSON.parse(klic[1].body)).toEqual({ aktiven: false });

    await uporabnik.click(within(bor()).getByRole('button', { name: 'Aktiviraj' }));
    await waitFor(() => expect(within(bor()).getByText('Aktiven')).toBeTruthy());
  });

  it('napaka pri deaktivaciji ostane v oknu', async () => {
    const uporabnik = userEvent.setup();
    await odpri(strezi({ spremeni: () => [400, { sporocilo: 'Ni podatkov za spremembo.' }] }));
    const bor = vrsticeTabele().find((v) => v.textContent.includes('Bor Kos'));
    await uporabnik.click(within(bor).getByRole('button', { name: 'Deaktiviraj' }));
    await uporabnik.click(screen.getByRole('button', { name: 'Deaktiviraj račun' }));
    expect((await within(screen.getByRole('dialog')).findByRole('alert')).textContent).toBe(
      'Ni podatkov za spremembo.',
    );
  });

  it('napaka pri nalaganju z gumbom Poskusi znova', async () => {
    const uporabnik = userEvent.setup();
    let poskus = 0;
    izrisi('/admin/uporabniki', {
      vloga: 'ADMIN',
      api: {
        'GET /api/uporabniki': () =>
          ++poskus === 1 ? [500, { sporocilo: 'Prišlo je do napake.' }] : [200, SEZNAM],
      },
    });
    expect((await screen.findByRole('alert')).textContent).toContain('Prišlo je do napake.');
    await uporabnik.click(screen.getByRole('button', { name: 'Poskusi znova' }));
    expect(await screen.findByRole('table')).toBeTruthy();
  });
});

describe('potekla seja', () => {
  it('401 pri klicu API-ja pošlje na prijavo in si zapomni stran', async () => {
    const { router } = izrisi('/admin/uporabniki', {
      vloga: 'ADMIN',
      api: {
        'GET /api/uporabniki': () => [401, { sporocilo: 'Seja je potekla. Prijavite se znova.' }],
      },
    });
    await waitFor(() => expect(router.state.location.pathname).toBe('/prijava'));
    expect(router.state.location.state).toEqual({ od: '/admin/uporabniki' });
  });
});
