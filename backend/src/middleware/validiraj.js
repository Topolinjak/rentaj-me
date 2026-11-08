// Preveri req.body z Zod shemo. Uporaba: router.post('/pot', validiraj(shema), handler)
// Ob napaki vrne 400 s seznamom napačnih polj, ob uspehu req.body zamenja s
// preverjenimi podatki (neznana polja odstranjena, tipi pretvorjeni).
export const validiraj = (shema) => (req, res, next) => {
  const rezultat = shema.safeParse(req.body ?? {});

  if (!rezultat.success) {
    return res.status(400).json({
      sporocilo: 'Neveljavni podatki.',
      napake: rezultat.error.issues.map((napaka) => ({
        polje: napaka.path.join('.'),
        sporocilo: napaka.message,
      })),
    });
  }

  req.body = rezultat.data;
  next();
};
