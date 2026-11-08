// Rezervacije. Logika je v services/rezervacije.js, tu sta le validacija in dostop.
import { Router } from 'express';
import { z } from 'zod';
import { zahtevajPrijavo, zahtevajVlogo } from '../middleware/avtentikacija.js';
import { validiraj } from '../middleware/validiraj.js';
import { oddajRezervacijo } from '../services/rezervacije.js';
import { danes, jeVeljavenDatum } from '../utils/datumi.js';
import { besedilo, obdobjeShema } from '../utils/sheme.js';

export const rezervacijeRouter = Router();

rezervacijeRouter.use(zahtevajPrijavo);

// Vloge, ki si opremo izposojajo. Tehnik in administrator je ne (dokument 02).
export const IZPOSOJEVALCI = ['STUDENT', 'ASISTENT', 'PROFESOR'];

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
