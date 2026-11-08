// Naslov testne baze. Testi NIKOLI ne smejo teči na razvojni bazi, ker jo praznijo.
//
// Prednost ima TEST_DATABASE_URL (npr. v CI). Sicer se vzame DATABASE_URL iz korenske
// .env in imenu baze doda pripono _test (rentaj → rentaj_test) – isti strežnik, ločena baza.
import { config } from 'dotenv';

config({ path: new URL('../../.env', import.meta.url), quiet: true });

export function naslovTestneBaze() {
  const izvor = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!izvor) {
    throw new Error('Nastavi DATABASE_URL (v .env) ali TEST_DATABASE_URL.');
  }

  const url = new URL(izvor);
  // Že testni naslov (klic iz globalSetup za vitest.config.js) pusti, kot je.
  if (!process.env.TEST_DATABASE_URL && !url.pathname.endsWith('_test')) {
    url.pathname = `${url.pathname}_test`;
  }

  if (!url.pathname.endsWith('_test')) {
    throw new Error(
      `Ime testne baze se mora končati s _test, dobil sem »${url.pathname.slice(1)}«.`,
    );
  }
  return url.toString();
}
