// Nadzorna plošča tehnika (US-05, US-06, US-11, dokument 07, 5.5): števci, seznam oddanih
// rezervacij od najstarejše, Odobri v enem kliku, Zavrni z obveznim razlogom. Opozorila o
// zamudah in poškodbah uporabnika so vidna, a ne blokirajo odobritve; klik nanje pokaže
// seznam.
import { useCallback, useState } from 'react';
import {
  odobriRezervacijo,
  opozorilaRezervacije,
  seznamRezervacij,
  stevciRezervacij,
  zavrniRezervacijo,
} from '../api/rezervacije.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import Gumb from '../components/Gumb.jsx';
import Ikona from '../components/Ikona.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import NapakaObrazca from '../components/NapakaObrazca.jsx';
import PodatkiRezervacije from '../components/PodatkiRezervacije.jsx';
import PogovornoOkno from '../components/PogovornoOkno.jsx';
import Polje from '../components/Polje.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import StevciTehnika from '../components/StevciTehnika.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { usePodatki } from '../hooks/usePodatki.js';
import { useObvestila } from '../obvestila/useObvestila.js';
import { datumInUra, datumZLetom, obdobje } from '../utils/datumi.js';
import { OZNAKE_RAZLOGOV, poStevilu, steviloDniBesedilo } from '../utils/oznake.js';

const nalozOddane = ({ signal }) => seznamRezervacij({ status: 'ODDANA' }, { signal });

const besediloZamud = (n) =>
  `Uporabnik ima ${poStevilu(n, ['zamujeno izposojo', 'zamujeni izposoji', 'zamujene izposoje', 'zamujenih izposoj'])}`;
const besediloPoskodb = (n) =>
  `Uporabnik ima ${poStevilu(n, ['neporavnano poškodbo', 'neporavnani poškodbi', 'neporavnane poškodbe', 'neporavnanih poškodb'])}`;

// Razlog, ki ga okno za zavrnitev predlaga ob opozorilu (US-11); tehnik ga lahko spremeni.
const predlaganRazlog = (r) =>
  r.steviloZamud > 0
    ? 'ZAMUJENA_IZPOSOJA'
    : r.steviloNeporavnanihPoskodb > 0
      ? 'NEPORAVNANA_POSKODBA'
      : '';

const imeUporabnika = (r) => `${r.uporabnik.ime} ${r.uporabnik.priimek}`;

// Seznam zamud in poškodb uporabnika (klik na opozorilo).
function OknoOpozoril({ rezervacija, onZapri }) {
  const id = rezervacija?.id;
  const nalozi = useCallback(
    ({ signal }) => (id ? opozorilaRezervacije(id, { signal }) : Promise.resolve(null)),
    [id],
  );
  const { podatki, nalaganje, napaka, osvezi } = usePodatki(nalozi);

  return (
    <PogovornoOkno
      odprto={Boolean(rezervacija)}
      onZapri={onZapri}
      naslov={rezervacija ? `Opozorila: ${imeUporabnika(rezervacija)}` : 'Opozorila'}
      dejanja={<Gumb onClick={onZapri}>Zapri</Gumb>}
    >
      {nalaganje ? (
        <p role="status">Nalaganje …</p>
      ) : napaka ? (
        <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
      ) : (
        podatki && (
          <div className="space-y-6">
            <section>
              <h3 className="font-bold text-gray-900">Zamujene izposoje</h3>
              {podatki.zamujene.length === 0 ? (
                <p className="mt-1 text-sm text-gray-600">Ni zamujenih izposoj.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {podatki.zamujene.map((z) => (
                    <li key={z.id} className="rounded-osnovni border border-gray-300 px-3 py-2">
                      <p className="tabular-nums">
                        {obdobje(z.od, z.do)}{' '}
                        <span className="font-medium text-napaka">
                          · zamuda {steviloDniBesedilo(z.dniZamude)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        {z.kosi.map((k) => `${k.naziv} (${k.inventarnaStevilka})`).join(', ')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="font-bold text-gray-900">Neporavnane poškodbe</h3>
              {podatki.poskodbe.length === 0 ? (
                <p className="mt-1 text-sm text-gray-600">Ni neporavnanih poškodb.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {podatki.poskodbe.map((p) => (
                    <li key={p.id} className="rounded-osnovni border border-gray-300 px-3 py-2">
                      <p>{p.opis}</p>
                      <p className="text-sm text-gray-600">
                        {p.kos.naziv} ({p.kos.inventarnaStevilka}) · zapisano{' '}
                        {datumZLetom(p.ustvarjeno.slice(0, 10))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )
      )}
    </PogovornoOkno>
  );
}

// Zavrnitev (US-06): obvezen razlog s seznama, neobvezen komentar; ob opozorilu je razlog že
// izbran.
function OknoZavrnitve({ rezervacija, onZapri, onZavrnjena }) {
  const [razlog, setRazlog] = useState('');
  const [komentar, setKomentar] = useState('');
  const [napaka, setNapaka] = useState(null);
  const [posiljanje, setPosiljanje] = useState(false);
  const [zadnjaId, setZadnjaId] = useState(null);

  if (rezervacija && rezervacija.id !== zadnjaId) {
    setZadnjaId(rezervacija.id);
    setRazlog(predlaganRazlog(rezervacija));
    setKomentar('');
    setNapaka(null);
  }

  function zapri() {
    setZadnjaId(null);
    onZapri();
  }

  async function potrdi(dogodek) {
    dogodek.preventDefault();
    setPosiljanje(true);
    setNapaka(null);
    try {
      await zavrniRezervacijo(rezervacija.id, {
        razlogZavrnitve: razlog,
        komentarTehnika: komentar.trim() || null,
      });
      onZavrnjena(rezervacija);
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
      naslov="Zavrnitev rezervacije"
      dejanja={
        <>
          <Gumb razlicica="sekundarni" onClick={zapri} disabled={posiljanje}>
            Nazaj
          </Gumb>
          <Gumb
            type="submit"
            form="zavrnitev"
            razlicica="nevarni"
            disabled={!razlog}
            nalaganje={posiljanje}
          >
            Potrdi zavrnitev
          </Gumb>
        </>
      }
    >
      {rezervacija && (
        <form id="zavrnitev" onSubmit={potrdi} noValidate className="space-y-4">
          <p className="text-sm text-gray-700">
            {imeUporabnika(rezervacija)}, {obdobje(rezervacija.od, rezervacija.do)}. Uporabnik bo
            razlog in komentar videl pri svoji rezervaciji.
          </p>
          <Polje
            oznaka="Razlog zavrnitve"
            kot="select"
            obvezno
            value={razlog}
            onChange={(e) => setRazlog(e.target.value)}
            pomoc={
              predlaganRazlog(rezervacija)
                ? 'Predlagan je razlog iz opozorila; lahko ga spremenite.'
                : undefined
            }
          >
            <option value="">Izberite razlog</option>
            {Object.entries(OZNAKE_RAZLOGOV).map(([vrednost, oznaka]) => (
              <option key={vrednost} value={vrednost}>
                {oznaka}
              </option>
            ))}
          </Polje>
          <Polje
            oznaka="Komentar"
            kot="textarea"
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            pomoc="Neobvezno. Npr. kdaj bo oprema spet na voljo."
          />
          <NapakaObrazca napaka={napaka} />
        </form>
      )}
    </PogovornoOkno>
  );
}

function Opozorila({ r, onOdpri }) {
  const opozorila = [
    r.steviloZamud > 0 && besediloZamud(r.steviloZamud),
    r.steviloNeporavnanihPoskodb > 0 && besediloPoskodb(r.steviloNeporavnanihPoskodb),
  ].filter(Boolean);
  if (opozorila.length === 0) return null;
  return (
    <ul className="mt-3 space-y-2">
      {opozorila.map((besedilo) => (
        <li key={besedilo}>
          <button
            type="button"
            onClick={onOdpri}
            className="flex min-h-11 w-full items-center gap-2 rounded-osnovni bg-opozorilo-ozadje px-3 py-2 text-left text-sm font-medium text-opozorilo hover:underline"
          >
            <Ikona ime="opozorilo" />
            {besedilo}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function TehnikOddane() {
  const obvesti = useObvestila();
  const oddane = usePodatki(nalozOddane);
  const stevci = usePodatki(stevciRezervacij);
  const [vObdelavi, setVObdelavi] = useState(null);
  const [zaZavrnitev, setZaZavrnitev] = useState(null);
  const [zaOpozorila, setZaOpozorila] = useState(null);

  // Obdelana rezervacija izgine s seznama, števci se osvežijo.
  function odstrani(id) {
    oddane.setPodatki((seznam) => seznam.filter((r) => r.id !== id));
    stevci.osvezi();
  }

  async function odobri(r) {
    setVObdelavi(r.id);
    try {
      await odobriRezervacijo(r.id);
      odstrani(r.id);
      obvesti(`Rezervacija uporabnika ${imeUporabnika(r)} je odobrena`);
    } catch (e) {
      obvesti(e.message, { vrsta: 'napaka' });
      // 409: rezervacijo je medtem obdelal drug tehnik – seznam ni več aktualen.
      if (e.status === 409) {
        oddane.osvezi();
        stevci.osvezi();
      }
    } finally {
      setVObdelavi(null);
    }
  }

  return (
    <Vsebina>
      <GlavaStrani naslov="Nadzorna plošča" opis="Oddane rezervacije čakajo na vašo odločitev." />

      <div className="mt-6">
        {stevci.napaka ? (
          <NapakaNalaganja napaka={stevci.napaka} onPonovi={stevci.osvezi} />
        ) : (
          <StevciTehnika stevci={stevci.podatki} />
        )}
      </div>

      <section aria-labelledby="oddane" className="mt-10">
        <h2 id="oddane" className="text-razdelek font-bold text-brand-600">
          Oddane rezervacije
        </h2>
        <p className="mt-1 text-sm text-gray-600">Najstarejše zgoraj.</p>
        <div className="mt-4">
          {oddane.nalaganje ? (
            <SkeletTabele vrstice={3} stolpci={3} />
          ) : oddane.napaka ? (
            <NapakaNalaganja napaka={oddane.napaka} onPonovi={oddane.osvezi} />
          ) : oddane.podatki.length === 0 ? (
            <PraznoStanje
              ikona="kljukica"
              naslov="Ni oddanih rezervacij"
              besedilo="Vse rezervacije so obdelane."
            />
          ) : (
            <ul className="space-y-4">
              {oddane.podatki.map((r) => (
                <li key={r.id}>
                  <article
                    aria-label={`Rezervacija ${imeUporabnika(r)}, ${obdobje(r.od, r.do)}`}
                    className="rounded-osnovni border border-gray-300 bg-white p-4"
                  >
                    <p className="mb-3 text-sm text-gray-600">Oddano {datumInUra(r.ustvarjeno)}</p>
                    <PodatkiRezervacije r={r} />
                    <Opozorila r={r} onOdpri={() => setZaOpozorila(r)} />
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <Gumb
                        razlicica="nevarni"
                        ikona="kriz"
                        disabled={vObdelavi === r.id}
                        onClick={() => setZaZavrnitev(r)}
                      >
                        Zavrni
                      </Gumb>
                      <Gumb
                        ikona="kljukica"
                        nalaganje={vObdelavi === r.id}
                        onClick={() => odobri(r)}
                      >
                        Odobri
                      </Gumb>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <OknoZavrnitve
        rezervacija={zaZavrnitev}
        onZapri={() => setZaZavrnitev(null)}
        onZavrnjena={(r) => {
          odstrani(r.id);
          obvesti(`Rezervacija uporabnika ${imeUporabnika(r)} je zavrnjena`);
        }}
      />
      <OknoOpozoril rezervacija={zaOpozorila} onZapri={() => setZaOpozorila(null)} />
    </Vsebina>
  );
}
