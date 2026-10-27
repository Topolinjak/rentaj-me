# Proxy v razvojnem strežniku Vite

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

V razvoju frontend teče na razvojnem strežniku Vite, backend pa na drugih vratih (npr. `localhost:5173` in `localhost:3000`). Za brskalnik sta to dva različna izvora (origin), zato zahteve s frontenda na backend blokira politika CORS, piškotek z JWT (glej [ADR-0008](0008-jwt-v-piskotku-httponly.md)) pa se med izvori ne pošilja brez dodatnih nastavitev. Kako omogočiti, da frontend in backend v razvoju komunicirata brez težav s CORS in piškotki?

## Obravnavane možnosti

- CORS na backendu z `credentials: true` in dovoljenim izvorom frontenda
- Backend streže zgrajen frontend (brez razvojnega strežnika Vite)
- Proxy v razvojnem strežniku Vite, ki zahteve na `/api` posreduje backendu

## Odločitev

Izbrana možnost: »proxy v Vite«, ker brskalnik komunicira le z enim izvorom, zato CORS sploh ni potreben in piškotek deluje kot pri običajni aplikaciji na enem naslovu. Nastavitev je ena vrstica v `vite.config.js`. CORS s piškotki je mogoče nastaviti, a je občutljiv na napake (natančen izvor, `sameSite`, `secure`) in bi razvojno okolje oddaljil od produkcijskega. Streženje zgrajenega frontenda iz backenda bi pomenilo izgubo hitrega osveževanja ob spremembah kode, ki ga ponuja Vite.

### Posledice

- Dobro, ker ni nastavitev CORS in težav s pošiljanjem piškotkov v razvoju.
- Dobro, ker klici API-ja v frontendu uporabljajo relativne poti (`/api/...`), ki delujejo enako v razvoju in produkciji.
- Dobro, ker ohranimo hitro osveževanje (HMR) razvojnega strežnika Vite.
- Slabo, ker proxy deluje le v razvoju; v produkciji je treba enak učinek doseči drugače (npr. backend streže zgrajen frontend ali obratni proxy, kot je nginx), kar bo predmet ločenega ADR-ja.
- Slabo, ker lahko razlike med razvojnim proxyjem in produkcijsko postavitvijo povzročijo napake, ki se pokažejo šele ob namestitvi.
