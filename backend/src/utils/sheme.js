// Zod sheme, ki se ponavljajo v več rutah.
import { z } from 'zod';

// E-poštni naslov: obreže presledke in pretvori v male črke, da je iskanje enolično.
export const emailShema = z
  .string('Vnesite e-poštni naslov.')
  .trim()
  .toLowerCase()
  .pipe(z.email('Vnesite veljaven e-poštni naslov.'));

// Obvezno besedilo, obrezano.
export const besedilo = (sporocilo) => z.string(sporocilo).trim().min(1, sporocilo);

// Parameter :id v poti.
export const idShema = z.object({
  id: z.coerce.number('Neveljaven id.').int('Neveljaven id.').positive('Neveljaven id.'),
});
