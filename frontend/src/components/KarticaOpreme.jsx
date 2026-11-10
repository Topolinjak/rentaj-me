// Kartica opreme v katalogu (dokument 07, 4): namesto slike siv placeholder z ikono kategorije
// (slike niso del MVP), naziv, inventarna številka, značka statusa in dejanja. Kos v okvari
// ima onemogočen gumb Rezerviraj in razlog v besedilu, ne le siv gumb.
import { useId } from 'react';
import { Link, useNavigate } from 'react-router';
import { useIzbira } from '../izbira/useIzbira.js';
import Gumb from './Gumb.jsx';
import Ikona from './Ikona.jsx';
import { slogGumba } from './slogGumba.js';
import { ZnackaOpreme } from './StatusnaZnacka.jsx';
import { ikonaKategorije } from '../utils/kategorije.js';

export function PlaceholderSlike({ kategorija, className = '' }) {
  return (
    <div
      className={`flex aspect-video flex-col items-center justify-center gap-2 rounded-osnovni bg-gray-100 text-gray-600 ${className}`}
    >
      <Ikona ime={ikonaKategorije(kategorija.naziv)} className="size-10" />
      <span className="text-sm">{kategorija.naziv}</span>
    </div>
  );
}

export default function KarticaOpreme({ kos }) {
  const idRazloga = useId();
  const navigiraj = useNavigate();
  const { dodaj, odstrani, vsebuje } = useIzbira();
  const vOkvari = kos.status === 'V_OKVARI';
  const izbran = vsebuje(kos.id);
  const oznaka = `${kos.naziv} (${kos.inventarnaStevilka})`;

  return (
    <article className="flex flex-col rounded-osnovni border border-gray-300 bg-white p-4">
      <PlaceholderSlike kategorija={kos.kategorija} />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">{kos.naziv}</h3>
          <p className="text-sm text-gray-600 tabular-nums">{kos.inventarnaStevilka}</p>
        </div>
        <ZnackaOpreme status={kos.status} />
      </div>
      {vOkvari && (
        <p id={idRazloga} className="mt-3 text-sm text-opozorilo">
          Kos je v okvari, zato ga trenutno ni mogoče rezervirati.
        </p>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        {vOkvari ? (
          <Gumb disabled aria-describedby={idRazloga} className="col-span-2">
            Rezerviraj
          </Gumb>
        ) : (
          <>
            {/* Rezerviraj doda kos in odpre obrazec: od kataloga do oddaje so trije kliki. */}
            <Gumb
              className="col-span-2"
              aria-label={`Rezerviraj: ${oznaka}`}
              onClick={() => {
                dodaj(kos);
                navigiraj('/rezervacija');
              }}
            >
              Rezerviraj
            </Gumb>
            <Gumb
              razlicica="sekundarni"
              velikost="majhna"
              ikona={izbran ? 'kljukica' : 'plus'}
              aria-pressed={izbran}
              aria-label={
                izbran ? `Odstrani iz rezervacije: ${oznaka}` : `Dodaj k rezervaciji: ${oznaka}`
              }
              onClick={() => (izbran ? odstrani(kos.id) : dodaj(kos))}
            >
              {izbran ? 'Izbrano' : 'Dodaj'}
            </Gumb>
          </>
        )}
        <Link
          to={`/oprema/${kos.id}`}
          className={slogGumba({
            razlicica: 'sekundarni',
            velikost: 'majhna',
            className: vOkvari ? 'col-span-2' : '',
          })}
          aria-label={`Podrobnosti: ${oznaka}`}
        >
          Podrobnosti
        </Link>
      </div>
    </article>
  );
}
