import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { poStevilu } from '../src/utils/oznake.js';
import { izrisi } from './pomocniki.jsx';

const oddana = (id, ime, ostalo = {}) => ({
  id,
  status: 'ODDANA',
  od: '2026-11-20',
  do: '2026-11-22',
  namen: 'Seminarska naloga',
  ustvarjeno: '2026-11-10T08:30:00.000Z',
  uporabnik: { id: id + 100, ime, priimek: 'Novak', email: `${ime}@um.si`, vloga: 'STUDENT' },
  kosi: [{ id: 1, naziv: 'Arduino Uno', inventarnaStevilka: 'A-014' }],
  zamujena: false,
  dniZamude: 0,
  steviloZamud: 0,
  steviloNeporavnanihPoskodb: 0,
  ...ostalo,
});

function strezi({ seznam, odobri, zavrni } = {}) {
  let oddane = seznam ?? [
    oddana(1, 'Ana'),
    oddana(2, 'Bor', { steviloZamud: 2 }),
    oddana(3, 'Cene', { steviloNeporavnanihPoskodb: 1 }),
  ];
  return {
    'GET /api/rezervacije': ({ iskalni }) => [
      200,
      iskalni.get('status') === 'ODDANA' ? oddane : [],
    ],
    'GET /api/rezervacije/stevci': () => [200, { oddane: oddane.length, izdane: 4, zamujene: 1 }],
    'PATCH /api/rezervacije/:id/odobritev':
      odobri ??
      (({ parametri }) => {
        oddane = oddane.filter((r) => r.id !== Number(parametri.id));
        return [200, { id: Number(parametri.id), status: 'ODOBRENA' }];
      }),
    'PATCH /api/rezervacije/:id/zavrnitev':
      zavrni ??
      (({ parametri, telo }) => {
        oddane = oddane.filter((r) => r.id !== Number(parametri.id));
        return [200, { id: Number(parametri.id), status: 'ZAVRNJENA', ...telo }];
      }),
    'GET /api/rezervacije/:id/opozorila': () => [
      200,
      {
        uporabnik: { id: 102, ime: 'Bor', priimek: 'Novak' },
        zamujene: [
          {
            id: 9,
            od: '2026-11-01',
            do: '2026-11-05',
            dniZamude: 7,
            kosi: [{ id: 5, naziv: 'Multimeter', inventarnaStevilka: 'M-002' }],
          },
        ],
        poskodbe: [],
      },
    ],
  };
}

const odpri = async (moznosti) => {
  const r = izrisi('/tehnik', { vloga: 'TEHNIK', api: strezi(moznosti) });
  await screen.findAllByRole('article');
  return r;
};
const kartica = (ime) =>
  screen.getAllByRole('article').find((a) => a.getAttribute('aria-label').includes(ime));
// Kartice števcev so v glavni vsebini (meni v glavi ima povezave z enakimi imeni).
const stevec = (oznaka) =>
  within(screen.getByRole('main')).getByRole('link', { name: new RegExp(`^${oznaka}`) });
const stevilo = (oznaka) => within(stevec(oznaka)).getByText(/^\d+$/).textContent;

describe('nadzorna plošča tehnika (US-05)', () => {
  it('števci kot povezave na sezname', async () => {
    await odpri();
    await waitFor(() => expect(stevilo('Oddane')).toBe('3'));
    expect(stevilo('Izdane')).toBe('4');
    expect(stevec('Zamujene').getAttribute('href')).toBe('/tehnik/zamujene');
    expect(stevec('Izdane').getAttribute('href')).toBe('/tehnik/izdane');
  });

  it('oddana rezervacija: uporabnik in vloga, oprema, termin s trajanjem, namen, čas oddaje', async () => {
    await odpri();
    const ana = kartica('Ana');
    expect(ana.textContent).toContain('Ana Novak · Študent');
    expect(ana.textContent).toContain('Arduino Uno (A-014)');
    expect(ana.textContent).toContain('20. 11. – 22. 11. 2026 (3 dnevi)');
    expect(ana.textContent).toContain('Seminarska naloga');
    expect(ana.textContent).toContain('Oddano 10. 11. 2026 ob 9.30');
  });

  it('Odobri v enem kliku: rezervacija izgine, števci se osvežijo, obvestilo', async () => {
    const uporabnik = userEvent.setup();
    const { fetch } = await odpri();
    await uporabnik.click(within(kartica('Ana')).getByRole('button', { name: 'Odobri' }));

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    expect(
      fetch.mock.calls.some(
        ([url, o]) => url === '/api/rezervacije/1/odobritev' && o.method === 'PATCH',
      ),
    ).toBe(true);
    await waitFor(() => expect(stevilo('Oddane')).toBe('2'));
    expect(screen.getByRole('status', { name: 'Obvestila' }).textContent).toContain(
      'Rezervacija uporabnika Ana Novak je odobrena',
    );
  });

  it('409 ob odobritvi (že obdelana): obvestilo o napaki in osvežen seznam', async () => {
    const uporabnik = userEvent.setup();
    await odpri({
      odobri: () => [
        409,
        { sporocilo: 'Rezervacije s statusom »Odobrena« ni mogoče spremeniti v »Odobrena«.' },
      ],
    });
    await uporabnik.click(within(kartica('Ana')).getByRole('button', { name: 'Odobri' }));
    expect(await screen.findByText(/ni mogoče spremeniti/)).toBeTruthy();
  });

  it('brez oddanih: prazno stanje', async () => {
    izrisi('/tehnik', { vloga: 'TEHNIK', api: strezi({ seznam: [] }) });
    expect(await screen.findByText('Ni oddanih rezervacij')).toBeTruthy();
  });

  it('gumba Odobri in Zavrni sta normalne velikosti (44 px)', async () => {
    await odpri();
    for (const ime of ['Odobri', 'Zavrni']) {
      expect(within(kartica('Ana')).getByRole('button', { name: ime }).className).toContain(
        'min-h-11',
      );
    }
  });
});

describe('zavrnitev in opozorila (US-06, US-11)', () => {
  it('Potrdi zavrnitev je onemogočen brez razloga; oddaja razlog in komentar', async () => {
    const uporabnik = userEvent.setup();
    const { fetch } = await odpri();
    await uporabnik.click(within(kartica('Ana')).getByRole('button', { name: 'Zavrni' }));
    const okno = screen.getByRole('dialog', { name: 'Zavrnitev rezervacije' });
    const potrdi = within(okno).getByRole('button', { name: 'Potrdi zavrnitev' });
    expect(potrdi.disabled).toBe(true);

    const moznosti = within(within(okno).getByLabelText(/Razlog zavrnitve/)).getAllByRole('option');
    expect(moznosti.slice(1).map((o) => o.textContent)).toEqual([
      'Zamujena izposoja',
      'Neporavnana poškodba',
      'Oprema v okvari ali na servisu',
      'Oprema potrebna za izvedbo vaj',
      'Neustrezen namen izposoje',
    ]);

    await uporabnik.selectOptions(
      within(okno).getByLabelText(/Razlog zavrnitve/),
      'POTREBNA_ZA_VAJE',
    );
    await uporabnik.type(within(okno).getByLabelText(/Komentar/), 'Na voljo po 1. 12.');
    expect(potrdi.disabled).toBe(false);
    await uporabnik.click(potrdi);

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    const klic = fetch.mock.calls.find(([url]) => url === '/api/rezervacije/1/zavrnitev');
    expect(JSON.parse(klic[1].body)).toEqual({
      razlogZavrnitve: 'POTREBNA_ZA_VAJE',
      komentarTehnika: 'Na voljo po 1. 12.',
    });
  });

  it('opozorilo o zamudah ne blokira odobritve; v oknu za zavrnitev je razlog že izbran', async () => {
    const uporabnik = userEvent.setup();
    await odpri();
    const bor = kartica('Bor');
    expect(
      within(bor).getByRole('button', { name: /Uporabnik ima 2 zamujeni izposoji/ }),
    ).toBeTruthy();
    expect(within(bor).getByRole('button', { name: 'Odobri' }).disabled).toBe(false);

    await uporabnik.click(within(bor).getByRole('button', { name: 'Zavrni' }));
    expect(within(screen.getByRole('dialog')).getByLabelText(/Razlog zavrnitve/).value).toBe(
      'ZAMUJENA_IZPOSOJA',
    );
  });

  it('opozorilo o poškodbi predlaga razlog Neporavnana poškodba', async () => {
    const uporabnik = userEvent.setup();
    await odpri();
    const cene = kartica('Cene');
    expect(within(cene).getByText('Uporabnik ima 1 neporavnano poškodbo')).toBeTruthy();
    await uporabnik.click(within(cene).getByRole('button', { name: 'Zavrni' }));
    expect(within(screen.getByRole('dialog')).getByLabelText(/Razlog zavrnitve/).value).toBe(
      'NEPORAVNANA_POSKODBA',
    );
  });

  it('klik na opozorilo pokaže seznam zamud uporabnika', async () => {
    const uporabnik = userEvent.setup();
    await odpri();
    await uporabnik.click(
      within(kartica('Bor')).getByRole('button', { name: /zamujeni izposoji/ }),
    );
    const okno = screen.getByRole('dialog', { name: 'Opozorila: Bor Novak' });
    expect(await within(okno).findByText(/zamuda 7 dni/)).toBeTruthy();
    expect(within(okno).getByText('Multimeter (M-002)')).toBeTruthy();
    expect(within(okno).getByText('Ni neporavnanih poškodb.')).toBeTruthy();
  });

  it('napaka ob zavrnitvi ostane v oknu', async () => {
    const uporabnik = userEvent.setup();
    await odpri({ zavrni: () => [409, { sporocilo: 'Rezervacija je že obdelana.' }] });
    await uporabnik.click(within(kartica('Ana')).getByRole('button', { name: 'Zavrni' }));
    const okno = screen.getByRole('dialog');
    await uporabnik.selectOptions(
      within(okno).getByLabelText(/Razlog zavrnitve/),
      'NEUSTREZEN_NAMEN',
    );
    await uporabnik.click(within(okno).getByRole('button', { name: 'Potrdi zavrnitev' }));
    expect((await within(okno).findByRole('alert')).textContent).toBe(
      'Rezervacija je že obdelana.',
    );
  });
});

describe('poStevilu', () => {
  it.each([
    [1, 'zamujeno izposojo'],
    [2, 'zamujeni izposoji'],
    [3, 'zamujene izposoje'],
    [5, 'zamujenih izposoj'],
  ])('%i → %s', (n, oblika) => {
    expect(
      poStevilu(n, [
        'zamujeno izposojo',
        'zamujeni izposoji',
        'zamujene izposoje',
        'zamujenih izposoj',
      ]),
    ).toBe(`${n} ${oblika}`);
  });
});
