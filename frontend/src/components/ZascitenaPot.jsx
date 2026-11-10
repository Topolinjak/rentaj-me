// Zaščitena pot (US-01, kriterij 4): neprijavljen uporabnik gre na prijavo, uporabnik z vlogo,
// ki strani ne sme videti, pa na začetno stran svoje vloge. Pravo zaščito izvaja backend (401,
// 403); tu le ne prikažemo strani, ki bi ob prvem klicu API-ja tako ali tako vrnila napako.
import { Navigate, Outlet, useLocation } from 'react-router';
import { useUporabnik } from '../auth/useUporabnik.js';
import { zacetnaStran } from '../auth/vloge.js';

export default function ZascitenaPot({ vloge }) {
  const { uporabnik, nalaganje } = useUporabnik();
  const lokacija = useLocation();

  // Dokler /api/auth/jaz ne odgovori, ne vemo, ali je kdo prijavljen – nič ne preusmerjamo.
  if (nalaganje) return null;

  if (!uporabnik) {
    // Stran za prijavo (I-10) lahko uporabnika po prijavi vrne sem.
    return <Navigate to="/prijava" replace state={{ od: lokacija.pathname }} />;
  }

  if (vloge && !vloge.includes(uporabnik.vloga)) {
    return <Navigate to={zacetnaStran(uporabnik.vloga)} replace />;
  }

  return <Outlet />;
}
