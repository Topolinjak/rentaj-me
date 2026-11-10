import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Gumb from '../src/components/Gumb.jsx';
import PogovornoOkno, { PotrditvenoOkno } from '../src/components/PogovornoOkno.jsx';
import Polje from '../src/components/Polje.jsx';
import {
  ZnackaOpreme,
  ZnackaRezervacije,
  ZnackaStanja,
} from '../src/components/StatusnaZnacka.jsx';
import ObvestilaProvider, { TRAJANJE_MS } from '../src/obvestila/ObvestilaProvider.jsx';
import { useObvestila } from '../src/obvestila/useObvestila.js';
import { steviloDniBesedilo } from '../src/utils/oznake.js';

describe('Gumb', () => {
  it('privzeto je type="button", da ne odda obrazca po nesreči', () => {
    render(<Gumb>Odobri</Gumb>);
    expect(screen.getByRole('button', { name: 'Odobri' }).getAttribute('type')).toBe('button');
  });

  it('med nalaganjem je onemogočen, ima aria-busy in obdrži besedilo', async () => {
    const klik = vi.fn();
    render(
      <Gumb nalaganje onClick={klik}>
        Shrani
      </Gumb>,
    );
    const gumb = screen.getByRole('button', { name: 'Shrani' });
    expect(gumb.disabled).toBe(true);
    expect(gumb.getAttribute('aria-busy')).toBe('true');
    await userEvent.click(gumb);
    expect(klik).not.toHaveBeenCalled();
  });

  it('onemogočen gumb se ne odzove na klik', async () => {
    const klik = vi.fn();
    render(
      <Gumb disabled onClick={klik}>
        Potrdi izdajo
      </Gumb>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(klik).not.toHaveBeenCalled();
  });

  it('gumb samo z ikono dobi ime iz aria-label', () => {
    render(<Gumb ikona="plus" aria-label="Dodaj kos" />);
    expect(screen.getByRole('button', { name: 'Dodaj kos' })).toBeTruthy();
  });
});

describe('Polje', () => {
  it('oznaka je povezana s poljem, obvezno je zapisano z besedo', () => {
    render(<Polje oznaka="E-poštni naslov" obvezno />);
    const polje = screen.getByRole('textbox', { name: /E-poštni naslov/ });
    expect(screen.getByText('(obvezno)')).toBeTruthy();
    expect(polje.getAttribute('aria-required')).toBe('true');
    // Brez vgrajenega preverjanja brskalnika – odloča API.
    expect(polje.required).toBe(false);
  });

  it('pomoč in napaka sta povezani s poljem, napaka je napovedana', () => {
    render(<Polje oznaka="Konec" pomoc="Zadnji dan izposoje." napaka="Predolgo obdobje." />);
    const polje = screen.getByRole('textbox', { name: 'Konec' });

    expect(polje.getAttribute('aria-invalid')).toBe('true');
    const opisi = polje
      .getAttribute('aria-describedby')
      .split(' ')
      .map((id) => document.getElementById(id).textContent);
    expect(opisi).toEqual(['Zadnji dan izposoje.', 'Predolgo obdobje.']);
    expect(screen.getByRole('alert').textContent).toBe('Predolgo obdobje.');
  });

  it('brez napake ni aria-invalid in ni opozorila', () => {
    render(<Polje oznaka="Ime" />);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('kot select prikaže podane možnosti', () => {
    render(
      <Polje oznaka="Razlog" kot="select">
        <option>Oprema je potrebna za vaje</option>
      </Polje>,
    );
    expect(screen.getByRole('combobox', { name: 'Razlog' })).toBeTruthy();
  });
});

describe('statusne značke (dokument 07, 3.3)', () => {
  it.each([
    ['ODDANA', 'Oddana'],
    ['ODOBRENA', 'Odobrena'],
    ['ZAVRNJENA', 'Zavrnjena'],
    ['PREKLICANA', 'Preklicana'],
    ['IZDANA', 'Izdana'],
    ['VRNJENA', 'Vrnjena'],
  ])('rezervacija %s → »%s« z ikono', (status, besedilo) => {
    const { container } = render(<ZnackaRezervacije status={status} />);
    expect(container.textContent).toBe(besedilo);
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('izdana in zamujena: »Zamujena · N dni«', () => {
    const { container } = render(<ZnackaRezervacije status="IZDANA" zamujena dniZamude={3} />);
    expect(container.textContent).toBe('Zamujena · 3 dnevi');
  });

  it.each([
    ['NA_VOLJO', 'Na voljo'],
    ['V_OKVARI', 'V okvari'],
    ['UMAKNJEN', 'Umaknjen'],
  ])('oprema %s → »%s«', (status, besedilo) => {
    const { container } = render(<ZnackaOpreme status={status} />);
    expect(container.textContent).toBe(besedilo);
  });

  it.each([
    ['BREZHIBNO', 'Brezhibno'],
    ['OBRABLJENO', 'Obrabljeno'],
    ['POSKODOVANO', 'Poškodovano'],
  ])('stanje %s → »%s«', (stanje, besedilo) => {
    const { container } = render(<ZnackaStanja stanje={stanje} />);
    expect(container.textContent).toBe(besedilo);
  });

  it.each([
    [1, '1 dan'],
    [2, '2 dneva'],
    [3, '3 dnevi'],
    [4, '4 dnevi'],
    [5, '5 dni'],
    [11, '11 dni'],
    [21, '21 dni'],
    [101, '101 dan'],
    [102, '102 dneva'],
    [104, '104 dnevi'],
  ])('%i → »%s«', (n, besedilo) => {
    expect(steviloDniBesedilo(n)).toBe(besedilo);
  });
});

describe('PogovornoOkno', () => {
  function Primer({ onZapriSpy = () => {} }) {
    const [odprto, setOdprto] = useState(false);
    return (
      <>
        <Gumb onClick={() => setOdprto(true)}>Odpri</Gumb>
        <PogovornoOkno
          odprto={odprto}
          onZapri={() => {
            onZapriSpy();
            setOdprto(false);
          }}
          naslov="Podrobnosti"
        >
          <p>Vsebina okna</p>
        </PogovornoOkno>
      </>
    );
  }

  it('odpre se kot modalno okno z naslovom kot imenom', async () => {
    render(<Primer />);
    expect(screen.queryByText('Vsebina okna')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Odpri' }));

    const okno = screen.getByRole('dialog', { name: 'Podrobnosti' });
    expect(okno.open).toBe(true);
    expect(screen.getByText('Vsebina okna')).toBeTruthy();
  });

  it('Esc (dogodek cancel) in gumb Zapri zapreta okno', async () => {
    const onZapri = vi.fn();
    render(<Primer onZapriSpy={onZapri} />);

    await userEvent.click(screen.getByRole('button', { name: 'Odpri' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(onZapri).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Vsebina okna')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Odpri' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zapri' }));
    expect(onZapri).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Vsebina okna')).toBeNull();
  });
});

describe('PotrditvenoOkno', () => {
  it('gumb za potrditev nosi ime dejanja, napaka API-ja je v oknu', async () => {
    const onPotrdi = vi.fn();
    const onZapri = vi.fn();
    render(
      <PotrditvenoOkno
        odprto
        onZapri={onZapri}
        onPotrdi={onPotrdi}
        naslov="Ali res želite preklicati rezervacijo?"
        potrdi="Prekliči rezervacijo"
        nevarno
        napaka="Rezervacije ni več mogoče preklicati."
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Prekliči rezervacijo' }));
    expect(onPotrdi).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Nazaj' }));
    expect(onZapri).toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('Rezervacije ni več mogoče preklicati.');
  });

  it('med nalaganjem sta oba gumba onemogočena', () => {
    render(
      <PotrditvenoOkno
        odprto
        onZapri={() => {}}
        onPotrdi={() => {}}
        naslov="Izdaja"
        potrdi="Izdaj"
        nalaganje
      />,
    );
    expect(screen.getByRole('button', { name: 'Izdaj' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Nazaj' }).disabled).toBe(true);
  });
});

describe('obvestila (toast)', () => {
  function Sprozilec() {
    const obvesti = useObvestila();
    return (
      <Gumb onClick={() => obvesti('Rezervacija oddana – čaka na odobritev tehnika')}>Oddaj</Gumb>
    );
  }

  it('obvestilo je v območju aria-live in izgine po 5 s', () => {
    vi.useFakeTimers();
    try {
      render(
        <ObvestilaProvider>
          <Sprozilec />
        </ObvestilaProvider>,
      );
      const obmocje = screen.getByRole('status', { name: 'Obvestila' });
      expect(obmocje.getAttribute('aria-live')).toBe('polite');

      fireEvent.click(screen.getByRole('button', { name: 'Oddaj' }));
      expect(obmocje.textContent).toContain('Rezervacija oddana – čaka na odobritev tehnika');

      act(() => vi.advanceTimersByTime(TRAJANJE_MS - 1));
      expect(obmocje.textContent).toContain('Rezervacija oddana');
      act(() => vi.advanceTimersByTime(1));
      expect(obmocje.textContent).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('obvestilo se zapre z gumbom', async () => {
    render(
      <ObvestilaProvider>
        <Sprozilec />
      </ObvestilaProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Oddaj' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zapri obvestilo' }));
    expect(screen.getByRole('status', { name: 'Obvestila' }).textContent).toBe('');
  });

  it('useObvestila zunaj ponudnika vrže napako', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Sprozilec />)).toThrow(/ObvestilaProvider/);
  });
});
