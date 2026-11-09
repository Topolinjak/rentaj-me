// Pravila izposoje po vlogah (US-04, US-09). Pravilo se vedno prebere iz tabele
// PraviloIzposoje (ADR-0010), zato sprememba pravil velja takoj za vse nove oddaje.
import { prisma } from '../db.js';
import { ApiError } from '../utils/ApiError.js';
import { steviloDni } from '../utils/datumi.js';
import { ZASEDAJOCI_STATUSI } from './termini.js';

// Dolgoročno izposojo lahko odda le profesor (dokument 03, Ključna pravila).
export const DOLGOROCNA_VLOGE = ['PROFESOR'];

export async function praviloZaVlogo(db, vloga) {
  const pravilo = await db.praviloIzposoje.findUnique({ where: { vloga } });
  if (!pravilo) {
    throw new ApiError(403, 'Za vašo vlogo izposoja ni določena.');
  }
  return pravilo;
}

// Število kosov v aktivnih rezervacijah uporabnika (ODDANA, ODOBRENA, IZDANA).
export const steviloAktivnihKosov = (db, uporabnikId) =>
  db.postavkaRezervacije.count({
    where: { rezervacija: { uporabnikId, status: { in: ZASEDAJOCI_STATUSI } } },
  });

// Najdaljše dovoljeno trajanje v dneh. Za dolgoročno izposojo velja maxDniDolgorocno.
const najvecDni = (pravilo, dolgorocna) =>
  dolgorocna ? (pravilo.maxDniDolgorocno ?? pravilo.maxDni) : pravilo.maxDni;

// Preverjanja, ki ne potrebujejo stanja drugih rezervacij: dolgoročnost in trajanje.
export function preveriTrajanje(uporabnik, pravilo, { od, do: zadnjiDan, dolgorocna }) {
  if (dolgorocna && !DOLGOROCNA_VLOGE.includes(uporabnik.vloga)) {
    throw new ApiError(403, 'Dolgoročno izposojo lahko odda le profesor.');
  }
  const meja = najvecDni(pravilo, dolgorocna);
  if (steviloDni(od, zadnjiDan) > meja) {
    throw new ApiError(
      400,
      dolgorocna
        ? `Najdaljši čas dolgoročne izposoje je ${meja} dni`
        : `Najdaljši čas izposoje za vašo vlogo je ${meja} dni`,
    );
  }
}

// Omejitev kosov: aktivni kosi + novi kosi ≤ maxKosov. Kliče se v transakciji oddaje.
export async function preveriSteviloKosov(tx, uporabnik, pravilo, steviloNovih) {
  const aktivnih = await steviloAktivnihKosov(tx, uporabnik.id);
  if (aktivnih + steviloNovih > pravilo.maxKosov) {
    throw new ApiError(
      400,
      `Presežena omejitev: imate ${aktivnih} aktivnih kosov, dovoljenih je ${pravilo.maxKosov}.`,
    );
  }
}

// Omejitve prijavljenega uporabnika za namig v obrazcu (GET /api/pravila/moje).
export async function mojaPravila(uporabnik) {
  const pravilo = await praviloZaVlogo(prisma, uporabnik.vloga);
  const dolgorocna = DOLGOROCNA_VLOGE.includes(uporabnik.vloga);
  return {
    vloga: uporabnik.vloga,
    maxKosov: pravilo.maxKosov,
    maxDni: pravilo.maxDni,
    dolgorocna,
    maxDniDolgorocno: dolgorocna ? (pravilo.maxDniDolgorocno ?? pravilo.maxDni) : null,
    aktivnihKosov: await steviloAktivnihKosov(prisma, uporabnik.id),
  };
}
