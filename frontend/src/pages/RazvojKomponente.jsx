// Pregled osnovnih komponent v vseh stanjih (dokument 07, 10: komponente pred stranmi). Pot
// /razvoj/komponente obstaja le v razvojnem načinu (npm run dev), v buildu je ni.
import { useState } from 'react';
import Gumb from '../components/Gumb.jsx';
import PogovornoOkno, { PotrditvenoOkno } from '../components/PogovornoOkno.jsx';
import Polje from '../components/Polje.jsx';
import { ZnackaOpreme, ZnackaRezervacije, ZnackaStanja } from '../components/StatusnaZnacka.jsx';
import { useObvestila } from '../obvestila/useObvestila.js';

function Razdelek({ naslov, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-razdelek font-bold text-brand-600">{naslov}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const Vrsta = ({ children }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

export default function RazvojKomponente() {
  const obvesti = useObvestila();
  const [okno, setOkno] = useState(null);
  const [nalaganje, setNalaganje] = useState(false);

  function potrdiPreklic() {
    setNalaganje(true);
    setTimeout(() => {
      setNalaganje(false);
      setOkno(null);
      obvesti('Rezervacija preklicana');
    }, 1000);
  }

  return (
    <div className="mx-auto max-w-vsebina px-4 py-8">
      <h1 className="text-naslov font-bold text-gray-900">Komponente</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pregled za razvoj (I-11). Preizkusi s tipkovnico (Tab, Enter, Esc) in na več širinah.
      </p>

      <Razdelek naslov="Gumbi">
        <div className="space-y-4">
          {['normalna', 'majhna'].map((velikost) => (
            <Vrsta key={velikost}>
              <Gumb velikost={velikost}>Odobri</Gumb>
              <Gumb velikost={velikost} razlicica="sekundarni">
                Podrobnosti
              </Gumb>
              <Gumb velikost={velikost} razlicica="nevarni">
                Zavrni
              </Gumb>
              <Gumb velikost={velikost} ikona="puscicaVen">
                Izdaj
              </Gumb>
              <Gumb velikost={velikost} nalaganje>
                Shranjujem
              </Gumb>
              <Gumb velikost={velikost} disabled>
                Potrdi izdajo
              </Gumb>
              <Gumb
                velikost={velikost}
                razlicica="sekundarni"
                ikona="plus"
                aria-label="Dodaj kos"
              />
            </Vrsta>
          ))}
        </div>
      </Razdelek>

      <Razdelek naslov="Polja obrazca">
        <div className="grid max-w-xl gap-6">
          <Polje oznaka="E-poštni naslov" type="email" obvezno autoComplete="email" />
          <Polje
            oznaka="Namen izposoje"
            kot="textarea"
            obvezno
            pomoc="Na kratko opišite, za kaj potrebujete opremo."
          />
          <Polje
            oznaka="Konec"
            type="date"
            obvezno
            napaka="Najdaljši čas izposoje za vašo vlogo je 7 dni"
            defaultValue="2026-11-30"
          />
          <Polje oznaka="Razlog zavrnitve" kot="select" obvezno defaultValue="">
            <option value="" disabled>
              Izberite razlog
            </option>
            <option>Oprema je potrebna za vaje</option>
          </Polje>
          <Polje oznaka="Inventarna številka" disabled defaultValue="A-014" />
        </div>
      </Razdelek>

      <Razdelek naslov="Statusne značke">
        <div className="space-y-3">
          <Vrsta>
            {['ODDANA', 'ODOBRENA', 'ZAVRNJENA', 'PREKLICANA', 'IZDANA', 'VRNJENA'].map((s) => (
              <ZnackaRezervacije key={s} status={s} />
            ))}
            <ZnackaRezervacije status="IZDANA" zamujena dniZamude={3} />
          </Vrsta>
          <Vrsta>
            {['NA_VOLJO', 'V_OKVARI', 'UMAKNJEN'].map((s) => (
              <ZnackaOpreme key={s} status={s} />
            ))}
          </Vrsta>
          <Vrsta>
            {['BREZHIBNO', 'OBRABLJENO', 'POSKODOVANO'].map((s) => (
              <ZnackaStanja key={s} stanje={s} />
            ))}
          </Vrsta>
        </div>
      </Razdelek>

      <Razdelek naslov="Pogovorna okna in obvestila">
        <Vrsta>
          <Gumb razlicica="sekundarni" onClick={() => setOkno('info')}>
            Odpri okno
          </Gumb>
          <Gumb razlicica="nevarni" onClick={() => setOkno('preklic')}>
            Prekliči rezervacijo
          </Gumb>
          <Gumb onClick={() => obvesti('Rezervacija oddana – čaka na odobritev tehnika')}>
            Obvestilo
          </Gumb>
          <Gumb
            razlicica="sekundarni"
            onClick={() => obvesti('Prišlo je do napake. Poskusite znova.', { vrsta: 'napaka' })}
          >
            Obvestilo o napaki
          </Gumb>
        </Vrsta>

        <PogovornoOkno
          odprto={okno === 'info'}
          onZapri={() => setOkno(null)}
          naslov="Podrobnosti rezervacije"
          dejanja={<Gumb onClick={() => setOkno(null)}>Zapri</Gumb>}
        >
          <p>Arduino Uno (A-014), 20. 10. – 24. 10. 2026.</p>
        </PogovornoOkno>

        <PotrditvenoOkno
          odprto={okno === 'preklic'}
          onZapri={() => setOkno(null)}
          onPotrdi={potrdiPreklic}
          naslov="Ali res želite preklicati rezervacijo?"
          potrdi="Prekliči rezervacijo"
          nevarno
          nalaganje={nalaganje}
        >
          <p>Preklica ni mogoče razveljaviti.</p>
        </PotrditvenoOkno>
      </Razdelek>
    </div>
  );
}
