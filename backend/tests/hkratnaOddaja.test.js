// Zaščita pred hkratno oddajo (I-22, ADR-0006). Zahteve se pošljejo hkrati (Promise.all),
// zato vsaka teče v svoji transakciji na svoji povezavi z bazo.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db.js';
import { api, ustvariKos, ustvariPravila, ustvariUporabnika } from './pomocniki.js';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-10T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

beforeEach(async () => {
  await ustvariPravila();
});

const oddaj = (piskotek, kosi) =>
  api()
    .post('/api/rezervacije')
    .set('Cookie', piskotek)
    .send({ kosi: kosi.map((k) => k.id), od: '2026-11-20', do: '2026-11-22', namen: 'Vaje' });

const statusi = (odgovori) => odgovori.map((o) => o.status).sort();

describe('hkratna oddaja', () => {
  it('več hkratnih oddaj za isti kos in termin: uspe natanko ena, ostale dobijo 409', async () => {
    const kos = await ustvariKos();
    const uporabniki = await Promise.all(
      Array.from({ length: 5 }, () => ustvariUporabnika({ vloga: 'ASISTENT' })),
    );

    const odgovori = await Promise.all(uporabniki.map((u) => oddaj(u.piskotek, [kos])));

    expect(statusi(odgovori)).toEqual([201, 409, 409, 409, 409]);
    expect(await prisma.postavkaRezervacije.count({ where: { kosOpremeId: kos.id } })).toBe(1);
  });

  it('več kosov v nasprotnem vrstnem redu (A, B in B, A): ni deadlocka', async () => {
    for (let poskus = 0; poskus < 5; poskus++) {
      const a = await ustvariKos();
      const b = await ustvariKos();
      const prvi = await ustvariUporabnika({ vloga: 'ASISTENT' });
      const drugi = await ustvariUporabnika({ vloga: 'ASISTENT' });

      const odgovori = await Promise.all([
        oddaj(prvi.piskotek, [a, b]),
        oddaj(drugi.piskotek, [b, a]),
      ]);

      // Deadlock bi PostgreSQL prekinil z napako (500); pričakujemo 201 in 409.
      expect(statusi(odgovori)).toEqual([201, 409]);
    }
  });

  it('hkratne oddaje istega uporabnika upoštevajo maxKosov', async () => {
    const student = await ustvariUporabnika({ vloga: 'STUDENT' }); // maxKosov = 3
    const zahtevki = [];
    for (let i = 0; i < 3; i++) zahtevki.push([await ustvariKos(), await ustvariKos()]);

    const odgovori = await Promise.all(zahtevki.map((kosi) => oddaj(student.piskotek, kosi)));

    expect(statusi(odgovori)).toEqual([201, 400, 400]);
    expect(
      await prisma.postavkaRezervacije.count({
        where: { rezervacija: { uporabnikId: student.uporabnik.id } },
      }),
    ).toBe(2);
  });
});
