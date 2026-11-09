import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db.js';
import { terminIzDatumov } from '../src/utils/datumi.js';
import { api, ustvariKos, ustvariRezervacijo, ustvariUporabnika } from './pomocniki.js';

// Fiksen »zdaj«: 12. 11. 2026 ob 10.00 v Ljubljani.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-12T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

let tehnik;
beforeEach(async () => {
  tehnik = await ustvariUporabnika({ vloga: 'TEHNIK' });
});

const pridobi = (pot, piskotek = tehnik.piskotek) => api().get(pot).set('Cookie', piskotek);

async function rezervacija(uporabnik, status, od, do_) {
  return ustvariRezervacijo({
    uporabnikId: uporabnik.uporabnik.id,
    kosi: [await ustvariKos()],
    status,
    ...terminIzDatumov(od, do_),
  });
}

// Vrnjena rezervacija s poškodbo na edini postavki.
async function poskodba(uporabnik, razresen = false, opis = 'Zlomljen priključek') {
  const r = await rezervacija(uporabnik, 'VRNJENA', '2026-10-01', '2026-10-03');
  return prisma.zapisPoskodbe.create({
    data: { postavkaId: r.postavke[0].id, opis, razresen },
  });
}

const oddana = (uporabnik) => rezervacija(uporabnik, 'ODDANA', '2026-11-20', '2026-11-21');

describe('opozorila na seznamu oddanih (US-11)', () => {
  it('vsaka rezervacija ima števca za svojega uporabnika', async () => {
    const zamudnik = await ustvariUporabnika();
    const poskodovalec = await ustvariUporabnika();
    const vzoren = await ustvariUporabnika();

    // Zamudnik: dve zamujeni izposoji, ena izdana še v roku, ena vrnjena po roku.
    await rezervacija(zamudnik, 'IZDANA', '2026-11-01', '2026-11-09');
    await rezervacija(zamudnik, 'IZDANA', '2026-11-05', '2026-11-11');
    await rezervacija(zamudnik, 'IZDANA', '2026-11-10', '2026-11-14');
    await rezervacija(zamudnik, 'VRNJENA', '2026-10-01', '2026-10-02');
    // Poškodovalec: dve neporavnani in ena razrešena poškodba.
    await poskodba(poskodovalec);
    await poskodba(poskodovalec);
    await poskodba(poskodovalec, true);

    const rz = await oddana(zamudnik);
    const rz2 = await oddana(zamudnik);
    const rp = await oddana(poskodovalec);
    const rv = await oddana(vzoren);

    const odgovor = await pridobi('/api/rezervacije?status=ODDANA');

    expect(odgovor.status).toBe(200);
    const poId = Object.fromEntries(
      odgovor.body.map((r) => [r.id, [r.steviloZamud, r.steviloNeporavnanihPoskodb]]),
    );
    expect(poId).toEqual({
      [rz.id]: [2, 0],
      [rz2.id]: [2, 0],
      [rp.id]: [0, 2],
      [rv.id]: [0, 0],
    });
  });

  it('opozorila niso vezana na status rezervacij s poškodbo', async () => {
    const uporabnik = await ustvariUporabnika();
    const r = await rezervacija(uporabnik, 'IZDANA', '2026-11-10', '2026-11-14');
    await prisma.zapisPoskodbe.create({ data: { postavkaId: r.postavke[0].id, opis: 'Praska' } });
    await oddana(uporabnik);

    const [vrstica] = (await pridobi('/api/rezervacije?status=ODDANA')).body;
    expect(vrstica.steviloNeporavnanihPoskodb).toBe(1);
  });

  it('prazen seznam ne sproži napake', async () => {
    const odgovor = await pridobi('/api/rezervacije?status=ODDANA');
    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toEqual([]);
  });
});

describe('GET /api/rezervacije/:id/opozorila', () => {
  it('vrne uporabnika, zamujene izposoje in neporavnane poškodbe', async () => {
    const student = await ustvariUporabnika();
    const drugi = await ustvariUporabnika();

    const tri = await rezervacija(student, 'IZDANA', '2026-11-01', '2026-11-09');
    const dan = await rezervacija(student, 'IZDANA', '2026-11-05', '2026-11-11');
    await rezervacija(student, 'IZDANA', '2026-11-10', '2026-11-14'); // v roku
    const p = await poskodba(student, false, 'Počeno ohišje');
    await poskodba(student, true); // razrešena
    await rezervacija(drugi, 'IZDANA', '2026-11-01', '2026-11-02'); // tuja zamuda
    await poskodba(drugi); // tuja poškodba
    const r = await oddana(student);

    const odgovor = await pridobi(`/api/rezervacije/${r.id}/opozorila`);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body.uporabnik).toMatchObject({
      id: student.uporabnik.id,
      email: student.uporabnik.email,
    });
    expect(odgovor.body.zamujene.map((z) => [z.id, z.do, z.dniZamude])).toEqual([
      [tri.id, '2026-11-09', 3],
      [dan.id, '2026-11-11', 1],
    ]);
    expect(odgovor.body.zamujene[0].kosi).toHaveLength(1);
    expect(odgovor.body.poskodbe).toEqual([
      {
        id: p.id,
        opis: 'Počeno ohišje',
        ustvarjeno: p.ustvarjeno.toISOString(),
        rezervacijaId: expect.any(Number),
        kos: {
          id: expect.any(Number),
          naziv: expect.any(String),
          inventarnaStevilka: expect.any(String),
        },
      },
    ]);
  });

  it('uporabnik brez zamud in poškodb dobi prazna seznama', async () => {
    const r = await oddana(await ustvariUporabnika());
    const odgovor = await pridobi(`/api/rezervacije/${r.id}/opozorila`);
    expect(odgovor.body).toMatchObject({ zamujene: [], poskodbe: [] });
  });

  it('neobstoječa rezervacija 404, neveljaven id 400', async () => {
    expect((await pridobi('/api/rezervacije/999999/opozorila')).status).toBe(404);
    expect((await pridobi('/api/rezervacije/abc/opozorila')).status).toBe(400);
  });

  it('administrator ima dostop, izposojevalci ne (403)', async () => {
    const student = await ustvariUporabnika();
    const r = await oddana(student);
    const admin = await ustvariUporabnika({ vloga: 'ADMIN' });

    expect((await pridobi(`/api/rezervacije/${r.id}/opozorila`, admin.piskotek)).status).toBe(200);
    expect((await pridobi(`/api/rezervacije/${r.id}/opozorila`, student.piskotek)).status).toBe(
      403,
    );
  });
});
