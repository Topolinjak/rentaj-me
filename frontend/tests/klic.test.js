import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { klic, NapakaApi, SPLOSNA_NAPAKA } from '../src/api/klic.js';

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const odgovor = (status, telo) =>
  new Response(telo === undefined ? null : JSON.stringify(telo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('klic()', () => {
  it('GET s piškotkom vrne podatke iz odgovora', async () => {
    fetchMock.mockResolvedValue(odgovor(200, [{ id: 1 }]));

    expect(await klic('/api/kategorije')).toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/kategorije',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it('telo pošlje kot JSON', async () => {
    fetchMock.mockResolvedValue(odgovor(201, { id: 7 }));

    await klic('/api/rezervacije', { metoda: 'POST', telo: { kosi: [1] } });

    const [, zahteva] = fetchMock.mock.calls[0];
    expect(zahteva).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{"kosi":[1]}',
    });
  });

  it('prazen odgovor (npr. odjava) vrne null', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await klic('/api/auth/odjava', { metoda: 'POST' })).toBeNull();
  });

  it('ob napaki vrže sporočilo backenda s statusom in napakami po poljih', async () => {
    const napake = [{ polje: 'od', sporocilo: 'Začetek ne sme biti v preteklosti.' }];
    fetchMock.mockResolvedValue(odgovor(400, { sporocilo: 'Neveljavni podatki.', napake }));

    const napaka = await klic('/api/rezervacije', { metoda: 'POST', telo: {} }).catch((e) => e);

    expect(napaka).toBeInstanceOf(NapakaApi);
    expect(napaka.message).toBe('Neveljavni podatki.');
    expect(napaka.status).toBe(400);
    expect(napaka.napake).toEqual(napake);
  });

  it('409 s sporočilom backenda', async () => {
    fetchMock.mockResolvedValue(
      odgovor(409, { sporocilo: 'Arduino Uno (A-014) je zaseden od 22. 10. do 27. 10.' }),
    );
    await expect(klic('/api/rezervacije')).rejects.toThrow(
      'Arduino Uno (A-014) je zaseden od 22. 10. do 27. 10.',
    );
  });

  it('napaka brez sporočila (npr. 502 iz proxyja) vrže splošno sporočilo', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));

    const napaka = await klic('/api/oprema').catch((e) => e);

    expect(napaka.message).toBe(SPLOSNA_NAPAKA);
    expect(napaka.status).toBe(502);
    expect(napaka.napake).toEqual([]);
  });

  it('nedosegljiv strežnik vrže splošno sporočilo s statusom 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const napaka = await klic('/api/oprema').catch((e) => e);

    expect(napaka).toBeInstanceOf(NapakaApi);
    expect(napaka.message).toBe('Prišlo je do napake. Poskusite znova.');
    expect(napaka.status).toBe(0);
  });

  it('preklic zahteve se posreduje nespremenjen', async () => {
    const preklic = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(preklic);
    await expect(klic('/api/oprema')).rejects.toBe(preklic);
  });
});
