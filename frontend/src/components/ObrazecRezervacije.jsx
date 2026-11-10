// Obrazec za oddajo rezervacije (US-03, US-04, dokument 07, 5.3). Termin sta prvi in zadnji
// dan (ADR-0013); trajanje v koledarskih dneh je prikazano ob omejitvi vloge, a odloči API
// (400 pri poljih ali nad gumbom, 409 nad gumbom z navedenim kosom in terminom).
//
// kosi: [{ id, naziv, inventarnaStevilka }] – vsi kosi, ki se oddajo skupaj (I-24);
// termin, onTermin: nadzorovan termin { od, do }, da ga lahko nastavi tudi klik v koledarju;
// onOdstrani(id): odstrani kos iz izbire; zaklenjen: id kosa, ki ga ni mogoče odstraniti
// (kos, katerega stran je odprta).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { mojaPravila } from '../api/pravila.js';
import { oddajRezervacijo } from '../api/rezervacije.js';
import { usePodatki } from '../hooks/usePodatki.js';
import { useIzbira } from '../izbira/useIzbira.js';
import { useObvestila } from '../obvestila/useObvestila.js';
import { danes, jeVeljavenDatum, steviloDni } from '../utils/datumi.js';
import { steviloDniBesedilo, steviloKosovBesedilo } from '../utils/oznake.js';
import Gumb from './Gumb.jsx';
import Ikona from './Ikona.jsx';
import NapakaObrazca from './NapakaObrazca.jsx';
import Polje from './Polje.jsx';

// Namig z omejitvami vloge, ves čas viden pod obrazcem (US-04).
function NamigVloge({ pravila, steviloIzbranih }) {
  if (pravila.nalaganje) return <p className="text-sm text-gray-600">Nalaganje omejitev …</p>;
  if (pravila.napaka || !pravila.podatki) return null;
  const { maxKosov, maxDni, aktivnihKosov } = pravila.podatki;
  const prostih = Math.max(maxKosov - aktivnihKosov, 0);
  return (
    <div className="flex gap-2 rounded-osnovni bg-brand-50 px-3 py-2 text-sm text-brand-700">
      <Ikona ime="info" className="mt-0.5" />
      <p className="min-w-0 flex-1">
        Vaša vloga: največ {steviloKosovBesedilo(maxKosov)}, {steviloDniBesedilo(maxDni)}.
        {aktivnihKosov > 0 &&
          ` Trenutno imate ${steviloKosovBesedilo(aktivnihKosov)} v aktivnih rezervacijah, dodate lahko še ${prostih}.`}
        {steviloIzbranih > prostih && ' Izbrali ste več kosov, kot jih še lahko rezervirate.'}
      </p>
    </div>
  );
}

export default function ObrazecRezervacije({ kosi, termin, onTermin, onOdstrani, zaklenjen }) {
  const navigiraj = useNavigate();
  const obvesti = useObvestila();
  const { izprazni } = useIzbira();
  const pravila = usePodatki(mojaPravila);
  const [namen, setNamen] = useState('');
  const [napake, setNapake] = useState({});
  const [napaka, setNapaka] = useState(null);
  const [posiljanje, setPosiljanje] = useState(false);

  const { od, do: zadnjiDan } = termin;
  const trajanje =
    jeVeljavenDatum(od) && jeVeljavenDatum(zadnjiDan) && zadnjiDan >= od
      ? steviloDni(od, zadnjiDan)
      : null;
  const maxDni = pravila.podatki?.maxDni;

  async function oddaj(dogodek) {
    dogodek.preventDefault();
    setPosiljanje(true);
    setNapake({});
    setNapaka(null);
    try {
      await oddajRezervacijo({ kosi: kosi.map((k) => k.id), od, do: zadnjiDan, namen });
      izprazni();
      obvesti('Rezervacija oddana – čaka na odobritev tehnika');
      navigiraj('/moje-izposoje');
    } catch (e) {
      const poPoljih = {};
      for (const { polje, sporocilo } of e.napake ?? []) {
        // Napake pri kosih (npr. »kosi.0«) sodijo k seznamu kosov.
        poPoljih[polje.startsWith('kosi') ? 'kosi' : polje] = sporocilo;
      }
      setNapake(poPoljih);
      // 409 (kos zaseden) in 400 brez polj (trajanje, omejitev kosov) nad gumbom.
      if (!e.napake?.length) setNapaka(e.message);
      setPosiljanje(false);
    }
  }

  return (
    <form onSubmit={oddaj} noValidate className="space-y-4" aria-labelledby="naslov-obrazca">
      <h2 id="naslov-obrazca" className="text-razdelek font-bold text-brand-600">
        Rezervacija
      </h2>

      <div>
        <p className="font-medium text-gray-900">Izbrani kosi</p>
        <ul className="mt-2 space-y-2">
          {kosi.map((kos) => (
            <li
              key={kos.id}
              className="flex items-center justify-between gap-3 rounded-osnovni border border-gray-300 px-3 py-2"
            >
              <span>
                {kos.naziv}{' '}
                <span className="text-sm text-gray-600 tabular-nums">
                  ({kos.inventarnaStevilka})
                </span>
              </span>
              {onOdstrani && kos.id !== zaklenjen && (
                <Gumb
                  razlicica="sekundarni"
                  velikost="majhna"
                  onClick={() => onOdstrani(kos.id)}
                  aria-label={`Odstrani ${kos.naziv} (${kos.inventarnaStevilka}) iz rezervacije`}
                >
                  Odstrani
                </Gumb>
              )}
            </li>
          ))}
        </ul>
        {napake.kosi && (
          <p role="alert" className="mt-1 text-sm text-napaka">
            {napake.kosi}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Polje
          oznaka="Prvi dan"
          type="date"
          obvezno
          min={danes()}
          value={od}
          onChange={(e) => onTermin({ ...termin, od: e.target.value })}
          napaka={napake.od}
        />
        <Polje
          oznaka="Zadnji dan"
          type="date"
          obvezno
          min={od || danes()}
          value={zadnjiDan}
          onChange={(e) => onTermin({ ...termin, do: e.target.value })}
          napaka={napake.do}
        />
      </div>
      <p className="text-sm text-gray-600" aria-live="polite">
        {trajanje
          ? `Trajanje: ${steviloDniBesedilo(trajanje)}${maxDni ? ` (največ ${maxDni})` : ''}.`
          : 'Izberite prvi in zadnji dan izposoje. Dan lahko izberete tudi v koledarju.'}
        {trajanje && maxDni && trajanje > maxDni && (
          <span className="text-opozorilo"> Termin je daljši, kot ga dovoljuje vaša vloga.</span>
        )}
      </p>

      <Polje
        oznaka="Namen izposoje"
        kot="textarea"
        obvezno
        value={namen}
        onChange={(e) => setNamen(e.target.value)}
        napaka={napake.namen}
        pomoc="Na kratko opišite, za kaj potrebujete opremo (npr. predmet ali projekt)."
      />

      <NamigVloge pravila={pravila} steviloIzbranih={kosi.length} />

      <NapakaObrazca napaka={napaka} />

      <Gumb type="submit" nalaganje={posiljanje} disabled={kosi.length === 0} className="w-full">
        Oddaj rezervacijo
      </Gumb>
    </form>
  );
}
