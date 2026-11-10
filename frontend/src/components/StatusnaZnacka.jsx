// Statusne značke (dokument 07, 3.3): besedilo v slovenščini in ikona levo, barva nikoli ne
// nosi pomena sama.
import {
  OZNAKE_STANJ,
  OZNAKE_STATUSOV_OPREME,
  OZNAKE_STATUSOV_REZERVACIJE,
  steviloDniBesedilo,
} from '../utils/oznake.js';
import Ikona from './Ikona.jsx';

const TONI = {
  info: 'bg-brand-50 text-brand-700',
  uspeh: 'bg-uspeh-ozadje text-uspeh',
  opozorilo: 'bg-opozorilo-ozadje text-opozorilo',
  napaka: 'bg-napaka-ozadje text-napaka',
  siva: 'border-gray-300 bg-gray-100 text-gray-700',
  primarna: 'bg-brand-600 text-white',
};

// Splošna značka (npr. Aktiven/Deaktiviran): ton iz TONI, ikona iz Ikona.jsx.
export function Znacka({ ton, ikona, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-osnovni border border-transparent px-2 py-0.5 text-sm font-medium whitespace-nowrap ${TONI[ton]}`}
    >
      <Ikona ime={ikona} className="size-3.5" />
      {children}
    </span>
  );
}

const REZERVACIJA = {
  ODDANA: ['info', 'ura'],
  ODOBRENA: ['uspeh', 'kljukica'],
  ZAVRNJENA: ['napaka', 'kriz'],
  PREKLICANA: ['siva', 'precrtano'],
  IZDANA: ['primarna', 'puscicaVen'],
  VRNJENA: ['siva', 'kljukica'],
};

// Status rezervacije. »Zamujena« ni shranjen status (ADR-0007): API pri izdani rezervaciji s
// pretečenim rokom vrne zamujena = true in dniZamude.
export function ZnackaRezervacije({ status, zamujena = false, dniZamude = 0 }) {
  if (status === 'IZDANA' && zamujena) {
    return (
      <Znacka ton="napaka" ikona="budilka">
        Zamujena · {steviloDniBesedilo(dniZamude)}
      </Znacka>
    );
  }
  const [ton, ikona] = REZERVACIJA[status];
  return (
    <Znacka ton={ton} ikona={ikona}>
      {OZNAKE_STATUSOV_REZERVACIJE[status]}
    </Znacka>
  );
}

const OPREMA = {
  NA_VOLJO: ['uspeh', 'kljukica'],
  V_OKVARI: ['opozorilo', 'opozorilo'],
  UMAKNJEN: ['siva', 'precrtano'],
};

export function ZnackaOpreme({ status }) {
  const [ton, ikona] = OPREMA[status];
  return (
    <Znacka ton={ton} ikona={ikona}>
      {OZNAKE_STATUSOV_OPREME[status]}
    </Znacka>
  );
}

const STANJE = {
  BREZHIBNO: ['uspeh', 'kljukica'],
  OBRABLJENO: ['opozorilo', 'opozorilo'],
  POSKODOVANO: ['napaka', 'kriz'],
};

// Stanje kosa ob izdaji in vračilu.
export function ZnackaStanja({ stanje }) {
  const [ton, ikona] = STANJE[stanje];
  return (
    <Znacka ton={ton} ikona={ikona}>
      {OZNAKE_STANJ[stanje]}
    </Znacka>
  );
}
