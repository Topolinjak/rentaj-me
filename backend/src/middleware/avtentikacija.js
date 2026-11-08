import { prisma } from '../db.js';
import { IME_PISKOTKA, preveriZeton } from '../services/auth.js';
import { ApiError } from '../utils/ApiError.js';

// Prebere JWT iz piškotka in v req.uporabnik zapiše { id, vloga }; sicer 401.
// Uporabnika vsakič prebere iz baze: deaktiviran račun ali spremenjena vloga začneta
// veljati takoj, ne šele, ko žeton po 8 urah poteče.
export async function zahtevajPrijavo(req, res, next) {
  const zeton = req.cookies?.[IME_PISKOTKA];
  if (!zeton) {
    throw new ApiError(401, 'Prijava je obvezna.');
  }

  let vsebina;
  try {
    vsebina = preveriZeton(zeton);
  } catch {
    throw new ApiError(401, 'Seja je potekla. Prijavite se znova.');
  }

  const uporabnik = await prisma.uporabnik.findUnique({
    where: { id: Number(vsebina.sub) },
    select: { id: true, vloga: true, aktiven: true },
  });
  if (!uporabnik || !uporabnik.aktiven) {
    throw new ApiError(401, 'Prijava je obvezna.');
  }

  req.uporabnik = { id: uporabnik.id, vloga: uporabnik.vloga };
  next();
}

// Uporabi za zahtevajPrijavo: router.get('/pot', zahtevajPrijavo, zahtevajVlogo('TEHNIK'), …)
export function zahtevajVlogo(...vloge) {
  return (req, res, next) => {
    if (!vloge.includes(req.uporabnik?.vloga)) {
      throw new ApiError(403, 'Za to dejanje nimate pravic.');
    }
    next();
  };
}
