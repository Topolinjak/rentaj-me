// Sestavi Express aplikacijo. Tu ni app.listen(), da lahko testi (I-39) uvozijo
// aplikacijo brez zagona strežnika. Vrstni red middleware je pomemben.
import express from 'express';
import cookieParser from 'cookie-parser';
import { router } from './routes/index.js';
import { neznanaPot, obdelajNapako } from './middleware/napake.js';

export const app = express();

app.use(express.json()); // telo zahteve → req.body
app.use(cookieParser()); // piškotki → req.cookies (JWT v I-05)

app.use('/api', router);
app.use('/api', neznanaPot); // za routerjem: ujame, česar router ni obdelal

app.use(obdelajNapako); // zadnji: ujame napake iz vsega zgoraj
