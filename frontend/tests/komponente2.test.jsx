import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Harmonika from '../src/components/Harmonika.jsx';
import Paginacija from '../src/components/Paginacija.jsx';
import PraznoStanje from '../src/components/PraznoStanje.jsx';
import { SkeletKartic, SkeletTabele } from '../src/components/Skelet.jsx';
import Tabela from '../src/components/Tabela.jsx';
import Zavihki from '../src/components/Zavihki.jsx';

const VRSTICE = [
  { id: 1, ime: 'Žiga', dni: 2 },
  { id: 2, ime: 'Ana', dni: 10 },
  { id: 3, ime: 'Čedo', dni: 1 },
];
const STOLPCI = [
  { kljuc: 'ime', oznaka: 'Uporabnik', vrednost: (v) => v.ime, razvrsti: (v) => v.ime },
  { kljuc: 'dni', oznaka: 'Dni', vrednost: (v) => v.dni, razvrsti: (v) => v.dni, stevilka: true },
  { kljuc: 'dejanja', oznaka: 'Dejanja', vrednost: () => 'Vračilo' },
];

// Imena v vrsticah tabele (namizni prikaz) po vrsti.
const imenaVTabeli = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((vrstica) => within(vrstica).getAllByRole('cell')[0].textContent);

describe('Tabela', () => {
  it('privzeto ohrani vrstni red podatkov', () => {
    render(<Tabela stolpci={STOLPCI} vrstice={VRSTICE} naslov="Zamujene" />);
    expect(imenaVTabeli()).toEqual(['Žiga', 'Ana', 'Čedo']);
    expect(screen.getByRole('table', { name: 'Zamujene' })).toBeTruthy();
  });

  it('klik na glavo razvrsti naraščajoče, ponovni klik padajoče; aria-sort to pove', async () => {
    const uporabnik = userEvent.setup();
    render(<Tabela stolpci={STOLPCI} vrstice={VRSTICE} />);
    const glava = screen.getByRole('columnheader', { name: /Dni/ });

    await uporabnik.click(within(glava).getByRole('button'));
    expect(imenaVTabeli()).toEqual(['Čedo', 'Žiga', 'Ana']);
    expect(glava.getAttribute('aria-sort')).toBe('ascending');

    await uporabnik.click(within(glava).getByRole('button'));
    expect(imenaVTabeli()).toEqual(['Ana', 'Žiga', 'Čedo']);
    expect(glava.getAttribute('aria-sort')).toBe('descending');
  });

  it('besedilo razvršča po slovenski abecedi (č za c, ž na koncu)', async () => {
    render(
      <Tabela
        stolpci={STOLPCI}
        vrstice={VRSTICE}
        zacetnoRazvrscanje={{ kljuc: 'ime', smer: 'narascajoce' }}
      />,
    );
    expect(imenaVTabeli()).toEqual(['Ana', 'Čedo', 'Žiga']);
  });

  it('stolpec brez razvrsti nima gumba', () => {
    render(<Tabela stolpci={STOLPCI} vrstice={VRSTICE} />);
    const glava = screen.getByRole('columnheader', { name: 'Dejanja' });
    expect(within(glava).queryByRole('button')).toBeNull();
  });

  it('ne spremeni podanega seznama', async () => {
    const vrstice = [...VRSTICE];
    render(<Tabela stolpci={STOLPCI} vrstice={vrstice} />);
    await userEvent.click(
      within(screen.getByRole('columnheader', { name: /Dni/ })).getByRole('button'),
    );
    expect(vrstice.map((v) => v.id)).toEqual([1, 2, 3]);
  });

  it('na telefonu kartice s pari oznaka: vrednost in izbira razvrščanja', async () => {
    const uporabnik = userEvent.setup();
    render(<Tabela stolpci={STOLPCI} vrstice={VRSTICE} naslov="Zamujene" />);
    const seznam = screen.getByRole('list', { name: 'Zamujene' });
    const kartice = within(seznam).getAllByRole('listitem');
    expect(kartice).toHaveLength(3);
    expect(within(kartice[0]).getByText('Uporabnik')).toBeTruthy();
    expect(within(kartice[0]).getByText('Žiga')).toBeTruthy();

    await uporabnik.selectOptions(screen.getByLabelText('Razvrsti po'), 'dni:padajoce');
    expect(within(within(seznam).getAllByRole('listitem')[0]).getByText('Ana')).toBeTruthy();
  });
});

describe('Zavihki', () => {
  const ZAVIHKI = [
    { kljuc: 'trenutne', oznaka: 'Trenutne', vsebina: <p>Vsebina trenutnih</p> },
    { kljuc: 'pretekle', oznaka: 'Pretekle', vsebina: <p>Vsebina preteklih</p> },
    { kljuc: 'vse', oznaka: 'Vse', vsebina: <p>Vsebina vseh</p> },
  ];

  it('prvi zavihek je izbran, vsebina je povezana z zavihkom', () => {
    render(<Zavihki zavihki={ZAVIHKI} oznaka="Izposoje" />);
    const zavihek = screen.getByRole('tab', { name: 'Trenutne' });
    expect(zavihek.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Trenutne' }).textContent).toBe(
      'Vsebina trenutnih',
    );
    expect(screen.getByRole('tablist', { name: 'Izposoje' })).toBeTruthy();
  });

  it('klik izbere zavihek', async () => {
    render(<Zavihki zavihki={ZAVIHKI} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Pretekle' }));
    expect(screen.getByRole('tabpanel').textContent).toBe('Vsebina preteklih');
  });

  it('puščice, Home in End premikajo fokus in izbiro; le izbran zavihek je v vrsti Tab', async () => {
    const uporabnik = userEvent.setup();
    render(<Zavihki zavihki={ZAVIHKI} />);
    const [prvi, drugi, tretji] = screen.getAllByRole('tab');
    expect([prvi.tabIndex, drugi.tabIndex, tretji.tabIndex]).toEqual([0, -1, -1]);

    prvi.focus();
    await uporabnik.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(drugi);
    expect(drugi.getAttribute('aria-selected')).toBe('true');

    await uporabnik.keyboard('{End}');
    expect(document.activeElement).toBe(tretji);
    await uporabnik.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(prvi);
    await uporabnik.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tretji);
    await uporabnik.keyboard('{Home}');
    expect(document.activeElement).toBe(prvi);
    expect(screen.getByRole('tabpanel').textContent).toBe('Vsebina trenutnih');
  });

  it('nadzorovana raba: izbran in onIzberi', async () => {
    const onIzberi = vi.fn();
    function Nadzorovani() {
      const [izbran, setIzbran] = useState('pretekle');
      return (
        <Zavihki
          zavihki={ZAVIHKI}
          izbran={izbran}
          onIzberi={(k) => {
            onIzberi(k);
            setIzbran(k);
          }}
        />
      );
    }
    render(<Nadzorovani />);
    expect(screen.getByRole('tabpanel').textContent).toBe('Vsebina preteklih');
    await userEvent.click(screen.getByRole('tab', { name: 'Vse' }));
    expect(onIzberi).toHaveBeenCalledWith('vse');
    expect(screen.getByRole('tabpanel').textContent).toBe('Vsebina vseh');
  });
});

describe('Paginacija', () => {
  it.each([
    [1, 143, '1–20 od 143'],
    [2, 143, '21–40 od 143'],
    [8, 143, '141–143 od 143'],
    [1, 5, '1–5 od 5'],
  ])('stran %i od %i zapisov: »%s«', (stran, skupaj, besedilo) => {
    render(<Paginacija stran={stran} skupaj={skupaj} onStran={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Strani' }).textContent).toContain(besedilo);
  });

  it('gumba premikata stran; na robu sta onemogočena', async () => {
    const onStran = vi.fn();
    const { rerender } = render(<Paginacija stran={1} skupaj={143} onStran={onStran} />);
    expect(screen.getByRole('button', { name: 'Prejšnja' }).disabled).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Naslednja' }));
    expect(onStran).toHaveBeenCalledWith(2);

    rerender(<Paginacija stran={8} skupaj={143} onStran={onStran} />);
    expect(screen.getByRole('button', { name: 'Naslednja' }).disabled).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Prejšnja' }));
    expect(onStran).toHaveBeenCalledWith(7);
  });

  it('ena stran: brez gumbov; brez zapisov: nič', () => {
    const { rerender, container } = render(<Paginacija stran={1} skupaj={5} onStran={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<Paginacija stran={1} skupaj={0} onStran={() => {}} />);
    expect(container.textContent).toBe('');
  });
});

describe('PraznoStanje', () => {
  it('pokaže besedilo in dejanje', () => {
    render(
      <PraznoStanje
        naslov="Nimate še nobene rezervacije"
        besedilo="Opremo izberete v katalogu."
        dejanje={<a href="/katalog">Na katalog</a>}
      />,
    );
    expect(screen.getByText('Nimate še nobene rezervacije')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Na katalog' })).toBeTruthy();
  });
});

describe('skeleti', () => {
  it.each([
    ['kartic', <SkeletKartic key="k" />],
    ['tabele', <SkeletTabele key="t" />],
  ])('skelet %s je napovedan kot nalaganje', (_, element) => {
    render(element);
    expect(screen.getByRole('status').textContent).toBe('Nalaganje …');
  });
});

describe('Harmonika', () => {
  it('se odpre in zapre s klikom na naslov', async () => {
    render(
      <Harmonika naslov="Zgodovina kosa">
        <p>Vsebina</p>
      </Harmonika>,
    );
    const podrobnosti = screen.getByText('Zgodovina kosa').closest('details');
    expect(podrobnosti.open).toBe(false);
    await userEvent.click(screen.getByText('Zgodovina kosa'));
    expect(podrobnosti.open).toBe(true);
  });

  it('odprta je lahko že na začetku', () => {
    render(
      <Harmonika naslov="Podrobnosti" odprta>
        <p>Vsebina</p>
      </Harmonika>,
    );
    expect(screen.getByText('Podrobnosti').closest('details').open).toBe(true);
  });
});
