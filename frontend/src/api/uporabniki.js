// Upravljanje uporabnikov (US-18, le administrator).
import { klic } from './klic.js';

export const seznamUporabnikov = ({ signal } = {}) => klic('/api/uporabniki', { signal });

export const ustvariUporabnika = (podatki) =>
  klic('/api/uporabniki', { metoda: 'POST', telo: podatki });

export const spremeniUporabnika = (id, podatki) =>
  klic(`/api/uporabniki/${id}`, { metoda: 'PATCH', telo: podatki });
