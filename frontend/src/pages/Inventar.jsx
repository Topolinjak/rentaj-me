// Inventar (US-19, tehnik in administrator): seznam vseh kosov z iskanjem in filtrom statusa,
// nov kos in sprememba statusa (NA_VOLJO, V_OKVARI, UMAKNJEN).
import { useState } from 'react';
import { seznamKategorij } from '../api/kategorije.js';
import { inventar, spremeniKos, ustvariKos } from '../api/oprema.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import Gumb from '../components/Gumb.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import NapakaObrazca from '../components/NapakaObrazca.jsx';
import PogovornoOkno, { PotrditvenoOkno } from '../components/PogovornoOkno.jsx';
import Polje from '../components/Polje.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import { ZnackaOpreme, ZnackaStanja } from '../components/StatusnaZnacka.jsx';
import Tabela from '../components/Tabela.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { useObrazec } from '../hooks/useObrazec.js';
import { usePodatki } from '../hooks/usePodatki.js';
import { useObvestila } from '../obvestila/useObvestila.js';
import { OZNAKE_STANJ, OZNAKE_STATUSOV_OPREME } from '../utils/oznake.js';

const PRAZEN_KOS = {
  inventarnaStevilka: '',
  naziv: '',
  kategorijaId: '',
  trenutnoStanje: 'BREZHIBNO',
  opis: '',
};

const oznakaKosa = (kos) => `${kos.naziv} (${kos.inventarnaStevilka})`;

function ustreza(kos, iskanje) {
  const niz = iskanje.trim().toLocaleLowerCase('sl');
  if (!niz) return true;
  return [kos.naziv, kos.inventarnaStevilka, kos.kategorija.naziv].some((v) =>
    v.toLocaleLowerCase('sl').includes(niz),
  );
}

// Dejanja glede na trenutni status kosa.
const DEJANJA = {
  NA_VOLJO: [
    { status: 'V_OKVARI', oznaka: 'Označi okvaro' },
    { status: 'UMAKNJEN', oznaka: 'Umakni' },
  ],
  V_OKVARI: [
    { status: 'NA_VOLJO', oznaka: 'Popravljen' },
    { status: 'UMAKNJEN', oznaka: 'Umakni' },
  ],
  UMAKNJEN: [{ status: 'NA_VOLJO', oznaka: 'Vrni v uporabo' }],
};

// Besedilo o odprtih rezervacijah (ODDANA, ODOBRENA) po okvari ali umiku (US-19, kriterij 3).
function opozoriloOdprtih(n) {
  if (n === 1) return '1 odprta rezervacija vključuje ta kos. Preverite jo na nadzorni plošči.';
  if (n === 2) return '2 odprti rezervaciji vključujeta ta kos. Preverite ju na nadzorni plošči.';
  if (n === 3 || n === 4)
    return `${n} odprte rezervacije vključujejo ta kos. Preverite jih na nadzorni plošči.`;
  return `${n} odprtih rezervacij vključuje ta kos. Preverite jih na nadzorni plošči.`;
}

function NovKos({ odprto, onZapri, onUstvarjen }) {
  const kategorije = usePodatki(seznamKategorij);
  const obrazec = useObrazec(
    PRAZEN_KOS,
    (p) => ustvariKos({ ...p, kategorijaId: p.kategorijaId ? Number(p.kategorijaId) : undefined }),
    { polje409: 'inventarnaStevilka' },
  );

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
      naslov="Nov kos opreme"
      dejanja={
        <>
          <Gumb razlicica="sekundarni" onClick={zapri} disabled={obrazec.posiljanje}>
            Prekliči
          </Gumb>
          <Gumb type="submit" form="nov-kos" nalaganje={obrazec.posiljanje}>
            Dodaj kos
          </Gumb>
        </>
      }
    >
      <form id="nov-kos" onSubmit={oddaj} noValidate className="grid gap-4 sm:grid-cols-2">
        <Polje
          oznaka="Inventarna številka"
          obvezno
          autoComplete="off"
          {...obrazec.polje('inventarnaStevilka')}
        />
        <Polje oznaka="Naziv" obvezno autoComplete="off" {...obrazec.polje('naziv')} />
        <Polje
          oznaka="Kategorija"
          kot="select"
          obvezno
          pomoc={
            kategorije.napaka
              ? `Kategorij ni bilo mogoče naložiti: ${kategorije.napaka}`
              : undefined
          }
          {...obrazec.polje('kategorijaId')}
        >
          <option value="">{kategorije.nalaganje ? 'Nalaganje …' : 'Izberite kategorijo'}</option>
          {kategorije.podatki?.map((k) => (
            <option key={k.id} value={k.id}>
              {k.naziv}
            </option>
          ))}
        </Polje>
        <Polje oznaka="Začetno stanje" kot="select" obvezno {...obrazec.polje('trenutnoStanje')}>
          {Object.entries(OZNAKE_STANJ).map(([vrednost, oznaka]) => (
            <option key={vrednost} value={vrednost}>
              {oznaka}
            </option>
          ))}
        </Polje>
        <Polje oznaka="Opis" kot="textarea" className="sm:col-span-2" {...obrazec.polje('opis')} />
        <p className="text-sm text-gray-600 sm:col-span-2">
          Nov kos je takoj na voljo za izposojo.
        </p>
        <NapakaObrazca napaka={obrazec.napaka} className="sm:col-span-2" />
      </form>
    </PogovornoOkno>
  );
}

export default function Inventar() {
  const obvesti = useObvestila();
  const { podatki, nalaganje, napaka, osvezi, setPodatki } = usePodatki(inventar);
  const [iskanje, setIskanje] = useState('');
  const [status, setStatus] = useState('');
  const [novOdprt, setNovOdprt] = useState(false);
  const [zaUmik, setZaUmik] = useState(null);
  const [spreminjanje, setSpreminjanje] = useState(null);
  const [napakaUmika, setNapakaUmika] = useState(null);

  async function nastaviStatus(kos, novStatus) {
    setSpreminjanje(kos.id);
    setNapakaUmika(null);
    try {
      const { odprteRezervacije, ...posodobljen } = await spremeniKos(kos.id, {
        status: novStatus,
      });
      setPodatki((seznam) => seznam.map((k) => (k.id === kos.id ? posodobljen : k)));
      setZaUmik(null);
      const sporocilo = {
        V_OKVARI: `${oznakaKosa(kos)} je označen kot pokvarjen`,
        UMAKNJEN: `${oznakaKosa(kos)} je umaknjen iz kataloga`,
        NA_VOLJO: `${oznakaKosa(kos)} je spet na voljo`,
      }[novStatus];
      obvesti(sporocilo);
      if (novStatus !== 'NA_VOLJO' && odprteRezervacije > 0) {
        obvesti(opozoriloOdprtih(odprteRezervacije), { vrsta: 'info' });
      }
    } catch (e) {
      if (novStatus === 'UMAKNJEN') setNapakaUmika(e.message);
      else obvesti(e.message, { vrsta: 'napaka' });
    } finally {
      setSpreminjanje(null);
    }
  }

  const stolpci = [
    {
      kljuc: 'inv',
      oznaka: 'Inv. št.',
      vrednost: (k) => <span className="tabular-nums">{k.inventarnaStevilka}</span>,
      razvrsti: (k) => k.inventarnaStevilka,
    },
    {
      kljuc: 'naziv',
      oznaka: 'Naziv',
      vrednost: (k) => <span className="font-medium text-gray-900">{k.naziv}</span>,
      razvrsti: (k) => k.naziv,
    },
    {
      kljuc: 'kategorija',
      oznaka: 'Kategorija',
      vrednost: (k) => k.kategorija.naziv,
      razvrsti: (k) => k.kategorija.naziv,
    },
    {
      kljuc: 'stanje',
      oznaka: 'Stanje',
      vrednost: (k) => <ZnackaStanja stanje={k.trenutnoStanje} />,
      razvrsti: (k) => OZNAKE_STANJ[k.trenutnoStanje],
    },
    {
      kljuc: 'status',
      oznaka: 'Status',
      vrednost: (k) => <ZnackaOpreme status={k.status} />,
      razvrsti: (k) => OZNAKE_STATUSOV_OPREME[k.status],
    },
    {
      kljuc: 'dejanja',
      oznaka: 'Dejanja',
      vrednost: (k) => (
        <div className="flex flex-wrap gap-2">
          {DEJANJA[k.status].map((d) => (
            <Gumb
              key={d.status}
              razlicica="sekundarni"
              velikost="majhna"
              nalaganje={spreminjanje === k.id && d.status !== 'UMAKNJEN'}
              disabled={spreminjanje === k.id}
              aria-label={`${d.oznaka}: ${oznakaKosa(k)}`}
              onClick={() => {
                if (d.status === 'UMAKNJEN') {
                  setNapakaUmika(null);
                  setZaUmik(k);
                } else {
                  nastaviStatus(k, d.status);
                }
              }}
            >
              {d.oznaka}
            </Gumb>
          ))}
        </div>
      ),
    },
  ];

  const prikazani =
    podatki?.filter((k) => ustreza(k, iskanje) && (!status || k.status === status)) ?? [];

  return (
    <Vsebina>
      <GlavaStrani
        naslov="Upravljanje opreme"
        opis="Vsi kosi, tudi umaknjeni. Umaknjenih katalog ne prikazuje."
      >
        <Gumb ikona="plus" onClick={() => setNovOdprt(true)}>
          Nov kos
        </Gumb>
      </GlavaStrani>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] md:max-w-2xl">
        <Polje
          oznaka="Iskanje"
          type="search"
          value={iskanje}
          onChange={(e) => setIskanje(e.target.value)}
          pomoc="Po nazivu, inventarni številki ali kategoriji."
        />
        <Polje
          oznaka="Status"
          kot="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Vsi</option>
          {Object.entries(OZNAKE_STATUSOV_OPREME).map(([vrednost, oznaka]) => (
            <option key={vrednost} value={vrednost}>
              {oznaka}
            </option>
          ))}
        </Polje>
      </div>

      <div className="mt-6">
        {nalaganje ? (
          <SkeletTabele stolpci={6} />
        ) : napaka ? (
          <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
        ) : podatki.length === 0 ? (
          <PraznoStanje
            naslov="V inventarju še ni opreme"
            dejanje={<Gumb onClick={() => setNovOdprt(true)}>Nov kos</Gumb>}
          />
        ) : prikazani.length === 0 ? (
          <PraznoStanje
            naslov="Ni opreme, ki ustreza iskanju"
            dejanje={
              <Gumb
                razlicica="sekundarni"
                onClick={() => {
                  setIskanje('');
                  setStatus('');
                }}
              >
                Počisti filtre
              </Gumb>
            }
          />
        ) : (
          <Tabela
            naslov="Inventar"
            stolpci={stolpci}
            vrstice={prikazani}
            zacetnoRazvrscanje={{ kljuc: 'naziv', smer: 'narascajoce' }}
          />
        )}
      </div>

      <NovKos
        odprto={novOdprt}
        onZapri={() => setNovOdprt(false)}
        onUstvarjen={(kos) => {
          setPodatki((seznam) => [...seznam, kos]);
          obvesti(`${oznakaKosa(kos)} je dodan v katalog`);
        }}
      />

      <PotrditvenoOkno
        odprto={Boolean(zaUmik)}
        onZapri={() => setZaUmik(null)}
        onPotrdi={() => nastaviStatus(zaUmik, 'UMAKNJEN')}
        naslov="Ali res želite umakniti kos?"
        potrdi="Umakni kos"
        nevarno
        nalaganje={spreminjanje === zaUmik?.id}
        napaka={napakaUmika}
      >
        {zaUmik && (
          <p>
            {oznakaKosa(zaUmik)} ne bo več prikazan v katalogu in ga ne bo mogoče rezervirati. Zapis
            in zgodovina izposoj ostaneta shranjena, kos lahko kadar koli vrnete v uporabo.
          </p>
        )}
      </PotrditvenoOkno>
    </Vsebina>
  );
}
