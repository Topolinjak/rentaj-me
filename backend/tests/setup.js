// Pred vsako testno datoteko: prazna baza pred vsakim testom, da so testi neodvisni.
import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/db.js';

const TABELE = [
  'ZapisPoskodbe',
  'PostavkaRezervacije',
  'Rezervacija',
  'KosOpreme',
  'Kategorija',
  'PraviloIzposoje',
  'Uporabnik',
];

beforeEach(async () => {
  const seznam = TABELE.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE ${seznam} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await prisma.$disconnect();
});
