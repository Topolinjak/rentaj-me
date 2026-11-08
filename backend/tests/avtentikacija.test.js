// zahtevajVlogo še nima prave rute, zato ga testiramo na majhni testni aplikaciji.
import cookieParser from 'cookie-parser';
import express from 'express';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { zahtevajPrijavo, zahtevajVlogo } from '../src/middleware/avtentikacija.js';
import { obdelajNapako } from '../src/middleware/napake.js';
import { ustvariUporabnika } from './pomocniki.js';

const app = express();
app.use(cookieParser());
app.get('/samo-osebje', zahtevajPrijavo, zahtevajVlogo('TEHNIK', 'ADMIN'), (req, res) =>
  res.json(req.uporabnik),
);
app.use(obdelajNapako);

describe('zahtevajVlogo', () => {
  it('vloga na seznamu: 200 in req.uporabnik = { id, vloga }', async () => {
    const { uporabnik, piskotek } = await ustvariUporabnika({ vloga: 'TEHNIK' });
    const odgovor = await supertest(app).get('/samo-osebje').set('Cookie', piskotek);
    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toEqual({ id: uporabnik.id, vloga: 'TEHNIK' });
  });

  it('vloga ni na seznamu: 403', async () => {
    const { piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });
    const odgovor = await supertest(app).get('/samo-osebje').set('Cookie', piskotek);
    expect(odgovor.status).toBe(403);
  });

  it('vloga se bere iz baze, ne iz žetona', async () => {
    // Žeton je bil izdan študentu, ki je medtem postal tehnik.
    const { uporabnik, piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });
    const { prisma } = await import('../src/db.js');
    await prisma.uporabnik.update({ where: { id: uporabnik.id }, data: { vloga: 'TEHNIK' } });

    const odgovor = await supertest(app).get('/samo-osebje').set('Cookie', piskotek);
    expect(odgovor.status).toBe(200);
  });
});
