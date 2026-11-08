import { describe, expect, it } from 'vitest';
import { api } from './pomocniki.js';

describe('ogrodje API', () => {
  it('GET /api/zdravje vrne 200', async () => {
    const odgovor = await api().get('/api/zdravje');
    expect(odgovor.status).toBe(200);
    expect(odgovor.body).toEqual({ status: 'ok' });
  });

  it('neznana pot pod /api vrne 404 z { sporocilo }', async () => {
    const odgovor = await api().get('/api/neobstaja');
    expect(odgovor.status).toBe(404);
    expect(odgovor.body).toEqual({ sporocilo: expect.any(String) });
  });

  it('pokvarjen JSON vrne 400', async () => {
    const odgovor = await api()
      .post('/api/auth/prijava')
      .set('Content-Type', 'application/json')
      .send('{pokvarjen');
    expect(odgovor.status).toBe(400);
    expect(odgovor.body.sporocilo).toBeTypeOf('string');
  });
});
