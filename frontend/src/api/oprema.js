// Oprema: katalog in zasedenost (US-02), upravljanje kosov (US-19).
import { klic } from './klic.js';

export const katalog = ({ signal } = {}) => klic('/api/oprema', { signal });

// Inventar za tehnika in administratorja: tudi umaknjeni kosi.
export const inventar = ({ signal } = {}) => klic('/api/oprema?vsi=true', { signal });

export const kosOpreme = (id, { signal } = {}) => klic(`/api/oprema/${id}`, { signal });

// Obdobja zasedenosti [{ od, do }] (do je zadnji dan), ki se prekrivajo z od–do.
export const zasedenost = (id, od, zadnjiDan, { signal } = {}) =>
  klic(`/api/oprema/${id}/zasedenost?od=${od}&do=${zadnjiDan}`, { signal });

export const ustvariKos = (podatki) => klic('/api/oprema', { metoda: 'POST', telo: podatki });

// Odgovor vsebuje odprteRezervacije (ODDANA, ODOBRENA), da jih tehnik vidi ob okvari ali umiku.
export const spremeniKos = (id, podatki) =>
  klic(`/api/oprema/${id}`, { metoda: 'PATCH', telo: podatki });
