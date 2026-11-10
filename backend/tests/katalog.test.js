import { beforeEach, describe, expect, it } from 'vitest';
import { terminIzDatumov } from '../src/utils/datumi.js';
import { api, ustvariKos, ustvariRezervacijo, ustvariUporabnika } from './pomocniki.js';

let student;
beforeEach(async () => {
  student = await ustvariUporabnika({ vloga: 'STUDENT' });
});

describe('GET /api/oprema (katalog)', () => {
  it('vrne kose s kategorijo, brez umaknjenih; V_OKVARI ostane s statusom', async () => {
    const naVoljo = await ustvariKos({ naziv: 'A naprava' });
    const vOkvari = await ustvariKos({ naziv: 'B naprava', status: 'V_OKVARI' });
    await ustvariKos({ naziv: 'C naprava', status: 'UMAKNJEN' });

    const odgovor = await api().get('/api/oprema').set('Cookie', student.piskotek);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body.map((k) => [k.id, k.status])).toEqual([
      [naVoljo.id, 'NA_VOLJO'],
      [vOkvari.id, 'V_OKVARI'],
    ]);
    expect(odgovor.body[0].kategorija).toEqual({
      id: expect.any(Number),
      naziv: expect.any(String),
    });
  });

  it('?vsi=true: tehnik in administrator vidita tudi umaknjene', async () => {
    const naVoljo = await ustvariKos({ naziv: 'A naprava' });
    const umaknjen = await ustvariKos({ naziv: 'B naprava', status: 'UMAKNJEN' });

    for (const vloga of ['TEHNIK', 'ADMIN']) {
      const { piskotek } = await ustvariUporabnika({ vloga });
      const odgovor = await api().get('/api/oprema?vsi=true').set('Cookie', piskotek);
      expect(odgovor.status).toBe(200);
      expect(odgovor.body.map((k) => k.id)).toEqual([naVoljo.id, umaknjen.id]);
    }
  });

  it('?vsi=true za študenta vrne 403, neveljavna vrednost 400', async () => {
    expect((await api().get('/api/oprema?vsi=true').set('Cookie', student.piskotek)).status).toBe(
      403,
    );
    expect((await api().get('/api/oprema?vsi=da').set('Cookie', student.piskotek)).status).toBe(
      400,
    );
  });

  it('neprijavljen dobi 401', async () => {
    expect((await api().get('/api/oprema')).status).toBe(401);
  });
});

describe('GET /api/oprema/:id', () => {
  it('vrne podrobnosti kosa', async () => {
    const kos = await ustvariKos({ opis: 'S kablom' });
    const odgovor = await api().get(`/api/oprema/${kos.id}`).set('Cookie', student.piskotek);
    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({
      id: kos.id,
      opis: 'S kablom',
      kategorija: { id: kos.kategorijaId },
    });
  });

  it('umaknjen ali neobstoječ kos vrne 404', async () => {
    const umaknjen = await ustvariKos({ status: 'UMAKNJEN' });
    for (const id of [umaknjen.id, 9999]) {
      const odgovor = await api().get(`/api/oprema/${id}`).set('Cookie', student.piskotek);
      expect(odgovor.status).toBe(404);
    }
  });
});

describe('GET /api/oprema/:id/zasedenost', () => {
  const zasedenost = (kos, od, do_) =>
    api()
      .get(`/api/oprema/${kos.id}/zasedenost`)
      .query({ od, do: do_ })
      .set('Cookie', student.piskotek);

  async function rezerviraj(kos, od, do_, status = 'ODOBRENA') {
    const drugi = await ustvariUporabnika();
    return ustvariRezervacijo({
      uporabnikId: drugi.uporabnik.id,
      kosi: [kos],
      status,
      namen: 'Skrivni projekt',
      ...terminIzDatumov(od, do_),
    });
  }

  it('vrne obdobja ODDANA, ODOBRENA in IZDANA kot datuma od–do, urejena', async () => {
    const kos = await ustvariKos();
    await rezerviraj(kos, '2026-12-14', '2026-12-16', 'IZDANA');
    await rezerviraj(kos, '2026-12-01', '2026-12-03', 'ODDANA');
    await rezerviraj(kos, '2026-12-22', '2026-12-27', 'ODOBRENA');

    const odgovor = await zasedenost(kos, '2026-12-01', '2026-12-31');

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toEqual([
      { od: '2026-12-01', do: '2026-12-03' },
      { od: '2026-12-14', do: '2026-12-16' },
      { od: '2026-12-22', do: '2026-12-27' },
    ]);
  });

  it('ZAVRNJENA, PREKLICANA in VRNJENA termina ne zasedajo', async () => {
    const kos = await ustvariKos();
    for (const status of ['ZAVRNJENA', 'PREKLICANA', 'VRNJENA']) {
      await rezerviraj(kos, '2026-12-10', '2026-12-12', status);
    }
    expect((await zasedenost(kos, '2026-12-01', '2026-12-31')).body).toEqual([]);
  });

  it('vključi rezervacije, ki obdobje le delno prekrivajo; mejni dnevi', async () => {
    const kos = await ustvariKos();
    await rezerviraj(kos, '2026-11-28', '2026-12-02'); // sega v december
    await rezerviraj(kos, '2026-12-31', '2027-01-03'); // zadnji dan decembra
    await rezerviraj(kos, '2026-11-20', '2026-11-30'); // konča se pred decembrom
    await rezerviraj(kos, '2027-01-01', '2027-01-05'); // začne se po decembru

    const odgovor = await zasedenost(kos, '2026-12-01', '2026-12-31');

    expect(odgovor.body).toEqual([
      { od: '2026-11-28', do: '2026-12-02' },
      { od: '2026-12-31', do: '2027-01-03' },
    ]);
  });

  it('upošteva le izbrani kos', async () => {
    const kos = await ustvariKos();
    const drug = await ustvariKos();
    await rezerviraj(drug, '2026-12-10', '2026-12-12');
    expect((await zasedenost(kos, '2026-12-01', '2026-12-31')).body).toEqual([]);
  });

  it('odgovor ne vsebuje uporabnika, e-pošte ali namena', async () => {
    const kos = await ustvariKos();
    await rezerviraj(kos, '2026-12-10', '2026-12-12');
    const odgovor = await zasedenost(kos, '2026-12-01', '2026-12-31');
    expect(Object.keys(odgovor.body[0]).sort()).toEqual(['do', 'od']);
    expect(JSON.stringify(odgovor.body)).not.toMatch(/Skrivni|rentaj\.test|uporabnik/i);
  });

  it('neveljavni datumi vrnejo 400', async () => {
    const kos = await ustvariKos();
    const primeri = [
      [undefined, undefined],
      ['2026-12-31', '2026-12-01'], // do pred od
      ['2026-02-30', '2026-03-01'], // neobstoječ dan
      ['1. 12. 2026', '2026-12-31'],
      ['2026-01-01', '2027-06-01'], // predolgo obdobje
    ];
    for (const [od, do_] of primeri) {
      expect((await zasedenost(kos, od, do_)).status).toBe(400);
    }
  });

  it('umaknjen kos vrne 404', async () => {
    const kos = await ustvariKos({ status: 'UMAKNJEN' });
    expect((await zasedenost(kos, '2026-12-01', '2026-12-31')).status).toBe(404);
  });
});
