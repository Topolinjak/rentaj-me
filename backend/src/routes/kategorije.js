// Kategorije opreme (US-19). Seznam vidijo vsi prijavljeni (obrazec za nov kos, filter v
// katalogu), spreminja jih le administrator.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { zahtevajPrijavo, zahtevajVlogo } from '../middleware/avtentikacija.js';
import { validiraj } from '../middleware/validiraj.js';
import { ApiError } from '../utils/ApiError.js';
import { jeKrsitevUnikatnosti, jeNeobstojecZapis } from '../utils/prismaNapake.js';
import { besedilo, idShema, neobveznoBesedilo } from '../utils/sheme.js';

export const kategorijeRouter = Router();

kategorijeRouter.use(zahtevajPrijavo);

const ZE_OBSTAJA = 'Kategorija s tem nazivom že obstaja';

const kategorijaShema = z.object({
  naziv: besedilo('Vnesite naziv kategorije.'),
  opis: neobveznoBesedilo,
});

const spremembaShema = kategorijaShema
  .partial()
  .refine((p) => Object.keys(p).length > 0, 'Ni podatkov za spremembo.');

kategorijeRouter.get('/', async (req, res) => {
  const kategorije = await prisma.kategorija.findMany({ orderBy: { naziv: 'asc' } });
  res.json(kategorije);
});

kategorijeRouter.post('/', zahtevajVlogo('ADMIN'), validiraj(kategorijaShema), async (req, res) => {
  try {
    res.status(201).json(await prisma.kategorija.create({ data: req.body }));
  } catch (napaka) {
    if (jeKrsitevUnikatnosti(napaka)) throw new ApiError(409, ZE_OBSTAJA);
    throw napaka;
  }
});

kategorijeRouter.patch(
  '/:id',
  zahtevajVlogo('ADMIN'),
  validiraj(idShema, 'params'),
  validiraj(spremembaShema),
  async (req, res) => {
    try {
      res.json(await prisma.kategorija.update({ where: { id: req.params.id }, data: req.body }));
    } catch (napaka) {
      if (jeNeobstojecZapis(napaka)) throw new ApiError(404, 'Kategorija ne obstaja.');
      if (jeKrsitevUnikatnosti(napaka)) throw new ApiError(409, ZE_OBSTAJA);
      throw napaka;
    }
  },
);
