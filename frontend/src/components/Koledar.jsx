// Koledar zasedenosti (US-02, dokument 07, 4 in 7): mesečni prikaz s premikanjem med meseci.
// Zasedeni dnevi imajo šrafuro (ne le barvo) in legendo, vsak dan ima aria-label z datumom in
// stanjem (»22. oktober 2026, zaseden«). Tipkovnica po vzorcu WAI-ARIA »Date picker grid«:
// puščice premikajo za dan oziroma teden (tudi čez rob meseca), Home/End na začetek/konec
// tedna, PageUp/PageDown za mesec, Enter ali preslednica izbere dan.
//
// zasedeni: [{ od, do }] (do je zadnji dan, ADR-0013); izbrano: { od, do } za poudarek termina;
// onIzberiDan(datum) ob kliku ali Enter na današnjem ali poznejšem dnevu.
import { useEffect, useId, useRef, useState } from 'react';
import {
  danes as danesVLjubljani,
  danVTednu,
  dodajDni,
  dodajMesece,
  dolgDatum,
  imeMeseca,
  mesecDatuma,
  prviDanMeseca,
  zadnjiDanMeseca,
} from '../utils/datumi.js';
import Ikona from './Ikona.jsx';

const DNEVI = ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'];
const DNEVI_POLNO = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'];

const SRAFURA =
  'bg-gray-100 bg-[repeating-linear-gradient(135deg,var(--color-gray-300)_0_2px,transparent_2px_7px)]';

// Tedni meseca: seznam vrstic po 7 celic (null za dneve sosednjih mesecev).
function tedniMeseca(mesec) {
  const celice = Array(danVTednu(prviDanMeseca(mesec))).fill(null);
  for (let d = prviDanMeseca(mesec); d <= zadnjiDanMeseca(mesec); d = dodajDni(d, 1)) {
    celice.push(d);
  }
  while (celice.length % 7) celice.push(null);
  return Array.from({ length: celice.length / 7 }, (_, i) => celice.slice(i * 7, i * 7 + 7));
}

// Isti dan v mesecu n mesecev naprej; 31. 1. + 1 mesec = 28. 2. (zadnji dan krajšega meseca).
function istiDanVMesecu(datum, n) {
  const mesec = dodajMesece(mesecDatuma(datum), n);
  const zadnji = zadnjiDanMeseca(mesec);
  const dan = datum.slice(8);
  return dan > zadnji.slice(8) ? zadnji : `${mesec}-${dan}`;
}

export default function Koledar({
  mesec,
  onMesec,
  zasedeni = [],
  izbrano,
  onIzberiDan,
  nalaganje = false,
}) {
  const danes = danesVLjubljani();
  const idNaslova = useId();
  const mreza = useRef(null);
  const [fokus, setFokus] = useState(danes);
  // Fokus premaknemo na dan le po uporabi tipkovnice v koledarju, ne ob nalaganju strani.
  const premakniFokus = useRef(false);

  // Dan, ki je v vrsti Tab: izbrani dan, če je v prikazanem mesecu, sicer prvi dan meseca.
  const aktivenDan = mesecDatuma(fokus) === mesec ? fokus : prviDanMeseca(mesec);

  useEffect(() => {
    if (!premakniFokus.current) return;
    const gumb = mreza.current?.querySelector(`[data-datum="${aktivenDan}"]`);
    if (gumb) {
      gumb.focus();
      premakniFokus.current = false;
    }
  }, [aktivenDan, mesec]);

  const jeZaseden = (datum) => zasedeni.some((z) => z.od <= datum && datum <= z.do);
  const jeIzbran = (datum) =>
    izbrano?.od && datum >= izbrano.od && datum <= (izbrano.do || izbrano.od);

  function premakni(novDatum) {
    premakniFokus.current = true;
    setFokus(novDatum);
    if (mesecDatuma(novDatum) !== mesec) onMesec(mesecDatuma(novDatum));
  }

  function obTipki(dogodek, datum) {
    const premik = {
      ArrowLeft: () => dodajDni(datum, -1),
      ArrowRight: () => dodajDni(datum, 1),
      ArrowUp: () => dodajDni(datum, -7),
      ArrowDown: () => dodajDni(datum, 7),
      Home: () => dodajDni(datum, -danVTednu(datum)),
      End: () => dodajDni(datum, 6 - danVTednu(datum)),
      PageUp: () => istiDanVMesecu(datum, -1),
      PageDown: () => istiDanVMesecu(datum, 1),
    }[dogodek.key];
    if (!premik) return;
    dogodek.preventDefault();
    premakni(premik());
  }

  return (
    <div className="rounded-osnovni border border-gray-300 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMesec(dodajMesece(mesec, -1))}
          aria-label="Prejšnji mesec"
          className="flex size-11 items-center justify-center rounded-osnovni text-gray-700 hover:bg-gray-100"
        >
          <Ikona ime="levo" className="size-5" />
        </button>
        <h3
          id={idNaslova}
          aria-live="polite"
          className="font-bold text-gray-900 first-letter:uppercase"
        >
          {imeMeseca(mesec)}
        </h3>
        <button
          type="button"
          onClick={() => onMesec(dodajMesece(mesec, 1))}
          aria-label="Naslednji mesec"
          className="flex size-11 items-center justify-center rounded-osnovni text-gray-700 hover:bg-gray-100"
        >
          <Ikona ime="desno" className="size-5" />
        </button>
      </div>

      <table
        ref={mreza}
        role="grid"
        aria-labelledby={idNaslova}
        aria-busy={nalaganje || undefined}
        className={`mt-3 w-full table-fixed border-separate border-spacing-1 ${nalaganje ? 'opacity-60' : ''}`}
      >
        <thead>
          <tr>
            {DNEVI.map((dan, i) => (
              <th
                key={dan}
                scope="col"
                abbr={DNEVI_POLNO[i]}
                className="pb-1 text-sm font-medium text-gray-600"
              >
                {dan}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tedniMeseca(mesec).map((teden) => (
            <tr key={teden.find(Boolean)}>
              {teden.map((datum, i) => {
                if (!datum) return <td key={`prazno-${i}`} />;
                const zaseden = jeZaseden(datum);
                const izbran = jeIzbran(datum);
                const pretekel = datum < danes;
                const opis = [dolgDatum(datum), zaseden ? 'zaseden' : 'prost'];
                if (datum === danes) opis.push('danes');
                if (izbran) opis.push('izbran');
                return (
                  <td key={datum} className="p-0" aria-selected={izbran || undefined}>
                    <button
                      type="button"
                      data-datum={datum}
                      tabIndex={datum === aktivenDan ? 0 : -1}
                      aria-label={opis.join(', ')}
                      onClick={() => {
                        setFokus(datum);
                        if (!pretekel) onIzberiDan?.(datum);
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && pretekel) e.preventDefault();
                        obTipki(e, datum);
                      }}
                      className={[
                        'flex min-h-10 w-full items-center justify-center rounded-osnovni border text-sm tabular-nums',
                        zaseden ? `${SRAFURA} border-gray-300 text-gray-900` : 'border-gray-200',
                        izbran ? 'border-brand-600 bg-brand-50 font-bold text-brand-700' : '',
                        datum === danes
                          ? 'font-bold underline decoration-2 underline-offset-4'
                          : '',
                        pretekel && !zaseden ? 'text-gray-600' : '',
                        !zaseden && !izbran ? 'hover:bg-gray-100' : '',
                      ].join(' ')}
                    >
                      {Number(datum.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <ul
        className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700"
        aria-label="Legenda"
      >
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-4 rounded-osnovni border border-gray-200 bg-white"
          />
          Prost
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`size-4 rounded-osnovni border border-gray-300 ${SRAFURA}`}
          />
          Zaseden
        </li>
        {izbrano && (
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-4 rounded-osnovni border border-brand-600 bg-brand-50"
            />
            Izbran termin
          </li>
        )}
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="font-bold underline decoration-2 underline-offset-4">
            1
          </span>
          Danes
        </li>
      </ul>
    </div>
  );
}
