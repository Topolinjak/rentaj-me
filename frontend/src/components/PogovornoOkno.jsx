// Pogovorno okno (dokument 07, 4 in 7) na vgrajenem elementu <dialog> s showModal(): brskalnik
// sam ujame fokus v oknu, ostalo stran naredi neaktivno, okno zapre s tipko Esc in fokus po
// zaprtju vrne na gumb, ki ga je odprl. Na telefonu je okno pripeto na dno čez celo širino
// (bottom sheet), od 640 px naprej je na sredini.
//
// Okno je nadzorovano: odprto pove, ali je prikazano, onZapri pa pokliče Esc ali gumb Zapri.
import { useEffect, useId, useRef } from 'react';
import Gumb from './Gumb.jsx';
import Ikona from './Ikona.jsx';

export default function PogovornoOkno({ odprto, onZapri, naslov, children, dejanja }) {
  const okno = useRef(null);
  const idNaslova = useId();

  useEffect(() => {
    const element = okno.current;
    if (odprto && !element.open) element.showModal();
    if (!odprto && element.open) element.close();
  }, [odprto]);

  return (
    <dialog
      ref={okno}
      aria-labelledby={idNaslova}
      // Esc sproži »cancel«. Brskalnik bi okno zaprl sam; prepustimo odločitev staršu, da
      // stanje odprto ostane usklajeno z DOM.
      onCancel={(dogodek) => {
        dogodek.preventDefault();
        onZapri();
      }}
      className={[
        'm-0 mt-auto w-full max-w-none rounded-t-osnovni bg-white p-0 text-gray-700 shadow-lg',
        'sm:m-auto sm:max-w-lg sm:rounded-osnovni',
        'backdrop:bg-gray-900/50',
      ].join(' ')}
    >
      {odprto && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={idNaslova} className="text-xl font-bold text-gray-900">
              {naslov}
            </h2>
            <button
              type="button"
              onClick={onZapri}
              aria-label="Zapri"
              className="-m-2 flex size-11 items-center justify-center rounded-osnovni text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Ikona ime="kriz" className="size-5" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
          {dejanja && (
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {dejanja}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

// Potrditev dejanja (preklic, izdaja, vračilo, razrešitev poškodbe). Gumb za potrditev ima
// glagol z dejanjem (»Prekliči rezervacijo«, ne »V redu«), nevarno dejanje je rdeče.
// Napaka API-ja se pokaže v oknu, da uporabnik ve, zakaj se ni zaprlo.
export function PotrditvenoOkno({
  odprto,
  onZapri,
  onPotrdi,
  naslov,
  children,
  potrdi,
  nevarno = false,
  nalaganje = false,
  napaka,
}) {
  return (
    <PogovornoOkno
      odprto={odprto}
      onZapri={onZapri}
      naslov={naslov}
      dejanja={
        <>
          <Gumb razlicica="sekundarni" onClick={onZapri} disabled={nalaganje}>
            Nazaj
          </Gumb>
          <Gumb
            razlicica={nevarno ? 'nevarni' : 'primarni'}
            onClick={onPotrdi}
            nalaganje={nalaganje}
          >
            {potrdi}
          </Gumb>
        </>
      }
    >
      {children}
      {napaka && (
        <p
          role="alert"
          className="mt-4 rounded-osnovni bg-napaka-ozadje px-3 py-2 text-sm text-napaka"
        >
          {napaka}
        </p>
      )}
    </PogovornoOkno>
  );
}
