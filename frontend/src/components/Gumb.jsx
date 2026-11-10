// Gumb (dokument 07, 4): primarni, sekundarni, nevarni; velikosti normalna in majhna; po želji
// z ikono. Med nalaganjem je onemogočen in ima aria-busy, besedilo ostane, da se gumb ne
// skrči. Gumb samo z ikono (brez besedila) mora dobiti aria-label.
import Ikona from './Ikona.jsx';
import { slogGumba } from './slogGumba.js';

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
      className={slogGumba({ razlicica, velikost, className })}
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
