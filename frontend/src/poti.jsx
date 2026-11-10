// Poti aplikacije. Vsaka skupina strani je za ZascitenaPot z vlogami, ki jih sme videti
// (dokument 02); vse razen prijave so v skupni postavitvi z glavo in nogo (I-08).
import { IZPOSOJEVALCI } from './auth/vloge.js';
import Postavitev from './components/Postavitev.jsx';
import ZacetnaPreusmeritev from './components/ZacetnaPreusmeritev.jsx';
import ZascitenaPot from './components/ZascitenaPot.jsx';
import AdminKategorije from './pages/AdminKategorije.jsx';
import AdminUporabniki from './pages/AdminUporabniki.jsx';
import Inventar from './pages/Inventar.jsx';
import Katalog from './pages/Katalog.jsx';
import KosOpreme from './pages/KosOpreme.jsx';
import MojeIzposoje from './pages/MojeIzposoje.jsx';
import NiNajdeno from './pages/NiNajdeno.jsx';
import Prijava from './pages/Prijava.jsx';
import Rezervacija from './pages/Rezervacija.jsx';
import TehnikIzdane from './pages/TehnikIzdane.jsx';
import TehnikOddane from './pages/TehnikOddane.jsx';
import TehnikOdobrene from './pages/TehnikOdobrene.jsx';
import TehnikVracilo from './pages/TehnikVracilo.jsx';
import TehnikZamujene from './pages/TehnikZamujene.jsx';

export const poti = [
  // Na začetno stran vloge (US-01) ali na prijavo.
  { path: '/', element: <ZacetnaPreusmeritev /> },
  { path: '/prijava', element: <Prijava /> },

  {
    element: <Postavitev />,
    children: [
      {
        element: <ZascitenaPot vloge={IZPOSOJEVALCI} />,
        children: [
          { path: '/katalog', element: <Katalog /> },
          { path: '/oprema/:id', element: <KosOpreme /> },
          { path: '/rezervacija', element: <Rezervacija /> },
          { path: '/moje-izposoje', element: <MojeIzposoje /> },
        ],
      },
      {
        element: <ZascitenaPot vloge={['TEHNIK']} />,
        children: [
          { path: '/tehnik', element: <TehnikOddane /> },
          { path: '/tehnik/odobrene', element: <TehnikOdobrene /> },
          { path: '/tehnik/izdane', element: <TehnikIzdane /> },
          { path: '/tehnik/zamujene', element: <TehnikZamujene /> },
          { path: '/tehnik/vracilo/:id', element: <TehnikVracilo /> },
        ],
      },
      {
        element: <ZascitenaPot vloge={['TEHNIK', 'ADMIN']} />,
        children: [{ path: '/inventar', element: <Inventar /> }],
      },
      {
        element: <ZascitenaPot vloge={['ADMIN']} />,
        children: [
          { path: '/admin/uporabniki', element: <AdminUporabniki /> },
          { path: '/admin/kategorije', element: <AdminKategorije /> },
        ],
      },
      // Pregled komponent le med razvojem. Uvoz je dinamičen, zato ga build (DEV = false)
      // skupaj s stranjo izpusti.
      ...(import.meta.env.DEV
        ? [
            {
              path: '/razvoj/komponente',
              lazy: async () => ({
                Component: (await import('./pages/RazvojKomponente.jsx')).default,
              }),
            },
          ]
        : []),
      // 404 je v postavitvi, a brez zaščite: prijavljen uporabnik vidi meni, ostali le glavo.
      { path: '*', element: <NiNajdeno /> },
    ],
  },
];
