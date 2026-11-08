// US-01: prijava, odjava in podatki o prijavljenem uporabniku.
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validiraj } from '../middleware/validiraj.js';
import { emailShema } from '../utils/sheme.js';
import { zahtevajPrijavo } from '../middleware/avtentikacija.js';
import {
  IME_PISKOTKA,
  javniPodatkiUporabnika,
  nastavitvePiskotka,
  trajanjePiskotkaMs,
  ustvariZeton,
} from '../services/auth.js';
import { ApiError } from '../utils/ApiError.js';

export const authRouter = Router();

const NAPACNI_PODATKI = 'Napačen e-poštni naslov ali geslo';

// Hash naključnega gesla. Ko uporabnik ne obstaja, z njim vseeno izvedemo bcrypt.compare,
// da odgovor traja enako dolgo – sicer bi iz časa odgovora lahko ugotovili, kateri e-poštni
// naslovi obstajajo.
const LAZNI_HASH = await bcrypt.hash(crypto.randomUUID(), 10);

const prijavaShema = z.object({
  email: emailShema,
  geslo: z.string('Vnesite geslo.').min(1, 'Vnesite geslo.'),
});

authRouter.post('/prijava', validiraj(prijavaShema), async (req, res) => {
  const { email, geslo } = req.body;

  const uporabnik = await prisma.uporabnik.findUnique({ where: { email } });
  const gesloPravilno = await bcrypt.compare(geslo, uporabnik?.gesloHash ?? LAZNI_HASH);

  if (!uporabnik || !gesloPravilno) {
    throw new ApiError(401, NAPACNI_PODATKI);
  }
  // Šele po pravilnem geslu, da se obstoj deaktiviranega računa ne razkrije.
  if (!uporabnik.aktiven) {
    throw new ApiError(403, 'Račun je deaktiviran. Obrnite se na administratorja.');
  }

  res.cookie(IME_PISKOTKA, ustvariZeton(uporabnik), {
    ...nastavitvePiskotka,
    maxAge: trajanjePiskotkaMs,
  });

  const { id, ime, priimek, vloga } = uporabnik;
  res.json({ id, ime, priimek, email: uporabnik.email, vloga });
});

authRouter.post('/odjava', zahtevajPrijavo, (req, res) => {
  res.clearCookie(IME_PISKOTKA, nastavitvePiskotka);
  res.status(204).end();
});

authRouter.get('/jaz', zahtevajPrijavo, async (req, res) => {
  const uporabnik = await prisma.uporabnik.findUnique({
    where: { id: req.uporabnik.id },
    select: javniPodatkiUporabnika,
  });
  res.json(uporabnik);
});
