// Rezervacije (US-03 … US-11).
import { klic } from './klic.js';

// Oddaja: { kosi: [id], od, do (zadnji dan), namen }.
export const oddajRezervacijo = (podatki) =>
  klic('/api/rezervacije', { metoda: 'POST', telo: podatki });

export const mojeRezervacije = ({ signal } = {}) => klic('/api/rezervacije/moje', { signal });
