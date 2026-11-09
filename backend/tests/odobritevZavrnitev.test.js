import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db.js';
import { jeDovoljenPrehod, PREHODI } from '../src/services/statusi.js';
import { terminIzDatumov } from '../src/utils/datumi.js';
import {
  api,
  ustvariKos,
  ustvariPravila,
  ustvariRezervacijo,
  ustvariUporabnika,
} from './pomocniki.js';

// Fiksen »danes« (10. 11. 2026), da so termini v testih stabilni.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-10T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

let tehnik;
let student;
let kos;
beforeEach(async () => {
  tehnik = await ustvariUporabnika({ vloga: 'TEHNIK' });
  student = await ustvariUporabnika({ vloga: 'STUDENT' });
  kos = await ustvariKos();
});

const rezervacija = (status = 'ODDANA') =>
  ustvariRezervacijo({
    uporabnikId: student.uporabnik.id,
    kosi: [kos],
    status,
    ...terminIzDatumov('2026-11-20', '2026-11-22'),
  });

const odobri = (id, piskotek = tehnik.piskotek) =>
  api().patch(`/api/rezervacije/${id}/odobritev`).set('Cookie', piskotek);

const zavrni = (id, telo, piskotek = tehnik.piskotek) =>
  api().patch(`/api/rezervacije/${id}/zavrnitev`).set('Cookie', piskotek).send(telo);

const RAZLOG = { razlogZavrnitve: 'POTREBNA_ZA_VAJE' };

describe('dovoljeni prehodi (dokument 03)', () => {
  it('sledijo diagramu stanj', () => {
    expect(jeDovoljenPrehod('ODDANA', 'ODOBRENA')).toBe(true);
    expect(jeDovoljenPrehod('ODDANA', 'ZAVRNJENA')).toBe(true);
    expect(jeDovoljenPrehod('ODDANA', 'PREKLICANA')).toBe(true);
    expect(jeDovoljenPrehod('ODOBRENA', 'IZDANA')).toBe(true);
    expect(jeDovoljenPrehod('IZDANA', 'VRNJENA')).toBe(true);

    expect(jeDovoljenPrehod('ODOBRENA', 'ZAVRNJENA')).toBe(false);
    expect(jeDovoljenPrehod('ODDANA', 'IZDANA')).toBe(false);
    expect(jeDovoljenPrehod('IZDANA', 'ODDANA')).toBe(false);
  });

  it('končni statusi nimajo izhodov', () => {
    for (const koncni of ['ZAVRNJENA', 'PREKLICANA', 'VRNJENA']) {
      expect(PREHODI[koncni]).toEqual([]);
    }
  });
});

describe('PATCH /api/rezervacije/:id/odobritev (US-05)', () => {
  it('oddano rezervacijo odobri in zapiše tehnika', async () => {
    const r = await rezervacija();

    const odgovor = await odobri(r.id);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({
      id: r.id,
      status: 'ODOBRENA',
      obdelalId: tehnik.uporabnik.id,
      od: '2026-11-20',
      do: '2026-11-22',
      kosi: [{ id: kos.id, inventarnaStevilka: kos.inventarnaStevilka }],
    });
    const vBazi = await prisma.rezervacija.findUnique({ where: { id: r.id } });
    expect(vBazi).toMatchObject({ status: 'ODOBRENA', obdelalId: tehnik.uporabnik.id });
  });

  it.each(['ODOBRENA', 'ZAVRNJENA', 'PREKLICANA', 'IZDANA', 'VRNJENA'])(
    'rezervacije s statusom %s ne odobri (409) in je ne spremeni',
    async (status) => {
      const r = await rezervacija(status);

      const odgovor = await odobri(r.id);

      expect(odgovor.status).toBe(409);
      const vBazi = await prisma.rezervacija.findUnique({ where: { id: r.id } });
      expect(vBazi.status).toBe(status);
      expect(vBazi.obdelalId).toBeNull();
    },
  );

  it('neobstoječa rezervacija vrne 404, neveljaven id 400', async () => {
    expect((await odobri(999999)).status).toBe(404);
    expect((await odobri('abc')).status).toBe(400);
  });
});

describe('PATCH /api/rezervacije/:id/zavrnitev (US-06)', () => {
  it('shrani razlog, komentar in tehnika', async () => {
    const r = await rezervacija();

    const odgovor = await zavrni(r.id, {
      razlogZavrnitve: 'NEUSTREZEN_NAMEN',
      komentarTehnika: '  Za zaključni projekt uporabite opremo laboratorija.  ',
    });

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({
      status: 'ZAVRNJENA',
      razlogZavrnitve: 'NEUSTREZEN_NAMEN',
      komentarTehnika: 'Za zaključni projekt uporabite opremo laboratorija.',
      obdelalId: tehnik.uporabnik.id,
    });
  });

  it('brez komentarja shrani null', async () => {
    const r = await rezervacija();
    const odgovor = await zavrni(r.id, { ...RAZLOG, komentarTehnika: '' });
    expect(odgovor.status).toBe(200);
    expect(odgovor.body.komentarTehnika).toBeNull();
  });

  it('brez razloga ali z neznanim razlogom vrne 400 in ne spremeni statusa', async () => {
    const r = await rezervacija();

    for (const telo of [{}, { razlogZavrnitve: 'KER_TAKO' }]) {
      const odgovor = await zavrni(r.id, telo);
      expect(odgovor.status).toBe(400);
      expect(odgovor.body.napake[0].polje).toBe('razlogZavrnitve');
    }
    const vBazi = await prisma.rezervacija.findUnique({ where: { id: r.id } });
    expect(vBazi.status).toBe('ODDANA');
  });

  it('odobrene rezervacije ne zavrne (409)', async () => {
    const r = await rezervacija('ODOBRENA');
    const odgovor = await zavrni(r.id, RAZLOG);
    expect(odgovor.status).toBe(409);
    expect(odgovor.body.sporocilo).toBe(
      'Rezervacije s statusom »Odobrena« ni mogoče spremeniti v »Zavrnjena«.',
    );
  });

  it('po zavrnitvi kos v tem terminu ni več zaseden in ga je mogoče rezervirati', async () => {
    await ustvariPravila();
    const r = await rezervacija();
    const zasedenost = () =>
      api()
        .get(`/api/oprema/${kos.id}/zasedenost?od=2026-11-01&do=2026-11-30`)
        .set('Cookie', student.piskotek);

    expect((await zasedenost()).body).toHaveLength(1);
    await zavrni(r.id, RAZLOG);
    expect((await zasedenost()).body).toEqual([]);

    const drugi = await ustvariUporabnika({ vloga: 'STUDENT' });
    const oddaja = await api()
      .post('/api/rezervacije')
      .set('Cookie', drugi.piskotek)
      .send({ kosi: [kos.id], od: '2026-11-20', do: '2026-11-22', namen: 'Vaje' });
    expect(oddaja.status).toBe(201);
  });
});

describe('hkratna obdelava', () => {
  it('odobritev in zavrnitev iste rezervacije hkrati: uspe le ena', async () => {
    const r = await rezervacija();
    const drugiTehnik = await ustvariUporabnika({ vloga: 'TEHNIK' });

    const odgovori = await Promise.all([odobri(r.id), zavrni(r.id, RAZLOG, drugiTehnik.piskotek)]);

    expect(odgovori.map((o) => o.status).sort()).toEqual([200, 409]);
    const vBazi = await prisma.rezervacija.findUnique({ where: { id: r.id } });
    const uspesni = odgovori.find((o) => o.status === 200).body;
    expect(vBazi.status).toBe(uspesni.status);
  });
});

describe('dostop: le TEHNIK', () => {
  it.each(['STUDENT', 'ASISTENT', 'PROFESOR', 'ADMIN'])('%s dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const r = await rezervacija();

    expect((await odobri(r.id, piskotek)).status).toBe(403);
    expect((await zavrni(r.id, RAZLOG, piskotek)).status).toBe(403);
    const vBazi = await prisma.rezervacija.findUnique({ where: { id: r.id } });
    expect(vBazi.status).toBe('ODDANA');
  });

  it('profesor ne more odobriti lastne rezervacije', async () => {
    const profesor = await ustvariUporabnika({ vloga: 'PROFESOR' });
    const r = await ustvariRezervacijo({ uporabnikId: profesor.uporabnik.id, kosi: [kos] });
    expect((await odobri(r.id, profesor.piskotek)).status).toBe(403);
  });

  it('brez prijave 401', async () => {
    const r = await rezervacija();
    expect((await api().patch(`/api/rezervacije/${r.id}/odobritev`)).status).toBe(401);
  });
});
