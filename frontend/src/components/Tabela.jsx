// Tabela z razvrščanjem (dokument 07, 4 in 6). Na namizju klasična tabela, pod 640 px seznam
// kartic s pari »oznaka: vrednost«. Razvršča se na odjemalcu, po stolpcih, ki imajo razvrsti.
//
// stolpci: [{ kljuc, oznaka, vrednost: (vrstica) => vsebina, razvrsti?: (vrstica) => primerljivo,
//             stevilka?: true (desno poravnano, tabelarne številke) }]
// vrstice: podatki; kljucVrstice: (vrstica) => enolični ključ (privzeto vrstica.id);
// zacetnoRazvrscanje: { kljuc, smer: 'narascajoce' | 'padajoce' }; naslov: opis tabele (caption).
import { useId, useMemo, useState } from 'react';
import Ikona from './Ikona.jsx';

const primerjalnik = new Intl.Collator('sl', { numeric: true, sensitivity: 'base' });

function primerjaj(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // prazne vrednosti vedno na konec
  if (b == null) return -1;
  if (typeof a === 'string' && typeof b === 'string') return primerjalnik.compare(a, b);
  return a < b ? -1 : a > b ? 1 : 0;
}

export default function Tabela({
  stolpci,
  vrstice,
  kljucVrstice = (vrstica) => vrstica.id,
  zacetnoRazvrscanje,
  naslov,
}) {
  const [razvrscanje, setRazvrscanje] = useState(zacetnoRazvrscanje ?? null);
  const idIzbire = useId();

  const razvrscene = useMemo(() => {
    const stolpec = stolpci.find((s) => s.kljuc === razvrscanje?.kljuc);
    if (!stolpec?.razvrsti) return vrstice;
    const predznak = razvrscanje.smer === 'padajoce' ? -1 : 1;
    // toSorted ohrani vrstni red enakih vrstic in ne spremeni podanega seznama.
    return vrstice.toSorted(
      (a, b) => predznak * primerjaj(stolpec.razvrsti(a), stolpec.razvrsti(b)),
    );
  }, [stolpci, vrstice, razvrscanje]);

  function razvrstiPo(kljuc) {
    setRazvrscanje((trenutno) =>
      trenutno?.kljuc === kljuc && trenutno.smer === 'narascajoce'
        ? { kljuc, smer: 'padajoce' }
        : { kljuc, smer: 'narascajoce' },
    );
  }

  const razvrstljivi = stolpci.filter((s) => s.razvrsti);

  return (
    <div>
      {/* Namizje in tablica */}
      <div className="hidden overflow-x-auto rounded-osnovni border border-gray-300 sm:block">
        <table className="w-full border-collapse text-left">
          {naslov && <caption className="sr-only">{naslov}</caption>}
          <thead className="bg-gray-100 text-sm text-gray-700">
            <tr>
              {stolpci.map((stolpec) => {
                const aktiven = razvrscanje?.kljuc === stolpec.kljuc;
                const smer = aktiven ? razvrscanje.smer : null;
                return (
                  <th
                    key={stolpec.kljuc}
                    scope="col"
                    aria-sort={
                      smer === 'narascajoce'
                        ? 'ascending'
                        : smer === 'padajoce'
                          ? 'descending'
                          : undefined
                    }
                    className={`border-b border-gray-300 px-4 py-2 font-medium ${stolpec.stevilka ? 'text-right' : ''}`}
                  >
                    {stolpec.razvrsti ? (
                      <button
                        type="button"
                        onClick={() => razvrstiPo(stolpec.kljuc)}
                        className="-mx-1 inline-flex items-center gap-1 rounded-osnovni px-1 py-1 hover:text-brand-600"
                      >
                        {stolpec.oznaka}
                        <Ikona
                          ime={
                            smer === 'narascajoce'
                              ? 'puscicaGor'
                              : smer === 'padajoce'
                                ? 'puscicaDol'
                                : 'razvrsti'
                          }
                          className={`size-3.5 ${aktiven ? 'text-brand-600' : 'text-gray-600'}`}
                        />
                      </button>
                    ) : (
                      stolpec.oznaka
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {razvrscene.map((vrstica) => (
              <tr
                key={kljucVrstice(vrstica)}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-100"
              >
                {stolpci.map((stolpec) => (
                  <td
                    key={stolpec.kljuc}
                    className={`px-4 py-3 align-top ${stolpec.stevilka ? 'text-right tabular-nums' : ''}`}
                  >
                    {stolpec.vrednost(vrstica)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Telefon: kartice z istimi podatki */}
      <div className="sm:hidden">
        {razvrstljivi.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <label htmlFor={idIzbire} className="text-sm text-gray-600">
              Razvrsti po
            </label>
            <select
              id={idIzbire}
              value={razvrscanje ? `${razvrscanje.kljuc}:${razvrscanje.smer}` : ''}
              onChange={(e) => {
                const [kljuc, smer] = e.target.value.split(':');
                setRazvrscanje(kljuc ? { kljuc, smer } : null);
              }}
              className="min-h-11 flex-1 rounded-osnovni border border-gray-300 bg-white px-3 text-gray-900"
            >
              {!razvrscanje && <option value="">Privzeto</option>}
              {razvrstljivi.flatMap((s) => [
                <option key={`${s.kljuc}:n`} value={`${s.kljuc}:narascajoce`}>
                  {s.oznaka} ↑
                </option>,
                <option key={`${s.kljuc}:p`} value={`${s.kljuc}:padajoce`}>
                  {s.oznaka} ↓
                </option>,
              ])}
            </select>
          </div>
        )}
        <ul aria-label={naslov} className="space-y-3">
          {razvrscene.map((vrstica) => (
            <li
              key={kljucVrstice(vrstica)}
              className="rounded-osnovni border border-gray-300 bg-white p-4"
            >
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                {stolpci.map((stolpec) => (
                  <div key={stolpec.kljuc} className="contents">
                    <dt className="text-sm text-gray-600">{stolpec.oznaka}</dt>
                    <dd className={stolpec.stevilka ? 'tabular-nums' : ''}>
                      {stolpec.vrednost(vrstica)}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
