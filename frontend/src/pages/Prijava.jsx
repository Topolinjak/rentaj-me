// Prijava (US-01, dokument 07, 5.1): zatemnjena fotografija stavbe FNM, na sredini bela kartica
// z logotipom in obrazcem, spodaj noga, glave z menijem ni.
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { prijava } from '../api/auth.js';
import { napakePoPoljih } from '../api/klic.js';
import logo from '../assets/logo-um-fnm-odt.jpg';
import stavba from '../assets/stavba-fnm.jpg';
import { useUporabnik } from '../auth/useUporabnik.js';
import { zacetnaStran } from '../auth/vloge.js';
import Gumb from '../components/Gumb.jsx';
import Noga from '../components/Noga.jsx';
import Polje from '../components/Polje.jsx';

export default function Prijava() {
  const { uporabnik, nalaganje, prijavljen } = useUporabnik();
  const navigiraj = useNavigate();
  const lokacija = useLocation();

  const [email, setEmail] = useState('');
  const [geslo, setGeslo] = useState('');
  const [posiljanje, setPosiljanje] = useState(false);
  const [napaka, setNapaka] = useState(null);
  const [napakePolj, setNapakePolj] = useState({});

  // Dokler ne vemo, ali je seja že odprta, ne pokažemo ničesar (brez utripa obrazca).
  if (nalaganje) return null;
  // Prijavljen uporabnik na /prijava gre na začetno stran svoje vloge. Ob uspešni prijavi
  // spodaj preusmerimo sami, zato tu le, če je bil prijavljen že ob odprtju strani.
  if (uporabnik && !posiljanje) return <Navigate to={zacetnaStran(uporabnik.vloga)} replace />;

  async function obOddaji(dogodek) {
    dogodek.preventDefault();
    setPosiljanje(true);
    setNapaka(null);
    setNapakePolj({});
    try {
      const podatki = await prijava(email, geslo);
      prijavljen(podatki);
      // Nazaj na stran, ki jo je uporabnik hotel odpreti (ZascitenaPot), sicer na začetno stran
      // vloge. Če stran ni za njegovo vlogo, ga ZascitenaPot preusmeri naprej.
      navigiraj(lokacija.state?.od ?? zacetnaStran(podatki.vloga), { replace: true });
    } catch (e) {
      // 400: napake pri poljih; 401, 403 in ostalo: sporočilo API-ja nad gumbom.
      if (e.napake?.length) setNapakePolj(napakePoPoljih(e));
      else setNapaka(e.message);
      setPosiljanje(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        <img src={stavba} alt="" className="absolute inset-0 size-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-brand-800/75" />

        <div className="relative w-full max-w-md rounded-osnovni bg-white p-6 shadow-lg sm:p-8">
          <img
            src={logo}
            alt="Univerza v Mariboru, Fakulteta za naravoslovje in matematiko, Oddelek za tehniko"
            className="h-auto w-full"
          />
          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-2xl font-bold text-brand-600">Rentaj.me</p>
            <p className="text-sm text-gray-600">Izposoja opreme</p>
          </div>

          <h1 className="mt-6 text-xl font-bold text-gray-900">Prijava</h1>

          <form onSubmit={obOddaji} noValidate className="mt-4 space-y-4">
            <Polje
              oznaka="E-poštni naslov"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              napaka={napakePolj.email}
              obvezno
            />
            <Polje
              oznaka="Geslo"
              type="password"
              autoComplete="current-password"
              value={geslo}
              onChange={(e) => setGeslo(e.target.value)}
              napaka={napakePolj.geslo}
              obvezno
            />

            {napaka && (
              <p
                role="alert"
                className="rounded-osnovni bg-napaka-ozadje px-3 py-2 text-sm text-napaka"
              >
                {napaka}
              </p>
            )}

            <Gumb type="submit" nalaganje={posiljanje} className="w-full">
              Prijava
            </Gumb>
          </form>
        </div>
      </main>
      <Noga />
    </div>
  );
}
