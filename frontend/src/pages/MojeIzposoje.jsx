// Moje izposoje (US-10, dokument 07, 5.4): zavihka Trenutne in Pretekle, vsaka rezervacija
// s kosi, terminom, namenom in značko statusa. Zamujena ima rdečo značko s številom dni
// (izračuna jo API, ADR-0007), zavrnjena razlog in komentar tehnika. Preklic je US-13 (P-13).
import { Link } from 'react-router';
import { mojeRezervacije } from '../api/rezervacije.js';
import GlavaStrani from '../components/GlavaStrani.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { SkeletTabele } from '../components/Skelet.jsx';
import { slogGumba } from '../components/slogGumba.js';
import { ZnackaRezervacije } from '../components/StatusnaZnacka.jsx';
import Vsebina from '../components/Vsebina.jsx';
import Zavihki from '../components/Zavihki.jsx';
import { usePodatki } from '../hooks/usePodatki.js';
import { datumZLetom, obdobje } from '../utils/datumi.js';
import { OZNAKE_RAZLOGOV } from '../utils/oznake.js';

const TRENUTNI = ['ODDANA', 'ODOBRENA', 'IZDANA'];

// Kratko pojasnilo stanja pod značko.
function Pojasnilo({ r }) {
  if (r.status === 'ODDANA')
    return <p className="text-sm text-gray-600">Čaka na odobritev tehnika.</p>;
  if (r.status === 'ODOBRENA') {
    return (
      <p className="text-sm text-gray-600">
        Odobreno. Opremo prevzemite pri tehniku od {datumZLetom(r.od)} naprej.
      </p>
    );
  }
  if (r.status === 'IZDANA') {
    return (
      <p className={`text-sm ${r.zamujena ? 'font-medium text-napaka' : 'text-gray-700'}`}>
        Rok vračila: {datumZLetom(r.do)}
        {r.zamujena && '. Opremo čim prej vrnite tehniku.'}
      </p>
    );
  }
  return null;
}

function KarticaRezervacije({ r }) {
  return (
    <article
      className={`rounded-osnovni border bg-white p-4 ${r.zamujena ? 'border-napaka' : 'border-gray-300'}`}
      aria-label={`Rezervacija ${obdobje(r.od, r.do)}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900 tabular-nums">{obdobje(r.od, r.do)}</p>
          <Pojasnilo r={r} />
        </div>
        <ZnackaRezervacije status={r.status} zamujena={r.zamujena} dniZamude={r.dniZamude} />
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
        <dt className="text-sm text-gray-600">Oprema</dt>
        <dd>
          <ul>
            {r.kosi.map((k) => (
              <li key={k.id}>
                {k.naziv}{' '}
                <span className="text-sm text-gray-600 tabular-nums">({k.inventarnaStevilka})</span>
              </li>
            ))}
          </ul>
        </dd>
        <dt className="text-sm text-gray-600">Namen</dt>
        <dd>{r.namen}</dd>
      </dl>
      {r.status === 'ZAVRNJENA' && (
        <div className="mt-3 rounded-osnovni bg-napaka-ozadje px-3 py-2 text-sm text-napaka">
          <p>
            <span className="font-medium">Razlog zavrnitve:</span>{' '}
            {OZNAKE_RAZLOGOV[r.razlogZavrnitve] ?? r.razlogZavrnitve}
          </p>
          {r.komentarTehnika && (
            <p className="mt-1">
              <span className="font-medium">Komentar tehnika:</span> {r.komentarTehnika}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function Seznam({ rezervacije, prazno }) {
  if (rezervacije.length === 0) return <PraznoStanje naslov={prazno} />;
  return (
    <ul className="space-y-4">
      {rezervacije.map((r) => (
        <li key={r.id}>
          <KarticaRezervacije r={r} />
        </li>
      ))}
    </ul>
  );
}

export default function MojeIzposoje() {
  const { podatki, nalaganje, napaka, osvezi } = usePodatki(mojeRezervacije);

  let vsebina;
  if (nalaganje) vsebina = <SkeletTabele vrstice={3} stolpci={3} />;
  else if (napaka) vsebina = <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />;
  else if (podatki.length === 0) {
    vsebina = (
      <PraznoStanje
        naslov="Nimate še nobene rezervacije"
        besedilo="Opremo izberete v katalogu."
        dejanje={
          <Link to="/katalog" className={slogGumba()}>
            Na katalog
          </Link>
        }
      />
    );
  } else {
    // API vrne rezervacije od najkasnejšega začetka naprej.
    const trenutne = podatki.filter((r) => TRENUTNI.includes(r.status));
    const pretekle = podatki.filter((r) => !TRENUTNI.includes(r.status));
    vsebina = (
      <Zavihki
        oznaka="Moje izposoje"
        zavihki={[
          {
            kljuc: 'trenutne',
            oznaka: `Trenutne (${trenutne.length})`,
            vsebina: <Seznam rezervacije={trenutne} prazno="Nimate trenutnih izposoj" />,
          },
          {
            kljuc: 'pretekle',
            oznaka: `Pretekle (${pretekle.length})`,
            vsebina: <Seznam rezervacije={pretekle} prazno="Nimate preteklih izposoj" />,
          },
        ]}
      />
    );
  }

  return (
    <Vsebina>
      <GlavaStrani naslov="Moje izposoje" opis="Vaše rezervacije in izposoje opreme." />
      <div className="mt-6">{vsebina}</div>
    </Vsebina>
  );
}
