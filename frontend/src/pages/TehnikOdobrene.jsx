// Odobrene rezervacije, ki čakajo na izdajo (US-07): Izdaj le pri ODOBRENA; za vsak kos
// izbira stanja, privzeto trenutno stanje kosa.
import { useState } from 'react';
import { izdajRezervacijo, seznamRezervacij } from '../api/rezervacije.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import Gumb from '../components/Gumb.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import NapakaObrazca from '../components/NapakaObrazca.jsx';
import PodatkiRezervacije from '../components/PodatkiRezervacije.jsx';
import PogovornoOkno from '../components/PogovornoOkno.jsx';
import Polje from '../components/Polje.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { usePodatki } from '../hooks/usePodatki.js';
import { useObvestila } from '../obvestila/useObvestila.js';
import { danes, datumZLetom, obdobje } from '../utils/datumi.js';
import { OZNAKE_STANJ } from '../utils/oznake.js';

const nalozOdobrene = ({ signal }) => seznamRezervacij({ status: 'ODOBRENA' }, { signal });
const imeUporabnika = (r) => `${r.uporabnik.ime} ${r.uporabnik.priimek}`;

function OknoIzdaje({ rezervacija, onZapri, onIzdana }) {
  const [stanja, setStanja] = useState({});
  const [napaka, setNapaka] = useState(null);
  const [posiljanje, setPosiljanje] = useState(false);
  const [zadnjaId, setZadnjaId] = useState(null);

  // Ob odprtju: privzeto trenutno stanje vsakega kosa (US-07).
  if (rezervacija && rezervacija.id !== zadnjaId) {
    setZadnjaId(rezervacija.id);
    setStanja(Object.fromEntries(rezervacija.kosi.map((k) => [k.id, k.trenutnoStanje ?? ''])));
    setNapaka(null);
  }

  const vsaIzbrana = rezervacija?.kosi.every((k) => stanja[k.id]);

  function zapri() {
    setZadnjaId(null);
    onZapri();
  }

  async function potrdi(dogodek) {
    dogodek.preventDefault();
    setPosiljanje(true);
    setNapaka(null);
    try {
      await izdajRezervacijo(
        rezervacija.id,
        rezervacija.kosi.map((k) => ({ id: k.id, stanje: stanja[k.id] })),
      );
      onIzdana(rezervacija);
      zapri();
    } catch (e) {
      setNapaka(e.message);
    } finally {
      setPosiljanje(false);
    }
  }

  return (
    <PogovornoOkno
      odprto={Boolean(rezervacija)}
      onZapri={zapri}
      naslov="Izdaja opreme"
      dejanja={
        <>
          <Gumb razlicica="sekundarni" onClick={zapri} disabled={posiljanje}>
            Nazaj
          </Gumb>
          <Gumb type="submit" form="izdaja" disabled={!vsaIzbrana} nalaganje={posiljanje}>
            Potrdi izdajo
          </Gumb>
        </>
      }
    >
      {rezervacija && (
        <form id="izdaja" onSubmit={potrdi} noValidate className="space-y-4">
          <p className="text-sm text-gray-700">
            {imeUporabnika(rezervacija)}, {obdobje(rezervacija.od, rezervacija.do)}. Rok vračila:{' '}
            {datumZLetom(rezervacija.do)}.
          </p>
          <p className="text-sm text-gray-600">Za vsak kos izberite stanje ob izdaji.</p>
          {rezervacija.kosi.map((k) => (
            <Polje
              key={k.id}
              oznaka={`${k.naziv} (${k.inventarnaStevilka})`}
              kot="select"
              obvezno
              value={stanja[k.id] ?? ''}
              onChange={(e) => setStanja((s) => ({ ...s, [k.id]: e.target.value }))}
            >
              <option value="">Izberite stanje</option>
              {Object.entries(OZNAKE_STANJ).map(([vrednost, oznaka]) => (
                <option key={vrednost} value={vrednost}>
                  {oznaka}
                </option>
              ))}
            </Polje>
          ))}
          <NapakaObrazca napaka={napaka} />
        </form>
      )}
    </PogovornoOkno>
  );
}

export default function TehnikOdobrene() {
  const obvesti = useObvestila();
  const { podatki, nalaganje, napaka, osvezi, setPodatki } = usePodatki(nalozOdobrene);
  const [zaIzdajo, setZaIzdajo] = useState(null);
  const dan = danes();

  // Najprej tiste, ki se začnejo najprej.
  const urejene = podatki?.toSorted((a, b) => a.od.localeCompare(b.od) || a.id - b.id) ?? [];

  return (
    <Vsebina>
      <GlavaStrani naslov="Odobrene" opis="Odobrene rezervacije čakajo na prevzem opreme." />
      <div className="mt-6">
        {nalaganje ? (
          <SkeletTabele vrstice={3} stolpci={3} />
        ) : napaka ? (
          <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
        ) : urejene.length === 0 ? (
          <PraznoStanje
            naslov="Ni odobrenih rezervacij"
            besedilo="Nobena oprema ne čaka na izdajo."
          />
        ) : (
          <ul className="space-y-4">
            {urejene.map((r) => (
              <li key={r.id}>
                <article
                  aria-label={`Rezervacija ${imeUporabnika(r)}, ${obdobje(r.od, r.do)}`}
                  className="rounded-osnovni border border-gray-300 bg-white p-4"
                >
                  <p className="mb-3 text-sm text-gray-600">
                    {r.od <= dan ? 'Prevzem že mogoč.' : `Prevzem od ${datumZLetom(r.od)}.`}
                  </p>
                  <PodatkiRezervacije r={r} />
                  <div className="mt-4 flex justify-end">
                    <Gumb
                      ikona="puscicaVen"
                      onClick={() => setZaIzdajo(r)}
                      className="w-full sm:w-auto"
                    >
                      Izdaj
                    </Gumb>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
      <OknoIzdaje
        rezervacija={zaIzdajo}
        onZapri={() => setZaIzdajo(null)}
        onIzdana={(r) => {
          setPodatki((seznam) => seznam.filter((x) => x.id !== r.id));
          obvesti(`Oprema je izdana uporabniku ${imeUporabnika(r)}`);
        }}
      />
    </Vsebina>
  );
}
