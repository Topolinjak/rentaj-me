// Uporabniki (US-18, administrator): tabela z iskanjem, nov uporabnik, (de)aktivacija.
import { useState } from 'react';
import { seznamUporabnikov, spremeniUporabnika, ustvariUporabnika } from '../api/uporabniki.js';
import { useUporabnik } from '../auth/useUporabnik.js';
import { OZNAKE_VLOG } from '../auth/vloge.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import Gumb from '../components/Gumb.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import NapakaObrazca from '../components/NapakaObrazca.jsx';
import PogovornoOkno, { PotrditvenoOkno } from '../components/PogovornoOkno.jsx';
import Polje from '../components/Polje.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import { Znacka } from '../components/StatusnaZnacka.jsx';
import Tabela from '../components/Tabela.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { useObrazec } from '../hooks/useObrazec.js';
import { usePodatki } from '../hooks/usePodatki.js';
import { useObvestila } from '../obvestila/useObvestila.js';

const PRAZEN_OBRAZEC = { ime: '', priimek: '', email: '', vloga: 'STUDENT', geslo: '' };

const polnoIme = (u) => `${u.ime} ${u.priimek}`;

// Iskanje po imenu, priimku in e-pošti, brez razlike med velikimi in malimi črkami.
function ustreza(uporabnik, iskanje) {
  const niz = iskanje.trim().toLocaleLowerCase('sl');
  if (!niz) return true;
  return [uporabnik.ime, uporabnik.priimek, uporabnik.email, polnoIme(uporabnik)].some((v) =>
    v.toLocaleLowerCase('sl').includes(niz),
  );
}

function NovUporabnik({ odprto, onZapri, onUstvarjen }) {
  const obrazec = useObrazec(PRAZEN_OBRAZEC, ustvariUporabnika, { polje409: 'email' });
  const { polje, posiljanje, napaka } = obrazec;

  function zapri() {
    obrazec.ponastavi();
    onZapri();
  }

  async function oddaj(dogodek) {
    const nov = await obrazec.oddaj(dogodek);
    if (nov) {
      onUstvarjen(nov);
      zapri();
    }
  }

  return (
    <PogovornoOkno
      odprto={odprto}
      onZapri={zapri}
      naslov="Nov uporabnik"
      dejanja={
        <>
          <Gumb razlicica="sekundarni" onClick={zapri} disabled={posiljanje}>
            Prekliči
          </Gumb>
          <Gumb type="submit" form="nov-uporabnik" nalaganje={posiljanje}>
            Ustvari uporabnika
          </Gumb>
        </>
      }
    >
      <form id="nov-uporabnik" onSubmit={oddaj} noValidate className="grid gap-4 sm:grid-cols-2">
        <Polje oznaka="Ime" obvezno autoComplete="off" {...polje('ime')} />
        <Polje oznaka="Priimek" obvezno autoComplete="off" {...polje('priimek')} />
        <Polje
          oznaka="E-poštni naslov"
          type="email"
          obvezno
          autoComplete="off"
          className="sm:col-span-2"
          {...polje('email')}
        />
        <Polje oznaka="Vloga" kot="select" obvezno {...polje('vloga')}>
          {Object.entries(OZNAKE_VLOG).map(([vrednost, oznaka]) => (
            <option key={vrednost} value={vrednost}>
              {oznaka}
            </option>
          ))}
        </Polje>
        <Polje
          oznaka="Začetno geslo"
          type="password"
          obvezno
          autoComplete="new-password"
          pomoc="Vsaj 8 znakov."
          {...polje('geslo')}
        />
        <NapakaObrazca napaka={napaka} className="sm:col-span-2" />
      </form>
    </PogovornoOkno>
  );
}

export default function AdminUporabniki() {
  const { uporabnik: jaz } = useUporabnik();
  const obvesti = useObvestila();
  const { podatki, nalaganje, napaka, osvezi, setPodatki } = usePodatki(seznamUporabnikov);
  const [iskanje, setIskanje] = useState('');
  const [novOdprt, setNovOdprt] = useState(false);
  const [zaDeaktivacijo, setZaDeaktivacijo] = useState(null);
  const [spreminjanje, setSpreminjanje] = useState(null);
  const [napakaSpremembe, setNapakaSpremembe] = useState(null);

  const zamenjaj = (posodobljen) =>
    setPodatki((seznam) => seznam.map((u) => (u.id === posodobljen.id ? posodobljen : u)));

  async function nastaviAktiven(uporabnik, aktiven) {
    setSpreminjanje(uporabnik.id);
    setNapakaSpremembe(null);
    try {
      zamenjaj(await spremeniUporabnika(uporabnik.id, { aktiven }));
      setZaDeaktivacijo(null);
      obvesti(
        aktiven
          ? `Račun uporabnika ${polnoIme(uporabnik)} je spet aktiven`
          : `Račun uporabnika ${polnoIme(uporabnik)} je deaktiviran`,
      );
    } catch (e) {
      if (aktiven) obvesti(e.message, { vrsta: 'napaka' });
      else setNapakaSpremembe(e.message);
    } finally {
      setSpreminjanje(null);
    }
  }

  const stolpci = [
    {
      kljuc: 'ime',
      oznaka: 'Ime in priimek',
      vrednost: (u) => (
        <span className="font-medium text-gray-900">
          {polnoIme(u)}
          {u.id === jaz.id && <span className="ml-2 text-sm font-normal text-gray-600">(vi)</span>}
        </span>
      ),
      razvrsti: (u) => `${u.priimek} ${u.ime}`,
    },
    { kljuc: 'email', oznaka: 'E-pošta', vrednost: (u) => u.email, razvrsti: (u) => u.email },
    {
      kljuc: 'vloga',
      oznaka: 'Vloga',
      vrednost: (u) => OZNAKE_VLOG[u.vloga],
      razvrsti: (u) => OZNAKE_VLOG[u.vloga],
    },
    {
      kljuc: 'status',
      oznaka: 'Status',
      vrednost: (u) =>
        u.aktiven ? (
          <Znacka ton="uspeh" ikona="kljukica">
            Aktiven
          </Znacka>
        ) : (
          <Znacka ton="siva" ikona="precrtano">
            Deaktiviran
          </Znacka>
        ),
      razvrsti: (u) => (u.aktiven ? 0 : 1),
    },
    {
      kljuc: 'dejanja',
      oznaka: 'Dejanja',
      vrednost: (u) =>
        // Svojega računa administrator ne more deaktivirati (API vrne 400).
        u.id === jaz.id ? null : u.aktiven ? (
          <Gumb
            razlicica="sekundarni"
            velikost="majhna"
            onClick={() => {
              setNapakaSpremembe(null);
              setZaDeaktivacijo(u);
            }}
          >
            Deaktiviraj
          </Gumb>
        ) : (
          <Gumb
            razlicica="sekundarni"
            velikost="majhna"
            nalaganje={spreminjanje === u.id}
            onClick={() => nastaviAktiven(u, true)}
          >
            Aktiviraj
          </Gumb>
        ),
    },
  ];

  const prikazani = podatki?.filter((u) => ustreza(u, iskanje)) ?? [];

  return (
    <Vsebina>
      <GlavaStrani naslov="Uporabniki" opis="Računi članov oddelka. Javne registracije ni.">
        <Gumb ikona="plus" onClick={() => setNovOdprt(true)}>
          Nov uporabnik
        </Gumb>
      </GlavaStrani>

      <div className="mt-6 max-w-md">
        <Polje
          oznaka="Iskanje"
          type="search"
          value={iskanje}
          onChange={(e) => setIskanje(e.target.value)}
          pomoc="Po imenu, priimku ali e-poštnem naslovu."
        />
      </div>

      <div className="mt-6">
        {nalaganje ? (
          <SkeletTabele stolpci={5} />
        ) : napaka ? (
          <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
        ) : prikazani.length === 0 ? (
          <PraznoStanje
            naslov="Ni uporabnikov, ki ustrezajo iskanju"
            dejanje={
              <Gumb razlicica="sekundarni" onClick={() => setIskanje('')}>
                Počisti iskanje
              </Gumb>
            }
          />
        ) : (
          <Tabela
            naslov="Uporabniki"
            stolpci={stolpci}
            vrstice={prikazani}
            zacetnoRazvrscanje={{ kljuc: 'ime', smer: 'narascajoce' }}
          />
        )}
      </div>

      <NovUporabnik
        odprto={novOdprt}
        onZapri={() => setNovOdprt(false)}
        onUstvarjen={(nov) => {
          setPodatki((seznam) => [...seznam, nov]);
          obvesti(`Uporabnik ${polnoIme(nov)} je ustvarjen`);
        }}
      />

      <PotrditvenoOkno
        odprto={Boolean(zaDeaktivacijo)}
        onZapri={() => setZaDeaktivacijo(null)}
        onPotrdi={() => nastaviAktiven(zaDeaktivacijo, false)}
        naslov="Ali res želite deaktivirati račun?"
        potrdi="Deaktiviraj račun"
        nevarno
        nalaganje={spreminjanje === zaDeaktivacijo?.id}
        napaka={napakaSpremembe}
      >
        {zaDeaktivacijo && (
          <p>
            Prijava z računom {polnoIme(zaDeaktivacijo)} ({zaDeaktivacijo.email}) ne bo več mogoča.
            Rezervacije in zgodovina ostanejo shranjene, račun lahko kadar koli spet aktivirate.
          </p>
        )}
      </PotrditvenoOkno>
    </Vsebina>
  );
}
