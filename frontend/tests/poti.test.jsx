import { renderToString } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { poti } from '../src/poti.jsx';

const izrisi = (pot) =>
  renderToString(<RouterProvider router={createMemoryRouter(poti, { initialEntries: [pot] })} />);

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

describe('poti', () => {
  it('vsebujejo vse poti MVP in stran 404', () => {
    const definirane = poti.map((p) => p.path);
    expect(definirane).toEqual(expect.arrayContaining([...POTI_MVP, '*']));
  });

  it.each([
    ['/katalog', 'Katalog'],
    ['/oprema/14', 'Kos opreme'],
    ['/tehnik', 'Nadzorna plošča'],
    ['/tehnik/vracilo/3', 'Vračilo'],
    ['/admin/uporabniki', 'Uporabniki'],
  ])('%s prikaže stran »%s«', (pot, naslov) => {
    expect(izrisi(pot)).toContain(`<h1>${naslov}</h1>`);
  });

  it('neznana pot prikaže stran 404', () => {
    expect(izrisi('/neobstojeca/pot')).toContain('Stran ne obstaja');
    expect(izrisi('/tehnik/neznano')).toContain('Stran ne obstaja');
  });
});
