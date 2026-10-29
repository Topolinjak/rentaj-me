# Rentaj.me

Spletni sistem za izposojo opreme na oddelku za tehniko.

Študenti, asistenti in profesorji v katalogu poiščejo opremo (mikrokrmilnike, senzorje, merilne instrumente, kamere, VR očala, 3D tiskalnike …), preverijo njeno zasedenost in oddajo rezervacijo. Tehnik oddelka rezervacije odobrava, opremo izdaja in prevzema ter beleži njeno stanje in morebitne poškodbe. Sistem samodejno prikaže zamujena vračila, administrator pa upravlja uporabnike, kategorije opreme in pravila izposoje.

## Tehnologije

| Področje | Tehnologije |
|---|---|
| **Frontend** | React, Vite, React Router, Tailwind CSS |
| **Backend** | Node.js, Express, Zod |
| **Podatkovna baza** | PostgreSQL, Prisma ORM |
| **Avtentikacija** | JWT v piškotku httpOnly, bcrypt |
| **Lokalni razvoj** | Docker, Docker Compose |

## Struktura repozitorija

```
├── frontend/   # React aplikacija
├── backend/    # Express REST API
└── docs/       # dokumentacija projekta
```

## Lokalni zagon

Potrebuješ [Docker](https://docs.docker.com/get-docker/) z Docker Compose.

1. Kopiraj predlogo nastavitev in jo po potrebi prilagodi:

   ```bash
   cp .env.example .env
   ```

   Če so vrata `5432` na tvojem računalniku že zasedena, v `.env` nastavi drug `DB_PORT` (npr. `5433`) in ista vrata uporabi v `DATABASE_URL`.

2. Zaženi sistem:

   ```bash
   docker compose up -d
   ```

3. Preveri, ali je baza pripravljena (stanje `healthy`):

   ```bash
   docker compose ps
   ```

Sistem ustavi z `docker compose down`. Podatki baze ostanejo v volumnu `db-podatki`; izbrišeš jih z `docker compose down -v`.

## Dokumentacija

1. [Zasnova rešitve](docs/01-zasnova-resitve.md)
2. [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
3. [Podatkovni model](docs/03-podatkovni-model.md)
4. [Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
5. [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
6. [Wireframes](docs/06-wireframes.md)
7. [Oblikovanje](docs/07-oblikovanje.md)

Arhitekturne odločitve so zapisane v [docs/adr/](docs/adr/).
