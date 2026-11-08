import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { api, ustvariUporabnika } from './pomocniki.js';

const NAPACNI_PODATKI = 'Napačen e-poštni naslov ali geslo';

const prijava = (email, geslo) => api().post('/api/auth/prijava').send({ email, geslo });
const piskotekIz = (odgovor) => odgovor.headers['set-cookie']?.[0] ?? '';

describe('POST /api/auth/prijava', () => {
  it('pravilni podatki: 200, podatki uporabnika in piškotek httpOnly za 8 ur', async () => {
    const { uporabnik, geslo } = await ustvariUporabnika();

    const odgovor = await prijava(uporabnik.email, geslo);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toEqual({
      id: uporabnik.id,
      ime: uporabnik.ime,
      priimek: uporabnik.priimek,
      email: uporabnik.email,
      vloga: uporabnik.vloga,
    });
    const piskotek = piskotekIz(odgovor);
    expect(piskotek).toMatch(/^zeton=/);
    expect(piskotek).toContain('HttpOnly');
    expect(piskotek).toContain('SameSite=Lax');
    expect(piskotek).toContain('Max-Age=28800');
    expect(piskotek).not.toContain('Secure'); // samo v produkciji
  });

  it('e-poštni naslov ni občutljiv na velike črke in presledke', async () => {
    const { uporabnik, geslo } = await ustvariUporabnika({ email: 'ana@rentaj.test' });
    const odgovor = await prijava('  Ana@Rentaj.TEST ', geslo);
    expect(odgovor.status).toBe(200);
    expect(odgovor.body.id).toBe(uporabnik.id);
  });

  it('napačno geslo in neobstoječ naslov vrneta enak 401', async () => {
    const { uporabnik } = await ustvariUporabnika();

    const napacnoGeslo = await prijava(uporabnik.email, 'napacno');
    const neobstojec = await prijava('nihce@rentaj.test', 'napacno');

    for (const odgovor of [napacnoGeslo, neobstojec]) {
      expect(odgovor.status).toBe(401);
      expect(odgovor.body).toEqual({ sporocilo: NAPACNI_PODATKI });
      expect(odgovor.headers['set-cookie']).toBeUndefined();
    }
  });

  it('deaktiviran uporabnik: s pravilnim geslom 403, z napačnim 401', async () => {
    const { uporabnik, geslo } = await ustvariUporabnika({ aktiven: false });

    const pravilno = await prijava(uporabnik.email, geslo);
    expect(pravilno.status).toBe(403);
    expect(pravilno.body.sporocilo).toBe('Račun je deaktiviran. Obrnite se na administratorja.');

    const napacno = await prijava(uporabnik.email, 'napacno');
    expect(napacno.status).toBe(401);
    expect(napacno.body.sporocilo).toBe(NAPACNI_PODATKI);
  });

  it('neveljaven vnos vrne 400 s seznamom polj', async () => {
    const odgovor = await api().post('/api/auth/prijava').send({ email: 'ni-email' });
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.napake.map((n) => n.polje).sort()).toEqual(['email', 'geslo']);
  });
});

describe('GET /api/auth/jaz', () => {
  it('po prijavi vrne podatke brez gesloHash', async () => {
    const { uporabnik, geslo } = await ustvariUporabnika({ vloga: 'TEHNIK' });
    const piskotek = piskotekIz(await prijava(uporabnik.email, geslo));

    const odgovor = await api().get('/api/auth/jaz').set('Cookie', piskotek);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({ id: uporabnik.id, vloga: 'TEHNIK' });
    expect(odgovor.body).not.toHaveProperty('gesloHash');
    expect(odgovor.body).not.toHaveProperty('aktiven');
  });

  it('brez piškotka vrne 401', async () => {
    const odgovor = await api().get('/api/auth/jaz');
    expect(odgovor.status).toBe(401);
  });

  it('ponarejen ali potekel žeton vrne 401', async () => {
    const { uporabnik } = await ustvariUporabnika();
    const potekel = jwt.sign({ vloga: 'STUDENT' }, process.env.JWT_SECRET, {
      subject: String(uporabnik.id),
      expiresIn: -10,
    });
    const tujaSkrivnost = jwt.sign({ vloga: 'ADMIN' }, 'druga-skrivnost', {
      subject: String(uporabnik.id),
    });

    for (const zeton of ['abc.def.ghi', potekel, tujaSkrivnost]) {
      const odgovor = await api().get('/api/auth/jaz').set('Cookie', `zeton=${zeton}`);
      expect(odgovor.status).toBe(401);
    }
  });

  it('veljaven žeton deaktiviranega uporabnika vrne 401', async () => {
    const { uporabnik, piskotek } = await ustvariUporabnika();
    await prisma.uporabnik.update({ where: { id: uporabnik.id }, data: { aktiven: false } });

    const odgovor = await api().get('/api/auth/jaz').set('Cookie', piskotek);
    expect(odgovor.status).toBe(401);
  });
});

describe('POST /api/auth/odjava', () => {
  it('izbriše piškotek', async () => {
    const { uporabnik, geslo } = await ustvariUporabnika();
    const piskotek = piskotekIz(await prijava(uporabnik.email, geslo));

    const odjava = await api().post('/api/auth/odjava').set('Cookie', piskotek);
    expect(odjava.status).toBe(204);
    expect(piskotekIz(odjava)).toMatch(/^zeton=;.*Expires=Thu, 01 Jan 1970/);
  });

  it('brez prijave vrne 401', async () => {
    const odgovor = await api().post('/api/auth/odjava');
    expect(odgovor.status).toBe(401);
  });
});
