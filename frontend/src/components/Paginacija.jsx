// Paginacija (dokument 07, 4): 20 zapisov na stran, prikaz »1–20 od 143«. Strani so štete od 1.
import Gumb from './Gumb.jsx';

export const VELIKOST_STRANI = 20;

export default function Paginacija({ stran, skupaj, velikost = VELIKOST_STRANI, onStran }) {
  if (skupaj === 0) return null;
  const steviloStrani = Math.ceil(skupaj / velikost);
  const prvi = (stran - 1) * velikost + 1;
  const zadnji = Math.min(stran * velikost, skupaj);

  return (
    <nav
      aria-label="Strani"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4"
    >
      <p className="text-sm text-gray-600 tabular-nums">
        {prvi}–{zadnji} od {skupaj}
      </p>
      {steviloStrani > 1 && (
        <div className="flex gap-2">
          <Gumb
            razlicica="sekundarni"
            velikost="majhna"
            ikona="levo"
            disabled={stran <= 1}
            onClick={() => onStran(stran - 1)}
          >
            Prejšnja
          </Gumb>
          <Gumb
            razlicica="sekundarni"
            velikost="majhna"
            disabled={stran >= steviloStrani}
            onClick={() => onStran(stran + 1)}
          >
            Naslednja
          </Gumb>
        </div>
      )}
    </nav>
  );
}
