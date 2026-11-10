// Kategorije opreme (US-19, administrator): seznam, dodajanje in urejanje.
import { useState } from 'react';
import { seznamKategorij, spremeniKategorijo, ustvariKategorijo } from '../api/kategorije.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import Gumb from '../components/Gumb.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import NapakaObrazca from '../components/NapakaObrazca.jsx';
import PogovornoOkno from '../components/PogovornoOkno.jsx';
import Polje from '../components/Polje.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import Tabela from '../components/Tabela.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { useObrazec } from '../hooks/useObrazec.js';
import { usePodatki } from '../hooks/usePodatki.js';
import { useObvestila } from '../obvestila/useObvestila.js';

const PRAZNA = { naziv: '', opis: '' };

// Okno za novo kategorijo (kategorija = null) ali urejanje obstoječe.
function OknoKategorije({ odprto, kategorija, onZapri, onShranjena }) {
  const obrazec = useObrazec(
    PRAZNA,
    (podatki) => {
      // Prazen opis pošljemo kot null, da se obstoječi opis lahko izbriše.
      const telo = { naziv: podatki.naziv, opis: podatki.opis.trim() || null };
      return kategorija ? spremeniKategorijo(kategorija.id, telo) : ustvariKategorijo(telo);
    },
    { polje409: 'naziv' },
  );
  const [prejsnja, setPrejsnja] = useState(null);

  // Ob odprtju okna za drugo kategorijo napolnimo obrazec z njenimi podatki.
  if (odprto && prejsnja !== (kategorija ?? 'nova')) {
    setPrejsnja(kategorija ?? 'nova');
    obrazec.ponastavi(
      kategorija ? { naziv: kategorija.naziv, opis: kategorija.opis ?? '' } : PRAZNA,
    );
  }

  function zapri() {
    setPrejsnja(null);
    onZapri();
  }

  async function oddaj(dogodek) {
    const shranjena = await obrazec.oddaj(dogodek);
    if (shranjena) {
      onShranjena(shranjena, Boolean(kategorija));
      zapri();
    }
  }

  return (
    <PogovornoOkno
      odprto={odprto}
      onZapri={zapri}
      naslov={kategorija ? 'Uredi kategorijo' : 'Nova kategorija'}
      dejanja={
        <>
          <Gumb razlicica="sekundarni" onClick={zapri} disabled={obrazec.posiljanje}>
            Prekliči
          </Gumb>
          <Gumb type="submit" form="kategorija" nalaganje={obrazec.posiljanje}>
            {kategorija ? 'Shrani' : 'Dodaj kategorijo'}
          </Gumb>
        </>
      }
    >
      <form id="kategorija" onSubmit={oddaj} noValidate className="space-y-4">
        <Polje oznaka="Naziv" obvezno autoComplete="off" {...obrazec.polje('naziv')} />
        <Polje oznaka="Opis" kot="textarea" {...obrazec.polje('opis')} />
        <NapakaObrazca napaka={obrazec.napaka} />
      </form>
    </PogovornoOkno>
  );
}

export default function AdminKategorije() {
  const obvesti = useObvestila();
  const { podatki, nalaganje, napaka, osvezi, setPodatki } = usePodatki(seznamKategorij);
  // null: okno zaprto; 'nova' ali kategorija za urejanje.
  const [okno, setOkno] = useState(null);

  const stolpci = [
    {
      kljuc: 'naziv',
      oznaka: 'Naziv',
      vrednost: (k) => <span className="font-medium text-gray-900">{k.naziv}</span>,
      razvrsti: (k) => k.naziv,
    },
    {
      kljuc: 'opis',
      oznaka: 'Opis',
      vrednost: (k) => k.opis || <span className="text-gray-600">–</span>,
    },
    {
      kljuc: 'dejanja',
      oznaka: 'Dejanja',
      vrednost: (k) => (
        <Gumb
          razlicica="sekundarni"
          velikost="majhna"
          onClick={() => setOkno(k)}
          aria-label={`Uredi kategorijo ${k.naziv}`}
        >
          Uredi
        </Gumb>
      ),
    },
  ];

  return (
    <Vsebina>
      <GlavaStrani naslov="Kategorije" opis="Kategorije opreme v katalogu in inventarju.">
        <Gumb ikona="plus" onClick={() => setOkno('nova')}>
          Nova kategorija
        </Gumb>
      </GlavaStrani>

      <div className="mt-6">
        {nalaganje ? (
          <SkeletTabele stolpci={3} />
        ) : napaka ? (
          <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
        ) : podatki.length === 0 ? (
          <PraznoStanje
            naslov="Ni še nobene kategorije"
            besedilo="Kategorije potrebujete, preden dodate prvi kos opreme."
            dejanje={<Gumb onClick={() => setOkno('nova')}>Nova kategorija</Gumb>}
          />
        ) : (
          <Tabela
            naslov="Kategorije"
            stolpci={stolpci}
            vrstice={podatki}
            zacetnoRazvrscanje={{ kljuc: 'naziv', smer: 'narascajoce' }}
          />
        )}
      </div>

      <OknoKategorije
        odprto={okno !== null}
        kategorija={okno === 'nova' ? null : okno}
        onZapri={() => setOkno(null)}
        onShranjena={(kategorija, urejena) => {
          setPodatki((seznam) =>
            urejena
              ? seznam.map((k) => (k.id === kategorija.id ? kategorija : k))
              : [...seznam, kategorija],
          );
          obvesti(urejena ? 'Kategorija je shranjena' : `Kategorija ${kategorija.naziv} je dodana`);
        }}
      />
    </Vsebina>
  );
}
