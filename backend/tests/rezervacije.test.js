import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db.js';
import { terminIzDatumov } from '../src/utils/datumi.js';
import {
  api,
  ustvariKos,
  ustvariPravila,
  ustvariRezervacijo,
  ustvariUporabnika,
} from './pomocniki.js';

// Fiksen »danes« (10. 11. 2026 v Ljubljani), da so datumi v testih stabilni. Le Date –
// pravi časovniki ostanejo, sicer bi se ustavili supertest in povezave z bazo.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-10T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

let student;
beforeEach(async () => {
  await ustvariPravila();
  student = await ustvariUporabnika({ vloga: 'STUDENT' });
});

const oddaj = (piskotek, telo) => api().post('/api/rezervacije').set('Cookie', piskotek).send(telo);

const zahtevek = (kosi, od = '2026-11-20', do_ = '2026-11-22') => ({
  kosi: kosi.map((k) => k.id),
  od,
  do: do_,
  namen: 'Projekt pri predmetu Vgrajeni sistemi',
});

async function rezervirajZaDrugega(kos, od, do_, status = 'ODOBRENA') {
  const drugi = await ustvariUporabnika();
  return ustvariRezervacijo({
    uporabnikId: drugi.uporabnik.id,
    kosi: [kos],
    status,
    ...terminIzDatumov(od, do_),
  });
}

describe('POST /api/rezervacije – uspešna oddaja', () => {
  it('ustvari rezervacijo ODDANA s postavko za vsak kos (201)', async () => {
    const a = await ustvariKos();
    const b = await ustvariKos();

    const odgovor = await oddaj(student.piskotek, zahtevek([b, a]));

    expect(odgovor.status).toBe(201);
    expect(odgovor.body).toMatchObject({
      status: 'ODDANA',
      od: '2026-11-20',
      do: '2026-11-22',
      dolgorocna: false,
      uporabnikId: student.uporabnik.id,
      kosi: [
        { id: a.id, naziv: a.naziv, inventarnaStevilka: a.inventarnaStevilka },
        { id: b.id, naziv: b.naziv, inventarnaStevilka: b.inventarnaStevilka },
      ],
    });

    const vBazi = await prisma.rezervacija.findUnique({
      where: { id: odgovor.body.id },
      include: { postavke: true },
    });
    expect(vBazi.postavke).toHaveLength(2);
    expect(vBazi.zacetek.toISOString()).toBe('2026-11-19T23:00:00.000Z');
    expect(vBazi.konec.toISOString()).toBe('2026-11-22T23:00:00.000Z'); // polnoč 23. 11.
  });

  it('začetek danes je dovoljen; ponovljen kos se upošteva enkrat', async () => {
    const kos = await ustvariKos();
    const odgovor = await oddaj(student.piskotek, {
      ...zahtevek([kos, kos], '2026-11-10', '2026-11-10'),
    });
    expect(odgovor.status).toBe(201);
    expect(odgovor.body.kosi).toHaveLength(1);
  });

  it('zaporedna rezervacija (dan po vračilu) se ne prekriva', async () => {
    const kos = await ustvariKos();
    await rezervirajZaDrugega(kos, '2026-11-15', '2026-11-19');
    expect((await oddaj(student.piskotek, zahtevek([kos]))).status).toBe(201);
  });

  it('ZAVRNJENA, PREKLICANA in VRNJENA rezervacije termina ne zasedajo', async () => {
    const kos = await ustvariKos();
    for (const status of ['ZAVRNJENA', 'PREKLICANA', 'VRNJENA']) {
      await rezervirajZaDrugega(kos, '2026-11-20', '2026-11-22', status);
    }
    expect((await oddaj(student.piskotek, zahtevek([kos]))).status).toBe(201);
  });

  it.each(['ASISTENT', 'PROFESOR'])('%s lahko odda rezervacijo', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const kos = await ustvariKos();
    expect((await oddaj(piskotek, zahtevek([kos]))).status).toBe(201);
  });
});

describe('POST /api/rezervacije – prekrivanje', () => {
  it.each(['ODDANA', 'ODOBRENA', 'IZDANA'])(
    'prekrivanje z %s vrne 409 s kosom in zasedenim terminom',
    async (status) => {
      const kos = await ustvariKos({ naziv: 'Arduino', inventarnaStevilka: 'A-014' });
      await rezervirajZaDrugega(kos, '2026-11-22', '2026-11-27', status);

      const odgovor = await oddaj(student.piskotek, zahtevek([kos], '2026-11-20', '2026-11-24'));

      expect(odgovor.status).toBe(409);
      expect(odgovor.body.sporocilo).toBe('Arduino (A-014) je zaseden od 22. 11. do 27. 11.');
    },
  );

  it('ob prekrivanju enega kosa ne nastane noben zapis, tudi za ostale kose', async () => {
    const prost = await ustvariKos();
    const zaseden = await ustvariKos();
    await rezervirajZaDrugega(zaseden, '2026-11-21', '2026-11-21');
    const prej = await prisma.rezervacija.count();

    const odgovor = await oddaj(student.piskotek, zahtevek([prost, zaseden]));

    expect(odgovor.status).toBe(409);
    expect(await prisma.rezervacija.count()).toBe(prej);
    expect(await prisma.postavkaRezervacije.count({ where: { kosOpremeId: prost.id } })).toBe(0);
  });
});

describe('POST /api/rezervacije – kosi, ki niso na voljo', () => {
  it.each(['V_OKVARI', 'UMAKNJEN'])('kos %s vrne 409 z imenom kosa', async (status) => {
    const kos = await ustvariKos({ naziv: 'Osciloskop', inventarnaStevilka: 'INV-7', status });
    const odgovor = await oddaj(student.piskotek, zahtevek([kos]));
    expect(odgovor.status).toBe(409);
    expect(odgovor.body.sporocilo).toContain('Osciloskop (INV-7)');
    expect(await prisma.rezervacija.count()).toBe(0);
  });

  it('neobstoječ kos vrne 400', async () => {
    const odgovor = await oddaj(student.piskotek, { ...zahtevek([]), kosi: [9999] });
    expect(odgovor.status).toBe(400);
  });
});

describe('POST /api/rezervacije – validacija', () => {
  it.each([
    ['brez kosov', { kosi: [] }, 'kosi'],
    ['brez namena', { namen: '  ' }, 'namen'],
    ['brez datuma', { od: undefined }, 'od'],
    ['konec pred začetkom', { od: '2026-11-22', do: '2026-11-20' }, 'do'],
    ['začetek v preteklosti', { od: '2026-11-09', do: '2026-11-12' }, 'od'],
    ['neveljaven datum', { od: '2026-11-31' }, 'od'],
  ])('%s vrne 400 z napako pri polju', async (_, sprememba, polje) => {
    const kos = await ustvariKos();
    const odgovor = await oddaj(student.piskotek, { ...zahtevek([kos]), ...sprememba });
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.napake.map((n) => n.polje)).toContain(polje);
  });
});

describe('POST /api/rezervacije – dostop', () => {
  it.each(['TEHNIK', 'ADMIN'])('%s dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const kos = await ustvariKos();
    expect((await oddaj(piskotek, zahtevek([kos]))).status).toBe(403);
  });

  it('neprijavljen dobi 401', async () => {
    expect((await api().post('/api/rezervacije').send({})).status).toBe(401);
  });
});
