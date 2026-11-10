// Izbira termina s klikom v koledarju: prvi klik nastavi prvi dan, drugi zadnji dan; klik pred
// prvim dnevom ali po že izbranem terminu začne znova.
export function izberiDanVTerminu(termin, datum) {
  if (!termin.od || termin.do || datum < termin.od) return { od: datum, do: '' };
  return { od: termin.od, do: datum };
}
