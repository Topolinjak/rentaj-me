// Kartice s števili oddanih, izdanih in zamujenih rezervacij (US-05); vsaka je povezava na
// ustrezen seznam.
import { Link } from 'react-router';
import Ikona from './Ikona.jsx';

const KARTICE = [
  { kljuc: 'oddane', oznaka: 'Oddane', pot: '/tehnik#oddane', ikona: 'ura' },
  { kljuc: 'izdane', oznaka: 'Izdane', pot: '/tehnik/izdane', ikona: 'puscicaVen' },
  { kljuc: 'zamujene', oznaka: 'Zamujene', pot: '/tehnik/zamujene', ikona: 'budilka' },
];

export default function StevciTehnika({ stevci }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {KARTICE.map((k) => {
        const stevilo = stevci?.[k.kljuc];
        const opozorilo = k.kljuc === 'zamujene' && stevilo > 0;
        return (
          <li key={k.kljuc}>
            <Link
              to={k.pot}
              className={`flex items-center gap-4 rounded-osnovni border bg-white p-4 hover:bg-gray-100 ${
                opozorilo ? 'border-napaka' : 'border-gray-300'
              }`}
            >
              <span
                className={`flex size-11 items-center justify-center rounded-full ${
                  opozorilo ? 'bg-napaka-ozadje text-napaka' : 'bg-brand-50 text-brand-600'
                }`}
              >
                <Ikona ime={k.ikona} className="size-5" />
              </span>
              <span>
                <span className="block text-sm text-gray-600">{k.oznaka}</span>
                <span className="block text-2xl font-bold text-gray-900 tabular-nums">
                  {stevilo ?? '–'}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
