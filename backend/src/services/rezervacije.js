// Oddaja rezervacije (US-03). Vsa preverjanja in shranjevanje so v eni transakciji, zato ob
// napaki ne nastane noben zapis – niti rezervacija niti katera od postavk.
import { prisma } from '../db.js';
import { ApiError } from '../utils/ApiError.js';
import { datumiIzTermina, kratekDatum, terminIzDatumov } from '../utils/datumi.js';
import { praviloZaVlogo, preveriSteviloKosov, preveriTrajanje } from './pravila.js';
import { zasedaKos } from './termini.js';

export const oznakaKosa = (kos) => `${kos.naziv} (${kos.inventarnaStevilka})`;

const vkljuciKose = {
  postavke: {
    select: { kosOpreme: { select: { id: true, naziv: true, inventarnaStevilka: true } } },
    orderBy: { kosOpremeId: 'asc' },
  },
};

// Rezervacija za odgovor API-ja: datuma od/do namesto zacetek/konec (ADR-0013), kosi namesto postavk.
export function predstaviRezervacijo({ zacetek, konec, postavke, ...rezervacija }) {
  return {
    ...rezervacija,
    ...datumiIzTermina({ zacetek, konec }),
    kosi: postavke.map((p) => p.kosOpreme),
  };
}

async function preveriKose(tx, kosOpremeIds) {
  const kosi = await tx.kosOpreme.findMany({
    where: { id: { in: kosOpremeIds } },
    orderBy: { id: 'asc' },
  });

  if (kosi.length !== kosOpremeIds.length) {
    throw new ApiError(400, 'Izbrani kos opreme ne obstaja.');
  }
  const niNaVoljo = kosi.find((kos) => kos.status !== 'NA_VOLJO');
  if (niNaVoljo) {
    throw new ApiError(409, `${oznakaKosa(niNaVoljo)} trenutno ni na voljo za izposojo.`);
  }
  return kosi;
}

// Prekrivanje z rezervacijami ODDANA, ODOBRENA ali IZDANA (dokument 03, Ključna pravila).
async function preveriPrekrivanje(tx, kosi, termin) {
  for (const kos of kosi) {
    const obstojeca = await tx.rezervacija.findFirst({
      where: zasedaKos(kos.id, termin),
      orderBy: { zacetek: 'asc' },
      select: { zacetek: true, konec: true },
    });
    if (obstojeca) {
      const { od, do: zadnjiDan } = datumiIzTermina(obstojeca);
      throw new ApiError(
        409,
        // kratekDatum že konča s piko (»27. 11.«), zato je za njim ni.
        `${oznakaKosa(kos)} je zaseden od ${kratekDatum(od)} do ${kratekDatum(zadnjiDan)}`,
      );
    }
  }
}

// podatki: { kosi: number[] (brez ponovitev), od, do (YYYY-MM-DD), namen, dolgorocna }
export async function oddajRezervacijo(uporabnik, podatki) {
  const termin = terminIzDatumov(podatki.od, podatki.do);

  const rezervacija = await prisma.$transaction(async (tx) => {
    // Pravilo se prebere ob vsaki oddaji, zato sprememba pravil velja takoj (US-04).
    const pravilo = await praviloZaVlogo(tx, uporabnik.vloga);
    preveriTrajanje(uporabnik, pravilo, podatki);

    const kosi = await preveriKose(tx, podatki.kosi);
    await preveriSteviloKosov(tx, uporabnik, pravilo, kosi.length);
    await preveriPrekrivanje(tx, kosi, termin);

    return tx.rezervacija.create({
      data: {
        uporabnikId: uporabnik.id,
        ...termin,
        namen: podatki.namen,
        dolgorocna: podatki.dolgorocna,
        status: 'ODDANA',
        postavke: { create: kosi.map((kos) => ({ kosOpremeId: kos.id })) },
      },
      include: vkljuciKose,
    });
  });

  return predstaviRezervacijo(rezervacija);
}
