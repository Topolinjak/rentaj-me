// Zamujene izposoje (US-09, dokument 07, 5.7): izdane rezervacije s pretečenim rokom (izračuna
// API, ADR-0007), od največje zamude naprej. Vrstica vodi na stran vračila; vrnjene se ne
// prikažejo, ker niso več IZDANA.
import { seznamRezervacij } from '../api/rezervacije.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import {
  stolpecOpreme,
  stolpecUporabnika,
  stolpecVracila,
} from '../components/stolpciRezervacij.jsx';
import Tabela from '../components/Tabela.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { usePodatki } from '../hooks/usePodatki.js';
import { datumZLetom } from '../utils/datumi.js';
import { steviloDniBesedilo } from '../utils/oznake.js';

const nalozZamujene = ({ signal }) => seznamRezervacij({ zamujene: true }, { signal });

const STOLPCI = [
  stolpecUporabnika,
  {
    kljuc: 'email',
    oznaka: 'E-pošta',
    vrednost: (r) => (
      <a href={`mailto:${r.uporabnik.email}`} className="text-brand-600 hover:underline">
        {r.uporabnik.email}
      </a>
    ),
  },
  stolpecOpreme,
  {
    kljuc: 'rok',
    oznaka: 'Rok vračila',
    vrednost: (r) => datumZLetom(r.do),
    razvrsti: (r) => r.do,
    stevilka: true,
  },
  {
    kljuc: 'zamuda',
    oznaka: 'Zamuda',
    vrednost: (r) => (
      <span className="font-medium text-napaka">{steviloDniBesedilo(r.dniZamude)}</span>
    ),
    razvrsti: (r) => r.dniZamude,
    stevilka: true,
  },
  stolpecVracila,
];

export default function TehnikZamujene() {
  const { podatki, nalaganje, napaka, osvezi } = usePodatki(nalozZamujene);

  return (
    <Vsebina>
      <GlavaStrani
        naslov="Zamujene izposoje"
        opis="Izdana oprema, katere rok vračila je potekel. Najdaljša zamuda zgoraj."
      />
      <div className="mt-6">
        {nalaganje ? (
          <SkeletTabele stolpci={6} />
        ) : napaka ? (
          <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
        ) : podatki.length === 0 ? (
          <PraznoStanje
            ikona="kljukica"
            naslov="Ni zamujenih izposoj"
            besedilo="Vsa izdana oprema je v roku."
          />
        ) : (
          <Tabela
            naslov="Zamujene izposoje"
            stolpci={STOLPCI}
            vrstice={podatki}
            zacetnoRazvrscanje={{ kljuc: 'zamuda', smer: 'padajoce' }}
          />
        )}
      </div>
    </Vsebina>
  );
}
