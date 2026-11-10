import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db.js';
import { terminIzDatumov } from '../src/utils/datumi.js';
import { api, ustvariKos, ustvariRezervacijo, ustvariUporabnika } from './pomocniki.js';

// 25. 11. 2026 ob 15.00 v Ljubljani – rezervacija z zadnjim dnem 22. 11. je zamujena 3 dni.
const ZDAJ = new Date('2026-11-25T14:00:00Z');

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
  b = await ustvariKos();
});

// Izdana rezervacija; privzeto v roku (do 30. 11.).
const rezervacija = (status = 'IZDANA', do_ = '2026-11-30') =>
  ustvariRezervacijo({
    uporabnikId: student.uporabnik.id,
    kosi: [a, b],
    status,
    ...terminIzDatumov('2026-11-20', do_),
  });

const vrni = (id, telo, piskotek = tehnik.piskotek) =>
  api().patch(`/api/rezervacije/${id}/vracilo`).set('Cookie', piskotek).send(telo);

const vBazi = (id) =>
  prisma.rezervacija.findUnique({
    where: { id },
    include: {
      postavke: {
        include: { kosOpreme: true, poskodba: true },
        orderBy: { kosOpremeId: 'asc' },
      },
    },
  });

const brezhibno = () => ({
  kosi: [
    { id: a.id, stanje: 'BREZHIBNO' },
    { id: b.id, stanje: 'BREZHIBNO' },
  ],
});

describe('PATCH /api/rezervacije/:id/vracilo (US-08)', () => {
  it('nastavi VRNJENA, vrnjenoOb, stanje ob vračilu in trenutno stanje kosov', async () => {
    const r = await rezervacija();

    const odgovor = await vrni(r.id, {
      kosi: [
        { id: a.id, stanje: 'OBRABLJENO' },
        { id: b.id, stanje: 'BREZHIBNO' },
      ],
    });

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({
      id: r.id,
      status: 'VRNJENA',
      vrnjenoOb: ZDAJ.toISOString(),
    });
    const zapis = await vBazi(r.id);
    expect(zapis.vrnjenoOb).toEqual(ZDAJ);
    expect(zapis.postavke.map((p) => p.stanjeObVracilu)).toEqual(['OBRABLJENO', 'BREZHIBNO']);
    expect(zapis.postavke.map((p) => p.kosOpreme.trenutnoStanje)).toEqual([
      'OBRABLJENO',
      'BREZHIBNO',
    ]);
    expect(zapis.postavke.every((p) => p.poskodba === null)).toBe(true);
  });

  it('za poškodovan kos ustvari ZapisPoskodbe z razresen = false', async () => {
    const r = await rezervacija();

    const odgovor = await vrni(r.id, {
      kosi: [
        { id: a.id, stanje: 'BREZHIBNO', opisPoskodbe: 'Pri brezhibnem se ne shrani' },
        { id: b.id, stanje: 'POSKODOVANO', opisPoskodbe: '  Zlomljen USB priključek  ' },
      ],
    });

    expect(odgovor.status).toBe(200);
    const [pa, pb] = (await vBazi(r.id)).postavke;
    expect(pa.poskodba).toBeNull();
    expect(pb.poskodba).toMatchObject({
      opis: 'Zlomljen USB priključek',
      razresen: false,
      razresenoOb: null,
      ustvarjeno: ZDAJ,
    });
    expect(pb.kosOpreme.trenutnoStanje).toBe('POSKODOVANO');
  });

  it('zamujeno rezervacijo je mogoče vrniti; nato ni več med zamujenimi', async () => {
    const r = await rezervacija('IZDANA', '2026-11-22');
    const zamujene = () =>
      api().get('/api/rezervacije?zamujene=true').set('Cookie', tehnik.piskotek);

    expect((await zamujene()).body.map((z) => z.id)).toEqual([r.id]);

    expect((await vrni(r.id, brezhibno())).status).toBe(200);

    expect((await zamujene()).body).toEqual([]);
  });

  it('poškodba se prikaže v opozorilih za naslednjo rezervacijo uporabnika', async () => {
    const r = await rezervacija();
    await vrni(r.id, {
      kosi: [
        { id: a.id, stanje: 'POSKODOVANO', opisPoskodbe: 'Počeno ohišje' },
        { id: b.id, stanje: 'BREZHIBNO' },
      ],
    });
    const nova = await ustvariRezervacijo({ uporabnikId: student.uporabnik.id, kosi: [b] });

    const odgovor = await api()
      .get(`/api/rezervacije/${nova.id}/opozorila`)
      .set('Cookie', tehnik.piskotek);

    expect(odgovor.body.poskodbe).toMatchObject([
      { opis: 'Počeno ohišje', rezervacijaId: r.id, kos: { id: a.id } },
    ]);
  });

  it.each(['ODDANA', 'ODOBRENA', 'ZAVRNJENA', 'PREKLICANA', 'VRNJENA'])(
    'iz statusa %s vrne 409 in ničesar ne spremeni',
    async (status) => {
      const r = await rezervacija(status);

      const odgovor = await vrni(r.id, brezhibno());

      expect(odgovor.status).toBe(409);
      const zapis = await vBazi(r.id);
      expect(zapis.status).toBe(status);
      expect(zapis.vrnjenoOb).toBeNull();
      expect(zapis.postavke.map((p) => p.stanjeObVracilu)).toEqual([null, null]);
    },
  );

  it('poškodovan kos brez opisa vrne 400', async () => {
    const r = await rezervacija();

    for (const opisPoskodbe of [undefined, '', '   ']) {
      const odgovor = await vrni(r.id, {
        kosi: [
          { id: a.id, stanje: 'BREZHIBNO' },
          { id: b.id, stanje: 'POSKODOVANO', opisPoskodbe },
        ],
      });
      expect(odgovor.status).toBe(400);
      expect(odgovor.body.napake).toEqual([
        { polje: 'kosi.1.opisPoskodbe', sporocilo: 'Opišite poškodbo.' },
      ]);
    }
    expect((await vBazi(r.id)).status).toBe('IZDANA');
  });

  it('manjkajoče stanje kosa vrne 400; nič se ne shrani, tudi poškodba ne', async () => {
    const r = await rezervacija();

    const odgovor = await vrni(r.id, {
      kosi: [{ id: a.id, stanje: 'POSKODOVANO', opisPoskodbe: 'Praska' }],
    });

    expect(odgovor.status).toBe(400);
    const zapis = await vBazi(r.id);
    expect(zapis.status).toBe('IZDANA');
    expect(zapis.postavke.map((p) => p.stanjeObVracilu)).toEqual([null, null]);
    expect(zapis.postavke[0].kosOpreme.trenutnoStanje).toBe('BREZHIBNO');
    expect(await prisma.zapisPoskodbe.count()).toBe(0);
  });

  it('neobstoječa rezervacija vrne 404', async () => {
    expect((await vrni(999999, brezhibno())).status).toBe(404);
  });
});

describe('dostop do vračila: le TEHNIK', () => {
  it.each(['STUDENT', 'ASISTENT', 'PROFESOR', 'ADMIN'])('%s dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const r = await rezervacija();

    expect((await vrni(r.id, brezhibno(), piskotek)).status).toBe(403);
    expect((await vBazi(r.id)).status).toBe('IZDANA');
  });
});
