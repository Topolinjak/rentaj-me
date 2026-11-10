// Datumi na frontendu (ADR-0013). API sprejema in vrača datume kot YYYY-MM-DD (od, do; do je
// zadnji dan). Pretvorbo v trenutke (zacetek, konec) naredi samo backend, zato frontend dela
// le s koledarskimi dnevi. Funkcije so enake kot v backend/src/utils/datumi.js.
//
// Datum (YYYY-MM-DD) je koledarski dan brez časa in pasu. Za aritmetiko ga predstavimo kot
// polnoč v UTC, kar je neodvisno od poletnega časa in od pasu brskalnika.

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

// Koledarski dan v Ljubljani, v katerem leži trenutek `trenutek` – ne glede na pas brskalnika.
export const datumVLjubljani = (trenutek) => oblikaLjubljana.format(trenutek);

// Današnji dan v Ljubljani (npr. najzgodnejši dovoljen začetek rezervacije).
export const danes = () => datumVLjubljani(new Date());

// Kratek prikaz: 2026-10-22 → »22. 10.« (rok vračila, sporočila).
export function kratekDatum(datum) {
  const [, mesec, dan] = razcleni(datum);
  return `${dan}. ${mesec}.`;
}

// Prikaz z letom: 2026-10-22 → »22. 10. 2026«.
export function datumZLetom(datum) {
  const [leto] = razcleni(datum);
  return `${kratekDatum(datum)} ${leto}`;
}

// Prikaz obdobja: »20. 10. – 24. 10. 2026«; čez novo leto z obema letnicama.
export function obdobje(od, zadnjiDan) {
  if (od === zadnjiDan) return datumZLetom(od);
  const istoLeto = od.slice(0, 4) === zadnjiDan.slice(0, 4);
  return `${istoLeto ? kratekDatum(od) : datumZLetom(od)} – ${datumZLetom(zadnjiDan)}`;
}

// Ure so v obliki »14.00« (s piko, kot je v slovenščini pravopisno; dokument 07, 3.4).
const oblikaUre = new Intl.DateTimeFormat('en-GB', {
  timeZone: CASOVNI_PAS,
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Ura trenutka v Ljubljani: »2026-10-22T12:00:00Z« → »14.00«. Sprejme Date ali niz ISO
// (tako API vrača izdanoOb, vrnjenoOb ...).
export function ura(trenutek) {
  const deli = Object.fromEntries(
    oblikaUre.formatToParts(new Date(trenutek)).map((d) => [d.type, d.value]),
  );
  return `${Number(deli.hour)}.${deli.minute}`;
}

// Datum in ura trenutka v Ljubljani: »22. 10. 2026 ob 14.00«.
export const datumInUra = (trenutek) =>
  `${datumZLetom(datumVLjubljani(new Date(trenutek)))} ob ${ura(trenutek)}`;

// --- Meseci (koledar zasedenosti) ---
// Mesec je niz YYYY-MM.

export const mesecDatuma = (datum) => datum.slice(0, 7);

export const prviDanMeseca = (mesec) => `${mesec}-01`;

export function zadnjiDanMeseca(mesec) {
  const [leto, m] = mesec.split('-').map(Number);
  // Dan 0 naslednjega meseca je zadnji dan tega meseca.
  return izUtc(Date.UTC(leto, m, 0));
}

export function dodajMesece(mesec, n) {
  const [leto, m] = mesec.split('-').map(Number);
  return izUtc(Date.UTC(leto, m - 1 + n, 1)).slice(0, 7);
}

// Dan v tednu, ponedeljek = 0 … nedelja = 6 (slovenski koledar se začne s ponedeljkom).
export const danVTednu = (datum) => (new Date(kotUtc(datum)).getUTCDay() + 6) % 7;

const oblikaMeseca = new Intl.DateTimeFormat('sl', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const oblikaDneva = new Intl.DateTimeFormat('sl', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

// »november 2026«
export const imeMeseca = (mesec) => oblikaMeseca.format(kotUtc(prviDanMeseca(mesec)));

// »22. oktober 2026« (za aria-label dneva v koledarju)
export const dolgDatum = (datum) => oblikaDneva.format(kotUtc(datum));
