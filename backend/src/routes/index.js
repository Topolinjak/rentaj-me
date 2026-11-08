// Router za /api. Nove skupine rut (auth, oprema, rezervacije …) priklopi tukaj.
import { Router } from 'express';

export const router = Router();

// Preverjanje, ali strežnik teče (Docker, CI, ročno s curl). Ne potrebuje prijave.
router.get('/zdravje', (req, res) => {
  res.json({ status: 'ok' });
});
