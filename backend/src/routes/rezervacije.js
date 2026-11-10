// Rezervacije. Logika je v services/rezervacije.js, tu sta le validacija in dostop.
import { Router } from 'express';
import { z } from 'zod';
import { RazlogZavrnitve, StanjeOpreme, StatusRezervacije } from '../generated/prisma/enums.ts';
import { zahtevajPrijavo, zahtevajVlogo } from '../middleware/avtentikacija.js';
import { validiraj } from '../middleware/validiraj.js';
import {
  izdajRezervacijo,
  oddajRezervacijo,
  odobriRezervacijo,
  opozorilaZaRezervacijo,
  seznamRezervacij,
  stevciRezervacij,
  zavrniRezervacijo,
} from '../services/rezervacije.js';
import { danes, jeVeljavenDatum } from '../utils/datumi.js';
import { besedilo, idShema, neobveznoBesedilo, obdobjeShema } from '../utils/sheme.js';

export const rezervacijeRouter = Router();

rezervacijeRouter.use(zahtevajPrijavo);

// Vloge, ki si opremo izposojajo. Tehnik in administrator je ne (dokument 02).
export const IZPOSOJEVALCI = ['STUDENT', 'ASISTENT', 'PROFESOR'];

// Vloge, ki vidijo rezervacije vseh uporabnikov (US-05, US-09).
const OSEBJE = ['TEHNIK', 'ADMIN'];

// ?status=ODDANA ali ?zamujene=true (ne oboje – zamujene so vedno IZDANA).
const seznamShema = z
  .object({
    status: z.enum(StatusRezervacije, 'Neveljaven status.').optional(),
    zamujene: z
      .enum(['true', 'false'], 'Parameter zamujene je lahko true ali false.')
      .optional()
      .transform((v) => v === 'true'),
  })
  .refine((q) => !(q.status && q.zamujene), {
    path: ['zamujene'],
    message: 'Parametrov status in zamujene ni mogoče združiti.',
  });

const zavrnitevShema = z.object({
  razlogZavrnitve: z.enum(RazlogZavrnitve, 'Izberite razlog zavrnitve.'),
  komentarTehnika: neobveznoBesedilo,
});

// Stanje vsakega kosa ob izdaji: { kosi: [{ id, stanje }] }.
const izdajaShema = z.object({
  kosi: z
    .array(
      z.object({
        id: z.number('Neveljaven kos.').int().positive('Neveljaven kos.'),
        stanje: z.enum(StanjeOpreme, 'Izberite stanje kosa.'),
      }),
      'Izberite stanje za vse kose.',
    )
    .min(1, 'Izberite stanje za vse kose.'),
});

const oddajaShema = obdobjeShema()
  .extend({
    kosi: z
      .array(z.number('Neveljaven kos.').int().positive(), 'Izberite vsaj en kos opreme.')
      .min(1, 'Izberite vsaj en kos opreme.')
      .transform((kosi) => [...new Set(kosi)]),
    namen: besedilo('Vnesite namen izposoje.'),
    dolgorocna: z.boolean().default(false),
  })
  // Začetek v preteklosti: prvi dan pred današnjim dnem v Ljubljani (ADR-0013).
  .superRefine((o, ctx) => {
    if (jeVeljavenDatum(o.od) && o.od < danes()) {
      ctx.addIssue({ code: 'custom', path: ['od'], message: 'Začetek ne sme biti v preteklosti.' });
    }
  });

// POST /api/rezervacije – oddaja rezervacije.
rezervacijeRouter.post(
  '/',
  zahtevajVlogo(...IZPOSOJEVALCI),
  validiraj(oddajaShema),
  async (req, res) => {
    res.status(201).json(await oddajRezervacijo(req.uporabnik, req.body));
  },
);

// GET /api/rezervacije – seznam za tehnika (US-05: ?status=ODDANA, US-09: ?zamujene=true).
rezervacijeRouter.get(
  '/',
  zahtevajVlogo(...OSEBJE),
  validiraj(seznamShema, 'query'),
  async (req, res) => {
    res.json(await seznamRezervacij(req.query));
  },
);

// GET /api/rezervacije/stevci – števci za nadzorno ploščo tehnika.
rezervacijeRouter.get('/stevci', zahtevajVlogo(...OSEBJE), async (req, res) => {
  res.json(await stevciRezervacij());
});

// GET /api/rezervacije/:id/opozorila – zamujene izposoje in neporavnane poškodbe uporabnika,
// ki je oddal rezervacijo :id (US-11, klik na opozorilo).
rezervacijeRouter.get(
  '/:id/opozorila',
  zahtevajVlogo(...OSEBJE),
  validiraj(idShema, 'params'),
  async (req, res) => {
    res.json(await opozorilaZaRezervacijo(req.params.id));
  },
);

// PATCH /api/rezervacije/:id/odobritev – le tehnik, tudi administrator ne (US-05).
rezervacijeRouter.patch(
  '/:id/odobritev',
  zahtevajVlogo('TEHNIK'),
  validiraj(idShema, 'params'),
  async (req, res) => {
    res.json(await odobriRezervacijo(req.params.id, req.uporabnik));
  },
);

// PATCH /api/rezervacije/:id/zavrnitev – le tehnik, razlog je obvezen (US-06).
rezervacijeRouter.patch(
  '/:id/zavrnitev',
  zahtevajVlogo('TEHNIK'),
  validiraj(idShema, 'params'),
  validiraj(zavrnitevShema),
  async (req, res) => {
    res.json(await zavrniRezervacijo(req.params.id, req.uporabnik, req.body));
  },
);

// PATCH /api/rezervacije/:id/izdaja – le tehnik, stanje za vsak kos je obvezno (US-07).
rezervacijeRouter.patch(
  '/:id/izdaja',
  zahtevajVlogo('TEHNIK'),
  validiraj(idShema, 'params'),
  validiraj(izdajaShema),
  async (req, res) => {
    res.json(await izdajRezervacijo(req.params.id, req.body));
  },
);
