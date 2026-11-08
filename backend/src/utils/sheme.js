// Zod sheme, ki se ponavljajo v več rutah.
import { z } from 'zod';
import { jeVeljavenDatum } from './datumi.js';

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

// Neobvezno besedilo: prazen niz ali null pomeni »brez vrednosti« (shrani se null).
export const neobveznoBesedilo = z
  .string()
  .trim()
  .nullish()
  .transform((v) => v || null);

// Datum v obliki YYYY-MM-DD (ADR-0013).
export const datumShema = z
  .string('Vnesite datum.')
  .refine(jeVeljavenDatum, 'Datum mora biti v obliki LLLL-MM-DD.');
