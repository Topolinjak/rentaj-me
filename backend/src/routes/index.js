// Router za /api. Nove skupine rut (auth, oprema, rezervacije …) priklopi tukaj.
import { Router } from 'express';
import { authRouter } from './auth.js';
import { kategorijeRouter } from './kategorije.js';
import { opremaRouter } from './oprema.js';
import { pravilaRouter } from './pravila.js';
import { rezervacijeRouter } from './rezervacije.js';
import { uporabnikiRouter } from './uporabniki.js';

export const router = Router();

// Preverjanje, ali strežnik teče (Docker, CI, ročno s curl). Ne potrebuje prijave.
router.get('/zdravje', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/uporabniki', uporabnikiRouter);
router.use('/kategorije', kategorijeRouter);
router.use('/oprema', opremaRouter);
router.use('/rezervacije', rezervacijeRouter);
router.use('/pravila', pravilaRouter);
