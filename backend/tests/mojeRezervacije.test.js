import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { terminIzDatumov } from '../src/utils/datumi.js';
import { api, ustvariKos, ustvariRezervacijo, ustvariUporabnika } from './pomocniki.js';

// Fiksen »zdaj«: 12. 11. 2026 ob 10.00 v Ljubljani.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-12T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

let ana;
let bor;
beforeEach(async () => {
  ana = await ustvariUporabnika({ vloga: 'STUDENT' });
  bor = await ustvariUporabnika({ vloga: 'STUDENT' });
});

const moje = (piskotek) => api().get('/api/rezervacije/moje').set('Cookie', piskotek);

async function rezervacija(uporabnik, status, od, do_, ostalo = {}) {
  return ustvariRezervacijo({
    uporabnikId: uporabnik.uporabnik.id,
    kosi: [await ustvariKos()],
    status,
    ...terminIzDatumov(od, do_),
    ...ostalo,
  });
}

describe('GET /api/rezervacije/moje (US-10)', () => {
  it('uporabnik A ne dobi rezervacij uporabnika B', async () => {
    const a1 = await rezervacija(ana, 'ODDANA', '2026-11-20', '2026-11-21');
    const a2 = await rezervacija(ana, 'VRNJENA', '2026-10-01', '2026-10-03');
    const b1 = await rezervacija(bor, 'ODDANA', '2026-11-20', '2026-11-21');

    const zaAno = await moje(ana.piskotek);
    const zaBora = await moje(bor.piskotek);

    expect(zaAno.status).toBe(200);
    expect(zaAno.body.map((r) => r.id).sort()).toEqual([a1.id, a2.id].sort());
    expect(zaBora.body.map((r) => r.id)).toEqual([b1.id]);
  });

  it('parametri zahteve ne spremenijo filtra po uporabniku', async () => {
    await rezervacija(bor, 'ODDANA', '2026-11-20', '2026-11-21');

    const odgovor = await api()
      .get(`/api/rezervacije/moje?uporabnikId=${bor.uporabnik.id}`)
      .set('Cookie', ana.piskotek);

    expect(odgovor.body).toEqual([]);
  });

  it('vrne vse statuse, od najkasnejšega začetka naprej', async () => {
    const statusi = ['ODDANA', 'ODOBRENA', 'IZDANA', 'VRNJENA', 'ZAVRNJENA', 'PREKLICANA'];
    const ustvarjene = [];
    for (const [i, status] of statusi.entries()) {
      const dan = String(10 + i).padStart(2, '0');
      ustvarjene.push(await rezervacija(ana, status, `2026-11-${dan}`, `2026-11-${dan}`));
    }

    const odgovor = await moje(ana.piskotek);

    expect(odgovor.body.map((r) => r.id)).toEqual(ustvarjene.map((r) => r.id).reverse());
  });

  it('vsebuje kose, termin, namen, status, razlog in komentar', async () => {
    const r = await rezervacija(ana, 'ZAVRNJENA', '2026-11-20', '2026-11-22', {
      namen: 'Seminarska naloga',
      razlogZavrnitve: 'POTREBNA_ZA_VAJE',
      komentarTehnika: 'Ta teden je oprema na vajah.',
    });

    const [vrstica] = (await moje(ana.piskotek)).body;

    expect(vrstica).toMatchObject({
      id: r.id,
      status: 'ZAVRNJENA',
      od: '2026-11-20',
      do: '2026-11-22',
      namen: 'Seminarska naloga',
      razlogZavrnitve: 'POTREBNA_ZA_VAJE',
      komentarTehnika: 'Ta teden je oprema na vajah.',
      zamujena: false,
      dniZamude: 0,
      kosi: [
        {
          id: expect.any(Number),
          naziv: expect.any(String),
          inventarnaStevilka: expect.any(String),
        },
      ],
    });
  });

  it('izdana s potečenim rokom je zamujena, v roku ali vrnjena ni', async () => {
    const zamujena = await rezervacija(ana, 'IZDANA', '2026-11-01', '2026-11-09');
    const vRoku = await rezervacija(ana, 'IZDANA', '2026-11-10', '2026-11-12');
    const vrnjena = await rezervacija(ana, 'VRNJENA', '2026-10-01', '2026-10-05');

    const poId = Object.fromEntries(
      (await moje(ana.piskotek)).body.map((r) => [r.id, [r.status, r.zamujena, r.dniZamude]]),
    );

    expect(poId).toEqual({
      [zamujena.id]: ['IZDANA', true, 3],
      [vRoku.id]: ['IZDANA', false, 0],
      [vrnjena.id]: ['VRNJENA', false, 0],
    });
  });

  it('brez rezervacij vrne prazen seznam', async () => {
    const odgovor = await moje(ana.piskotek);
    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toEqual([]);
  });
});

describe('dostop do /api/rezervacije/moje', () => {
  it.each(['ASISTENT', 'PROFESOR'])('%s ima dostop', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    expect((await moje(piskotek)).status).toBe(200);
  });

  it.each(['TEHNIK', 'ADMIN'])('%s dobi 403 (si opreme ne izposoja)', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    expect((await moje(piskotek)).status).toBe(403);
  });

  it('brez prijave 401', async () => {
    expect((await api().get('/api/rezervacije/moje')).status).toBe(401);
  });
});
