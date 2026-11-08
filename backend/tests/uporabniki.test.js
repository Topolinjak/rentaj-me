import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { api, ustvariUporabnika } from './pomocniki.js';

let admin;
beforeEach(async () => {
  admin = await ustvariUporabnika({ vloga: 'ADMIN' });
});

const nov = {
  ime: 'Nina',
  priimek: 'Novak',
  email: 'nina.novak@rentaj.test',
  vloga: 'ASISTENT',
  geslo: 'zacetno-geslo',
};

describe('dostop do /api/uporabniki', () => {
  it.each(['STUDENT', 'ASISTENT', 'PROFESOR', 'TEHNIK'])('%s dobi 403 povsod', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const zahteve = [
      api().get('/api/uporabniki'),
      api().post('/api/uporabniki').send(nov),
      api().patch(`/api/uporabniki/${admin.uporabnik.id}`).send({ ime: 'X' }),
    ];
    for (const zahteva of zahteve) {
      expect((await zahteva.set('Cookie', piskotek)).status).toBe(403);
    }
  });

  it('neprijavljen dobi 401', async () => {
    expect((await api().get('/api/uporabniki')).status).toBe(401);
  });
});

describe('GET /api/uporabniki', () => {
  it('vrne seznam brez gesloHash, urejen po priimku', async () => {
    await ustvariUporabnika({ vloga: 'STUDENT' });

    const odgovor = await api().get('/api/uporabniki').set('Cookie', admin.piskotek);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toHaveLength(2);
    for (const u of odgovor.body) {
      expect(Object.keys(u).sort()).toEqual(
        ['aktiven', 'email', 'id', 'ime', 'priimek', 'ustvarjeno', 'vloga'].sort(),
      );
    }
  });

  it('išče po imenu, priimku in e-pošti ne glede na velike črke', async () => {
    await ustvariUporabnika({ email: 'nina@rentaj.test' });
    await prisma.uporabnik.update({
      where: { email: 'nina@rentaj.test' },
      data: { ime: 'Nina', priimek: 'Novak' },
    });

    for (const iskanje of ['NINA', 'novak', 'nina@rent']) {
      const odgovor = await api()
        .get('/api/uporabniki')
        .query({ iskanje })
        .set('Cookie', admin.piskotek);
      expect(odgovor.body.map((u) => u.email)).toEqual(['nina@rentaj.test']);
    }
  });
});

describe('POST /api/uporabniki', () => {
  it('ustvari uporabnika (201), geslo shrani kot bcrypt hash', async () => {
    const odgovor = await api().post('/api/uporabniki').set('Cookie', admin.piskotek).send(nov);

    expect(odgovor.status).toBe(201);
    expect(odgovor.body).toMatchObject({ email: nov.email, vloga: 'ASISTENT', aktiven: true });
    expect(odgovor.body).not.toHaveProperty('gesloHash');

    const vBazi = await prisma.uporabnik.findUnique({ where: { email: nov.email } });
    expect(vBazi.gesloHash).not.toBe(nov.geslo);
    expect(await bcrypt.compare(nov.geslo, vBazi.gesloHash)).toBe(true);
  });

  it('nov uporabnik se lahko prijavi', async () => {
    await api().post('/api/uporabniki').set('Cookie', admin.piskotek).send(nov);
    const prijava = await api()
      .post('/api/auth/prijava')
      .send({ email: nov.email, geslo: nov.geslo });
    expect(prijava.status).toBe(200);
  });

  it('obstoječa e-pošta (tudi z velikimi črkami) vrne 409', async () => {
    await api().post('/api/uporabniki').set('Cookie', admin.piskotek).send(nov);
    const odgovor = await api()
      .post('/api/uporabniki')
      .set('Cookie', admin.piskotek)
      .send({ ...nov, email: 'Nina.Novak@Rentaj.test' });

    expect(odgovor.status).toBe(409);
    expect(odgovor.body.sporocilo).toBe('Uporabnik s tem e-poštnim naslovom že obstaja');
  });

  it('neveljavni podatki vrnejo 400 s seznamom polj', async () => {
    const odgovor = await api()
      .post('/api/uporabniki')
      .set('Cookie', admin.piskotek)
      .send({ ime: ' ', email: 'ni-email', vloga: 'DEKAN', geslo: 'kratko' });

    expect(odgovor.status).toBe(400);
    expect(odgovor.body.napake.map((n) => n.polje).sort()).toEqual(
      ['email', 'geslo', 'ime', 'priimek', 'vloga'].sort(),
    );
  });
});

describe('PATCH /api/uporabniki/:id', () => {
  it('uredi podatke in vlogo', async () => {
    const { uporabnik } = await ustvariUporabnika({ vloga: 'STUDENT' });

    const odgovor = await api()
      .patch(`/api/uporabniki/${uporabnik.id}`)
      .set('Cookie', admin.piskotek)
      .send({ priimek: 'Spremenjen', vloga: 'ASISTENT' });

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({ priimek: 'Spremenjen', vloga: 'ASISTENT' });
    expect(odgovor.body).not.toHaveProperty('gesloHash');
  });

  it('deaktivacija: prijava ni več mogoča, zapis ostane v bazi', async () => {
    const { uporabnik, geslo } = await ustvariUporabnika();

    const odgovor = await api()
      .patch(`/api/uporabniki/${uporabnik.id}`)
      .set('Cookie', admin.piskotek)
      .send({ aktiven: false });
    expect(odgovor.status).toBe(200);
    expect(odgovor.body.aktiven).toBe(false);

    const prijava = await api().post('/api/auth/prijava').send({ email: uporabnik.email, geslo });
    expect(prijava.status).toBe(403);
    expect(await prisma.uporabnik.count({ where: { id: uporabnik.id } })).toBe(1);
  });

  it('ponastavitev gesla', async () => {
    const { uporabnik } = await ustvariUporabnika();
    await api()
      .patch(`/api/uporabniki/${uporabnik.id}`)
      .set('Cookie', admin.piskotek)
      .send({ geslo: 'novo-geslo-123' });

    const prijava = await api()
      .post('/api/auth/prijava')
      .send({ email: uporabnik.email, geslo: 'novo-geslo-123' });
    expect(prijava.status).toBe(200);
  });

  it('administrator ne more deaktivirati sebe ali si odvzeti vloge', async () => {
    for (const sprememba of [{ aktiven: false }, { vloga: 'TEHNIK' }]) {
      const odgovor = await api()
        .patch(`/api/uporabniki/${admin.uporabnik.id}`)
        .set('Cookie', admin.piskotek)
        .send(sprememba);
      expect(odgovor.status).toBe(400);
    }
    // Lastno ime pa lahko spremeni.
    const ime = await api()
      .patch(`/api/uporabniki/${admin.uporabnik.id}`)
      .set('Cookie', admin.piskotek)
      .send({ ime: 'Novo' });
    expect(ime.status).toBe(200);
  });

  it('e-pošta drugega uporabnika vrne 409', async () => {
    const { uporabnik } = await ustvariUporabnika();
    const odgovor = await api()
      .patch(`/api/uporabniki/${uporabnik.id}`)
      .set('Cookie', admin.piskotek)
      .send({ email: admin.uporabnik.email });
    expect(odgovor.status).toBe(409);
  });

  it('neobstoječ uporabnik vrne 404, neveljaven id 400, prazno telo 400', async () => {
    const zahteve = [
      [api().patch('/api/uporabniki/99999').send({ ime: 'X' }), 404],
      [api().patch('/api/uporabniki/abc').send({ ime: 'X' }), 400],
      [api().patch(`/api/uporabniki/${admin.uporabnik.id}`).send({}), 400],
    ];
    for (const [zahteva, status] of zahteve) {
      expect((await zahteva.set('Cookie', admin.piskotek)).status).toBe(status);
    }
  });
});
