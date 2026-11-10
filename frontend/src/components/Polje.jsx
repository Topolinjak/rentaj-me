// Polje obrazca (dokument 07, 4): oznaka nad poljem, pomožno besedilo in napaka pod njim.
// Obvezno polje ima v oznaki besedilo »obvezno«, ne le zvezdico. Napaka je povezana s poljem
// (aria-describedby, aria-invalid) in se napove bralniku zaslona (role="alert").
//
// kot = 'input' (privzeto), 'textarea' ali 'select' (možnosti podaj kot children).
import { useId } from 'react';

const SLOG_POLJA = [
  'block w-full rounded-osnovni border border-gray-300 bg-white px-3 text-base text-gray-900',
  'hover:border-gray-600 focus-visible:border-brand-600',
  'aria-invalid:border-napaka',
  'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600 disabled:hover:border-gray-300',
].join(' ');

export default function Polje({
  oznaka,
  pomoc,
  napaka,
  obvezno = false,
  kot: Element = 'input',
  id,
  className = '',
  children,
  ...ostalo
}) {
  const samodejniId = useId();
  const idPolja = id ?? samodejniId;
  const idPomoci = pomoc ? `${idPolja}-pomoc` : undefined;
  const idNapake = napaka ? `${idPolja}-napaka` : undefined;
  const opisano = [idPomoci, idNapake].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={idPolja} className="block font-medium text-gray-900">
        {oznaka}
        {obvezno && <span className="ml-1 text-sm font-normal text-gray-600">(obvezno)</span>}
      </label>
      <Element
        id={idPolja}
        // aria-required namesto required: vgrajeno preverjanje brskalnika bi pokazalo svoje
        // oblačke in ustavilo oddajo, napake pa naj prihajajo iz API-ja (dokument 07, 2).
        aria-required={obvezno || undefined}
        aria-invalid={napaka ? true : undefined}
        aria-describedby={opisano}
        className={`mt-1 ${SLOG_POLJA} ${Element === 'textarea' ? 'min-h-24 py-2' : 'min-h-11'}`}
        {...ostalo}
      >
        {children}
      </Element>
      {pomoc && (
        <p id={idPomoci} className="mt-1 text-sm text-gray-600">
          {pomoc}
        </p>
      )}
      {napaka && (
        <p id={idNapake} role="alert" className="mt-1 text-sm text-napaka">
          {napaka}
        </p>
      )}
    </div>
  );
}
