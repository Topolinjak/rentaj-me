// Vračilo (US-08, dokument 07, 5.6): tabela kosov s stanjem ob izdaji (samo branje) in izbiro
// stanja ob vračilu; pri »Poškodovano« obvezen opis poškodbe v isti vrstici. Potrditveno okno
// pove, koliko kosov je poškodovanih. Velja tudi za zamujene izposoje.
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { rezervacija as naloziRezervacijo, vrniRezervacijo } from '../api/rezervacije.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import Gumb from '../components/Gumb.jsx';
import Ikona from '../components/Ikona.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import NapakaObrazca from '../components/NapakaObrazca.jsx';
import PodatkiRezervacije from '../components/PodatkiRezervacije.jsx';
import { PotrditvenoOkno } from '../components/PogovornoOkno.jsx';
import Polje from '../components/Polje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import { ZnackaRezervacije, ZnackaStanja } from '../components/StatusnaZnacka.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { usePodatki } from '../hooks/usePodatki.js';
import { useObvestila } from '../obvestila/useObvestila.js';
import { datumZLetom } from '../utils/datumi.js';
import {
  OZNAKE_STANJ,
  OZNAKE_STATUSOV_REZERVACIJE,
  poStevilu,
  steviloKosovBesedilo,
} from '../utils/oznake.js';

function NazajNaIzdane() {
  return (
    <Link
      to="/tehnik/izdane"
      className="inline-flex min-h-11 items-center gap-1 text-brand-600 hover:underline"
    >
      <Ikona ime="levo" />
      Izdano
    </Link>
  );
}

// Napake API-ja po kosih: »kosi.1.opisPoskodbe« → { 1: { opisPoskodbe: '…' } } (indeks kosa).
function napakeKosov(napake = []) {
  const poKosih = {};
  for (const { polje, sporocilo } of napake) {
    const [, indeks, ime] = /^kosi\.(\d+)\.(\w+)$/.exec(polje) ?? [];
    if (indeks !== undefined) poKosih[indeks] = { ...poKosih[indeks], [ime]: sporocilo };
  }
  return poKosih;
}

function ObrazecVracila({ r }) {
  const navigiraj = useNavigate();
  const obvesti = useObvestila();
  const [vnosi, setVnosi] = useState(() =>
    Object.fromEntries(r.kosi.map((k) => [k.id, { stanje: '', opisPoskodbe: '' }])),
  );
  const [napake, setNapake] = useState({});
  const [napaka, setNapaka] = useState(null);
  const [potrjevanje, setPotrjevanje] = useState(false);
  const [posiljanje, setPosiljanje] = useState(false);

  const nastavi = (id, polje, vrednost) =>
    setVnosi((v) => ({ ...v, [id]: { ...v[id], [polje]: vrednost } }));

  const poskodovani = r.kosi.filter((k) => vnosi[k.id].stanje === 'POSKODOVANO');
  const vseIzbrano = r.kosi.every((k) => vnosi[k.id].stanje);
  const manjkaOpis = poskodovani.some((k) => !vnosi[k.id].opisPoskodbe.trim());

  async function potrdi() {
    setPosiljanje(true);
    setNapaka(null);
    setNapake({});
    try {
      await vrniRezervacijo(
        r.id,
        r.kosi.map((k) => ({
          id: k.id,
          stanje: vnosi[k.id].stanje,
          ...(vnosi[k.id].stanje === 'POSKODOVANO' && { opisPoskodbe: vnosi[k.id].opisPoskodbe }),
        })),
      );
      obvesti(
        poskodovani.length > 0
          ? `Vračilo je prevzeto. Zapisanih poškodb: ${poskodovani.length}.`
          : 'Vračilo je prevzeto',
      );
      navigiraj('/tehnik/izdane');
    } catch (e) {
      setPotrjevanje(false);
      if (e.napake?.length) setNapake(napakeKosov(e.napake));
      setNapaka(e.message);
      setPosiljanje(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setPotrjevanje(true);
      }}
      aria-labelledby="naslov-kosov"
    >
      <h2 id="naslov-kosov" className="text-razdelek font-bold text-brand-600">
        Stanje kosov
      </h2>

      {/* Glava stolpcev le na širših zaslonih; na telefonu so oznake pri poljih. */}
      <div className="mt-4 hidden grid-cols-[2fr_1fr_2fr] gap-4 border-b border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 sm:grid">
        <span>Kos</span>
        <span>Ob izdaji</span>
        <span>Ob vračilu</span>
      </div>
      <ul className="divide-y divide-gray-200 rounded-osnovni border border-gray-300 sm:rounded-t-none sm:border-t-0">
        {r.kosi.map((k, i) => {
          const vnos = vnosi[k.id];
          return (
            <li key={k.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[2fr_1fr_2fr] sm:gap-4">
              <div>
                <p className="font-medium text-gray-900">{k.naziv}</p>
                <p className="text-sm text-gray-600 tabular-nums">{k.inventarnaStevilka}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 sm:hidden">Ob izdaji: </span>
                {k.stanjeObIzdaji ? <ZnackaStanja stanje={k.stanjeObIzdaji} /> : '–'}
              </div>
              <div className="space-y-3">
                <Polje
                  oznaka={`Stanje ob vračilu: ${k.naziv} (${k.inventarnaStevilka})`}
                  kot="select"
                  obvezno
                  value={vnos.stanje}
                  onChange={(e) => nastavi(k.id, 'stanje', e.target.value)}
                  napaka={napake[i]?.stanje}
                >
                  <option value="">Izberite stanje</option>
                  {Object.entries(OZNAKE_STANJ).map(([vrednost, oznaka]) => (
                    <option key={vrednost} value={vrednost}>
                      {oznaka}
                    </option>
                  ))}
                </Polje>
                {vnos.stanje === 'POSKODOVANO' && (
                  <Polje
                    oznaka={`Opis poškodbe: ${k.naziv}`}
                    kot="textarea"
                    obvezno
                    value={vnos.opisPoskodbe}
                    onChange={(e) => nastavi(k.id, 'opisPoskodbe', e.target.value)}
                    napaka={napake[i]?.opisPoskodbe}
                    pomoc="Kaj je poškodovano. Zapis ostane odprt, dokler ga ne razrešite."
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-3">
        <NapakaObrazca napaka={napaka} />
        {!vseIzbrano && (
          <p className="text-sm text-gray-600">Za vsak kos izberite stanje ob vračilu.</p>
        )}
        {vseIzbrano && manjkaOpis && (
          <p className="text-sm text-gray-600">Pri poškodovanem kosu opišite poškodbo.</p>
        )}
        <div className="flex justify-end">
          <Gumb type="submit" disabled={!vseIzbrano || manjkaOpis} className="w-full sm:w-auto">
            Prevzemi vračilo
          </Gumb>
        </div>
      </div>

      <PotrditvenoOkno
        odprto={potrjevanje}
        onZapri={() => setPotrjevanje(false)}
        onPotrdi={potrdi}
        naslov="Prevzem vračila"
        potrdi="Potrdi vračilo"
        nalaganje={posiljanje}
      >
        <p>
          Vračate {steviloKosovBesedilo(r.kosi.length)}
          {poskodovani.length > 0
            ? `, od tega ${poStevilu(poskodovani.length, ['poškodovanega', 'poškodovana', 'poškodovane', 'poškodovanih'])}.`
            : ', noben ni poškodovan.'}
        </p>
        {poskodovani.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Za poškodovane kose se zapiše poškodba, ki jo tehnik vidi kot opozorilo pri naslednjih
            rezervacijah uporabnika.
          </p>
        )}
      </PotrditvenoOkno>
    </form>
  );
}

export default function TehnikVracilo() {
  const { id } = useParams();
  const nalozi = useCallback(({ signal }) => naloziRezervacijo(id, { signal }), [id]);
  const { podatki: r, nalaganje, napaka, statusNapake, osvezi } = usePodatki(nalozi);

  let vsebina;
  if (nalaganje) vsebina = <SkeletTabele vrstice={2} stolpci={3} />;
  else if (napaka) {
    vsebina = (
      <NapakaNalaganja napaka={napaka} onPonovi={statusNapake === 404 ? undefined : osvezi} />
    );
  } else if (r.status !== 'IZDANA') {
    vsebina = (
      <NapakaNalaganja
        napaka={`Rezervacija ima status »${OZNAKE_STATUSOV_REZERVACIJE[r.status]}«, zato vračila ni mogoče prevzeti.`}
      />
    );
  } else {
    vsebina = (
      <div className="space-y-8">
        <div className="rounded-osnovni border border-gray-300 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className={r.zamujena ? 'font-medium text-napaka' : 'text-gray-700'}>
              Rok vračila: {datumZLetom(r.do)}
            </p>
            <ZnackaRezervacije status={r.status} zamujena={r.zamujena} dniZamude={r.dniZamude} />
          </div>
          <PodatkiRezervacije r={r} email />
        </div>
        <ObrazecVracila r={r} />
      </div>
    );
  }

  return (
    <Vsebina>
      <NazajNaIzdane />
      <div className="mt-2">
        <GlavaStrani naslov="Vračilo" />
      </div>
      <div className="mt-6 max-w-4xl">{vsebina}</div>
    </Vsebina>
  );
}
