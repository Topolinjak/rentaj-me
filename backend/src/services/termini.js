// Zasedenost terminov. Isti pogoj uporabljata koledar zasedenosti (I-17) in oddaja
// rezervacije (I-20), zato je zapisan samo tukaj.

// Rezervacije s temi statusi zasedajo termin kosa (dokument 03, Ključna pravila).
export const ZASEDAJOCI_STATUSI = ['ODDANA', 'ODOBRENA', 'IZDANA'];

// Prisma pogoj za rezervacije, ki se prekrivajo s terminom [zacetek, konec) (ADR-0013):
// obstojeciZacetek < konec in obstojeciKonec > zacetek.
export const prekrivaTermin = ({ zacetek, konec }) => ({
  zacetek: { lt: konec },
  konec: { gt: zacetek },
});

// Prisma pogoj za rezervacije, ki zasedajo kos v danem terminu.
export const zasedaKos = (kosOpremeId, termin) => ({
  status: { in: ZASEDAJOCI_STATUSI },
  postavke: { some: { kosOpremeId } },
  ...prekrivaTermin(termin),
});
