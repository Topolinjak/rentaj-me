// Glava (dokument 07, 3.6): logotipa in ime aplikacije levo, meni glede na vlogo desno, nato
// ime in vloga prijavljenega ter Odjava. Pod 1024 px se meni skrije za gumb »Meni«, ki odpre
// bel pladenj čez celo širino.
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import logo from '../assets/logo-um-fnm-odt.jpg';
import { useUporabnik } from '../auth/useUporabnik.js';
import { useIzbira } from '../izbira/useIzbira.js';
import { meniZaVlogo, OZNAKE_VLOG } from '../auth/vloge.js';

const ALT_LOGOTIPA =
  'Univerza v Mariboru, Fakulteta za naravoslovje in matematiko, Oddelek za tehniko';

// Število izbranih kosov ob povezavi Rezervacija; bralnik zaslona prebere »izbranih kosov: 2«.
function SteviloIzbranih({ n }) {
  if (n === 0) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
      <span className="sr-only">izbranih kosov: </span>
      {n}
    </span>
  );
}

const gumbOdjava =
  'rounded-osnovni border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100';

export default function Glava() {
  const { uporabnik, odjavi } = useUporabnik();
  const { kosi: izbrani } = useIzbira();
  const navigiraj = useNavigate();
  const [meniOdprt, setMeniOdprt] = useState(false);

  // Esc zapre odprt mobilni meni.
  useEffect(() => {
    if (!meniOdprt) return undefined;
    const obTipki = (dogodek) => {
      if (dogodek.key === 'Escape') setMeniOdprt(false);
    };
    document.addEventListener('keydown', obTipki);
    return () => document.removeEventListener('keydown', obTipki);
  }, [meniOdprt]);

  async function obOdjavi() {
    setMeniOdprt(false);
    await odjavi();
    navigiraj('/prijava', { replace: true });
  }

  const meni = uporabnik ? meniZaVlogo(uporabnik.vloga) : [];
  const ime = uporabnik && `${uporabnik.ime} ${uporabnik.priimek}`;
  const vloga = uporabnik && OZNAKE_VLOG[uporabnik.vloga];

  return (
    <header className="relative border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-vsebina items-center gap-4 px-4 lg:h-20">
        <Link to="/" className="flex shrink-0 items-center gap-3 lg:gap-4">
          <img src={logo} alt={ALT_LOGOTIPA} className="h-7 w-auto sm:h-10 lg:h-12" />
          <span className="border-l border-gray-200 pl-3 leading-tight lg:pl-4">
            <span className="block text-lg font-bold text-brand-600">Rentaj.me</span>
            <span className="hidden text-sm text-gray-600 sm:block">Izposoja opreme</span>
          </span>
        </Link>

        {uporabnik && (
          <>
            <nav aria-label="Glavni meni" className="ml-auto hidden h-full lg:flex">
              <ul className="flex h-full items-center gap-1">
                {meni.map((povezava) => (
                  <li key={povezava.pot}>
                    <NavLink
                      to={povezava.pot}
                      end={povezava.natancno}
                      className="group block px-3 py-2 text-meni font-medium text-gray-900 hover:text-brand-600 aria-[current=page]:text-brand-600"
                    >
                      <span className="border-b-2 border-transparent pb-1 group-aria-[current=page]:border-brand-600">
                        {povezava.oznaka}
                      </span>
                      {povezava.izbira && <SteviloIzbranih n={izbrani.length} />}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="hidden items-center gap-3 border-l border-gray-200 pl-4 lg:flex">
              <p className="text-right text-sm leading-tight">
                <span className="block font-medium text-gray-900">{ime}</span>
                <span className="block text-gray-600">{vloga}</span>
              </p>
              <button type="button" onClick={obOdjavi} className={gumbOdjava}>
                Odjava
              </button>
            </div>

            <button
              type="button"
              className="ml-auto flex min-h-11 items-center gap-2 rounded-osnovni px-3 text-meni font-medium text-gray-900 hover:bg-gray-100 lg:hidden"
              aria-expanded={meniOdprt}
              aria-controls="mobilni-meni"
              onClick={() => setMeniOdprt((odprt) => !odprt)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
                <path
                  d={meniOdprt ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {meniOdprt ? 'Zapri' : 'Meni'}
            </button>
          </>
        )}
      </div>

      {uporabnik && meniOdprt && (
        <div
          id="mobilni-meni"
          className="absolute inset-x-0 top-full z-20 border-b border-gray-200 bg-white shadow-md lg:hidden"
        >
          <nav aria-label="Glavni meni">
            <ul>
              {meni.map((povezava) => (
                <li key={povezava.pot} className="border-b border-gray-200">
                  <NavLink
                    to={povezava.pot}
                    end={povezava.natancno}
                    onClick={() => setMeniOdprt(false)}
                    className="flex min-h-11 items-center border-l-4 border-transparent px-4 font-medium text-gray-900 hover:bg-gray-100 aria-[current=page]:border-brand-600 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-600"
                  >
                    {povezava.oznaka}
                    {povezava.izbira && <SteviloIzbranih n={izbrani.length} />}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm leading-tight">
              <span className="block font-medium text-gray-900">{ime}</span>
              <span className="block text-gray-600">{vloga}</span>
            </p>
            <button type="button" onClick={obOdjavi} className={`${gumbOdjava} min-h-11`}>
              Odjava
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
