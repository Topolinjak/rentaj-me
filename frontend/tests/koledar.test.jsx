import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Koledar from '../src/components/Koledar.jsx';
import { izrisi } from './pomocniki.jsx';

// »Danes« je 12. 11. 2026 v Ljubljani.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-12T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

function Nadzorovan({ zasedeni = [], onIzberiDan, onMesecSpy = () => {} }) {
  const [mesec, setMesec] = useState('2026-11');
  return (
    <Koledar
      mesec={mesec}
      onMesec={(m) => {
        onMesecSpy(m);
        setMesec(m);
      }}
      zasedeni={zasedeni}
      onIzberiDan={onIzberiDan}
    />
  );
}

const dan = (oznaka) => screen.getByRole('button', { name: new RegExp(`^${oznaka}`) });

describe('Koledar', () => {
  it('mesec v slovenščini, teden od ponedeljka, november 2026 se začne v nedeljo', () => {
    render(<Nadzorovan />);
    expect(screen.getByRole('grid', { name: 'november 2026' })).toBeTruthy();
    const glava = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(glava).toEqual(['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne']);
    // 1. 11. 2026 je nedelja: v prvi vrstici je šest praznih celic in nato 1.
    const prvaVrstica = screen.getAllByRole('row')[1];
    expect(
      within(prvaVrstica)
        .getAllByRole('button')
        .map((g) => g.textContent),
    ).toEqual(['1']);
  });

  it('zasedeni dnevi (od–do vključno) imajo v aria-label »zaseden«, ostali »prost«; danes je označen', () => {
    render(<Nadzorovan zasedeni={[{ od: '2026-11-20', do: '2026-11-22' }]} />);
    expect(dan('19. november 2026').getAttribute('aria-label')).toBe('19. november 2026, prost');
    expect(dan('20. november 2026').getAttribute('aria-label')).toBe('20. november 2026, zaseden');
    expect(dan('22. november 2026').getAttribute('aria-label')).toBe('22. november 2026, zaseden');
    expect(dan('23. november 2026').getAttribute('aria-label')).toBe('23. november 2026, prost');
    expect(dan('12. november 2026').getAttribute('aria-label')).toBe(
      '12. november 2026, prost, danes',
    );
  });

  it('obdobje čez rob meseca označi le dneve v prikazanem mesecu', () => {
    render(<Nadzorovan zasedeni={[{ od: '2026-10-28', do: '2026-11-02' }]} />);
    expect(dan('1. november 2026').getAttribute('aria-label')).toContain('zaseden');
    expect(dan('2. november 2026').getAttribute('aria-label')).toContain('zaseden');
    expect(dan('3. november 2026').getAttribute('aria-label')).toContain('prost');
  });

  it('gumba za mesec premakneta na prejšnji in naslednji mesec (čez novo leto)', async () => {
    const uporabnik = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onMesec = vi.fn();
    render(<Nadzorovan onMesecSpy={onMesec} />);
    await uporabnik.click(screen.getByRole('button', { name: 'Naslednji mesec' }));
    await uporabnik.click(screen.getByRole('button', { name: 'Naslednji mesec' }));
    expect(screen.getByRole('grid', { name: 'januar 2027' })).toBeTruthy();
    expect(onMesec).toHaveBeenLastCalledWith('2027-01');
    await uporabnik.click(screen.getByRole('button', { name: 'Prejšnji mesec' }));
    expect(screen.getByRole('grid', { name: 'december 2026' })).toBeTruthy();
  });

  it('le en dan je v vrsti Tab; puščice premikajo fokus, čez rob meseca zamenjajo mesec', async () => {
    const uporabnik = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Nadzorovan />);
    const vVrsti = screen.getAllByRole('button').filter((g) => g.dataset.datum && g.tabIndex === 0);
    expect(vVrsti.map((g) => g.dataset.datum)).toEqual(['2026-11-12']);

    dan('12. november 2026').focus();
    await uporabnik.keyboard('{ArrowRight}');
    expect(document.activeElement.dataset.datum).toBe('2026-11-13');
    await uporabnik.keyboard('{ArrowDown}');
    expect(document.activeElement.dataset.datum).toBe('2026-11-20');
    await uporabnik.keyboard('{Home}');
    expect(document.activeElement.dataset.datum).toBe('2026-11-16');
    await uporabnik.keyboard('{End}');
    expect(document.activeElement.dataset.datum).toBe('2026-11-22');

    await uporabnik.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(document.activeElement.dataset.datum).toBe('2026-12-06'));
    expect(screen.getByRole('grid', { name: 'december 2026' })).toBeTruthy();

    await uporabnik.keyboard('{PageUp}');
    await waitFor(() => expect(document.activeElement.dataset.datum).toBe('2026-11-06'));
  });

  it('Enter in klik izbereta dan; pretekli dnevi se ne izberejo', async () => {
    const uporabnik = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onIzberiDan = vi.fn();
    render(<Nadzorovan onIzberiDan={onIzberiDan} />);

    await uporabnik.click(dan('20. november 2026'));
    expect(onIzberiDan).toHaveBeenLastCalledWith('2026-11-20');
    dan('20. november 2026').focus();
    await uporabnik.keyboard('{ArrowRight}{Enter}');
    expect(onIzberiDan).toHaveBeenLastCalledWith('2026-11-21');

    onIzberiDan.mockClear();
    await uporabnik.click(dan('10. november 2026'));
    expect(onIzberiDan).not.toHaveBeenCalled();
  });

  it('izbran termin je označen (aria-selected) in v legendi', () => {
    render(
      <Koledar
        mesec="2026-11"
        onMesec={() => {}}
        izbrano={{ od: '2026-11-20', do: '2026-11-21' }}
      />,
    );
    expect(dan('20. november 2026').getAttribute('aria-label')).toContain('izbran');
    expect(dan('20. november 2026').closest('td').getAttribute('aria-selected')).toBe('true');
    expect(
      within(screen.getByRole('list', { name: 'Legenda' })).getByText('Izbran termin'),
    ).toBeTruthy();
  });
});

const KOS = {
  id: 11,
  inventarnaStevilka: 'A-014',
  naziv: 'Arduino Uno',
  opis: 'Z USB kablom',
  kategorija: { id: 1, naziv: 'Mikrokrmilniki' },
  status: 'NA_VOLJO',
  trenutnoStanje: 'OBRABLJENO',
};

describe('stran kosa (US-02)', () => {
  it('podatki kosa in zasedenost meseca; premik meseca naloži nov mesec', async () => {
    const uporabnik = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { fetch } = izrisi('/oprema/11', {
      vloga: 'STUDENT',
      api: {
        'GET /api/oprema/:id': () => [200, KOS],
        'GET /api/oprema/:id/zasedenost': ({ iskalni }) => [
          200,
          iskalni.get('od') === '2026-11-01' ? [{ od: '2026-11-20', do: '2026-11-22' }] : [],
        ],
      },
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Arduino Uno' })).toBeTruthy();
    expect(screen.getByText('Obrabljeno')).toBeTruthy();
    expect(screen.getByText('Z USB kablom')).toBeTruthy();
    expect(await screen.findByText('20. 11. – 22. 11. 2026')).toBeTruthy();
    expect(
      fetch.mock.calls.some(
        ([url]) => url === '/api/oprema/11/zasedenost?od=2026-11-01&do=2026-11-30',
      ),
    ).toBe(true);

    await uporabnik.click(screen.getByRole('button', { name: 'Naslednji mesec' }));
    expect(await screen.findByText('Kos je v tem mesecu ves čas prost.')).toBeTruthy();
    expect(
      fetch.mock.calls.some(
        ([url]) => url === '/api/oprema/11/zasedenost?od=2026-12-01&do=2026-12-31',
      ),
    ).toBe(true);
  });

  it('kos v okvari pokaže razlog', async () => {
    izrisi('/oprema/11', {
      vloga: 'STUDENT',
      api: {
        'GET /api/oprema/:id': () => [200, { ...KOS, status: 'V_OKVARI' }],
        'GET /api/oprema/:id/zasedenost': () => [200, []],
      },
    });
    expect(await screen.findByText(/je v okvari/)).toBeTruthy();
  });

  it('neobstoječ kos: napaka brez ponovnega poskusa in povezava na katalog', async () => {
    izrisi('/oprema/999', {
      vloga: 'STUDENT',
      api: { 'GET /api/oprema/:id': () => [404, { sporocilo: 'Kos opreme ne obstaja.' }] },
    });
    expect((await screen.findByRole('alert')).textContent).toContain('Kos opreme ne obstaja.');
    expect(screen.queryByRole('button', { name: 'Poskusi znova' })).toBeNull();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Katalog' }).getAttribute('href'),
    ).toBe('/katalog');
  });
});
