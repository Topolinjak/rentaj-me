// Pot »/«: prijavljenega uporabnika pošlje na začetno stran njegove vloge, ostale na prijavo.
import { Navigate } from 'react-router';
import { useUporabnik } from '../auth/useUporabnik.js';
import { zacetnaStran } from '../auth/vloge.js';

export default function ZacetnaPreusmeritev() {
  const { uporabnik, nalaganje } = useUporabnik();
  if (nalaganje) return null;
  return <Navigate to={uporabnik ? zacetnaStran(uporabnik.vloga) : '/prijava'} replace />;
}
