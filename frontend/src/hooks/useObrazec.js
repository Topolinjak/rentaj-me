// Stanje obrazca: vrednosti, napake pri poljih, splošna napaka in oddaja.
//   const o = useObrazec(ZACETNO, (podatki) => api(podatki), { polje409: 'email' });
//   <form onSubmit={o.oddaj}> <Polje {...o.polje('email')} /> ... {o.napaka && ...}
// oddaj vrne rezultat API-ja ali undefined ob napaki. Napake 400 gredo k poljem; 409 k polju
// polje409 (npr. podvojen e-poštni naslov), sicer v splošno napako.
import { useCallback, useState } from 'react';
import { napakePoPoljih } from '../api/klic.js';

export function useObrazec(zacetno, poslji, { polje409 } = {}) {
  const [podatki, setPodatki] = useState(zacetno);
  const [napake, setNapake] = useState({});
  const [napaka, setNapaka] = useState(null);
  const [posiljanje, setPosiljanje] = useState(false);

  const polje = (ime) => ({
    name: ime,
    value: podatki[ime] ?? '',
    onChange: (e) => setPodatki((p) => ({ ...p, [ime]: e.target.value })),
    napaka: napake[ime],
  });

  const ponastavi = useCallback(
    (vrednosti = zacetno) => {
      setPodatki(vrednosti);
      setNapake({});
      setNapaka(null);
    },
    [zacetno],
  );

  async function oddaj(dogodek) {
    dogodek?.preventDefault();
    setPosiljanje(true);
    setNapake({});
    setNapaka(null);
    try {
      return await poslji(podatki);
    } catch (e) {
      if (e.napake?.length) setNapake(napakePoPoljih(e));
      else if (e.status === 409 && polje409) setNapake({ [polje409]: e.message });
      else setNapaka(e.message);
      return undefined;
    } finally {
      setPosiljanje(false);
    }
  }

  return { podatki, setPodatki, polje, napake, napaka, posiljanje, oddaj, ponastavi };
}
