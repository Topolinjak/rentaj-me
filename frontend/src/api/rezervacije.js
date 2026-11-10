// Rezervacije (US-03 … US-11).
import { klic } from './klic.js';

// Oddaja: { kosi: [id], od, do (zadnji dan), namen }.
export const oddajRezervacijo = (podatki) =>
  klic('/api/rezervacije', { metoda: 'POST', telo: podatki });

export const mojeRezervacije = ({ signal } = {}) => klic('/api/rezervacije/moje', { signal });

// --- Tehnik (US-05 … US-11) ---

// Seznam: { status: 'ODDANA' } ali { zamujene: true }. Vsaka rezervacija ima uporabnika,
// kose, zamujena, dniZamude ter steviloZamud in steviloNeporavnanihPoskodb uporabnika.
export function seznamRezervacij({ status, zamujene } = {}, { signal } = {}) {
  const parametri = new URLSearchParams();
  if (status) parametri.set('status', status);
  if (zamujene) parametri.set('zamujene', 'true');
  return klic(`/api/rezervacije?${parametri}`, { signal });
}

export const stevciRezervacij = ({ signal } = {}) => klic('/api/rezervacije/stevci', { signal });

// { uporabnik, zamujene: [{ id, od, do, dniZamude, kosi }], poskodbe: [{ id, opis, ustvarjeno, kos }] }
export const opozorilaRezervacije = (id, { signal } = {}) =>
  klic(`/api/rezervacije/${id}/opozorila`, { signal });

export const odobriRezervacijo = (id) =>
  klic(`/api/rezervacije/${id}/odobritev`, { metoda: 'PATCH' });

export const zavrniRezervacijo = (id, { razlogZavrnitve, komentarTehnika }) =>
  klic(`/api/rezervacije/${id}/zavrnitev`, {
    metoda: 'PATCH',
    telo: { razlogZavrnitve, komentarTehnika },
  });
