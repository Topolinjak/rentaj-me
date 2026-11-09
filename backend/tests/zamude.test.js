import { describe, expect, it } from 'vitest';
import { dniZamude, jeZamujena, pogojZamujena } from '../src/services/zamude.js';
import { terminIzDatumov } from '../src/utils/datumi.js';

// Zadnji dan izposoje 10. 11. 2026 → konec = polnoč 11. 11. v Ljubljani (2026-11-10T23:00Z).
const izdana = { status: 'IZDANA', ...terminIzDatumov('2026-11-08', '2026-11-10') };

describe('zamude (ADR-0007)', () => {
  it('na zadnji dan izposoje ni zamujena', () => {
    const zdaj = new Date('2026-11-10T22:59:59Z'); // 23.59.59 v Ljubljani
    expect(jeZamujena(izdana, zdaj)).toBe(false);
    expect(dniZamude(izdana, zdaj)).toBe(0);
  });

  it('naslednji dan je zamujena 1 dan, čez tri dni 3 dni', () => {
    expect(jeZamujena(izdana, new Date('2026-11-10T23:00:01Z'))).toBe(true);
    expect(dniZamude(izdana, new Date('2026-11-10T23:00:01Z'))).toBe(1);
    expect(dniZamude(izdana, new Date('2026-11-13T21:00:00Z'))).toBe(3);
  });

  it('le status IZDANA je lahko zamujen', () => {
    const zdaj = new Date('2026-11-20T10:00:00Z');
    for (const status of ['ODDANA', 'ODOBRENA', 'VRNJENA', 'ZAVRNJENA', 'PREKLICANA']) {
      expect(jeZamujena({ ...izdana, status }, zdaj)).toBe(false);
      expect(dniZamude({ ...izdana, status }, zdaj)).toBe(0);
    }
  });

  it('pogoj za bazo uporablja isti status in mejo', () => {
    const zdaj = new Date('2026-11-12T10:00:00Z');
    expect(pogojZamujena(zdaj)).toEqual({ status: 'IZDANA', konec: { lt: zdaj } });
  });
});
