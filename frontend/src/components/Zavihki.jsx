// Zavihki (dokument 07, 4) po vzorcu WAI-ARIA »Tabs«: puščici levo in desno, Home in End
// premikajo med zavihki in jih hkrati izberejo; Tab skoči iz vrste zavihkov v vsebino.
//
// zavihki: [{ kljuc, oznaka, vsebina }]; izbran in onIzberi za nadzorovano rabo (npr. zavihek
// v URL), sicer si izbiro zapomni komponenta sama.
import { useId, useRef, useState } from 'react';

export default function Zavihki({ zavihki, izbran, onIzberi, oznaka }) {
  const [lastnaIzbira, setLastnaIzbira] = useState(zavihki[0]?.kljuc);
  const aktivni = izbran ?? lastnaIzbira;
  const predpona = useId();
  const gumbi = useRef([]);

  function izberi(indeks) {
    const { kljuc } = zavihki[indeks];
    setLastnaIzbira(kljuc);
    onIzberi?.(kljuc);
    gumbi.current[indeks]?.focus();
  }

  function obTipki(dogodek, indeks) {
    const zadnji = zavihki.length - 1;
    const novi = {
      ArrowRight: indeks === zadnji ? 0 : indeks + 1,
      ArrowLeft: indeks === 0 ? zadnji : indeks - 1,
      Home: 0,
      End: zadnji,
    }[dogodek.key];
    if (novi === undefined) return;
    dogodek.preventDefault();
    izberi(novi);
  }

  return (
    <div>
      <div role="tablist" aria-label={oznaka} className="flex gap-1 border-b border-gray-200">
        {zavihki.map((zavihek, indeks) => {
          const je = zavihek.kljuc === aktivni;
          return (
            <button
              key={zavihek.kljuc}
              ref={(el) => {
                gumbi.current[indeks] = el;
              }}
              type="button"
              role="tab"
              id={`${predpona}-zavihek-${zavihek.kljuc}`}
              aria-selected={je}
              aria-controls={`${predpona}-vsebina-${zavihek.kljuc}`}
              tabIndex={je ? 0 : -1}
              onClick={() => izberi(indeks)}
              onKeyDown={(e) => obTipki(e, indeks)}
              className={`-mb-px min-h-11 border-b-2 px-4 font-medium ${
                je
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {zavihek.oznaka}
            </button>
          );
        })}
      </div>
      {zavihki
        .filter((zavihek) => zavihek.kljuc === aktivni)
        .map((zavihek) => (
          <div
            key={zavihek.kljuc}
            role="tabpanel"
            id={`${predpona}-vsebina-${zavihek.kljuc}`}
            aria-labelledby={`${predpona}-zavihek-${zavihek.kljuc}`}
            tabIndex={0}
            className="pt-6"
          >
            {zavihek.vsebina}
          </div>
        ))}
    </div>
  );
}
