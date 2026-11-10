// Kontekst prijavljenega uporabnika. Ob zagonu vpraša backend, kdo je prijavljen
// (GET /api/auth/jaz). Žeton je v piškotku httpOnly, ki ga JavaScript ne vidi (ADR-0008), zato
// je to edini način, da frontend izve za obstoječo sejo.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { jaz, odjava } from '../api/auth.js';
import { DOGODEK_SEJA_POTEKLA } from '../api/klic.js';
import { UporabnikKontekst } from './kontekst.js';

export default function UporabnikProvider({ children }) {
  const [uporabnik, setUporabnik] = useState(null);
  const [nalaganje, setNalaganje] = useState(true);

  useEffect(() => {
    const preklic = new AbortController();
    jaz({ signal: preklic.signal })
      .then(setUporabnik)
      // 401 pomeni, da nihče ni prijavljen. Tudi ob drugih napakah (backend nedosegljiv) se
      // pokaže prijava, kjer uporabnik dobi sporočilo o napaki ob poskusu prijave.
      .catch((napaka) => {
        if (napaka.name !== 'AbortError') setUporabnik(null);
      })
      .finally(() => {
        if (!preklic.signal.aborted) setNalaganje(false);
      });
    return () => preklic.abort();
  }, []);

  // Seja je potekla sredi dela (401 pri katerem koli klicu): izpraznimo kontekst, zaščitena
  // pot nato pošlje uporabnika na prijavo in si zapomni stran, na kateri je bil.
  useEffect(() => {
    const obPotekli = () => setUporabnik(null);
    window.addEventListener(DOGODEK_SEJA_POTEKLA, obPotekli);
    return () => window.removeEventListener(DOGODEK_SEJA_POTEKLA, obPotekli);
  }, []);

  // Po uspešni prijavi (I-10) stran za prijavo sem zapiše podatke iz odgovora.
  const prijavljen = useCallback((podatki) => setUporabnik(podatki), []);

  // Piškotek izbriše backend. Kontekst se izprazni v vsakem primeru: ob 401 je seja že
  // potekla, ob drugi napaki pa uporabnika vseeno ne pustimo v aplikaciji z gumbom, ki ne dela.
  const odjavi = useCallback(async () => {
    try {
      await odjava();
    } catch {
      // Namerno prezrto, glej zgoraj.
    }
    setUporabnik(null);
  }, []);

  const vrednost = useMemo(
    () => ({ uporabnik, nalaganje, prijavljen, odjavi }),
    [uporabnik, nalaganje, prijavljen, odjavi],
  );

  return <UporabnikKontekst value={vrednost}>{children}</UporabnikKontekst>;
}
