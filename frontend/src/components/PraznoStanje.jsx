// Prazno stanje (dokument 07, 4): ikona, kratko besedilo in dejanje za naslednji korak, npr.
// <PraznoStanje naslov="Nimate še nobene rezervacije"
//   dejanje={<Link to="/katalog" className={slogGumba()}>Na katalog</Link>} />
import Ikona from './Ikona.jsx';

export default function PraznoStanje({ naslov, besedilo, dejanje, ikona = 'predal' }) {
  return (
    <div className="flex flex-col items-center rounded-osnovni border border-dashed border-gray-300 px-6 py-12 text-center">
      <Ikona ime={ikona} className="size-10 text-gray-600" />
      <p className="mt-4 text-lg font-medium text-gray-900">{naslov}</p>
      {besedilo && <p className="mt-1 max-w-md text-sm text-gray-600">{besedilo}</p>}
      {dejanje && <div className="mt-6">{dejanje}</div>}
    </div>
  );
}
