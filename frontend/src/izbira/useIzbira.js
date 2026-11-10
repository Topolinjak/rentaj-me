import { useContext } from 'react';
import { IzbiraKontekst } from './kontekst.js';

// Kosi, izbrani za skupno rezervacijo (I-24).
export function useIzbira() {
  const vrednost = useContext(IzbiraKontekst);
  if (!vrednost) throw new Error('useIzbira je mogoče uporabiti le znotraj IzbiraProvider.');
  return vrednost;
}
