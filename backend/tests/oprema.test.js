import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { api, ustvariKos, ustvariRezervacijo, ustvariUporabnika } from './pomocniki.js';

let tehnik;
let kategorija;
beforeEach(async () => {
  tehnik = await ustvariUporabnika({ vloga: 'TEHNIK' });
  kategorija = await prisma.kategorija.create({ data: { naziv: 'Mikrokrmilniki' } });
});

const novKos = () => ({
  inventarnaStevilka: 'INV-1000',
  naziv: 'Arduino Uno',
  kategorijaId: kategorija.id,
  trenutnoStanje: 'BREZHIBNO',
});

describe('POST /api/oprema', () => {
  it('tehnik doda kos: 201, status NA_VOLJO, kategorija v odgovoru', async () => {
    const odgovor = await api()
      .post('/api/oprema')
      .set('Cookie', tehnik.piskotek)
      .send({ ...novKos(), status: 'UMAKNJEN' }); // status iz zahteve se ignorira

    expect(odgovor.status).toBe(201);
    expect(odgovor.body).toMatchObject({
      inventarnaStevilka: 'INV-1000',
      status: 'NA_VOLJO',
      trenutnoStanje: 'BREZHIBNO',
      opis: null,
      kategorija: { id: kategorija.id, naziv: 'Mikrokrmilniki' },
    });
  });

  it('admin lahko doda kos', async () => {
    const admin = await ustvariUporabnika({ vloga: 'ADMIN' });
    const odgovor = await api().post('/api/oprema').set('Cookie', admin.piskotek).send(novKos());
    expect(odgovor.status).toBe(201);
  });

  it('obstoječa inventarna številka vrne 409', async () => {
    await ustvariKos({ inventarnaStevilka: 'INV-1000', kategorijaId: kategorija.id });
    const odgovor = await api().post('/api/oprema').set('Cookie', tehnik.piskotek).send(novKos());
    expect(odgovor.status).toBe(409);
    expect(odgovor.body.sporocilo).toBe('Kos s to inventarno številko že obstaja');
  });

  it('neobstoječa kategorija vrne 400', async () => {
    const odgovor = await api()
      .post('/api/oprema')
      .set('Cookie', tehnik.piskotek)
      .send({ ...novKos(), kategorijaId: 9999 });
    expect(odgovor.status).toBe(400);
  });

  it('manjkajoča obvezna polja vrnejo 400 s seznamom', async () => {
    const odgovor = await api().post('/api/oprema').set('Cookie', tehnik.piskotek).send({});
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.napake.map((n) => n.polje).sort()).toEqual(
      ['inventarnaStevilka', 'kategorijaId', 'naziv', 'trenutnoStanje'].sort(),
    );
  });

  it.each(['STUDENT', 'ASISTENT', 'PROFESOR'])('%s dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const odgovor = await api().post('/api/oprema').set('Cookie', piskotek).send(novKos());
    expect(odgovor.status).toBe(403);
  });
});

describe('PATCH /api/oprema/:id', () => {
  it('sprememba statusa vrne število odprtih rezervacij (ODDANA, ODOBRENA)', async () => {
    const kos = await ustvariKos({ kategorijaId: kategorija.id });
    const { uporabnik } = await ustvariUporabnika();
    for (const status of ['ODDANA', 'ODOBRENA', 'ZAVRNJENA', 'VRNJENA', 'IZDANA']) {
      await ustvariRezervacijo({ uporabnikId: uporabnik.id, kosi: [kos], status });
    }

    const odgovor = await api()
      .patch(`/api/oprema/${kos.id}`)
      .set('Cookie', tehnik.piskotek)
      .send({ status: 'V_OKVARI' });

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({ status: 'V_OKVARI', odprteRezervacije: 2 });
  });

  it('umik in vrnitev v uporabo; kos ostane v bazi', async () => {
    const kos = await ustvariKos({ kategorijaId: kategorija.id, status: 'V_OKVARI' });

    for (const status of ['NA_VOLJO', 'UMAKNJEN']) {
      const odgovor = await api()
        .patch(`/api/oprema/${kos.id}`)
        .set('Cookie', tehnik.piskotek)
        .send({ status });
      expect(odgovor.body.status).toBe(status);
    }
    expect(await prisma.kosOpreme.count({ where: { id: kos.id } })).toBe(1);
  });

  it('urejanje podatkov ne spremeni neposlanih polj', async () => {
    const kos = await ustvariKos({ kategorijaId: kategorija.id, opis: 'S kablom' });
    const odgovor = await api()
      .patch(`/api/oprema/${kos.id}`)
      .set('Cookie', tehnik.piskotek)
      .send({ naziv: 'Arduino Mega' });
    expect(odgovor.body).toMatchObject({
      naziv: 'Arduino Mega',
      opis: 'S kablom',
      odprteRezervacije: 0,
    });
  });

  it('neveljaven status 400, neobstoječ kos 404, podvojena inventarna številka 409', async () => {
    const a = await ustvariKos({ kategorijaId: kategorija.id });
    const b = await ustvariKos({ kategorijaId: kategorija.id });
    const primeri = [
      [`/api/oprema/${a.id}`, { status: 'IZGUBLJEN' }, 400],
      ['/api/oprema/9999', { status: 'V_OKVARI' }, 404],
      [`/api/oprema/${a.id}`, { inventarnaStevilka: b.inventarnaStevilka }, 409],
    ];
    for (const [pot, telo, status] of primeri) {
      const odgovor = await api().patch(pot).set('Cookie', tehnik.piskotek).send(telo);
      expect(odgovor.status).toBe(status);
    }
  });

  it('študent dobi 403', async () => {
    const kos = await ustvariKos({ kategorijaId: kategorija.id });
    const { piskotek } = await ustvariUporabnika();
    const odgovor = await api()
      .patch(`/api/oprema/${kos.id}`)
      .set('Cookie', piskotek)
      .send({ status: 'UMAKNJEN' });
    expect(odgovor.status).toBe(403);
  });
});

describe('brisanje', () => {
  it('DELETE ne obstaja (404)', async () => {
    const kos = await ustvariKos({ kategorijaId: kategorija.id });
    const odgovor = await api().delete(`/api/oprema/${kos.id}`).set('Cookie', tehnik.piskotek);
    expect(odgovor.status).toBe(404);
  });
});
