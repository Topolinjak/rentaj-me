// Oprema (US-19): dodajanje kosov in sprememba statusa. Brisanja ni – umaknjen kos ostane v
// bazi skupaj z zgodovino izposoj (status UMAKNJEN). Katalog (GET) doda I-17.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { StanjeOpreme, StatusOpreme } from '../generated/prisma/enums.ts';
import { zahtevajPrijavo, zahtevajVlogo } from '../middleware/avtentikacija.js';
import { validiraj } from '../middleware/validiraj.js';
import { ApiError } from '../utils/ApiError.js';
import {
  jeKrsitevUnikatnosti,
  jeNeobstojecZapis,
  jeNeveljavenTujiKljuc,
} from '../utils/prismaNapake.js';
import { besedilo, idShema, neobveznoBesedilo } from '../utils/sheme.js';

export const opremaRouter = Router();

opremaRouter.use(zahtevajPrijavo);

const ZE_OBSTAJA = 'Kos s to inventarno številko že obstaja';

// Rezervacije, ki so oddane ali odobrene, a oprema še ni izdana. Tehnik mora vedeti zanje,
// ko kos označi kot pokvarjen ali umaknjen.
const ODPRTI_STATUSI = ['ODDANA', 'ODOBRENA'];

const novKosShema = z.object({
  inventarnaStevilka: besedilo('Vnesite inventarno številko.'),
  naziv: besedilo('Vnesite naziv.'),
  opis: neobveznoBesedilo,
  kategorijaId: z.coerce.number('Izberite kategorijo.').int().positive('Izberite kategorijo.'),
  trenutnoStanje: z.enum(StanjeOpreme, 'Izberite začetno stanje.'),
});

const spremembaShema = novKosShema
  .extend({ status: z.enum(StatusOpreme, 'Izberite veljaven status.') })
  .partial()
  .refine((p) => Object.keys(p).length > 0, 'Ni podatkov za spremembo.');

const vkljuciKategorijo = { kategorija: { select: { id: true, naziv: true } } };

async function steviloOdprtihRezervacij(kosOpremeId) {
  return prisma.rezervacija.count({
    where: { status: { in: ODPRTI_STATUSI }, postavke: { some: { kosOpremeId } } },
  });
}

function pretvoriNapako(napaka) {
  if (jeKrsitevUnikatnosti(napaka)) return new ApiError(409, ZE_OBSTAJA);
  if (jeNeveljavenTujiKljuc(napaka)) return new ApiError(400, 'Izbrana kategorija ne obstaja.');
  if (jeNeobstojecZapis(napaka)) return new ApiError(404, 'Kos opreme ne obstaja.');
  return napaka;
}

// POST /api/oprema – nov kos je vedno NA_VOLJO.
opremaRouter.post(
  '/',
  zahtevajVlogo('TEHNIK', 'ADMIN'),
  validiraj(novKosShema),
  async (req, res) => {
    try {
      const kos = await prisma.kosOpreme.create({
        data: { ...req.body, status: 'NA_VOLJO' },
        include: vkljuciKategorijo,
      });
      res.status(201).json(kos);
    } catch (napaka) {
      throw pretvoriNapako(napaka);
    }
  },
);

// PATCH /api/oprema/:id – urejanje in sprememba statusa (NA_VOLJO, V_OKVARI, UMAKNJEN).
// Odgovor vsebuje odprteRezervacije, da frontend tehniku pokaže, koliko rezervacij je prizadetih.
opremaRouter.patch(
  '/:id',
  zahtevajVlogo('TEHNIK', 'ADMIN'),
  validiraj(idShema, 'params'),
  validiraj(spremembaShema),
  async (req, res) => {
    let kos;
    try {
      kos = await prisma.kosOpreme.update({
        where: { id: req.params.id },
        data: req.body,
        include: vkljuciKategorijo,
      });
    } catch (napaka) {
      throw pretvoriNapako(napaka);
    }
    res.json({ ...kos, odprteRezervacije: await steviloOdprtihRezervacij(kos.id) });
  },
);
