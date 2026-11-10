import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db.js';
import { terminIzDatumov } from '../src/utils/datumi.js';
import { api, ustvariKos, ustvariRezervacijo, ustvariUporabnika } from './pomocniki.js';

const ZDAJ = new Date('2026-11-20T08:30:00Z');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(ZDAJ);
});
afterEach(() => vi.useRealTimers());

let tehnik;
let student;
let a;
let b;
beforeEach(async () => {
  tehnik = await ustvariUporabnika({ vloga: 'TEHNIK' });
  student = await ustvariUporabnika({ vloga: 'STUDENT' });
  a = await ustvariKos();
  b = await ustvariKos({ trenutnoStanje: 'OBRABLJENO' });
});

const rezervacija = (status = 'ODOBRENA', kosi = [a, b]) =>
  ustvariRezervacijo({
    uporabnikId: student.uporabnik.id,
    kosi,
    status,
    ...terminIzDatumov('2026-11-20', '2026-11-22'),
  });

const izdaj = (id, telo, piskotek = tehnik.piskotek) =>
  api().patch(`/api/rezervacije/${id}/izdaja`).set('Cookie', piskotek).send(telo);

const stanja = (...pari) => ({ kosi: pari.map(([kos, stanje]) => ({ id: kos.id, stanje })) });

const vBazi = (id) =>
  prisma.rezervacija.findUnique({
    where: { id },
    include: { postavke: { include: { kosOpreme: true }, orderBy: { kosOpremeId: 'asc' } } },
  });

describe('PATCH /api/rezervacije/:id/izdaja (US-07)', () => {
  it('nastavi IZDANA, izdanoOb in stanje vsake postavke', async () => {
    const r = await rezervacija();

    const odgovor = await izdaj(r.id, stanja([b, 'OBRABLJENO'], [a, 'BREZHIBNO']));

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({
      id: r.id,
      status: 'IZDANA',
      izdanoOb: ZDAJ.toISOString(),
      kosi: [{ id: a.id }, { id: b.id }],
    });

    const zapis = await vBazi(r.id);
    expect(zapis.status).toBe('IZDANA');
    expect(zapis.izdanoOb).toEqual(ZDAJ);
    expect(zapis.postavke.map((p) => p.stanjeObIzdaji)).toEqual(['BREZHIBNO', 'OBRABLJENO']);
  });

  it('trenutno stanje kosa se posodobi na stanje ob izdaji', async () => {
    const r = await rezervacija();

    await izdaj(r.id, stanja([a, 'POSKODOVANO'], [b, 'OBRABLJENO']));

    const zapis = await vBazi(r.id);
    expect(zapis.postavke.map((p) => p.kosOpreme.trenutnoStanje)).toEqual([
      'POSKODOVANO',
      'OBRABLJENO',
    ]);
  });

  it.each(['ODDANA', 'ZAVRNJENA', 'PREKLICANA', 'IZDANA', 'VRNJENA'])(
    'iz statusa %s vrne 409 in ničesar ne spremeni',
    async (status) => {
      const r = await rezervacija(status);

      const odgovor = await izdaj(r.id, stanja([a, 'BREZHIBNO'], [b, 'BREZHIBNO']));

      expect(odgovor.status).toBe(409);
      const zapis = await vBazi(r.id);
      expect(zapis.status).toBe(status);
      expect(zapis.izdanoOb).toBeNull();
      expect(zapis.postavke.map((p) => p.stanjeObIzdaji)).toEqual([null, null]);
    },
  );

  it('manjkajoče stanje za kos vrne 400 z imenom kosa in ničesar ne spremeni', async () => {
    const r = await rezervacija();

    const odgovor = await izdaj(r.id, stanja([a, 'POSKODOVANO']));

    expect(odgovor.status).toBe(400);
    expect(odgovor.body.sporocilo).toBe(`Izberite stanje za ${b.naziv} (${b.inventarnaStevilka}).`);
    const zapis = await vBazi(r.id);
    expect(zapis.status).toBe('ODOBRENA');
    expect(zapis.postavke.map((p) => p.stanjeObIzdaji)).toEqual([null, null]);
    expect(zapis.postavke[0].kosOpreme.trenutnoStanje).toBe('BREZHIBNO');
  });

  it('tuj ali ponovljen kos vrne 400', async () => {
    const r = await rezervacija();
    const tuj = await ustvariKos();

    const sTujim = await izdaj(
      r.id,
      stanja([a, 'BREZHIBNO'], [b, 'BREZHIBNO'], [tuj, 'BREZHIBNO']),
    );
    expect(sTujim.status).toBe(400);

    const ponovljen = await izdaj(
      r.id,
      stanja([a, 'BREZHIBNO'], [b, 'BREZHIBNO'], [a, 'OBRABLJENO']),
    );
    expect(ponovljen.status).toBe(400);

    expect((await vBazi(r.id)).status).toBe('ODOBRENA');
  });

  it('neveljavno telo vrne 400', async () => {
    const r = await rezervacija();

    for (const telo of [{}, { kosi: [] }, { kosi: [{ id: a.id }] }, stanja([a, 'NOVO'])]) {
      expect((await izdaj(r.id, telo)).status).toBe(400);
    }
  });

  it('neobstoječa rezervacija vrne 404', async () => {
    expect((await izdaj(999999, stanja([a, 'BREZHIBNO']))).status).toBe(404);
  });

  it('izdana rezervacija je med izdanimi v števcih', async () => {
    const r = await rezervacija();
    await izdaj(r.id, stanja([a, 'BREZHIBNO'], [b, 'OBRABLJENO']));

    const stevci = await api().get('/api/rezervacije/stevci').set('Cookie', tehnik.piskotek);
    expect(stevci.body).toMatchObject({ izdane: 1, zamujene: 0 });
  });
});

describe('dostop do izdaje: le TEHNIK', () => {
  it.each(['STUDENT', 'ASISTENT', 'PROFESOR', 'ADMIN'])('%s dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const r = await rezervacija();

    const odgovor = await izdaj(r.id, stanja([a, 'BREZHIBNO'], [b, 'BREZHIBNO']), piskotek);

    expect(odgovor.status).toBe(403);
    expect((await vBazi(r.id)).status).toBe('ODOBRENA');
  });
});
