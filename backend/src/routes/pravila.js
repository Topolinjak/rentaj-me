// Pravila izposoje. Upravljanje pravil (admin, US-17) pride v ločenem issueju.
import { Router } from 'express';
import { zahtevajPrijavo, zahtevajVlogo } from '../middleware/avtentikacija.js';
import { mojaPravila } from '../services/pravila.js';
import { IZPOSOJEVALCI } from './rezervacije.js';

export const pravilaRouter = Router();

pravilaRouter.use(zahtevajPrijavo);

// GET /api/pravila/moje – omejitve prijavljenega uporabnika za namig v obrazcu.
pravilaRouter.get('/moje', zahtevajVlogo(...IZPOSOJEVALCI), async (req, res) => {
  res.json(await mojaPravila(req.uporabnik));
});
