// Podatki rezervacije na seznamih tehnika: uporabnik in vloga, oprema z inventarnimi
// številkami, termin s trajanjem in namen (US-05).
import { OZNAKE_VLOG } from '../auth/vloge.js';
import { obdobje, steviloDni } from '../utils/datumi.js';
import { steviloDniBesedilo } from '../utils/oznake.js';

export default function PodatkiRezervacije({ r, email = false }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
      <dt className="text-sm text-gray-600">Uporabnik</dt>
      <dd>
        <span className="font-medium text-gray-900">
          {r.uporabnik.ime} {r.uporabnik.priimek}
        </span>{' '}
        <span className="text-sm text-gray-600">· {OZNAKE_VLOG[r.uporabnik.vloga]}</span>
        {email && <span className="block text-sm text-gray-600">{r.uporabnik.email}</span>}
      </dd>
      <dt className="text-sm text-gray-600">Oprema</dt>
      <dd>
        <ul>
          {r.kosi.map((k) => (
            <li key={k.id}>
              {k.naziv}{' '}
              <span className="text-sm text-gray-600 tabular-nums">({k.inventarnaStevilka})</span>
            </li>
          ))}
        </ul>
      </dd>
      <dt className="text-sm text-gray-600">Termin</dt>
      <dd className="tabular-nums">
        {obdobje(r.od, r.do)}{' '}
        <span className="text-sm text-gray-600">
          ({steviloDniBesedilo(steviloDni(r.od, r.do))})
        </span>
      </dd>
      <dt className="text-sm text-gray-600">Namen</dt>
      <dd>{r.namen}</dd>
    </dl>
  );
}
