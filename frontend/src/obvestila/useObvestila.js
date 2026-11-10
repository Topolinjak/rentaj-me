import { useContext } from 'react';
import { ObvestilaKontekst } from './kontekst.js';

// const obvesti = useObvestila(); obvesti('Rezervacija oddana – čaka na odobritev tehnika');
export function useObvestila() {
  const obvesti = useContext(ObvestilaKontekst);
  if (!obvesti) throw new Error('useObvestila je mogoče uporabiti le znotraj ObvestilaProvider.');
  return obvesti;
}
