// Opozorila tehniku o zamudah in neporavnanih poškodbah uporabnika (US-11).
// Zamuda se izračuna (ADR-0007, zamude.js). Poškodba je ZapisPoskodbe z razresen = false na
// postavki katere koli uporabnikove rezervacije. Razreševanje poškodb je v P-15, zato v MVP
// opozorilo o poškodbi ostane, dokler ga P-15 ne omogoči.
import { prisma } from '../db.js';
import { datumiIzTermina } from '../utils/datumi.js';
import { dniZamude, pogojZamujena } from './zamude.js';

// Prisma pogoj za neporavnane poškodbe uporabnikov (en id ali { in: [...] }).
const pogojNeporavnana = (uporabnikId) => ({
  razresen: false,
  postavka: { rezervacija: { uporabnikId } },
});

const izbiraKosa = { select: { id: true, naziv: true, inventarnaStevilka: true } };

// Števci za vse uporabnike naenkrat: Map uporabnikId → { steviloZamud, steviloNeporavnanihPoskodb }.
// Število poizvedb je stalno, ne glede na to, koliko rezervacij je na seznamu (brez N+1).
export async function stevciOpozoril(uporabnikIds, zdaj) {
  const ids = [...new Set(uporabnikIds)];
  const stevci = new Map(ids.map((id) => [id, { steviloZamud: 0, steviloNeporavnanihPoskodb: 0 }]));
  if (ids.length === 0) return stevci;

  const [zamude, poskodbe] = await Promise.all([
    // GROUP BY uporabnikId v bazi.
    prisma.rezervacija.groupBy({
      by: ['uporabnikId'],
      where: { uporabnikId: { in: ids }, ...pogojZamujena(zdaj) },
      _count: { _all: true },
    }),
    // groupBy ne gre prek relacij, zato preberemo le uporabnikId pri vsaki neporavnani
    // poškodbi in preštejemo tukaj. Takih zapisov je malo.
    prisma.zapisPoskodbe.findMany({
      where: pogojNeporavnana({ in: ids }),
      select: { postavka: { select: { rezervacija: { select: { uporabnikId: true } } } } },
    }),
  ]);

  for (const z of zamude) {
    stevci.get(z.uporabnikId).steviloZamud = z._count._all;
  }
  for (const p of poskodbe) {
    stevci.get(p.postavka.rezervacija.uporabnikId).steviloNeporavnanihPoskodb += 1;
  }
  return stevci;
}

// Podrobnosti za klik na opozorilo: zamujene izposoje in neporavnane poškodbe uporabnika.
export async function opozorilaUporabnika(uporabnikId, zdaj) {
  const [zamujene, poskodbe] = await Promise.all([
    prisma.rezervacija.findMany({
      where: { uporabnikId, ...pogojZamujena(zdaj) },
      orderBy: [{ konec: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        status: true,
        zacetek: true,
        konec: true,
        postavke: { select: { kosOpreme: izbiraKosa }, orderBy: { kosOpremeId: 'asc' } },
      },
    }),
    prisma.zapisPoskodbe.findMany({
      where: pogojNeporavnana(uporabnikId),
      orderBy: [{ ustvarjeno: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        opis: true,
        ustvarjeno: true,
        postavka: { select: { rezervacijaId: true, kosOpreme: izbiraKosa } },
      },
    }),
  ]);

  return {
    zamujene: zamujene.map((r) => ({
      id: r.id,
      ...datumiIzTermina(r),
      dniZamude: dniZamude(r, zdaj),
      kosi: r.postavke.map((p) => p.kosOpreme),
    })),
    poskodbe: poskodbe.map(({ postavka, ...p }) => ({
      ...p,
      rezervacijaId: postavka.rezervacijaId,
      kos: postavka.kosOpreme,
    })),
  };
}
