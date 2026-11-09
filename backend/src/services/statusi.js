// Življenjski cikel rezervacije (dokument 03, diagram stanj). Vsaka sprememba statusa
// gre skozi spremeniStatus, zato je pravilo o dovoljenih prehodih zapisano samo tukaj.
import { prisma } from '../db.js';
import { ApiError } from '../utils/ApiError.js';

// Iz katerega statusa v katere je prehod dovoljen. ZAVRNJENA, PREKLICANA in VRNJENA so končni.
export const PREHODI = {
  ODDANA: ['ODOBRENA', 'ZAVRNJENA', 'PREKLICANA'],
  ODOBRENA: ['IZDANA'],
  IZDANA: ['VRNJENA'],
  ZAVRNJENA: [],
  PREKLICANA: [],
  VRNJENA: [],
};

export const OZNAKE_STATUSOV = {
  ODDANA: 'Oddana',
  ODOBRENA: 'Odobrena',
  ZAVRNJENA: 'Zavrnjena',
  PREKLICANA: 'Preklicana',
  IZDANA: 'Izdana',
  VRNJENA: 'Vrnjena',
};

export const jeDovoljenPrehod = (iz, v) => PREHODI[iz]?.includes(v) ?? false;

// Spremeni status rezervacije `id` v `novi` in hkrati zapiše `podatki` (npr. obdelalId).
// Vrstico zaklene (FOR UPDATE), zato dva tehnika, ki hkrati odobrita in zavrneta isto
// rezervacijo, ne moreta oba uspeti: drugi počaka in nato vidi že spremenjen status (409).
// `dodatno(tx, rezervacija)` se izvede v isti transakciji – za kasnejše prehode (izdaja,
// vračilo), ki morajo spremeniti še kose opreme.
export async function spremeniStatus(id, novi, podatki = {}, { include, dodatno } = {}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Rezervacija" WHERE id = ${id} FOR UPDATE`;
    const rezervacija = await tx.rezervacija.findUnique({ where: { id } });

    if (!rezervacija) {
      throw new ApiError(404, 'Rezervacija ne obstaja.');
    }
    if (!jeDovoljenPrehod(rezervacija.status, novi)) {
      throw new ApiError(
        409,
        `Rezervacije s statusom »${OZNAKE_STATUSOV[rezervacija.status]}« ni mogoče ` +
          `spremeniti v »${OZNAKE_STATUSOV[novi]}«.`,
      );
    }

    await dodatno?.(tx, rezervacija);
    return tx.rezervacija.update({ where: { id }, data: { ...podatki, status: novi }, include });
  });
}
