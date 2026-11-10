// Omejitve vloge prijavljenega uporabnika za namig v obrazcu (US-04).
import { klic } from './klic.js';

export const mojaPravila = ({ signal } = {}) => klic('/api/pravila/moje', { signal });
