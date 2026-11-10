// Oddaja rezervacije (US-03). Zaklepanje, vsa preverjanja in shranjevanje so v eni transakciji,
// zato ob napaki ne nastane noben zapis – niti rezervacija niti katera od postavk.
import { prisma } from '../db.js';
import { ApiError } from '../utils/ApiError.js';
import { datumiIzTermina, kratekDatum, terminIzDatumov } from '../utils/datumi.js';
import { praviloZaVlogo, preveriSteviloKosov, preveriTrajanje } from './pravila.js';
import { opozorilaUporabnika, stevciOpozoril } from './opozorila.js';
import { spremeniStatus } from './statusi.js';
import { zasedaKos } from './termini.js';
import { dniZamude, jeZamujena, pogojZamujena } from './zamude.js';

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

// Zaklepanje proti hkratni oddaji (ADR-0006). Privzeta izolacija READ COMMITTED ne prepreči,
// da bi dve hkratni transakciji obe videli prost termin, zato pred preverjanjem zaklenemo:
//  1. vrstico uporabnika – hkratne oddaje istega uporabnika tečejo ena za drugo, zato
//     omejitev maxKosov velja tudi zanje;
//  2. vrstice izbranih kosov v naraščajočem vrstnem redu id – druga oddaja za isti kos počaka
//     in nato vidi že shranjeno rezervacijo (409). Enak vrstni red pri vseh transakcijah
//     prepreči deadlock (A, B proti B, A).
// Zaklep se sprosti ob koncu transakcije. Vsaka koda, ki ustvarja ali spreminja termine,
// mora iti skozi zakleniZaOddajo, sicer zaščita ne velja.
async function zakleniZaOddajo(tx, uporabnikId, kosOpremeIds) {
  await tx.$queryRaw`SELECT id FROM "Uporabnik" WHERE id = ${uporabnikId} FOR UPDATE`;
  const urejeni = [...kosOpremeIds].sort((a, b) => a - b);
  await tx.$queryRaw`SELECT id FROM "KosOpreme" WHERE id = ANY(${urejeni}::int[]) ORDER BY id FOR UPDATE`;
}

// Kliče se po zakleniZaOddajo, zato prebere zadnje potrjeno stanje kosov.
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

// Skupna funkcija za ustvarjanje termina: zaklep → preverjanja → shranjevanje (ADR-0006).
// podatki: { kosi: number[] (brez ponovitev), od, do (YYYY-MM-DD), namen, dolgorocna }
export async function oddajRezervacijo(uporabnik, podatki) {
  const termin = terminIzDatumov(podatki.od, podatki.do);

  const rezervacija = await prisma.$transaction(async (tx) => {
    await zakleniZaOddajo(tx, uporabnik.id, podatki.kosi);

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

// Uporabnik pri rezervacijah na seznamih za tehnika (US-05: ime in vloga, US-09: e-pošta).
const vkljuciUporabnika = {
  uporabnik: { select: { id: true, ime: true, priimek: true, email: true, vloga: true } },
};

// Seznam rezervacij za tehnika (US-05, US-09, US-11).
//  - zamujene: IZDANA s potečenim rokom, od največje zamude (najzgodnejši konec) naprej;
//  - sicer po želji filtrirano po statusu, od najstarejše oddaje naprej.
// Vsaka rezervacija ima zraven izračunana polja zamujena in dniZamude (ADR-0007) ter
// opozorila o uporabniku (steviloZamud, steviloNeporavnanihPoskodb).
export async function seznamRezervacij({ status, zamujene }, zdaj = new Date()) {
  const rezervacije = await prisma.rezervacija.findMany({
    where: zamujene ? pogojZamujena(zdaj) : { status },
    orderBy: zamujene ? [{ konec: 'asc' }, { id: 'asc' }] : [{ ustvarjeno: 'asc' }, { id: 'asc' }],
    include: { ...vkljuciKose, ...vkljuciUporabnika },
  });
  const opozorila = await stevciOpozoril(
    rezervacije.map((r) => r.uporabnikId),
    zdaj,
  );

  return rezervacije.map((r) => ({
    ...predstaviRezervacijo(r),
    zamujena: jeZamujena(r, zdaj),
    dniZamude: dniZamude(r, zdaj),
    ...opozorila.get(r.uporabnikId),
  }));
}

// Podrobnosti opozoril za uporabnika rezervacije `id` (US-11, klik na opozorilo).
export async function opozorilaZaRezervacijo(id, zdaj = new Date()) {
  const rezervacija = await prisma.rezervacija.findUnique({
    where: { id },
    select: vkljuciUporabnika,
  });
  if (!rezervacija) {
    throw new ApiError(404, 'Rezervacija ne obstaja.');
  }
  return {
    uporabnik: rezervacija.uporabnik,
    ...(await opozorilaUporabnika(rezervacija.uporabnik.id, zdaj)),
  };
}

// Števci za nadzorno ploščo tehnika. Izdane vključujejo tudi zamujene.
export async function stevciRezervacij(zdaj = new Date()) {
  const [oddane, izdane, zamujene] = await Promise.all([
    prisma.rezervacija.count({ where: { status: 'ODDANA' } }),
    prisma.rezervacija.count({ where: { status: 'IZDANA' } }),
    prisma.rezervacija.count({ where: pogojZamujena(zdaj) }),
  ]);
  return { oddane, izdane, zamujene };
}

// Odobritev oddane rezervacije (US-05). Termin je zaseden že od oddaje, zato prekrivanja
// tu ni treba ponovno preverjati (dokument 03).
export async function odobriRezervacijo(id, tehnik) {
  const rezervacija = await spremeniStatus(
    id,
    'ODOBRENA',
    { obdelalId: tehnik.id },
    { include: vkljuciKose },
  );
  return predstaviRezervacijo(rezervacija);
}

// Zavrnitev z razlogom in neobveznim komentarjem (US-06). ZAVRNJENA ni med statusi, ki
// zasedajo termin (termini.js), zato so kosi takoj spet prosti.
export async function zavrniRezervacijo(id, tehnik, { razlogZavrnitve, komentarTehnika }) {
  const rezervacija = await spremeniStatus(
    id,
    'ZAVRNJENA',
    { obdelalId: tehnik.id, razlogZavrnitve, komentarTehnika },
    { include: vkljuciKose },
  );
  return predstaviRezervacijo(rezervacija);
}

// Ali `kosi` ([{ id, stanje }]) vsebujejo natanko kose iz postavk rezervacije – vsakega enkrat.
function preveriStanjaKosov(postavke, kosi) {
  const vRezervaciji = new Set(postavke.map((p) => p.kosOpremeId));
  const podani = new Set(kosi.map((k) => k.id));
  const manjka = postavke.find((p) => !podani.has(p.kosOpremeId));
  if (manjka) {
    throw new ApiError(400, `Izberite stanje za ${oznakaKosa(manjka.kosOpreme)}.`);
  }
  if (podani.size !== kosi.length || kosi.some((k) => !vRezervaciji.has(k.id))) {
    throw new ApiError(400, 'Stanja se morajo ujemati s kosi v rezervaciji.');
  }
}

// Zapiše stanje vsakega kosa v polje postavke `polje` (stanjeObIzdaji ali stanjeObVracilu) in
// v trenutnoStanje kosa. Kliče se znotraj spremeniStatus, zato napaka razveljavi vse skupaj.
// `poPostavki(tx, postavka, podatkiKosa)` doda korak za posamezno postavko (npr. poškodbo).
async function zapisiStanjaKosov(tx, rezervacijaId, kosi, polje, poPostavki) {
  const postavke = await tx.postavkaRezervacije.findMany({
    where: { rezervacijaId },
    include: { kosOpreme: true },
    orderBy: { kosOpremeId: 'asc' },
  });
  preveriStanjaKosov(postavke, kosi);

  const poKosu = new Map(kosi.map((k) => [k.id, k]));
  for (const p of postavke) {
    const kos = poKosu.get(p.kosOpremeId);
    await tx.postavkaRezervacije.update({ where: { id: p.id }, data: { [polje]: kos.stanje } });
    await tx.kosOpreme.update({
      where: { id: p.kosOpremeId },
      data: { trenutnoStanje: kos.stanje },
    });
    await poPostavki?.(tx, p, kos);
  }
}

// Izdaja opreme (US-07): le iz ODOBRENA (spremeniStatus, sicer 409). V isti transakciji
// zapiše stanje vsakega kosa ob izdaji in izdanoOb. trenutnoStanje kosa se posodobi na
// stanje ob izdaji, ker je to zadnje znano stanje (privzeta izbira pri naslednji izdaji).
export async function izdajRezervacijo(id, { kosi }, zdaj = new Date()) {
  const rezervacija = await spremeniStatus(
    id,
    'IZDANA',
    { izdanoOb: zdaj },
    {
      include: vkljuciKose,
      dodatno: (tx) => zapisiStanjaKosov(tx, id, kosi, 'stanjeObIzdaji'),
    },
  );
  return predstaviRezervacijo(rezervacija);
}

// Vračilo opreme (US-08): le iz IZDANA, tudi zamujene (sicer 409). V isti transakciji zapiše
// vrnjenoOb, stanjeObVracilu, trenutnoStanje kosa in za vsak poškodovan kos ZapisPoskodbe
// (razresen = false), ki se nato prikaže v opozorilih tehniku (US-11).
export async function vrniRezervacijo(id, { kosi }, zdaj = new Date()) {
  const rezervacija = await spremeniStatus(
    id,
    'VRNJENA',
    { vrnjenoOb: zdaj },
    {
      include: vkljuciKose,
      dodatno: (tx) =>
        zapisiStanjaKosov(tx, id, kosi, 'stanjeObVracilu', async (tx, postavka, kos) => {
          if (kos.stanje === 'POSKODOVANO') {
            await tx.zapisPoskodbe.create({
              data: { postavkaId: postavka.id, opis: kos.opisPoskodbe, ustvarjeno: zdaj },
            });
          }
        }),
    },
  );
  return predstaviRezervacijo(rezervacija);
}
