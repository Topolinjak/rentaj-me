// Izdano (US-07): izdane rezervacije z uporabnikom in rokom vračila; zamujene so označene.
// Prevzemi vračilo vodi na stran vračila (US-08).
import { seznamRezervacij } from '../api/rezervacije.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import { ZnackaRezervacije } from '../components/StatusnaZnacka.jsx';
import Tabela from '../components/Tabela.jsx';
import Vsebina from '../components/Vsebina.jsx';
import {
  stolpecOpreme,
  stolpecUporabnika,
  stolpecVracila,
} from '../components/stolpciRezervacij.jsx';
import { usePodatki } from '../hooks/usePodatki.js';
import { datumZLetom } from '../utils/datumi.js';

const nalozIzdane = ({ signal }) => seznamRezervacij({ status: 'IZDANA' }, { signal });

const STOLPCI = [
  stolpecUporabnika,
  stolpecOpreme,
  {
    kljuc: 'izdano',
    oznaka: 'Izdano',
    vrednost: (r) => (r.izdanoOb ? datumZLetom(r.izdanoOb.slice(0, 10)) : '–'),
    razvrsti: (r) => r.izdanoOb,
    stevilka: true,
  },
  {
    kljuc: 'rok',
    oznaka: 'Rok vračila',
    vrednost: (r) => datumZLetom(r.do),
    razvrsti: (r) => r.do,
    stevilka: true,
  },
  {
    kljuc: 'status',
    oznaka: 'Status',
    vrednost: (r) => (
      <ZnackaRezervacije status={r.status} zamujena={r.zamujena} dniZamude={r.dniZamude} />
    ),
    razvrsti: (r) => -r.dniZamude,
  },
  stolpecVracila,
];

export default function TehnikIzdane() {
  const { podatki, nalaganje, napaka, osvezi } = usePodatki(nalozIzdane);

  return (
    <Vsebina>
      <GlavaStrani naslov="Izdano" opis="Oprema, ki je pri uporabnikih, z rokom vračila." />
      <div className="mt-6">
        {nalaganje ? (
          <SkeletTabele stolpci={6} />
        ) : napaka ? (
          <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
        ) : podatki.length === 0 ? (
          <PraznoStanje naslov="Ni izdane opreme" besedilo="Vsa oprema je vrnjena." />
        ) : (
          <Tabela
            naslov="Izdana oprema"
            stolpci={STOLPCI}
            vrstice={podatki}
            zacetnoRazvrscanje={{ kljuc: 'rok', smer: 'narascajoce' }}
          />
        )}
      </div>
    </Vsebina>
  );
}
