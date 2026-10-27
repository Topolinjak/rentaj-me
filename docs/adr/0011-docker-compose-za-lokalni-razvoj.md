# Docker Compose za lokalni zagon sistema

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Za zagon sistema potrebujemo frontend, backend in bazo PostgreSQL (glej [ADR-0004](0004-relacijska-baza-postgresql.md)). Razvijalci uporabljajo različne operacijske sisteme, ročna namestitev PostgreSQL pa se med sistemi razlikuje in pogosto povzroča težave z različicami, gesli in vrati. Kako zagotoviti, da imajo vsi razvijalci enako okolje in da se sistem zažene brez zapletenih navodil?

## Obravnavane možnosti

- Ročna namestitev PostgreSQL in Node.js na vsakem računalniku
- Skupna baza v oblaku (npr. Neon ali Supabase)
- Docker Compose, ki zažene bazo, backend in frontend

## Odločitev

Izbrana možnost: »Docker Compose«, ker se celoten sistem z bazo vred zažene z enim ukazom (`docker compose up`) in imajo vsi razvijalci enake različice programske opreme. Ročna namestitev bi vodila v razlike med okolji in težave »pri meni deluje«. Skupna baza v oblaku bi zahtevala internetno povezavo, razvijalci bi si med seboj spreminjali podatke in migracije, poleg tega bi bili odvisni od zunanjega ponudnika.

Nastavitve (npr. geslo baze, skrivnost za JWT) so v datoteki `.env`, ki ni v repozitoriju; v repozitoriju je le predloga `.env.example`.

### Posledice

- Dobro, ker nov razvijalec sistem zažene v nekaj minutah.
- Dobro, ker ima vsak razvijalec svojo bazo, ki jo lahko kadar koli izbriše in ponovno napolni s `seed.js`.
- Dobro, ker je konfiguracija okolja zapisana v repozitoriju in s tem dokumentirana.
- Slabo, ker mora imeti vsak razvijalec nameščen Docker, ki na Windows in macOS porabi kar nekaj sistemskih virov.
- Slabo, ker je delovanje kode v vsebnikih (npr. samodejno osveževanje ob spremembah datotek) včasih treba dodatno nastaviti.
- Slabo, ker Docker Compose rešuje le lokalni razvoj; način produkcijske namestitve bo predmet ločenega ADR-ja.
