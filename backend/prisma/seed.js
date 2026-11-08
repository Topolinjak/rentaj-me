// Začetni podatki za razvoj: testni uporabniki, pravila izposoje, kategorije in oprema.
// Zagon: npm run db:seed (oziroma docker compose exec backend npm run db:seed).
//
// Skripta je idempotentna: vsak zapis se išče po unikatnem polju (upsert), zato ponoven
// zagon ne podvoji podatkov. update: {} pomeni, da obstoječih zapisov ne spreminja –
// ročne spremembe v razvojni bazi (npr. deaktiviran uporabnik) ostanejo.

import '../src/env.js'; // najprej .env, šele nato db.js (glej komentar v src/env.js)
import bcrypt from 'bcrypt';
import { prisma } from '../src/db.js';

// Cena bcrypt (2^10 krogov). Isto vrednost uporabi tudi pri ustvarjanju uporabnikov (I-13).
const BCRYPT_CENA = 10;

// Testni računi – SAMO ZA RAZVOJ. Gesla so zapisana tudi v README.md.
const uporabniki = [
  { ime: 'Ana', priimek: 'Administratorka', email: 'admin@rentaj.test', geslo: 'admin123', vloga: 'ADMIN' },
  { ime: 'Tomaž', priimek: 'Tehnik', email: 'tehnik@rentaj.test', geslo: 'tehnik123', vloga: 'TEHNIK' },
  { ime: 'Špela', priimek: 'Študentka', email: 'student@rentaj.test', geslo: 'student123', vloga: 'STUDENT' },
  { ime: 'Andrej', priimek: 'Asistent', email: 'asistent@rentaj.test', geslo: 'asistent123', vloga: 'ASISTENT' },
  { ime: 'Petra', priimek: 'Profesorica', email: 'profesor@rentaj.test', geslo: 'profesor123', vloga: 'PROFESOR' },
];

// Začetne vrednosti iz docs/03-podatkovni-model.md. TEHNIK in ADMIN si opreme ne izposojata.
const pravila = [
  { vloga: 'STUDENT', maxKosov: 3, maxDni: 7, maxDniDolgorocno: null },
  { vloga: 'ASISTENT', maxKosov: 20, maxDni: 7, maxDniDolgorocno: null },
  { vloga: 'PROFESOR', maxKosov: 20, maxDni: 7, maxDniDolgorocno: 180 },
];

const kategorije = [
  { naziv: 'Mikrokrmilniki', opis: 'Razvojne plošče in mikroračunalniki' },
  { naziv: 'Merilni instrumenti', opis: 'Multimetri, osciloskopi, napajalniki' },
  { naziv: 'Foto/video oprema', opis: 'Fotoaparati, kamere, stojala' },
  { naziv: 'Računalniška oprema', opis: 'Prenosniki, tablice in dodatki' },
];

// status in trenutnoStanje imata v shemi privzeti vrednosti (NA_VOLJO, BREZHIBNO),
// zato sta navedena le tam, kjer se razlikujeta.
const oprema = [
  { inventarnaStevilka: 'INV-0001', naziv: 'Arduino Uno R3', kategorija: 'Mikrokrmilniki', opis: 'S kablom USB-B' },
  { inventarnaStevilka: 'INV-0002', naziv: 'Arduino Uno R3', kategorija: 'Mikrokrmilniki', opis: 'S kablom USB-B' },
  { inventarnaStevilka: 'INV-0003', naziv: 'Raspberry Pi 5 (8 GB)', kategorija: 'Mikrokrmilniki', opis: 'Z napajalnikom in kartico microSD' },
  { inventarnaStevilka: 'INV-0004', naziv: 'ESP32 DevKitC', kategorija: 'Mikrokrmilniki', trenutnoStanje: 'OBRABLJENO' },
  { inventarnaStevilka: 'INV-0005', naziv: 'Digitalni multimeter Fluke 117', kategorija: 'Merilni instrumenti' },
  { inventarnaStevilka: 'INV-0006', naziv: 'Osciloskop Rigol DS1054Z', kategorija: 'Merilni instrumenti', opis: 'S štirimi sondami' },
  { inventarnaStevilka: 'INV-0007', naziv: 'Laboratorijski napajalnik 30 V / 5 A', kategorija: 'Merilni instrumenti', status: 'V_OKVARI', trenutnoStanje: 'POSKODOVANO', opis: 'Ne drži nastavljene napetosti' },
  { inventarnaStevilka: 'INV-0008', naziv: 'Fotoaparat Sony A7 III', kategorija: 'Foto/video oprema', opis: 'Z objektivom 28–70 mm' },
  { inventarnaStevilka: 'INV-0009', naziv: 'Stativ Manfrotto', kategorija: 'Foto/video oprema' },
  { inventarnaStevilka: 'INV-0010', naziv: 'Kamera GoPro HERO9', kategorija: 'Foto/video oprema', status: 'UMAKNJEN', opis: 'Odpisana' },
  { inventarnaStevilka: 'INV-0011', naziv: 'Prenosnik Lenovo ThinkPad T14', kategorija: 'Računalniška oprema', opis: 'S polnilnikom' },
  { inventarnaStevilka: 'INV-0012', naziv: 'Tablica iPad (10. gen.)', kategorija: 'Računalniška oprema' },
];

try {
  for (const { geslo, ...uporabnik } of uporabniki) {
    await prisma.uporabnik.upsert({
      where: { email: uporabnik.email },
      update: {},
      create: { ...uporabnik, gesloHash: await bcrypt.hash(geslo, BCRYPT_CENA) },
    });
  }

  for (const pravilo of pravila) {
    await prisma.praviloIzposoje.upsert({
      where: { vloga: pravilo.vloga },
      update: {},
      create: pravilo,
    });
  }

  for (const kategorija of kategorije) {
    await prisma.kategorija.upsert({
      where: { naziv: kategorija.naziv },
      update: {},
      create: kategorija,
    });
  }

  for (const { kategorija, ...kos } of oprema) {
    await prisma.kosOpreme.upsert({
      where: { inventarnaStevilka: kos.inventarnaStevilka },
      update: {},
      // Kategorijo poveže po unikatnem nazivu, brez iskanja id-ja.
      create: { ...kos, kategorija: { connect: { naziv: kategorija } } },
    });
  }

  console.log(
    `Seed končan: ${uporabniki.length} uporabnikov, ${pravila.length} pravila, ` +
      `${kategorije.length} kategorije, ${oprema.length} kosov opreme.`,
  );
} finally {
  await prisma.$disconnect();
}
