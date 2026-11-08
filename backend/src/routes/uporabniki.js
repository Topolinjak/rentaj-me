// US-18: upravljanje uporabniških računov. Vsi endpointi samo za administratorja.
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../db.js';
import { Vloga } from '../generated/prisma/enums.ts';
import { zahtevajPrijavo, zahtevajVlogo } from '../middleware/avtentikacija.js';
import { validiraj } from '../middleware/validiraj.js';
import { BCRYPT_CENA, javniPodatkiUporabnika } from '../services/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { jeKrsitevUnikatnosti, jeNeobstojecZapis } from '../utils/prismaNapake.js';
import { besedilo, emailShema, idShema } from '../utils/sheme.js';

export const uporabnikiRouter = Router();

uporabnikiRouter.use(zahtevajPrijavo, zahtevajVlogo('ADMIN'));

const ZE_OBSTAJA = 'Uporabnik s tem e-poštnim naslovom že obstaja';

// Administrator vidi tudi, ali je račun aktiven, in kdaj je bil ustvarjen. gesloHash nikoli.
const podatkiZaAdmina = { ...javniPodatkiUporabnika, aktiven: true, ustvarjeno: true };

const gesloShema = z.string('Vnesite geslo.').min(8, 'Geslo mora imeti vsaj 8 znakov.');

const novUporabnikShema = z.object({
  ime: besedilo('Vnesite ime.'),
  priimek: besedilo('Vnesite priimek.'),
  email: emailShema,
  vloga: z.enum(Vloga, 'Izberite veljavno vlogo.'),
  geslo: gesloShema,
});

const spremembaShema = novUporabnikShema
  .extend({ aktiven: z.boolean('Polje aktiven mora biti true ali false.') })
  .partial()
  .refine((p) => Object.keys(p).length > 0, 'Ni podatkov za spremembo.');

const iskanjeShema = z.object({
  iskanje: z.string().trim().optional(),
});

// GET /api/uporabniki?iskanje=… – iskanje po imenu, priimku in e-pošti (brez velikih/malih črk).
uporabnikiRouter.get('/', validiraj(iskanjeShema, 'query'), async (req, res) => {
  const { iskanje } = req.query;
  const vsebuje = { contains: iskanje, mode: 'insensitive' };

  const uporabniki = await prisma.uporabnik.findMany({
    where: iskanje
      ? { OR: [{ ime: vsebuje }, { priimek: vsebuje }, { email: vsebuje }] }
      : undefined,
    select: podatkiZaAdmina,
    orderBy: [{ priimek: 'asc' }, { ime: 'asc' }],
  });
  res.json(uporabniki);
});

// POST /api/uporabniki – nov račun (javne registracije ni, ADR-0009).
uporabnikiRouter.post('/', validiraj(novUporabnikShema), async (req, res) => {
  const { geslo, ...podatki } = req.body;

  try {
    const uporabnik = await prisma.uporabnik.create({
      data: { ...podatki, gesloHash: await bcrypt.hash(geslo, BCRYPT_CENA) },
      select: podatkiZaAdmina,
    });
    res.status(201).json(uporabnik);
  } catch (napaka) {
    if (jeKrsitevUnikatnosti(napaka)) throw new ApiError(409, ZE_OBSTAJA);
    throw napaka;
  }
});

// PATCH /api/uporabniki/:id – urejanje, ponastavitev gesla in (de)aktivacija. Brisanja ni:
// rezervacije in zgodovina uporabnika morajo ostati v bazi.
uporabnikiRouter.patch(
  '/:id',
  validiraj(idShema, 'params'),
  validiraj(spremembaShema),
  async (req, res) => {
    const { id } = req.params;
    const { geslo, ...podatki } = req.body;

    // Administrator si ne sme sam zakleniti dostopa.
    const odvzemVloge = podatki.vloga !== undefined && podatki.vloga !== 'ADMIN';
    if (id === req.uporabnik.id && (podatki.aktiven === false || odvzemVloge)) {
      throw new ApiError(400, 'Svojega računa ne morete deaktivirati ali mu odvzeti vloge.');
    }

    if (geslo) {
      podatki.gesloHash = await bcrypt.hash(geslo, BCRYPT_CENA);
    }

    try {
      const uporabnik = await prisma.uporabnik.update({
        where: { id },
        data: podatki,
        select: podatkiZaAdmina,
      });
      res.json(uporabnik);
    } catch (napaka) {
      if (jeNeobstojecZapis(napaka)) throw new ApiError(404, 'Uporabnik ne obstaja.');
      if (jeKrsitevUnikatnosti(napaka)) throw new ApiError(409, ZE_OBSTAJA);
      throw napaka;
    }
  },
);
