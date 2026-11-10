// Rezervacija več kosov hkrati (I-24): izbrani kosi iz kataloga in en obrazec za vse.
import { useState } from 'react';
import { Link } from 'react-router';
import GlavaStrani from '../components/GlavaStrani.jsx';
import ObrazecRezervacije from '../components/ObrazecRezervacije.jsx';
import PraznoStanje from '../components/PraznoStanje.jsx';
import { slogGumba } from '../components/slogGumba.js';
import Vsebina from '../components/Vsebina.jsx';
import { useIzbira } from '../izbira/useIzbira.js';

export default function Rezervacija() {
  const { kosi, odstrani } = useIzbira();
  const [termin, setTermin] = useState({ od: '', do: '' });

  return (
    <Vsebina>
      <GlavaStrani
        naslov="Rezervacija"
        opis="En termin in namen za vse izbrane kose. Ali je kos prost, preverite v njegovem koledarju."
      />
      <div className="mt-6 max-w-2xl">
        {kosi.length === 0 ? (
          <PraznoStanje
            naslov="Niste izbrali še nobenega kosa"
            besedilo="V katalogu izberite Rezerviraj ali Dodaj k rezervaciji."
            dejanje={
              <Link to="/katalog" className={slogGumba()}>
                Na katalog
              </Link>
            }
          />
        ) : (
          <>
            <ObrazecRezervacije
              kosi={kosi}
              termin={termin}
              onTermin={setTermin}
              onOdstrani={odstrani}
            />
            <Link
              to="/katalog"
              className="mt-4 inline-flex min-h-11 items-center text-brand-600 hover:underline"
            >
              Dodaj še kos iz kataloga
            </Link>
          </>
        )}
      </div>
    </Vsebina>
  );
}
