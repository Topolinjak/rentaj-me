// Pomožne funkcije za teste.
import bcrypt from 'bcrypt';
import supertest from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';
import { IME_PISKOTKA, ustvariZeton } from '../src/services/auth.js';

export const api = () => supertest(app);

let stevec = 0;
const naslednji = () => ++stevec;

// Ustvari uporabnika dane vloge. Vrne uporabnika, njegovo geslo in piškotek za
// prijavljene zahteve: api().get('/api/…').set('Cookie', piskotek)
export async function ustvariUporabnika({ vloga = 'STUDENT', aktiven = true, ...ostalo } = {}) {
  const n = naslednji();
  const geslo = ostalo.geslo ?? `geslo-${n}`;
  const uporabnik = await prisma.uporabnik.create({
    data: {
      ime: 'Test',
      priimek: `Uporabnik ${n}`,
      email: ostalo.email ?? `uporabnik${n}@rentaj.test`,
      // Nizka cena bcrypt, da so testi hitri; compare deluje enako.
      gesloHash: await bcrypt.hash(geslo, 4),
      vloga,
      aktiven,
    },
  });
  return { uporabnik, geslo, piskotek: `${IME_PISKOTKA}=${ustvariZeton(uporabnik)}` };
}

// Ustvari kos opreme (in kategorijo, če ni podana).
export async function ustvariKos(podatki = {}) {
  const n = naslednji();
  const kategorijaId =
    podatki.kategorijaId ??
    (await prisma.kategorija.create({ data: { naziv: `Kategorija ${n}` } })).id;
  return prisma.kosOpreme.create({
    data: {
      inventarnaStevilka: `TEST-${String(n).padStart(4, '0')}`,
      naziv: `Testni kos ${n}`,
      ...podatki,
      kategorijaId,
    },
  });
}
