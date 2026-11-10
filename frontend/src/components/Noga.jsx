// Noga (dokument 07, 3.6): nižja različica noge spletne strani oddelka. Uporabi jo tudi stran
// za prijavo (I-10), ki nima glave.
import { datumVLjubljani } from '../utils/datumi.js';
import { IKONE_OMREZIJ } from './ikoneOmrezij.js';

const OMREZJA = [
  { ime: 'Facebook', url: 'https://www.facebook.com/tehnikafnmum/', ikona: IKONE_OMREZIJ.facebook },
  {
    ime: 'Instagram',
    url: 'https://www.instagram.com/tehnika_fnm_um/',
    ikona: IKONE_OMREZIJ.instagram,
  },
  {
    ime: 'YouTube',
    url: 'https://www.youtube.com/@fakultetazanaravoslovjeinm3945',
    ikona: IKONE_OMREZIJ.youtube,
  },
];

export default function Noga() {
  const leto = datumVLjubljani(new Date()).slice(0, 4);

  return (
    <footer className="bg-brand-600 text-white">
      <div className="mx-auto max-w-vsebina px-4 py-6">
        <h2 className="font-bold">Kontakt</h2>
        <address className="mt-2 text-sm not-italic">
          Oddelek za tehniko FNM
          <br />
          Koroška cesta 160, 2000 Maribor
        </address>
        <ul className="mt-4 flex gap-3">
          {OMREZJA.map((omrezje) => (
            <li key={omrezje.ime}>
              <a
                href={omrezje.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${omrezje.ime} (odpre se v novem zavihku)`}
                className="flex size-11 items-center justify-center rounded-full border border-white hover:bg-white hover:text-brand-600 focus-visible:outline-white"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
                  <path d={omrezje.ikona} />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-brand-400">
        <p className="mx-auto max-w-vsebina px-4 py-3 text-sm sm:text-right">
          Rentaj.me · Oddelek za tehniko FNM {leto} – Vse pravice pridržane.
        </p>
      </div>
    </footer>
  );
}
