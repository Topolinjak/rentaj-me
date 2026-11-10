// Osnovna funkcija za klice REST API-ja. Vse funkcije v src/api/ gredo skozi klic(), zato je
// obravnava napak na enem mestu. Poti so relativne (/api/...) in gredo prek proxyja (ADR-0012).

export const SPLOSNA_NAPAKA = 'Prišlo je do napake. Poskusite znova.';

// Dogodek ob 401 sredi dela (posluša ga UporabnikProvider).
export const DOGODEK_SEJA_POTEKLA = 'rentaj:seja-potekla';

// Napaka, ki jo vrže klic(). message je besedilo za uporabnika; status je HTTP status
// (0, če strežnik ni dosegljiv); napake so napake po poljih iz validacije ([{ polje, sporocilo }]).
export class NapakaApi extends Error {
  constructor(sporocilo, status = 0, napake = []) {
    super(sporocilo);
    this.name = 'NapakaApi';
    this.status = status;
    this.napake = napake;
  }
}

async function preberiJson(odgovor) {
  const besedilo = await odgovor.text();
  if (!besedilo) return null;
  try {
    return JSON.parse(besedilo);
  } catch {
    return null;
  }
}

// klic('/api/rezervacije', { metoda: 'POST', telo: { ... } }) → podatki iz odgovora.
// credentials: 'include' pošlje piškotek z JWT (ADR-0008). Ob napaki vrže NapakaApi s
// sporočilom backenda ({ sporocilo }) ali s splošnim sporočilom.
export async function klic(pot, { metoda = 'GET', telo, signal } = {}) {
  const zahteva = { method: metoda, credentials: 'include', signal, headers: {} };
  if (telo !== undefined) {
    zahteva.headers['Content-Type'] = 'application/json';
    zahteva.body = JSON.stringify(telo);
  }

  let odgovor;
  try {
    odgovor = await fetch(pot, zahteva);
  } catch (napaka) {
    // Preklic (AbortController) ni napaka za uporabnika – klicatelj ga obravnava sam.
    if (napaka.name === 'AbortError') throw napaka;
    throw new NapakaApi(SPLOSNA_NAPAKA);
  }

  const podatki = await preberiJson(odgovor);
  // Seja je potekla med delom: kontekst uporabnika se izprazni in zaščitena pot pošlje na
  // prijavo. Prijava in /jaz 401 obravnavata sama.
  if (odgovor.status === 401 && !pot.startsWith('/api/auth/')) {
    window.dispatchEvent(new Event(DOGODEK_SEJA_POTEKLA));
  }
  if (!odgovor.ok) {
    throw new NapakaApi(podatki?.sporocilo || SPLOSNA_NAPAKA, odgovor.status, podatki?.napake);
  }
  return podatki;
}

// Napake po poljih iz odgovora 400 ([{ polje, sporocilo }]) → { polje: sporocilo }.
export const napakePoPoljih = (napaka) =>
  Object.fromEntries((napaka?.napake ?? []).map(({ polje, sporocilo }) => [polje, sporocilo]));
