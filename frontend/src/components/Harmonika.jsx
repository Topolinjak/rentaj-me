// Harmonika po zgledu spletne strani oddelka (dokument 07, 3.6): glava v gray-100, rob gray-300,
// »+« oziroma »–« levo, krepek naslov. Na vgrajenem <details>/<summary>, zato sta tipkovnica
// (Enter, preslednica) in stanje za bralnik zaslona (razširjeno/strnjeno) že urejena.
import Ikona from './Ikona.jsx';

export default function Harmonika({ naslov, odprta = false, children }) {
  return (
    <details open={odprta} className="group rounded-osnovni border border-gray-300">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-osnovni bg-gray-100 px-4 py-2 font-bold text-gray-900 group-open:rounded-b-none group-open:border-b group-open:border-gray-300 hover:text-brand-600 [&::-webkit-details-marker]:hidden">
        <Ikona ime="plus" className="size-4 group-open:hidden" />
        <Ikona ime="minus" className="hidden size-4 group-open:block" />
        {naslov}
      </summary>
      <div className="px-4 py-4">{children}</div>
    </details>
  );
}
