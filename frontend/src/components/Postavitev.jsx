// Skupna postavitev strani za prijavljene uporabnike: glava, vsebina in noga. Stran za prijavo
// je zunaj nje, ker nima glave (dokument 07, 5.1).
import { Outlet } from 'react-router';
import Glava from './Glava.jsx';
import Noga from './Noga.jsx';

export default function Postavitev() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Uporabniki tipkovnice in bralnikov zaslona lahko preskočijo meni. */}
      <a
        href="#vsebina"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded-osnovni focus:bg-white focus:px-3 focus:py-2"
      >
        Preskoči na vsebino
      </a>
      <Glava />
      <main id="vsebina" className="flex-1">
        <Outlet />
      </main>
      <Noga />
    </div>
  );
}
