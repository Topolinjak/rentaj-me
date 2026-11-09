// Zamujene izposoje (ADR-0007). Status »zamujena« se ne shranjuje, ampak izračuna ob branju:
// rezervacija je zamujena, ko je IZDANA in je rok vračila (konec) že potekel.
// Ta modul je edino mesto, kjer je ta pogoj zapisan – seznam, števec na nadzorni plošči in
// oznaka pri posamezni rezervaciji morajo uporabljati iste funkcije, sicer bi se lahko razhajali.
import { datumVLjubljani, steviloDni } from '../utils/datumi.js';

// Prisma pogoj za filtriranje v bazi (seznam in števec zamud).
export const pogojZamujena = (zdaj) => ({
  status: 'IZDANA',
  konec: { lt: zdaj },
});

// Isti pogoj za rezervacijo, ki je že prebrana iz baze.
export const jeZamujena = (rezervacija, zdaj) =>
  rezervacija.status === 'IZDANA' && rezervacija.konec < zdaj;

// Število dni zamude. `konec` je polnoč po zadnjem dnevu izposoje (ADR-0013), zato je
// izposoja z zadnjim dnem 10. 11. na dan 11. 11. zamujena 1 dan.
export const dniZamude = (rezervacija, zdaj) =>
  jeZamujena(rezervacija, zdaj)
    ? steviloDni(datumVLjubljani(rezervacija.konec), datumVLjubljani(zdaj))
    : 0;
