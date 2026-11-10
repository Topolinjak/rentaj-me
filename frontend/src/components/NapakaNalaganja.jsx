// Napaka pri nalaganju strani: sporočilo API-ja in gumb za ponovni poskus.
import Gumb from './Gumb.jsx';
import Ikona from './Ikona.jsx';

export default function NapakaNalaganja({ napaka, onPonovi }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-osnovni border border-napaka bg-napaka-ozadje p-4 text-napaka sm:flex-row sm:items-center"
    >
      <Ikona ime="opozorilo" className="size-5" />
      <p className="flex-1">{napaka}</p>
      {onPonovi && (
        <Gumb razlicica="sekundarni" velikost="majhna" onClick={onPonovi}>
          Poskusi znova
        </Gumb>
      )}
    </div>
  );
}
