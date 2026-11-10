// Prijava, odjava in podatki o prijavljenem uporabniku (US-01, backend routes/auth.js).
import { klic } from './klic.js';

export const prijava = (email, geslo) =>
  klic('/api/auth/prijava', { metoda: 'POST', telo: { email, geslo } });

export const odjava = () => klic('/api/auth/odjava', { metoda: 'POST' });

export const jaz = ({ signal } = {}) => klic('/api/auth/jaz', { signal });
