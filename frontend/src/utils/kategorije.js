// Ikona kategorije po nazivu (placeholder namesto slike opreme). Kategorije ureja
// administrator, zato je za neznan naziv privzeta ikona predal.
const IKONE_KATEGORIJ = [
  [/mikro|arduino|elektron/i, 'cip'],
  [/meril|instrument/i, 'merilnik'],
  [/foto|video|kamer/i, 'kamera'],
  [/računal|racunal|prenosn/i, 'racunalnik'],
];

export const ikonaKategorije = (naziv) =>
  IKONE_KATEGORIJ.find(([vzorec]) => vzorec.test(naziv))?.[1] ?? 'predal';
