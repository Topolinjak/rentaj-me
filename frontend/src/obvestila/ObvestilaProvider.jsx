// Obvestila (toast, dokument 07, 4): potrditve dejanj, ki ostanejo 5 s. Območje z aria-live je
// v DOM ves čas, sicer bralnik zaslona ne bi opazil novega obvestila. Napake v obrazcih se
// prikazujejo pri obrazcu, ne tukaj.
import { useCallback, useEffect, useRef, useState } from 'react';
import Ikona from '../components/Ikona.jsx';
import { ObvestilaKontekst } from './kontekst.js';

export const TRAJANJE_MS = 5000;

const VRSTE = {
  uspeh: { ikona: 'kljukica', slog: 'border-uspeh text-uspeh' },
  info: { ikona: 'info', slog: 'border-brand-600 text-brand-600' },
  napaka: { ikona: 'opozorilo', slog: 'border-napaka text-napaka' },
};

export default function ObvestilaProvider({ children }) {
  const [obvestila, setObvestila] = useState([]);
  const naslednjiId = useRef(1);
  const casovniki = useRef(new Map());

  const odstrani = useCallback((id) => {
    clearTimeout(casovniki.current.get(id));
    casovniki.current.delete(id);
    setObvestila((seznam) => seznam.filter((o) => o.id !== id));
  }, []);

  const obvesti = useCallback(
    (besedilo, { vrsta = 'uspeh' } = {}) => {
      const id = naslednjiId.current++;
      setObvestila((seznam) => [...seznam, { id, besedilo, vrsta }]);
      casovniki.current.set(
        id,
        setTimeout(() => odstrani(id), TRAJANJE_MS),
      );
    },
    [odstrani],
  );

  // Ob odstranitvi ponudnika počistimo časovnike.
  useEffect(() => {
    const aktivni = casovniki.current;
    return () => aktivni.forEach(clearTimeout);
  }, []);

  return (
    <ObvestilaKontekst value={obvesti}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:w-96"
      >
        {obvestila.map(({ id, besedilo, vrsta }) => (
          <div
            key={id}
            className={`pointer-events-auto flex items-start gap-3 rounded-osnovni border-l-4 bg-white px-4 py-3 shadow-md ${VRSTE[vrsta].slog}`}
          >
            <Ikona ime={VRSTE[vrsta].ikona} className="mt-0.5 size-5" />
            <p className="flex-1 text-gray-900">{besedilo}</p>
            <button
              type="button"
              onClick={() => odstrani(id)}
              aria-label="Zapri obvestilo"
              className="-m-2 flex size-9 items-center justify-center rounded-osnovni text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Ikona ime="kriz" />
            </button>
          </div>
        ))}
      </div>
    </ObvestilaKontekst>
  );
}
