import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { terminIzDatumov } from '../src/utils/datumi.js';
import { api, ustvariKos, ustvariRezervacijo, ustvariUporabnika } from './pomocniki.js';

// »Zdaj« je 12. 11. 2026 ob 10.00 v Ljubljani.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-12T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

let tehnik;
let student;
beforeEach(async () => {
  tehnik = await ustvariUporabnika({ vloga: 'TEHNIK' });
  student = await ustvariUporabnika({ vloga: 'STUDENT' });
});

const podrobnosti = (id, piskotek = tehnik.piskotek) =>
  api().get(`/api/rezervacije/${id}`).set('Cookie', piskotek);

describe('GET /api/rezervacije/:id (stran vračila)', () => {
  it('vrne uporabnika, kose s stanji ob izdaji in trenutnim stanjem ter zamudo', async () => {
    const a = await ustvariKos({ trenutnoStanje: 'OBRABLJENO' });
    const b = await ustvariKos();
    const r = await ustvariRezervacijo({
      uporabnikId: student.uporabnik.id,
      kosi: [a, b],
      status: 'IZDANA',
      ...terminIzDatumov('2026-11-01', '2026-11-09'),
    });

    const odgovor = await podrobnosti(r.id);

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toMatchObject({
      id: r.id,
      status: 'IZDANA',
      od: '2026-11-01',
      do: '2026-11-09',
      zamujena: true,
      dniZamude: 3,
      uporabnik: { id: student.uporabnik.id, email: expect.any(String), vloga: 'STUDENT' },
      kosi: [
        { id: a.id, trenutnoStanje: 'OBRABLJENO', stanjeObIzdaji: null, stanjeObVracilu: null },
        { id: b.id, trenutnoStanje: 'BREZHIBNO', stanjeObIzdaji: null, stanjeObVracilu: null },
      ],
    });
    expect(odgovor.body.uporabnik).not.toHaveProperty('gesloHash');
  });

  it('po izdaji vsebujejo kosi stanje ob izdaji', async () => {
    const a = await ustvariKos();
    const r = await ustvariRezervacijo({
      uporabnikId: student.uporabnik.id,
      kosi: [a],
      status: 'ODOBRENA',
      ...terminIzDatumov('2026-11-12', '2026-11-14'),
    });
    await api()
      .patch(`/api/rezervacije/${r.id}/izdaja`)
      .set('Cookie', tehnik.piskotek)
      .send({ kosi: [{ id: a.id, stanje: 'OBRABLJENO' }] });

    const odgovor = await podrobnosti(r.id);
    expect(odgovor.body.kosi).toEqual([
      expect.objectContaining({
        id: a.id,
        stanjeObIzdaji: 'OBRABLJENO',
        trenutnoStanje: 'OBRABLJENO',
      }),
    ]);
  });

  it('neobstoječa 404, neveljaven id 400', async () => {
    expect((await podrobnosti(999999)).status).toBe(404);
    expect((await podrobnosti('abc')).status).toBe(400);
  });

  it('administrator ima dostop, izposojevalec dobi 403', async () => {
    const r = await ustvariRezervacijo({
      uporabnikId: student.uporabnik.id,
      kosi: [await ustvariKos()],
      status: 'ODDANA',
      ...terminIzDatumov('2026-11-20', '2026-11-21'),
    });
    const admin = await ustvariUporabnika({ vloga: 'ADMIN' });
    expect((await podrobnosti(r.id, admin.piskotek)).status).toBe(200);
    expect((await podrobnosti(r.id, student.piskotek)).status).toBe(403);
  });

  it('/moje in /stevci ostaneta dosegljiva (pot /:id ju ne ujame)', async () => {
    expect((await api().get('/api/rezervacije/moje').set('Cookie', student.piskotek)).status).toBe(
      200,
    );
    expect((await api().get('/api/rezervacije/stevci').set('Cookie', tehnik.piskotek)).status).toBe(
      200,
    );
  });
});
