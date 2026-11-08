// Pretvorbe med datumi v API-ju (YYYY-MM-DD) in termini v bazi ([zacetek, konec)).
// Dogovor je v docs/adr/0013-termini-kot-celi-dnevi.md. Vsa koda, ki dela s termini, naj
// uporablja te funkcije – ne računaj z milisekundami ali `new Date('YYYY-MM-DD')` drugje.
//
// Datum (YYYY-MM-DD) je koledarski dan brez časa in pasu. Za aritmetiko ga predstavimo kot
// polnoč v UTC, kar je neodvisno od poletnega časa; v trenutek v Ljubljani ga pretvori šele
// polnocVLjubljani().

export const CASOVNI_PAS = 'Europe/Ljubljana';

const DAN_MS = 24 * 60 * 60 * 1000;
const VZOREC = /^(\d{4})-(\d{2})-(\d{2})$/;

function razcleni(datum) {
  const ujemanje = VZOREC.exec(datum);
  if (!ujemanje) throw new TypeError(`Neveljaven datum »${datum}«, pričakujem YYYY-MM-DD.`);
  return ujemanje.slice(1).map(Number);
}

const kotUtc = (datum) => {
  const [leto, mesec, dan] = razcleni(datum);
  return Date.UTC(leto, mesec - 1, dan);
};

const izUtc = (ms) => new Date(ms).toISOString().slice(0, 10);

// Ali je niz pravi koledarski datum (npr. 2026-02-30 ni).
export function jeVeljavenDatum(datum) {
  if (typeof datum !== 'string' || !VZOREC.test(datum)) return false;
  return izUtc(kotUtc(datum)) === datum;
}

export const dodajDni = (datum, dni) => izUtc(kotUtc(datum) + dni * DAN_MS);

// Število koledarskih dni od prvega do zadnjega dne, oba vključena (od 20. 10. do 24. 10. = 5).
export const steviloDni = (prviDan, zadnjiDan) =>
  Math.round((kotUtc(zadnjiDan) - kotUtc(prviDan)) / DAN_MS) + 1;

const oblikaLjubljana = new Intl.DateTimeFormat('en-CA', {
  timeZone: CASOVNI_PAS,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Koledarski dan v Ljubljani, v katerem leži trenutek `trenutek`.
export const datumVLjubljani = (trenutek) => oblikaLjubljana.format(trenutek);

export const danes = () => datumVLjubljani(new Date());

// Zamik pasu Europe/Ljubljana (v ms) v danem trenutku: +1 h pozimi, +2 h poleti.
function zamikLjubljane(trenutek) {
  const deli = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: CASOVNI_PAS,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
      .formatToParts(trenutek)
      .map(({ type, value }) => [type, Number(value)]),
  );
  const lokalno = Date.UTC(
    deli.year,
    deli.month - 1,
    deli.day,
    deli.hour,
    deli.minute,
    deli.second,
  );
  return lokalno - Math.floor(trenutek.getTime() / 1000) * 1000;
}

// Trenutek (Date), ko je v Ljubljani polnoč na začetku dneva `datum`. Prehod na poletni ali
// zimski čas je ob 2.00/3.00, zato polnoč vedno obstaja in je enolična.
export function polnocVLjubljani(datum) {
  const utc = kotUtc(datum);
  const priblizek = new Date(utc - zamikLjubljane(new Date(utc)));
  return new Date(utc - zamikLjubljane(priblizek));
}

// Datuma iz API-ja (od, do) → termin za bazo. `do` je zadnji dan, `konec` je polnoč dneva po njem.
export const terminIzDatumov = (prviDan, zadnjiDan) => ({
  zacetek: polnocVLjubljani(prviDan),
  konec: polnocVLjubljani(dodajDni(zadnjiDan, 1)),
});

// Termin iz baze → datuma za API in prikaz.
export const datumiIzTermina = ({ zacetek, konec }) => ({
  od: datumVLjubljani(zacetek),
  do: dodajDni(datumVLjubljani(konec), -1),
});

// Kratek prikaz za sporočila: 2026-10-22 → »22. 10.«
export function kratekDatum(datum) {
  const [, mesec, dan] = razcleni(datum);
  return `${dan}. ${mesec}.`;
}
