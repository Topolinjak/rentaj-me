import { ApiError } from '../utils/ApiError.js';

// Za vse poti pod /api, ki jih router ni obdelal. Brez tega Express vrne HTML »Cannot GET«.
export function neznanaPot(req, res, next) {
  next(new ApiError(404, 'Pot ne obstaja.'));
}

// Centralni error handler. Express ga prepozna po ŠTIRIH parametrih, zato next ostane.
export function obdelajNapako(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ sporocilo: err.message });
  }

  // Pokvarjen JSON v telesu zahteve je napaka odjemalca, ne strežnika.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ sporocilo: 'Telo zahteve ni veljaven JSON.' });
  }

  // Neznana napaka: podrobnosti samo v log, uporabniku splošno sporočilo.
  console.error(err);
  res.status(500).json({ sporocilo: 'Prišlo je do napake na strežniku.' });
}
