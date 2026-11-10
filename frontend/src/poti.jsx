// Poti aplikacije (MVP, issue I-06). Vloge v komentarjih so informativne – zaščito poti in
// preusmeritev na začetno stran vloge (US-01) doda I-08.
import { Navigate } from 'react-router';
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
  // Začasno na prijavo; I-08 preusmeri na začetno stran vloge.
  { path: '/', element: <Navigate to="/prijava" replace /> },
  { path: '/prijava', element: <Prijava /> }, // vsi

  // študent, asistent, profesor
  { path: '/katalog', element: <Katalog /> },
  { path: '/oprema/:id', element: <KosOpreme /> },
  { path: '/rezervacija', element: <Rezervacija /> },
  { path: '/moje-izposoje', element: <MojeIzposoje /> },

  // tehnik
  { path: '/tehnik', element: <TehnikOddane /> },
  { path: '/tehnik/odobrene', element: <TehnikOdobrene /> },
  { path: '/tehnik/izdane', element: <TehnikIzdane /> },
  { path: '/tehnik/zamujene', element: <TehnikZamujene /> },
  { path: '/tehnik/vracilo/:id', element: <TehnikVracilo /> },

  // tehnik, admin
  { path: '/inventar', element: <Inventar /> },

  // admin
  { path: '/admin/uporabniki', element: <AdminUporabniki /> },
  { path: '/admin/kategorije', element: <AdminKategorije /> },

  { path: '*', element: <NiNajdeno /> },
];
