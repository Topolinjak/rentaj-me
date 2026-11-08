import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { api, ustvariUporabnika } from './pomocniki.js';

let admin;
beforeEach(async () => {
  admin = await ustvariUporabnika({ vloga: 'ADMIN' });
});

describe('/api/kategorije', () => {
  it('GET: vsi prijavljeni vidijo seznam, urejen po nazivu', async () => {
    await prisma.kategorija.createMany({ data: [{ naziv: 'Senzorji' }, { naziv: 'Kamere' }] });
    const { piskotek } = await ustvariUporabnika({ vloga: 'STUDENT' });

    const odgovor = await api().get('/api/kategorije').set('Cookie', piskotek);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body.map((k) => k.naziv)).toEqual(['Kamere', 'Senzorji']);
  });

  it('GET: neprijavljen dobi 401', async () => {
    expect((await api().get('/api/kategorije')).status).toBe(401);
  });

  it('POST: admin ustvari kategorijo (201), prazen opis shrani kot null', async () => {
    const odgovor = await api()
      .post('/api/kategorije')
      .set('Cookie', admin.piskotek)
      .send({ naziv: '  Senzorji ', opis: '' });

    expect(odgovor.status).toBe(201);
    expect(odgovor.body).toMatchObject({ naziv: 'Senzorji', opis: null });
  });

  it('POST: obstoječ naziv vrne 409', async () => {
    await prisma.kategorija.create({ data: { naziv: 'Senzorji' } });
    const odgovor = await api()
      .post('/api/kategorije')
      .set('Cookie', admin.piskotek)
      .send({ naziv: 'Senzorji' });
    expect(odgovor.status).toBe(409);
    expect(odgovor.body.sporocilo).toBe('Kategorija s tem nazivom že obstaja');
  });

  it('PATCH: admin preimenuje, opis ostane, če ga ne pošlje', async () => {
    const k = await prisma.kategorija.create({ data: { naziv: 'Stara', opis: 'Opis' } });
    const odgovor = await api()
      .patch(`/api/kategorije/${k.id}`)
      .set('Cookie', admin.piskotek)
      .send({ naziv: 'Nova' });
    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({ naziv: 'Nova', opis: 'Opis' });
  });

  it('PATCH: neobstoječa kategorija vrne 404', async () => {
    const odgovor = await api()
      .patch('/api/kategorije/9999')
      .set('Cookie', admin.piskotek)
      .send({ naziv: 'X' });
    expect(odgovor.status).toBe(404);
  });

  it.each(['TEHNIK', 'STUDENT'])('POST in PATCH: %s dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    const k = await prisma.kategorija.create({ data: { naziv: 'K' } });
    const post = await api().post('/api/kategorije').set('Cookie', piskotek).send({ naziv: 'X' });
    const patch = await api()
      .patch(`/api/kategorije/${k.id}`)
      .set('Cookie', piskotek)
      .send({ naziv: 'X' });
    expect([post.status, patch.status]).toEqual([403, 403]);
  });
});
