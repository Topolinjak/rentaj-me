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

// Ustvari rezervacijo za dane kose. Privzeto termin od jutri, 3 dni, status ODDANA.
export async function ustvariRezervacijo({ uporabnikId, kosi, ...podatki }) {
  const jutri = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return prisma.rezervacija.create({
    data: {
      uporabnikId,
      zacetek: jutri,
      konec: new Date(jutri.getTime() + 3 * 24 * 60 * 60 * 1000),
      namen: 'Testna rezervacija',
      ...podatki,
      postavke: { create: kosi.map((kos) => ({ kosOpremeId: kos.id ?? kos })) },
    },
    include: { postavke: true },
  });
}

// Začetna pravila izposoje (kot v seedu). Oddaja rezervacije brez pravila vrne 403.
export const PRIVZETA_PRAVILA = [
  { vloga: 'STUDENT', maxKosov: 3, maxDni: 7, maxDniDolgorocno: null },
  { vloga: 'ASISTENT', maxKosov: 20, maxDni: 7, maxDniDolgorocno: null },
  { vloga: 'PROFESOR', maxKosov: 20, maxDni: 7, maxDniDolgorocno: 180 },
];

export const ustvariPravila = (pravila = PRIVZETA_PRAVILA) =>
  prisma.praviloIzposoje.createMany({ data: pravila });
