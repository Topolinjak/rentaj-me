import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { terminIzDatumov } from '../src/utils/datumi.js';
import { api, ustvariKos, ustvariRezervacijo, ustvariUporabnika } from './pomocniki.js';

// Fiksen »zdaj«: 12. 11. 2026 ob 10.00 v Ljubljani. Le Date, da supertest in baza delujeta.
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

const pridobi = (pot, piskotek = tehnik.piskotek) => api().get(pot).set('Cookie', piskotek);

// Rezervacija študenta z enim novim kosom. od/do sta zadnja dneva po ADR-0013.
async function rezervacija(status, od, do_, ostalo = {}) {
  const kos = await ustvariKos();
  return ustvariRezervacijo({
    uporabnikId: student.uporabnik.id,
    kosi: [kos],
    status,
    ...terminIzDatumov(od, do_),
    ...ostalo,
  });
}

describe('GET /api/rezervacije?status=ODDANA (US-05)', () => {
  it('vrne le oddane, od najstarejše oddaje, z uporabnikom in kosi', async () => {
    const novejsa = await rezervacija('ODDANA', '2026-11-20', '2026-11-21', {
      ustvarjeno: new Date('2026-11-11T08:00:00Z'),
    });
    const starejsa = await rezervacija('ODDANA', '2026-11-25', '2026-11-26', {
      ustvarjeno: new Date('2026-11-10T08:00:00Z'),
    });
    await rezervacija('ODOBRENA', '2026-11-20', '2026-11-21');

    const odgovor = await pridobi('/api/rezervacije?status=ODDANA');

    expect(odgovor.status).toBe(200);
    expect(odgovor.body.map((r) => r.id)).toEqual([starejsa.id, novejsa.id]);
    expect(odgovor.body[0]).toMatchObject({
      status: 'ODDANA',
      od: '2026-11-25',
      do: '2026-11-26',
      namen: 'Testna rezervacija',
      zamujena: false,
      dniZamude: 0,
      uporabnik: {
        id: student.uporabnik.id,
        ime: student.uporabnik.ime,
        priimek: student.uporabnik.priimek,
        vloga: 'STUDENT',
      },
      kosi: [
        {
          id: expect.any(Number),
          naziv: expect.any(String),
          inventarnaStevilka: expect.any(String),
        },
      ],
    });
    expect(odgovor.body[0]).not.toHaveProperty('zacetek');
    expect(odgovor.body[0]).not.toHaveProperty('postavke');
  });

  it('brez filtra vrne vse rezervacije', async () => {
    await rezervacija('ODDANA', '2026-11-20', '2026-11-21');
    await rezervacija('VRNJENA', '2026-11-01', '2026-11-02');

    const odgovor = await pridobi('/api/rezervacije');
    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toHaveLength(2);
  });

  it('neveljaven status vrne 400', async () => {
    const odgovor = await pridobi('/api/rezervacije?status=NEKAJ');
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.napake[0].polje).toBe('status');
  });
});

describe('GET /api/rezervacije?zamujene=true (US-09)', () => {
  it('vrne izdane s potečenim rokom, od največje zamude, z e-pošto in dnevi zamude', async () => {
    const dan = await rezervacija('IZDANA', '2026-11-05', '2026-11-11'); // rok včeraj
    const tri = await rezervacija('IZDANA', '2026-11-01', '2026-11-09');
    await rezervacija('IZDANA', '2026-11-10', '2026-11-12'); // zadnji dan je danes
    await rezervacija('VRNJENA', '2026-11-01', '2026-11-03'); // vrnjena po roku ni zamujena
    await rezervacija('ODOBRENA', '2026-11-01', '2026-11-03'); // ni bila izdana

    const odgovor = await pridobi('/api/rezervacije?zamujene=true');

    expect(odgovor.status).toBe(200);
    expect(odgovor.body.map((r) => [r.id, r.dniZamude])).toEqual([
      [tri.id, 3],
      [dan.id, 1],
    ]);
    expect(odgovor.body[0]).toMatchObject({
      status: 'IZDANA', // shranjeni status ostane IZDANA (ADR-0007)
      zamujena: true,
      do: '2026-11-09',
      uporabnik: { email: student.uporabnik.email },
    });
  });

  it('zamujene=false je enako kot brez filtra', async () => {
    await rezervacija('IZDANA', '2026-11-01', '2026-11-09');
    await rezervacija('ODDANA', '2026-11-20', '2026-11-21');

    const odgovor = await pridobi('/api/rezervacije?zamujene=false');
    expect(odgovor.body).toHaveLength(2);
  });

  it('status in zamujene skupaj vrneta 400', async () => {
    const odgovor = await pridobi('/api/rezervacije?status=IZDANA&zamujene=true');
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.napake[0].polje).toBe('zamujene');
  });
});

describe('GET /api/rezervacije/stevci', () => {
  it('prešteje oddane, izdane (vključno z zamujenimi) in zamujene', async () => {
    await rezervacija('ODDANA', '2026-11-20', '2026-11-21');
    await rezervacija('ODDANA', '2026-11-22', '2026-11-23');
    await rezervacija('IZDANA', '2026-11-10', '2026-11-14');
    await rezervacija('IZDANA', '2026-11-01', '2026-11-09');
    await rezervacija('VRNJENA', '2026-11-01', '2026-11-03');

    const odgovor = await pridobi('/api/rezervacije/stevci');

    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toEqual({ oddane: 2, izdane: 2, zamujene: 1 });
  });

  it('administrator ima dostop', async () => {
    const admin = await ustvariUporabnika({ vloga: 'ADMIN' });
    expect((await pridobi('/api/rezervacije/stevci', admin.piskotek)).status).toBe(200);
    expect((await pridobi('/api/rezervacije', admin.piskotek)).status).toBe(200);
  });
});

describe('dostop do seznamov za tehnika', () => {
  it.each(['STUDENT', 'ASISTENT', 'PROFESOR'])('%s dobi 403', async (vloga) => {
    const { piskotek } = await ustvariUporabnika({ vloga });
    expect((await pridobi('/api/rezervacije', piskotek)).status).toBe(403);
    expect((await pridobi('/api/rezervacije?zamujene=true', piskotek)).status).toBe(403);
    expect((await pridobi('/api/rezervacije/stevci', piskotek)).status).toBe(403);
  });

  it('brez prijave 401', async () => {
    expect((await api().get('/api/rezervacije')).status).toBe(401);
    expect((await api().get('/api/rezervacije/stevci')).status).toBe(401);
  });
});
