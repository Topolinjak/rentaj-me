// Enotski testi za dogovor o terminih (ADR-0013). V letu 2026 je prehod na poletni čas
// 29. 3., na zimskega pa 25. 10.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  danes,
  datumiIzTermina,
  datumVLjubljani,
  dodajDni,
  jeVeljavenDatum,
  kratekDatum,
  polnocVLjubljani,
  steviloDni,
  terminIzDatumov,
} from '../src/utils/datumi.js';

const URA_MS = 60 * 60 * 1000;
const iso = (d) => d.toISOString();

describe('polnocVLjubljani', () => {
  it('pozimi je polnoč ob 23.00 UTC prejšnjega dne', () => {
    expect(iso(polnocVLjubljani('2026-11-08'))).toBe('2026-11-07T23:00:00.000Z');
    expect(iso(polnocVLjubljani('2027-01-01'))).toBe('2026-12-31T23:00:00.000Z');
  });

  it('poleti je polnoč ob 22.00 UTC prejšnjega dne', () => {
    expect(iso(polnocVLjubljani('2026-07-15'))).toBe('2026-07-14T22:00:00.000Z');
  });

  it('prehod na poletni čas: dan je dolg 23 ur', () => {
    const dan = polnocVLjubljani('2026-03-29');
    const naslednji = polnocVLjubljani('2026-03-30');
    expect(iso(dan)).toBe('2026-03-28T23:00:00.000Z');
    expect(iso(naslednji)).toBe('2026-03-29T22:00:00.000Z');
    expect(naslednji - dan).toBe(23 * URA_MS);
  });

  it('prehod na zimski čas: dan je dolg 25 ur', () => {
    const dan = polnocVLjubljani('2026-10-25');
    const naslednji = polnocVLjubljani('2026-10-26');
    expect(iso(dan)).toBe('2026-10-24T22:00:00.000Z');
    expect(iso(naslednji)).toBe('2026-10-25T23:00:00.000Z');
    expect(naslednji - dan).toBe(25 * URA_MS);
  });
});

describe('steviloDni', () => {
  it('šteje koledarske dni, oba konca vključena', () => {
    expect(steviloDni('2026-10-20', '2026-10-24')).toBe(5);
    expect(steviloDni('2026-10-20', '2026-10-20')).toBe(1);
  });

  it('ne glede na prehod na poletni ali zimski čas', () => {
    expect(steviloDni('2026-03-28', '2026-03-30')).toBe(3);
    expect(steviloDni('2026-10-24', '2026-10-26')).toBe(3);
  });

  it('čez konec leta in prestopni dan', () => {
    expect(steviloDni('2026-12-30', '2027-01-02')).toBe(4);
    expect(steviloDni('2028-02-28', '2028-03-01')).toBe(3);
  });
});

describe('terminIzDatumov in datumiIzTermina', () => {
  it('od 20. 10. do 24. 10.: konec je polnoč 25. 10.', () => {
    const { zacetek, konec } = terminIzDatumov('2026-10-20', '2026-10-24');
    expect(iso(zacetek)).toBe('2026-10-19T22:00:00.000Z');
    expect(iso(konec)).toBe('2026-10-24T22:00:00.000Z'); // 25. 10. 00.00, še poletni čas
  });

  it('zaporedni rezervaciji se dotikata, a ne prekrivata', () => {
    const prva = terminIzDatumov('2026-10-20', '2026-10-24');
    const druga = terminIzDatumov('2026-10-25', '2026-10-27');
    expect(prva.konec.getTime()).toBe(druga.zacetek.getTime());
    const prekrivanje = druga.zacetek < prva.konec && druga.konec > prva.zacetek;
    expect(prekrivanje).toBe(false);
  });

  it.each([
    ['2026-10-20', '2026-10-24'],
    ['2026-03-27', '2026-03-31'], // čez prehod na poletni čas
    ['2026-10-23', '2026-10-27'], // čez prehod na zimski čas
    ['2026-12-31', '2027-01-01'],
    ['2026-11-08', '2026-11-08'], // en dan
  ])('pretvorba tja in nazaj ohrani datuma %s–%s', (prviDan, zadnjiDan) => {
    expect(datumiIzTermina(terminIzDatumov(prviDan, zadnjiDan))).toEqual({
      od: prviDan,
      do: zadnjiDan,
    });
  });
});

describe('datumVLjubljani in danes', () => {
  afterEach(() => vi.useRealTimers());

  it('trenutek takoj po polnoči v Ljubljani je že naslednji dan', () => {
    expect(datumVLjubljani(new Date('2026-10-19T22:30:00Z'))).toBe('2026-10-20');
    expect(datumVLjubljani(new Date('2026-10-19T21:59:59Z'))).toBe('2026-10-19');
  });

  it('danes je dan v Ljubljani, ne v UTC', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T23:30:00Z')); // v Ljubljani 9. 11. ob 0.30
    expect(danes()).toBe('2026-11-09');
  });
});

describe('jeVeljavenDatum, dodajDni, kratekDatum', () => {
  it('sprejme le prave koledarske datume v obliki YYYY-MM-DD', () => {
    expect(jeVeljavenDatum('2026-10-20')).toBe(true);
    expect(jeVeljavenDatum('2028-02-29')).toBe(true);
    for (const napacen of [
      '2026-02-29',
      '2026-02-30',
      '2026-13-01',
      '2026-1-5',
      '20. 10. 2026',
      '',
      null,
    ]) {
      expect(jeVeljavenDatum(napacen)).toBe(false);
    }
  });

  it('dodajDni čez mesec in leto', () => {
    expect(dodajDni('2026-10-31', 1)).toBe('2026-11-01');
    expect(dodajDni('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('kratekDatum za sporočila', () => {
    expect(kratekDatum('2026-10-22')).toBe('22. 10.');
    expect(kratekDatum('2026-01-05')).toBe('5. 1.');
  });
});
