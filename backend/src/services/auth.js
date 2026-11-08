// Ustvarjanje in preverjanje JWT ter nastavitve piškotka (ADR-0008).
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Brez skrivnosti bi kdorkoli lahko podpisal veljaven žeton – raje ne zaženemo.
  throw new Error('Manjka spremenljivka okolja JWT_SECRET.');
}

// JWT in piškotek veljata enako dolgo, da brskalnik ne hrani žetona, ki je že potekel.
const TRAJANJE_UR = Number(process.env.JWT_TRAJANJE_UR ?? 8);

export const IME_PISKOTKA = 'zeton';

// Iste nastavitve morata uporabiti nastavljanje in brisanje piškotka, sicer ga brskalnik ne izbriše.
export const nastavitvePiskotka = {
  httpOnly: true, // JavaScript v brskalniku žetona ne vidi (zaščita pred XSS)
  sameSite: 'lax', // piškotek se ne pošlje ob zahtevah z drugih strani (zaščita pred CSRF)
  secure: process.env.NODE_ENV === 'production', // v produkciji samo prek HTTPS
  path: '/',
};

export function ustvariZeton(uporabnik) {
  return jwt.sign({ vloga: uporabnik.vloga }, JWT_SECRET, {
    subject: String(uporabnik.id),
    expiresIn: `${TRAJANJE_UR}h`,
  });
}

// Vrne vsebino žetona ali vrže napako, če je ponarejen ali potekel.
export function preveriZeton(zeton) {
  return jwt.verify(zeton, JWT_SECRET, { algorithms: ['HS256'] });
}

export const trajanjePiskotkaMs = TRAJANJE_UR * 60 * 60 * 1000;

// Polja uporabnika, ki jih API sme vrniti. gesloHash nikoli.
export const javniPodatkiUporabnika = {
  id: true,
  ime: true,
  priimek: true,
  email: true,
  vloga: true,
};

// Nizka cena bcrypt bi olajšala ugibanje gesel iz ukradene baze; 10 je običajen kompromis.
export const BCRYPT_CENA = 10;
