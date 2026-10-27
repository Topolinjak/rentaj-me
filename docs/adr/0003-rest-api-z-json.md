# REST API z JSON za komunikacijo frontend–backend

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Ker sta frontend in backend ločena (glej [ADR-0001](0001-locen-frontend-in-backend.md)), potrebujemo način komunikacije med njima. Aplikacija ima razmeroma majhno število virov (oprema, rezervacije, uporabniki, kategorije, pravila) in jasno določene akcije nad rezervacijami (odobritev, zavrnitev, izdaja, vračilo). Kakšen slog API-ja izbrati, da bo preprost za razvoj in uporaben tudi za druge odjemalce?

## Obravnavane možnosti

- REST API z JSON
- GraphQL
- tRPC (tipizirani klici funkcij med TypeScript frontendom in backendom)

## Odločitev

Izbrana možnost: »REST API z JSON«, ker za obseg aplikacije povsem zadošča, je najbolj razširjen in ga podpira vsak odjemalec, tudi morebitna mobilna aplikacija. Napake se naravno izražajo s HTTP statusnimi kodami (`400`, `401`, `403`, `404`, `409`). GraphQL rešuje problem prožnih poizvedb nad zapletenimi grafi podatkov, ki ga pri nas ni, prinese pa dodatno shemo, strežnik in knjižnice. tRPC predpostavlja TypeScript na obeh straneh in tesno poveže frontend z backendom, kar je v nasprotju s ciljem, da je API uporaben tudi za druge odjemalce.

Akcije nad rezervacijo modeliramo kot ločene endpointe (`PATCH /api/rezervacije/:id/odobritev`, `.../izdaja` …) namesto splošnega `PATCH` s statusom. Tako ima vsak prehod svoje preverjanje pravic in vhodnih podatkov.

### Posledice

- Dobro, ker je API preprost za razumevanje, testiranje (npr. s curl ali Postmanom) in dokumentiranje.
- Dobro, ker ne potrebujemo dodatnih knjižnic ali orodij za generiranje kode.
- Dobro, ker so endpointi za prehode statusov eksplicitni in jih je enostavno zaščititi po vlogah.
- Slabo, ker za nekatere zaslone potrebujemo več zahtev ali pa posebej prilagojene endpointe.
- Slabo, ker tipi podatkov med frontendom in backendom niso samodejno usklajeni; ob spremembi API-ja je treba ročno posodobiti klice v `frontend/src/api/`.
- Slabo, ker endpointi za akcije niso »čisti« REST viri, kar je zavesten pragmatičen kompromis.
