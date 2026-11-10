// Podrobnosti kosa in koledar zasedenosti (US-02, dokument 07, 5.3). Na namizju dva stolpca:
// levo podatki, desno koledar; na telefonu en stolpec. Ob vsakem premiku meseca nov klic
// zasedenosti. Zasedenost prikaže le obdobja, brez uporabnikov (API jih ne vrne).
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';
import { kosOpreme, zasedenost } from '../api/oprema.js';
import Gumb from '../components/Gumb.jsx';
import Ikona from '../components/Ikona.jsx';
import Koledar from '../components/Koledar.jsx';
import { PlaceholderSlike } from '../components/KarticaOpreme.jsx';
import NapakaNalaganja from '../components/NapakaNalaganja.jsx';
import ObrazecRezervacije from '../components/ObrazecRezervacije.jsx';
import { ZnackaOpreme, ZnackaStanja } from '../components/StatusnaZnacka.jsx';
import Vsebina from '../components/Vsebina.jsx';
import { usePodatki } from '../hooks/usePodatki.js';
import { useIzbira } from '../izbira/useIzbira.js';
import { danes, mesecDatuma, obdobje, prviDanMeseca, zadnjiDanMeseca } from '../utils/datumi.js';
import { izberiDanVTerminu } from '../utils/termin.js';

function NazajNaKatalog() {
  return (
    <Link
      to="/katalog"
      className="inline-flex min-h-11 items-center gap-1 text-brand-600 hover:underline"
    >
      <Ikona ime="levo" />
      Katalog
    </Link>
  );
}

// Seznam zasedenih obdobij v mesecu, dostopen tudi brez koledarja.
function SeznamZasedenosti({ zasedeni }) {
  if (zasedeni.length === 0) {
    return <p className="mt-3 text-sm text-gray-600">Kos je v tem mesecu ves čas prost.</p>;
  }
  return (
    <div className="mt-3 text-sm">
      <p className="text-gray-600">Zaseden v tem mesecu:</p>
      <ul className="mt-1 list-disc pl-5 tabular-nums">
        {zasedeni.map((z) => (
          <li key={`${z.od}-${z.do}`}>{obdobje(z.od, z.do)}</li>
        ))}
      </ul>
    </div>
  );
}

export function ZasedenostKosa({ id, izbrano, onIzberiDan }) {
  const [mesec, setMesec] = useState(() => mesecDatuma(danes()));
  const nalozi = useCallback(
    ({ signal }) => zasedenost(id, prviDanMeseca(mesec), zadnjiDanMeseca(mesec), { signal }),
    [id, mesec],
  );
  const { podatki, nalaganje, napaka, osvezi } = usePodatki(nalozi);

  return (
    <section aria-labelledby="naslov-zasedenosti">
      <h2 id="naslov-zasedenosti" className="text-razdelek font-bold text-brand-600">
        Zasedenost
      </h2>
      <div className="mt-4">
        <Koledar
          mesec={mesec}
          onMesec={setMesec}
          zasedeni={podatki ?? []}
          izbrano={izbrano}
          onIzberiDan={onIzberiDan}
          nalaganje={nalaganje}
        />
        {napaka ? (
          <div className="mt-3">
            <NapakaNalaganja napaka={napaka} onPonovi={osvezi} />
          </div>
        ) : (
          !nalaganje && <SeznamZasedenosti zasedeni={podatki} />
        )}
      </div>
    </section>
  );
}

export default function KosOpreme() {
  const { id } = useParams();
  const nalozi = useCallback(({ signal }) => kosOpreme(id, { signal }), [id]);
  const { podatki: kos, nalaganje, napaka, statusNapake, osvezi } = usePodatki(nalozi);
  const izbira = useIzbira();
  const [termin, setTermin] = useState({ od: '', do: '' });

  if (nalaganje) {
    return (
      <Vsebina>
        <NazajNaKatalog />
        <div role="status" className="mt-4">
          <span className="sr-only">Nalaganje …</span>
          <div
            aria-hidden="true"
            className="h-8 w-1/2 rounded-osnovni bg-gray-200 motion-safe:animate-pulse"
          />
        </div>
      </Vsebina>
    );
  }

  if (napaka) {
    return (
      <Vsebina>
        <NazajNaKatalog />
        <div className="mt-4">
          {/* 404: kos ne obstaja ali je umaknjen – ponovni poskus ne pomaga. */}
          <NapakaNalaganja napaka={napaka} onPonovi={statusNapake === 404 ? undefined : osvezi} />
        </div>
      </Vsebina>
    );
  }

  return (
    <Vsebina>
      <NazajNaKatalog />
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {/* min-w-0: element mreže se sme skrčiti pod širino vsebine (sicer stran drsi vodoravno). */}
        <div className="min-w-0">
          <PlaceholderSlike kategorija={kos.kategorija} />
          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-naslov font-bold text-gray-900">{kos.naziv}</h1>
              <p className="text-gray-600 tabular-nums">{kos.inventarnaStevilka}</p>
            </div>
            <ZnackaOpreme status={kos.status} />
          </div>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
            <dt className="text-sm text-gray-600">Kategorija</dt>
            <dd>{kos.kategorija.naziv}</dd>
            <dt className="text-sm text-gray-600">Stanje</dt>
            <dd>
              <ZnackaStanja stanje={kos.trenutnoStanje} />
            </dd>
            {kos.opis && (
              <>
                <dt className="text-sm text-gray-600">Opis</dt>
                <dd>{kos.opis}</dd>
              </>
            )}
          </dl>
          {kos.status === 'NA_VOLJO' && (
            <div className="mt-6">
              <Gumb
                razlicica="sekundarni"
                ikona={izbira.vsebuje(kos.id) ? 'kljukica' : 'plus'}
                aria-pressed={izbira.vsebuje(kos.id)}
                onClick={() =>
                  izbira.vsebuje(kos.id) ? izbira.odstrani(kos.id) : izbira.dodaj(kos)
                }
              >
                {izbira.vsebuje(kos.id) ? 'Dodano k rezervaciji' : 'Dodaj k rezervaciji'}
              </Gumb>
              <p className="mt-2 text-sm text-gray-600">
                Za rezervacijo več kosov hkrati jih dodajte in nadaljujte v katalogu.
              </p>
            </div>
          )}
          {kos.status === 'V_OKVARI' && (
            <p className="mt-6 rounded-osnovni bg-opozorilo-ozadje px-3 py-2 text-sm text-opozorilo">
              Kos je v okvari, zato ga trenutno ni mogoče rezervirati.
            </p>
          )}
        </div>

        <div className="min-w-0 space-y-8">
          <ZasedenostKosa
            id={kos.id}
            izbrano={termin.od ? termin : undefined}
            onIzberiDan={
              kos.status === 'NA_VOLJO'
                ? (datum) => setTermin((t) => izberiDanVTerminu(t, datum))
                : undefined
            }
          />
          {kos.status === 'NA_VOLJO' && (
            <ObrazecRezervacije
              // Ta kos in kosi, ki jih je uporabnik že izbral v katalogu (I-24).
              kosi={[kos, ...izbira.kosi.filter((k) => k.id !== kos.id)]}
              termin={termin}
              onTermin={setTermin}
              onOdstrani={(id) => izbira.odstrani(id)}
              zaklenjen={kos.id}
            />
          )}
        </div>
      </div>
    </Vsebina>
  );
}
