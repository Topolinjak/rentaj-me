import { useContext } from 'react';
import { UporabnikKontekst } from './kontekst.js';

// Prijavljeni uporabnik in dejanja za prijavo/odjavo. Le znotraj UporabnikProvider.
export function useUporabnik() {
  const vrednost = useContext(UporabnikKontekst);
  if (!vrednost) throw new Error('useUporabnik je mogoče uporabiti le znotraj UporabnikProvider.');
  return vrednost;
}
