// Napaka z HTTP statusom. Vrži jo kjerkoli (rute, servisi), error handler v
// middleware/napake.js jo pretvori v odgovor { sporocilo }.
export class ApiError extends Error {
  constructor(status, sporocilo) {
    super(sporocilo);
    this.name = 'ApiError';
    this.status = status;
  }
}
