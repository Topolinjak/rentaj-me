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

// Fiksen »danes« (10. 11. 2026 v Ljubljani), kot v rezervacije.test.js.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-10T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

beforeEach(async () => {
  await ustvariPravila();
});

const oddaj = (piskotek, telo) => api().post('/api/rezervacije').set('Cookie', piskotek).send(telo);

async function zahtevek(steviloKosov, od = '2026-11-20', do_ = '2026-11-22', ostalo = {}) {
  const kosi = [];
  for (let i = 0; i < steviloKosov; i++) kosi.push((await ustvariKos()).id);
  return { kosi, od, do: do_, namen: 'Vaje', ...ostalo };
}

// Aktivne kose ustvari neposredno v bazi, v terminu, ki se z oddajo ne prekriva.
async function aktivniKosi(uporabnik, stevilo, status = 'ODOBRENA') {
  const kosi = [];
  for (let i = 0; i < stevilo; i++) kosi.push(await ustvariKos());
  return ustvariRezervacijo({
    uporabnikId: uporabnik.id,
    kosi,
    status,
    ...terminIzDatumov('2026-12-01', '2026-12-03'),
  });
}

describe('POST /api/rezervacije – omejitev kosov', () => {
  it('študent s 4 kosi dobi 400 z omejitvijo 3', async () => {
    const { piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });
    const odgovor = await oddaj(piskotek, await zahtevek(4));
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.sporocilo).toBe(
      'Presežena omejitev: imate 0 aktivnih kosov, dovoljenih je 3.',
    );
    expect(await prisma.rezervacija.count()).toBe(0);
  });

  it('šteje kose v rezervacijah ODDANA, ODOBRENA in IZDANA', async () => {
    const { uporabnik, piskotek } = await ustvariUporabnika({ vloga: 'ASISTENT' });
    await aktivniKosi(uporabnik, 6, 'ODDANA');
    await aktivniKosi(uporabnik, 6, 'ODOBRENA');
    await aktivniKosi(uporabnik, 6, 'IZDANA');

    const odgovor = await oddaj(piskotek, await zahtevek(3));

    expect(odgovor.status).toBe(400);
    expect(odgovor.body.sporocilo).toBe(
      'Presežena omejitev: imate 18 aktivnih kosov, dovoljenih je 20.',
    );
  });

  it('do meje je dovoljeno; zaključene rezervacije in drugi uporabniki se ne štejejo', async () => {
    const { uporabnik, piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });
    const drugi = await ustvariUporabnika({ vloga: 'STUDENT' });
    await aktivniKosi(uporabnik, 1);
    for (const status of ['ZAVRNJENA', 'PREKLICANA', 'VRNJENA']) {
      await aktivniKosi(uporabnik, 3, status);
    }
    await aktivniKosi(drugi.uporabnik, 3);

    expect((await oddaj(piskotek, await zahtevek(2))).status).toBe(201);
  });

  it('sprememba pravila velja takoj za naslednjo oddajo', async () => {
    const { piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });
    await prisma.praviloIzposoje.update({ where: { vloga: 'STUDENT' }, data: { maxKosov: 2 } });
    const odgovor = await oddaj(piskotek, await zahtevek(3));
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.sporocilo).toContain('dovoljenih je 2.');
  });
});

describe('POST /api/rezervacije – trajanje', () => {
  it('7 koledarskih dni je dovoljeno, 8 vrne 400 s številom iz pravila', async () => {
    const { piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });
    expect((await oddaj(piskotek, await zahtevek(1, '2026-11-20', '2026-11-26'))).status).toBe(201);

    const odgovor = await oddaj(piskotek, await zahtevek(1, '2026-11-20', '2026-11-27'));
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.sporocilo).toBe('Najdaljši čas izposoje za vašo vlogo je 7 dni');
  });

  it('upošteva spremenjen maxDni', async () => {
    const { piskotek } = await ustvariUporabnika({ vloga: 'ASISTENT' });
    await prisma.praviloIzposoje.update({ where: { vloga: 'ASISTENT' }, data: { maxDni: 3 } });
    const odgovor = await oddaj(piskotek, await zahtevek(1, '2026-11-20', '2026-11-23'));
    expect(odgovor.body.sporocilo).toBe('Najdaljši čas izposoje za vašo vlogo je 3 dni');
  });
});

describe('POST /api/rezervacije – dolgoročna izposoja', () => {
  it.each(['STUDENT', 'ASISTENT'])('%s z dolgorocna = true dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const telo = await zahtevek(1, '2026-11-20', '2026-11-21', { dolgorocna: true });
    expect((await oddaj(piskotek, telo)).status).toBe(403);
    expect(await prisma.rezervacija.count()).toBe(0);
  });

  it('profesor: dolgoročno do 180 dni, nad tem 400', async () => {
    const { piskotek } = await ustvariUporabnika({ vloga: 'PROFESOR' });

    // 20. 11. 2026 + 179 dni = 18. 5. 2027 → 180 koledarskih dni.
    const dovoljeno = await oddaj(
      piskotek,
      await zahtevek(1, '2026-11-20', '2027-05-18', { dolgorocna: true }),
    );
    expect(dovoljeno.status).toBe(201);
    expect(dovoljeno.body.dolgorocna).toBe(true);

    const predolgo = await oddaj(
      piskotek,
      await zahtevek(1, '2026-11-20', '2027-05-19', { dolgorocna: true }),
    );
    expect(predolgo.status).toBe(400);
    expect(predolgo.body.sporocilo).toBe('Najdaljši čas dolgoročne izposoje je 180 dni');
  });

  it('profesor brez dolgoročne izposoje je omejen na maxDni', async () => {
    const { piskotek } = await ustvariUporabnika({ vloga: 'PROFESOR' });
    const odgovor = await oddaj(piskotek, await zahtevek(1, '2026-11-20', '2026-11-27'));
    expect(odgovor.status).toBe(400);
  });
});

describe('POST /api/rezervacije – brez pravila', () => {
  it('vloga brez pravila dobi 403', async () => {
    await prisma.praviloIzposoje.delete({ where: { vloga: 'STUDENT' } });
    const { piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });
    expect((await oddaj(piskotek, await zahtevek(1))).status).toBe(403);
  });
});

describe('GET /api/pravila/moje', () => {
  it('vrne omejitve in število aktivnih kosov študenta', async () => {
    const { uporabnik, piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });
    await aktivniKosi(uporabnik, 2);

    const odgovor = await api().get('/api/pravila/moje').set('Cookie', piskotek);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toEqual({
      vloga: 'STUDENT',
      maxKosov: 3,
      maxDni: 7,
      dolgorocna: false,
      maxDniDolgorocno: null,
      aktivnihKosov: 2,
    });
  });

  it('profesor dobi tudi dolgoročno omejitev', async () => {
    const { piskotek } = await ustvariUporabnika({ vloga: 'PROFESOR' });
    const odgovor = await api().get('/api/pravila/moje').set('Cookie', piskotek);
    expect(odgovor.body).toMatchObject({ dolgorocna: true, maxDniDolgorocno: 180 });
  });

  it.each(['TEHNIK', 'ADMIN'])('%s dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    expect((await api().get('/api/pravila/moje').set('Cookie', piskotek)).status).toBe(403);
  });

  it('neprijavljen dobi 401', async () => {
    expect((await api().get('/api/pravila/moje')).status).toBe(401);
  });
});
