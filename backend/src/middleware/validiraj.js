// Preveri del zahteve z Zod shemo. Uporaba:
//   router.post('/pot', validiraj(shema), handler)              – req.body
//   router.get('/pot', validiraj(shema, 'query'), handler)      – req.query
//   router.patch('/:id', validiraj(idShema, 'params'), handler) – req.params
// Ob napaki vrne 400 s seznamom napačnih polj, ob uspehu del zahteve zamenja s
// preverjenimi podatki (neznana polja odstranjena, tipi pretvorjeni).
export const validiraj =
  (shema, vir = 'body') =>
  (req, res, next) => {
    const rezultat = shema.safeParse(req[vir] ?? {});

    if (!rezultat.success) {
      return res.status(400).json({
        sporocilo: 'Neveljavni podatki.',
        napake: rezultat.error.issues.map((napaka) => ({
          polje: napaka.path.join('.'),
          sporocilo: napaka.message,
        })),
      });
    }

    // V Express 5 sta req.query in req.params le za branje (getter), zato ju prekrijemo
    // z lastnostjo na sami zahtevi.
    Object.defineProperty(req, vir, { value: rezultat.data, writable: true, enumerable: true });
    next();
  };
