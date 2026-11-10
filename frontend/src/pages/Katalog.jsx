// Katalog (US-02): kosi opreme po kategorijah, kartice v mreži 1–2 stolpcev na telefonu in
// 3–4 na namizju. Iskanje in filtri so del US-14 (P-14) in niso v MVP.
import { katalog } from '../api/oprema.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import KarticaOpreme from '../components/KarticaOpreme.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletKartic } from '../components/Skelet.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { usePodatki } from '../hooks/usePodatki.js';

const MREZA = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

// Kosi, razvrščeni po kategorijah (kategorije po abecedi, kosi v vrstnem redu API-ja).
function poKategorijah(kosi) {
  const skupine = new Map();
  for (const kos of kosi) {
    const { id, naziv } = kos.kategorija;
    if (!skupine.has(id)) skupine.set(id, { id, naziv, kosi: [] });
    skupine.get(id).kosi.push(kos);
  }
  return [...skupine.values()].sort((a, b) => a.naziv.localeCompare(b.naziv, 'sl'));
}

export default function Katalog() {
  const { podatki, nalaganje, napaka, osvezi } = usePodatki(katalog);

  return (
    <Vsebina>
      <GlavaStrani
        naslov="Katalog"
        opis="Izberite opremo, preverite, kdaj je prosta, in oddajte rezervacijo."
      />

      <div className="mt-6">
        {nalaganje ? (
          <SkeletKartic stevilo={8} />
        ) : napaka ? (
          <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
        ) : podatki.length === 0 ? (
          <PraznoStanje
            naslov="V katalogu še ni opreme"
            besedilo="Ko tehnik doda opremo, bo prikazana tukaj."
          />
        ) : (
          <div className="space-y-10">
            {poKategorijah(podatki).map((skupina) => (
              <section key={skupina.id} aria-labelledby={`kategorija-${skupina.id}`}>
                <h2
                  id={`kategorija-${skupina.id}`}
                  className="flex items-center gap-4 text-razdelek font-bold text-brand-600 after:h-px after:flex-1 after:bg-gray-200"
                >
                  {skupina.naziv}
                </h2>
                <div className={`mt-4 ${MREZA}`}>
                  {skupina.kosi.map((kos) => (
                    <KarticaOpreme key={kos.id} kos={kos} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Vsebina>
  );
}
