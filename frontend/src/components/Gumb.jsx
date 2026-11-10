// Gumb (dokument 07, 4): primarni, sekundarni, nevarni; velikosti normalna in majhna; po želji
// z ikono. Med nalaganjem je onemogočen in ima aria-busy, besedilo ostane, da se gumb ne
// skrči. Gumb samo z ikono (brez besedila) mora dobiti aria-label.
import Ikona from './Ikona.jsx';

const RAZLICICE = {
  primarni: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  sekundarni: 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200',
  nevarni: 'bg-napaka text-white hover:bg-napaka-temna active:bg-napaka-temna',
};

// Normalna velikost je visoka 44 px (najmanjša tarča za dotik, dokument 07, 6).
const VELIKOSTI = {
  normalna: 'min-h-11 px-4 text-base',
  majhna: 'min-h-8 px-3 text-sm',
};

export default function Gumb({
  razlicica = 'primarni',
  velikost = 'normalna',
  ikona,
  nalaganje = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...ostalo
}) {
  return (
    <button
      type={type}
      disabled={disabled || nalaganje}
      aria-busy={nalaganje || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-osnovni border border-transparent font-medium',
        'disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-600',
        RAZLICICE[razlicica],
        VELIKOSTI[velikost],
        className,
      ].join(' ')}
      {...ostalo}
    >
      {nalaganje ? (
        <Ikona ime="nalaganje" className="size-4 animate-spin" />
      ) : (
        ikona && <Ikona ime={ikona} />
      )}
      {children}
    </button>
  );
}
