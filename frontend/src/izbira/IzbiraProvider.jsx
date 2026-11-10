// Seznam kosov, izbranih za skupno rezervacijo (I-24, »Dodaj k rezervaciji«). Hrani se v
// sessionStorage, da ostane ob osvežitvi strani, in se izprazni po oddaji ali odjavi.
// Shranjeni so le podatki za prikaz (id, naziv, inventarna številka); ali je kos prost, odloči
// API ob oddaji (409).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUporabnik } from '../auth/useUporabnik.js';
import { IzbiraKontekst } from './kontekst.js';

export const KLJUC_SHRAMBE = 'rentaj:izbrani-kosi';

function preberi() {
  try {
    const shranjeno = JSON.parse(sessionStorage.getItem(KLJUC_SHRAMBE) ?? '[]');
    return Array.isArray(shranjeno) ? shranjeno : [];
  } catch {
    return [];
  }
}

function shrani(kosi) {
  try {
    sessionStorage.setItem(KLJUC_SHRAMBE, JSON.stringify(kosi));
  } catch {
    // Shramba ni na voljo (zasebno okno): izbira velja do osvežitve strani.
  }
}

export default function IzbiraProvider({ children }) {
  const { uporabnik, nalaganje } = useUporabnik();
  const [kosi, setKosi] = useState(preberi);

  // Po odjavi (ali potekli seji) izbira ne sme ostati naslednjemu uporabniku v istem zavihku.
  const odjavljen = !nalaganje && !uporabnik;
  if (odjavljen && kosi.length > 0) setKosi([]);

  useEffect(() => shrani(kosi), [kosi]);

  const dodaj = useCallback(
    ({ id, naziv, inventarnaStevilka }) =>
      setKosi((seznam) =>
        seznam.some((k) => k.id === id) ? seznam : [...seznam, { id, naziv, inventarnaStevilka }],
      ),
    [],
  );
  const odstrani = useCallback((id) => setKosi((seznam) => seznam.filter((k) => k.id !== id)), []);
  const izprazni = useCallback(() => setKosi([]), []);

  const vrednost = useMemo(
    () => ({ kosi, dodaj, odstrani, izprazni, vsebuje: (id) => kosi.some((k) => k.id === id) }),
    [kosi, dodaj, odstrani, izprazni],
  );

  return <IzbiraKontekst value={vrednost}>{children}</IzbiraKontekst>;
}
