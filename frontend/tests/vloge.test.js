import { describe, expect, it } from 'vitest';
import { IZPOSOJEVALCI, meniZaVlogo, OZNAKE_VLOG, zacetnaStran } from '../src/auth/vloge.js';

describe('vloge', () => {
  it('vsaka vloga ima oznako in meni, katerega prva povezava je njena začetna stran', () => {
    for (const vloga of [...IZPOSOJEVALCI, 'TEHNIK', 'ADMIN']) {
      expect(OZNAKE_VLOG[vloga]).toBeTruthy();
      expect(meniZaVlogo(vloga)[0].pot).toBe(zacetnaStran(vloga));
    }
  });

  it('neznana vloga nima menija', () => {
    expect(meniZaVlogo('GOST')).toEqual([]);
  });
});
