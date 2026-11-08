// Oprema (US-19): dodajanje kosov in sprememba statusa. Brisanja ni – umaknjen kos ostane v
// bazi skupaj z zgodovino izposoj (status UMAKNJEN), a se v katalogu ne prikaže.
// Katalog in zasedenost (US-02): vsi prijavljeni.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { StanjeOpreme, StatusOpreme } from '../generated/prisma/enums.ts';
import { zahtevajPrijavo, zahtevajVlogo } from '../middleware/avtentikacija.js';
import { validiraj } from '../middleware/validiraj.js';
import { ApiError } from '../utils/ApiError.js';
import { datumiIzTermina, terminIzDatumov } from '../utils/datumi.js';
import {
  jeKrsitevUnikatnosti,
  jeNeobstojecZapis,
  jeNeveljavenTujiKljuc,
} from '../utils/prismaNapake.js';
import { besedilo, idShema, neobveznoBesedilo, obdobjeShema } from '../utils/sheme.js';
import { zasedaKos } from '../services/termini.js';

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

// Najdaljše obdobje, za katero se lahko vpraša po zasedenosti (koledar prikazuje mesec).
const NAJVEC_DNI_ZASEDENOSTI = 366;

const zasedenostShema = obdobjeShema(NAJVEC_DNI_ZASEDENOSTI);

// Kos, ki ga katalog prikaže (vsi razen umaknjenih), ali 404.
async function najdiKosVKatalogu(id) {
  const kos = await prisma.kosOpreme.findFirst({
    where: { id, status: { not: 'UMAKNJEN' } },
    include: vkljuciKategorijo,
  });
  if (!kos) throw new ApiError(404, 'Kos opreme ne obstaja.');
  return kos;
}

// GET /api/oprema – katalog: vsi kosi razen umaknjenih, s kategorijo.
opremaRouter.get('/', async (req, res) => {
  const kosi = await prisma.kosOpreme.findMany({
    where: { status: { not: 'UMAKNJEN' } },
    include: vkljuciKategorijo,
    orderBy: [{ naziv: 'asc' }, { inventarnaStevilka: 'asc' }],
  });
  res.json(kosi);
});

// GET /api/oprema/:id – podrobnosti kosa.
opremaRouter.get('/:id', validiraj(idShema, 'params'), async (req, res) => {
  res.json(await najdiKosVKatalogu(req.params.id));
});

// GET /api/oprema/:id/zasedenost?od=YYYY-MM-DD&do=YYYY-MM-DD – obdobja, ko je kos zaseden
// (rezervacije ODDANA, ODOBRENA, IZDANA), ki se prekrivajo z obdobjem od–do. Odgovor
// namenoma ne vsebuje uporabnika, e-pošte ali namena (US-02, kriterij 3).
opremaRouter.get(
  '/:id/zasedenost',
  validiraj(idShema, 'params'),
  validiraj(zasedenostShema, 'query'),
  async (req, res) => {
    const kos = await najdiKosVKatalogu(req.params.id);
    const rezervacije = await prisma.rezervacija.findMany({
      where: zasedaKos(kos.id, terminIzDatumov(req.query.od, req.query.do)),
      select: { zacetek: true, konec: true },
      orderBy: { zacetek: 'asc' },
    });
    res.json(rezervacije.map(datumiIzTermina));
  },
);

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
