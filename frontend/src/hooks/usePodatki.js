// Nalaganje podatkov za stran: { podatki, nalaganje, napaka, statusNapake, osvezi, setPodatki }.
// napaka je besedilo za uporabnika, statusNapake HTTP status (npr. 404).
// nalozi({ signal }) mora biti stabilna funkcija (useCallback ali definirana zunaj komponente);
// ob spremembi se podatki naložijo znova. Ob zapustitvi strani se zahteva prekliče.
import { useCallback, useEffect, useState } from 'react';

export function usePodatki(nalozi) {
  const [stanje, setStanje] = useState({
    podatki: null,
    nalaganje: true,
    napaka: null,
    statusNapake: null,
  });
  const [poskus, setPoskus] = useState(0);
  const [prejsnjiNalozi, setPrejsnjiNalozi] = useState(() => nalozi);

  // Nov nalagalnik (npr. drug mesec v koledarju): takoj v stanje nalaganja, med izrisom.
  if (prejsnjiNalozi !== nalozi) {
    setPrejsnjiNalozi(() => nalozi);
    setStanje((s) => ({ ...s, nalaganje: true, napaka: null }));
  }

  useEffect(() => {
    const preklic = new AbortController();
    nalozi({ signal: preklic.signal }).then(
      (podatki) => setStanje({ podatki, nalaganje: false, napaka: null, statusNapake: null }),
      (napaka) => {
        if (napaka.name !== 'AbortError') {
          setStanje((s) => ({
            ...s,
            nalaganje: false,
            napaka: napaka.message,
            statusNapake: napaka.status ?? null,
          }));
        }
      },
    );
    return () => preklic.abort();
  }, [nalozi, poskus]);

  const osvezi = useCallback(() => {
    setStanje((s) => ({ ...s, nalaganje: true, napaka: null }));
    setPoskus((p) => p + 1);
  }, []);

  // Za posodobitev po dejanju brez ponovnega nalaganja (npr. odobrena rezervacija izgine).
  const setPodatki = useCallback(
    (posodobi) =>
      setStanje((s) => ({
        ...s,
        podatki: typeof posodobi === 'function' ? posodobi(s.podatki) : posodobi,
      })),
    [],
  );

  return { ...stanje, osvezi, setPodatki };
}
