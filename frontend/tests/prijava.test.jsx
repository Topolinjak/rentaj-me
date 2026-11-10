import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SPLOSNA_NAPAKA } from '../src/api/klic.js';
import { izrisi } from './pomocniki.jsx';

const naslov = (besedilo) => screen.findByRole('heading', { level: 1, name: besedilo });

async function prijaviSe(email, geslo) {
  const uporabnik = userEvent.setup();
  await naslov('Prijava');
  if (email) await uporabnik.type(screen.getByLabelText(/E-poštni naslov/), email);
  if (geslo) await uporabnik.type(screen.getByLabelText(/Geslo/), geslo);
  await uporabnik.click(screen.getByRole('button', { name: 'Prijava' }));
}

describe('stran za prijavo (US-01)', () => {
  it.each([
    ['student@rentaj.test', '/katalog', 'Katalog'],
    ['asistent@rentaj.test', '/katalog', 'Katalog'],
    ['profesor@rentaj.test', '/katalog', 'Katalog'],
    ['tehnik@rentaj.test', '/tehnik', 'Nadzorna plošča'],
    ['admin@rentaj.test', '/admin/uporabniki', 'Uporabniki'],
  ])('%s gre po prijavi na %s (kriterij 1)', async (email, cilj, stran) => {
    const { router, fetch } = izrisi('/prijava');

    await prijaviSe(email, 'geslo123');

    expect(await naslov(stran)).toBeTruthy();
    expect(router.state.location.pathname).toBe(cilj);
    // Kontekst je osvežen: glava pokaže prijavljenega.
    expect(screen.getAllByText('Ana Novak').length).toBeGreaterThan(0);
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/prijava',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('po prijavi vrne uporabnika na stran, ki jo je hotel odpreti', async () => {
    const { router } = izrisi('/moje-izposoje');

    await prijaviSe('student@rentaj.test', 'geslo123');

    expect(await naslov('Moje izposoje')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/moje-izposoje');
  });

  it('napačno geslo: sporočilo API-ja nad gumbom, ostane na prijavi (kriterij 2)', async () => {
    const { router } = izrisi('/prijava');

    await prijaviSe('student@rentaj.test', 'narobe');

    const napaka = await screen.findByRole('alert');
    expect(napaka.textContent).toBe('Napačen e-poštni naslov ali geslo');
    expect(router.state.location.pathname).toBe('/prijava');
    expect(screen.getByRole('button', { name: 'Prijava' }).disabled).toBe(false);
  });

  it('deaktiviran račun: »Račun je deaktiviran …« (kriterij 3)', async () => {
    izrisi('/prijava');

    await prijaviSe('deaktiviran@rentaj.test', 'geslo123');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Račun je deaktiviran. Obrnite se na administratorja.',
    );
  });

  it('prazna polja: napake iz API-ja pri poljih', async () => {
    izrisi('/prijava');

    await prijaviSe('', '');

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
    expect(screen.getByLabelText(/E-poštni naslov/).getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Vnesite e-poštni naslov.')).toBeTruthy();
    expect(screen.getByText('Vnesite geslo.')).toBeTruthy();
  });

  it('nedosegljiv strežnik: splošno sporočilo', async () => {
    const { fetch } = izrisi('/prijava');
    await naslov('Prijava');
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await prijaviSe('student@rentaj.test', 'geslo123');

    expect((await screen.findByRole('alert')).textContent).toBe(SPLOSNA_NAPAKA);
  });

  it('med prijavo je gumb onemogočen', async () => {
    const { fetch } = izrisi('/prijava');
    await naslov('Prijava');
    let odgovori;
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          odgovori = resolve;
        }),
    );

    await prijaviSe('student@rentaj.test', 'geslo123');

    const gumb = screen.getByRole('button', { name: 'Prijava' });
    expect(gumb.disabled).toBe(true);
    expect(gumb.getAttribute('aria-busy')).toBe('true');
    odgovori(new Response(JSON.stringify({ sporocilo: 'x' }), { status: 401 }));
    await waitFor(() => expect(gumb.disabled).toBe(false));
  });

  it('prijavljen uporabnik na /prijava gre na začetno stran vloge', async () => {
    const { router } = izrisi('/prijava', { vloga: 'TEHNIK' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/tehnik'));
  });

  it('ima nogo, nima glave z menijem', async () => {
    izrisi('/prijava');
    await naslov('Prijava');
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Glavni meni' })).toBeNull();
  });

  it('obrazec ne uporablja vgrajenega preverjanja brskalnika', async () => {
    izrisi('/prijava');
    await naslov('Prijava');
    expect(screen.getByRole('button', { name: 'Prijava' }).form.noValidate).toBe(true);
  });
});
