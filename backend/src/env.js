// Naloži .env iz korena repozitorija. Uvozi se kot PRVI v server.js, ker se v ESM
// vsi importi izvedejo pred kodo modula – db.js mora ob uvozu že videti DATABASE_URL.
// Če spremenljivke že obstajajo (npr. v Dockerju), jih dotenv ne povozi.
import { config } from 'dotenv';

config({ path: new URL('../../.env', import.meta.url), quiet: true });
