import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { poti } from '../src/poti.jsx';
import { izrisi } from './pomocniki.jsx';

// Vse poti, tudi gnezdene pod postavitvijo in zaščito.
const vsePoti = (seznam) => seznam.flatMap((p) => [p.path, ...vsePoti(p.children ?? [])]);

// Poti MVP iz issueja I-06.
const POTI_MVP = [
  '/prijava',
  '/katalog',
  '/oprema/:id',
  '/rezervacija',
  '/moje-izposoje',
  '/tehnik',
  '/tehnik/odobrene',
  '/tehnik/izdane',
  '/tehnik/zamujene',
  '/tehnik/vracilo/:id',
  '/inventar',
  '/admin/uporabniki',
  '/admin/kategorije',
];

const naslov = (besedilo) => screen.findByRole('heading', { level: 1, name: besedilo });
const glavniMeni = () => screen.getAllByRole('navigation', { name: 'Glavni meni' })[0];

describe('poti', () => {
  it('vsebujejo vse poti MVP in stran 404', () => {
    expect(vsePoti(poti)).toEqual(expect.arrayContaining([...POTI_MVP, '*']));
  });

  it.each([
    ['/katalog', 'STUDENT', 'Katalog'],
    ['/oprema/14', 'PROFESOR', 'Kos opreme'],
    ['/tehnik', 'TEHNIK', 'Nadzorna plošča'],
    ['/tehnik/vracilo/3', 'TEHNIK', 'Vračilo'],
    ['/inventar', 'ADMIN', 'Upravljanje opreme'],
    ['/admin/uporabniki', 'ADMIN', 'Uporabniki'],
  ])('%s z vlogo %s prikaže stran »%s«', async (pot, vloga, besedilo) => {
    izrisi(pot, { vloga });
    expect(await naslov(besedilo)).toBeTruthy();
  });

  it('neznana pot prikaže stran 404', async () => {
    izrisi('/neobstojeca/pot', { vloga: 'STUDENT' });
    expect(await naslov('Stran ne obstaja')).toBeTruthy();
  });
});

describe('zaščitene poti (US-01, kriterij 4)', () => {
  it.each(['/katalog', '/tehnik', '/inventar', '/admin/uporabniki'])(
    'neprijavljen na %s je preusmerjen na prijavo',
    async (pot) => {
      const { router } = izrisi(pot);
      expect(await naslov('Prijava')).toBeTruthy();
      expect(router.state.location.pathname).toBe('/prijava');
      // Prijava (I-10) lahko uporabnika vrne na stran, ki jo je odprl.
      expect(router.state.location.state).toEqual({ od: pot });
    },
  );

  it.each([
    ['/tehnik', 'STUDENT', '/katalog'],
    ['/admin/uporabniki', 'PROFESOR', '/katalog'],
    ['/inventar', 'ASISTENT', '/katalog'],
    ['/katalog', 'TEHNIK', '/tehnik'],
    ['/admin/kategorije', 'TEHNIK', '/tehnik'],
    ['/moje-izposoje', 'ADMIN', '/admin/uporabniki'],
    ['/tehnik/izdane', 'ADMIN', '/admin/uporabniki'],
  ])('%s z vlogo %s preusmeri na %s', async (pot, vloga, cilj) => {
    const { router } = izrisi(pot, { vloga });
    await waitFor(() => expect(router.state.location.pathname).toBe(cilj));
  });

  it.each([
    ['STUDENT', '/katalog'],
    ['ASISTENT', '/katalog'],
    ['PROFESOR', '/katalog'],
    ['TEHNIK', '/tehnik'],
    ['ADMIN', '/admin/uporabniki'],
  ])('»/« pošlje vlogo %s na začetno stran %s (US-01, kriterij 1)', async (vloga, cilj) => {
    const { router } = izrisi('/', { vloga });
    await waitFor(() => expect(router.state.location.pathname).toBe(cilj));
  });

  it('»/« brez prijave vodi na prijavo', async () => {
    const { router } = izrisi('/');
    await waitFor(() => expect(router.state.location.pathname).toBe('/prijava'));
  });
});

describe('glava', () => {
  it('pokaže meni vloge, ime in vlogo prijavljenega', async () => {
    izrisi('/tehnik/izdane', { vloga: 'TEHNIK' });
    await naslov('Izdano');

    const povezave = within(glavniMeni()).getAllByRole('link');
    expect(povezave.map((p) => p.textContent)).toEqual([
      'Nadzorna plošča',
      'Odobrene',
      'Izdane',
      'Zamujene',
      'Inventar',
    ]);
    expect(screen.getAllByText('Ana Novak').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tehnik').length).toBeGreaterThan(0);
  });

  it('aktivna je le povezava trenutne strani (Nadzorna plošča ni aktivna na podstraneh)', async () => {
    izrisi('/tehnik/izdane', { vloga: 'TEHNIK' });
    await naslov('Izdano');

    const aktivne = within(glavniMeni())
      .getAllByRole('link')
      .filter((p) => p.getAttribute('aria-current') === 'page');
    expect(aktivne.map((p) => p.textContent)).toEqual(['Izdane']);
  });

  it.each([
    ['STUDENT', ['Katalog', 'Moje izposoje']],
    ['ADMIN', ['Uporabniki', 'Kategorije', 'Inventar']],
  ])('meni za vlogo %s', async (vloga, oznake) => {
    izrisi('/', { vloga });
    await screen.findByRole('heading', { level: 1 });
    const povezave = within(glavniMeni()).getAllByRole('link');
    expect(povezave.map((p) => p.textContent)).toEqual(oznake);
  });

  it('brez prijave na strani 404 ni menija', async () => {
    izrisi('/neobstojeca');
    await naslov('Stran ne obstaja');
    expect(screen.queryByRole('navigation', { name: 'Glavni meni' })).toBeNull();
  });

  it('Odjava pokliče POST /api/auth/odjava in preusmeri na prijavo (US-01, kriterij 5)', async () => {
    const uporabnik = userEvent.setup();
    const { router, fetch } = izrisi('/katalog', { vloga: 'STUDENT' });
    await naslov('Katalog');

    await uporabnik.click(screen.getAllByRole('button', { name: 'Odjava' })[0]);

    expect(await naslov('Prijava')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/prijava');
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/odjava',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    // Kontekst je prazen: zaščitena stran spet vodi na prijavo.
    await router.navigate('/katalog');
    await waitFor(() => expect(router.state.location.pathname).toBe('/prijava'));
  });
});

describe('mobilni meni', () => {
  it('gumb Meni odpre in zapre pladenj, Esc ga zapre', async () => {
    const uporabnik = userEvent.setup();
    izrisi('/katalog', { vloga: 'STUDENT' });
    await naslov('Katalog');

    const gumb = screen.getByRole('button', { name: 'Meni' });
    expect(gumb.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('mobilni-meni')).toBeNull();

    await uporabnik.click(gumb);
    expect(gumb.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('mobilni-meni')).not.toBeNull();

    await uporabnik.keyboard('{Escape}');
    expect(document.getElementById('mobilni-meni')).toBeNull();
  });

  it('klik na povezavo v pladnju odpre stran in zapre pladenj', async () => {
    const uporabnik = userEvent.setup();
    const { router } = izrisi('/katalog', { vloga: 'STUDENT' });
    await naslov('Katalog');

    await uporabnik.click(screen.getByRole('button', { name: 'Meni' }));
    const pladenj = document.getElementById('mobilni-meni');
    await uporabnik.click(within(pladenj).getByRole('link', { name: 'Moje izposoje' }));

    expect(await naslov('Moje izposoje')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/moje-izposoje');
    expect(document.getElementById('mobilni-meni')).toBeNull();
  });
});

describe('noga', () => {
  it('ima kontakt in povezave na omrežja, ki se odprejo v novem zavihku', async () => {
    izrisi('/katalog', { vloga: 'STUDENT' });
    await naslov('Katalog');

    const noga = screen.getByRole('contentinfo');
    expect(within(noga).getByText(/Koroška cesta 160, 2000 Maribor/)).toBeTruthy();
    const omrezja = within(noga).getAllByRole('link');
    expect(omrezja).toHaveLength(3);
    for (const povezava of omrezja) {
      expect(povezava.getAttribute('target')).toBe('_blank');
      expect(povezava.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });
});
