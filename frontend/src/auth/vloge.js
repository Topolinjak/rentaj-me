// Vloge, njihove začetne strani in meni. Kdo sme kaj, odloči backend (403); to je le
// usmerjanje v vmesniku.

export const IZPOSOJEVALCI = ['STUDENT', 'ASISTENT', 'PROFESOR'];

export const OZNAKE_VLOG = {
  STUDENT: 'Študent',
  ASISTENT: 'Asistent',
  PROFESOR: 'Profesor',
  TEHNIK: 'Tehnik',
  ADMIN: 'Administrator',
};

// Začetna stran po prijavi (US-01, kriterij 1).
export function zacetnaStran(vloga) {
  if (vloga === 'TEHNIK') return '/tehnik';
  if (vloga === 'ADMIN') return '/admin/uporabniki';
  return '/katalog';
}

const MENI_IZPOSOJEVALCA = [
  { pot: '/katalog', oznaka: 'Katalog' },
  { pot: '/moje-izposoje', oznaka: 'Moje izposoje' },
];

const MENI = {
  STUDENT: MENI_IZPOSOJEVALCA,
  ASISTENT: MENI_IZPOSOJEVALCA,
  PROFESOR: MENI_IZPOSOJEVALCA,
  TEHNIK: [
    { pot: '/tehnik', oznaka: 'Nadzorna plošča', natancno: true },
    { pot: '/tehnik/odobrene', oznaka: 'Odobrene' },
    { pot: '/tehnik/izdane', oznaka: 'Izdane' },
    { pot: '/tehnik/zamujene', oznaka: 'Zamujene' },
    { pot: '/inventar', oznaka: 'Inventar' },
  ],
  ADMIN: [
    { pot: '/admin/uporabniki', oznaka: 'Uporabniki' },
    { pot: '/admin/kategorije', oznaka: 'Kategorije' },
    { pot: '/inventar', oznaka: 'Inventar' },
  ],
};

export const meniZaVlogo = (vloga) => MENI[vloga] ?? [];
