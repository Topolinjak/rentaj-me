import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { izrisi } from './pomocniki.jsx';

function strezi({ seznam, ustvari } = {}) {
  const baza = (
    seznam ?? [
      { id: 1, naziv: 'Mikrokrmilniki', opis: 'Razvojne plošče' },
      { id: 2, naziv: 'Merilni instrumenti', opis: null },
    ]
  ).map((k) => ({ ...k }));
  return {
    'GET /api/kategorije': () => [200, baza],
    'POST /api/kategorije': ustvari ?? (({ telo }) => [201, { id: 3, ...telo }]),
    'PATCH /api/kategorije/:id': ({ parametri, telo }) => {
      const k = baza.find((x) => x.id === Number(parametri.id));
      Object.assign(k, telo);
      return [200, k];
    },
  };
}

const vrstice = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('stran Kategorije (US-19)', () => {
  it('seznam po abecedi, dodajanje nove kategorije', async () => {
    const uporabnik = userEvent.setup();
    izrisi('/admin/kategorije', { vloga: 'ADMIN', api: strezi() });
    await screen.findByRole('table');
    expect(vrstice().map((v) => within(v).getAllByRole('cell')[0].textContent)).toEqual([
      'Merilni instrumenti',
      'Mikrokrmilniki',
    ]);

    await uporabnik.click(screen.getByRole('button', { name: 'Nova kategorija' }));
    const okno = screen.getByRole('dialog', { name: 'Nova kategorija' });
    await uporabnik.type(within(okno).getByLabelText(/Naziv/), 'Foto oprema');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Dodaj kategorijo' }));
    await waitFor(() => expect(vrstice()).toHaveLength(3));
  });

  it('urejanje napolni obrazec in shrani spremembo; prazen opis je null', async () => {
    const uporabnik = userEvent.setup();
    const { fetch } = izrisi('/admin/kategorije', { vloga: 'ADMIN', api: strezi() });
    await screen.findByRole('table');

    await uporabnik.click(
      within(screen.getByRole('table')).getByRole('button', {
        name: 'Uredi kategorijo Mikrokrmilniki',
      }),
    );
    const okno = screen.getByRole('dialog', { name: 'Uredi kategorijo' });
    expect(within(okno).getByLabelText(/Naziv/).value).toBe('Mikrokrmilniki');
    expect(within(okno).getByLabelText('Opis').value).toBe('Razvojne plošče');

    await uporabnik.clear(within(okno).getByLabelText('Opis'));
    await uporabnik.click(within(okno).getByRole('button', { name: 'Shrani' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const klic = fetch.mock.calls.find(([url]) => url === '/api/kategorije/1');
    expect(JSON.parse(klic[1].body)).toEqual({ naziv: 'Mikrokrmilniki', opis: null });
  });

  it('podvojen naziv: 409 pri polju', async () => {
    const uporabnik = userEvent.setup();
    izrisi('/admin/kategorije', {
      vloga: 'ADMIN',
      api: strezi({ ustvari: () => [409, { sporocilo: 'Kategorija s tem nazivom že obstaja' }] }),
    });
    await screen.findByRole('table');
    await uporabnik.click(screen.getByRole('button', { name: 'Nova kategorija' }));
    const okno = screen.getByRole('dialog');
    await uporabnik.type(within(okno).getByLabelText(/Naziv/), 'Mikrokrmilniki');
    await uporabnik.click(within(okno).getByRole('button', { name: 'Dodaj kategorijo' }));
    expect(await within(okno).findByText('Kategorija s tem nazivom že obstaja')).toBeTruthy();
  });

  it('brez kategorij prazno stanje', async () => {
    izrisi('/admin/kategorije', { vloga: 'ADMIN', api: strezi({ seznam: [] }) });
    expect(await screen.findByText('Ni še nobene kategorije')).toBeTruthy();
  });

  it('tehnik nima dostopa', async () => {
    const { router } = izrisi('/admin/kategorije', { vloga: 'TEHNIK', api: strezi() });
    await waitFor(() => expect(router.state.location.pathname).toBe('/tehnik'));
  });
});
