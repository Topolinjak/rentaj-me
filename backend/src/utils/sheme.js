// Zod sheme, ki se ponavljajo v več rutah.
import { z } from 'zod';
import { jeVeljavenDatum, steviloDni } from './datumi.js';

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

// Obdobje { od, do } (oba vključena, ADR-0013). Preverjanje vrstnega reda in dolžine se izvede
// le, ko sta oba datuma veljavna – Zod 4 sicer izvede refine na objektu tudi ob napakah polj.
export const obdobjeShema = (najvecDni) =>
  z.object({ od: datumShema, do: datumShema }).superRefine((o, ctx) => {
    if (!jeVeljavenDatum(o.od) || !jeVeljavenDatum(o.do)) return;
    if (o.do < o.od) {
      ctx.addIssue({ code: 'custom', path: ['do'], message: 'Datum »do« ne sme biti pred »od«.' });
    } else if (najvecDni && steviloDni(o.od, o.do) > najvecDni) {
      ctx.addIssue({
        code: 'custom',
        path: ['do'],
        message: `Obdobje je lahko dolgo največ ${najvecDni} dni.`,
      });
    }
  });
