// Kategorije opreme (US-19): seznam za vse prijavljene, spreminja administrator.
import { klic } from './klic.js';

export const seznamKategorij = ({ signal } = {}) => klic('/api/kategorije', { signal });

export const ustvariKategorijo = (podatki) =>
  klic('/api/kategorije', { metoda: 'POST', telo: podatki });

export const spremeniKategorijo = (id, podatki) =>
  klic(`/api/kategorije/${id}`, { metoda: 'PATCH', telo: podatki });
