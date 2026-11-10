import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  danes,
  datumInUra,
  datumVLjubljani,
  datumZLetom,
  dodajDni,
  jeVeljavenDatum,
  kratekDatum,
  obdobje,
  steviloDni,
  ura,
} from '../src/utils/datumi.js';

afterEach(() => vi.useRealTimers());

// V letu 2026 se poletni čas začne 29. 3. (02.00 → 03.00) in konča 25. 10. (03.00 → 02.00).
describe('štetje dni čez prehod na poletni/zimski čas (ADR-0013)', () => {
  it('teden čez začetek poletnega časa ima 7 dni', () => {
    expect(steviloDni('2026-03-26', '2026-04-01')).toBe(7);
    expect(dodajDni('2026-03-28', 1)).toBe('2026-03-29');
    expect(dodajDni('2026-03-29', 1)).toBe('2026-03-30');
  });

  it('teden čez konec poletnega časa ima 7 dni', () => {
    expect(steviloDni('2026-10-22', '2026-10-28')).toBe(7);
    expect(dodajDni('2026-10-25', 1)).toBe('2026-10-26');
    expect(dodajDni('2026-10-26', -2)).toBe('2026-10-24');
  });

  it('en dan je 1 dan, primer iz dokumenta 03 je 5 dni', () => {
    expect(steviloDni('2026-10-20', '2026-10-20')).toBe(1);
    expect(steviloDni('2026-10-20', '2026-10-24')).toBe(5);
  });

  it('dodajDni čez konec meseca, leta in prestopni dan', () => {
    expect(dodajDni('2026-12-31', 1)).toBe('2027-01-01');
    expect(dodajDni('2028-02-28', 1)).toBe('2028-02-29');
    expect(dodajDni('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('dan v Ljubljani ne glede na pas brskalnika', () => {
  it('pozimi je Ljubljana UTC+1', () => {
    expect(datumVLjubljani(new Date('2026-01-15T22:59:59Z'))).toBe('2026-01-15');
    expect(datumVLjubljani(new Date('2026-01-15T23:00:00Z'))).toBe('2026-01-16');
  });

  it('poleti je Ljubljana UTC+2', () => {
    expect(datumVLjubljani(new Date('2026-07-01T21:59:59Z'))).toBe('2026-07-01');
    expect(datumVLjubljani(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02');
  });

  it('noč prehoda na poletni čas', () => {
    expect(datumVLjubljani(new Date('2026-03-28T22:59:59Z'))).toBe('2026-03-28');
    expect(datumVLjubljani(new Date('2026-03-28T23:00:00Z'))).toBe('2026-03-29');
    expect(datumVLjubljani(new Date('2026-03-29T21:59:59Z'))).toBe('2026-03-29');
    expect(datumVLjubljani(new Date('2026-03-29T22:00:00Z'))).toBe('2026-03-30');
  });

  it('noč prehoda na zimski čas', () => {
    expect(datumVLjubljani(new Date('2026-10-24T21:59:59Z'))).toBe('2026-10-24');
    expect(datumVLjubljani(new Date('2026-10-24T22:00:00Z'))).toBe('2026-10-25');
    expect(datumVLjubljani(new Date('2026-10-25T22:59:59Z'))).toBe('2026-10-25');
    expect(datumVLjubljani(new Date('2026-10-25T23:00:00Z'))).toBe('2026-10-26');
  });

  it('danes() vrne dan v Ljubljani, ne v UTC', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T23:30:00Z')); // 10. 11. ob 0.30 v Ljubljani
    expect(danes()).toBe('2026-11-10');
  });
});

describe('veljavnost datuma', () => {
  it('sprejme le pravi koledarski datum v obliki YYYY-MM-DD', () => {
    expect(jeVeljavenDatum('2026-11-10')).toBe(true);
    expect(jeVeljavenDatum('2028-02-29')).toBe(true);
    expect(jeVeljavenDatum('2026-02-29')).toBe(false);
    expect(jeVeljavenDatum('2026-13-01')).toBe(false);
    expect(jeVeljavenDatum('10. 11. 2026')).toBe(false);
    expect(jeVeljavenDatum(undefined)).toBe(false);
  });

  it('neveljaven datum v pretvorbi vrže napako', () => {
    expect(() => dodajDni('2026-1-1', 1)).toThrow(TypeError);
  });
});

describe('prikaz (dokument 07: 22. 10. 2026, kratko 22. 10.)', () => {
  it('kratek datum in datum z letom', () => {
    expect(kratekDatum('2026-10-22')).toBe('22. 10.');
    expect(kratekDatum('2026-03-05')).toBe('5. 3.');
    expect(datumZLetom('2026-10-22')).toBe('22. 10. 2026');
  });

  it('obdobje', () => {
    expect(obdobje('2026-10-20', '2026-10-24')).toBe('20. 10. – 24. 10. 2026');
    expect(obdobje('2026-12-28', '2027-01-03')).toBe('28. 12. 2026 – 3. 1. 2027');
    expect(obdobje('2026-10-20', '2026-10-20')).toBe('20. 10. 2026');
  });
});

describe('ura (dokument 07: 14.00) v Ljubljani', () => {
  it('poleti je Ljubljana UTC+2, pozimi UTC+1', () => {
    expect(ura('2026-10-22T12:00:00Z')).toBe('14.00');
    expect(ura('2026-11-12T12:05:00Z')).toBe('13.05');
  });

  it('ura brez vodilne ničle, minute vedno z dvema mestoma; polnoč je 0.00', () => {
    expect(ura('2026-11-12T08:07:00Z')).toBe('9.07');
    expect(ura('2026-11-11T23:00:00Z')).toBe('0.00');
  });

  it('dan konca poletnega časa (25. 10. 2026): 01.30 UTC je 02.30 po zimskem času', () => {
    expect(ura('2026-10-25T00:30:00Z')).toBe('2.30');
    expect(ura('2026-10-25T01:30:00Z')).toBe('2.30');
  });

  it('sprejme tudi Date', () => {
    expect(ura(new Date('2026-03-29T01:00:00Z'))).toBe('3.00');
  });

  it('datum in ura: dan je ljubljanski, ne UTC', () => {
    expect(datumInUra('2026-10-22T12:00:00Z')).toBe('22. 10. 2026 ob 14.00');
    // 23.30 UTC 31. 12. je v Ljubljani že novo leto.
    expect(datumInUra('2026-12-31T23:30:00Z')).toBe('1. 1. 2027 ob 0.30');
  });
});
