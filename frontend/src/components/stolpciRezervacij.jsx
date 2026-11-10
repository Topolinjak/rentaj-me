// Skupni stolpci tabel z rezervacijami za tehnika (Izdano, Zamujene).
import { Link } from 'react-router';
import { slogGumba } from './slogGumba.js';

export const stolpecUporabnika = {
  kljuc: 'uporabnik',
  oznaka: 'Uporabnik',
  vrednost: (r) => (
    <span className="font-medium text-gray-900">
      {r.uporabnik.ime} {r.uporabnik.priimek}
    </span>
  ),
  razvrsti: (r) => `${r.uporabnik.priimek} ${r.uporabnik.ime}`,
};

export const stolpecOpreme = {
  kljuc: 'oprema',
  oznaka: 'Oprema',
  vrednost: (r) => (
    <ul>
      {r.kosi.map((k) => (
        <li key={k.id}>
          {k.naziv}{' '}
          <span className="text-sm text-gray-600 tabular-nums">({k.inventarnaStevilka})</span>
        </li>
      ))}
    </ul>
  ),
};

export const stolpecVracila = {
  kljuc: 'vracilo',
  oznaka: 'Dejanje',
  vrednost: (r) => (
    <Link
      to={`/tehnik/vracilo/${r.id}`}
      className={slogGumba({ razlicica: 'sekundarni', velikost: 'majhna' })}
      aria-label={`Prevzemi vračilo: ${r.uporabnik.ime} ${r.uporabnik.priimek}`}
    >
      Prevzemi vračilo
    </Link>
  ),
};
