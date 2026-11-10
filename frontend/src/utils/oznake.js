// Slovenske oznake vrednosti iz API-ja (enumi v backend/prisma/schema.prisma).

export const OZNAKE_STATUSOV_REZERVACIJE = {
  ODDANA: 'Oddana',
  ODOBRENA: 'Odobrena',
  ZAVRNJENA: 'Zavrnjena',
  PREKLICANA: 'Preklicana',
  IZDANA: 'Izdana',
  VRNJENA: 'Vrnjena',
};

export const OZNAKE_STATUSOV_OPREME = {
  NA_VOLJO: 'Na voljo',
  V_OKVARI: 'V okvari',
  UMAKNJEN: 'Umaknjen',
};

export const OZNAKE_STANJ = {
  BREZHIBNO: 'Brezhibno',
  OBRABLJENO: 'Obrabljeno',
  POSKODOVANO: 'Poškodovano',
};

// Število dni s pravilno slovensko obliko: 1 dan, 2 dneva, 3 in 4 dnevi, 5 dni ... Odloča
// ostanek pri deljenju s 100 (101 dan, 102 dneva, 103 dnevi, 111 dni).
export function steviloDniBesedilo(n) {
  const ostanek = Math.abs(n) % 100;
  if (ostanek === 1) return `${n} dan`;
  if (ostanek === 2) return `${n} dneva`;
  if (ostanek === 3 || ostanek === 4) return `${n} dnevi`;
  return `${n} dni`;
}

// »1 kos«, »2 kosa«, »3 kosi«, »5 kosov« (enako pravilo kot pri dnevih).
export function steviloKosovBesedilo(n) {
  const ostanek = Math.abs(n) % 100;
  if (ostanek === 1) return `${n} kos`;
  if (ostanek === 2) return `${n} kosa`;
  if (ostanek === 3 || ostanek === 4) return `${n} kosi`;
  return `${n} kosov`;
}

// Razlogi zavrnitve (dokument 02, Ročna odločitev tehnika).
export const OZNAKE_RAZLOGOV = {
  ZAMUJENA_IZPOSOJA: 'Zamujena izposoja',
  NEPORAVNANA_POSKODBA: 'Neporavnana poškodba',
  OPREMA_V_OKVARI: 'Oprema v okvari ali na servisu',
  POTREBNA_ZA_VAJE: 'Oprema potrebna za izvedbo vaj',
  NEUSTREZEN_NAMEN: 'Neustrezen namen izposoje',
};
