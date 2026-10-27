# Relacijska podatkovna baza PostgreSQL

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Podatki v sistemu so močno povezani: uporabnik ima rezervacije, rezervacija ima postavke, vsaka postavka se nanaša na kos opreme, ta pa pripada kategoriji; na izposojo se vežejo zapisi o poškodbah. Najpomembnejša zahteva je, da isti kos opreme ne more biti dvakrat rezerviran v istem terminu, tudi če dva uporabnika rezervacijo oddata hkrati. Katero podatkovno bazo izbrati, da bo celovitost podatkov zagotovljena?

## Obravnavane možnosti

- Dokumentna baza MongoDB
- SQLite
- MySQL / MariaDB
- PostgreSQL

## Odločitev

Izbrana možnost: »PostgreSQL«, ker relacijski model naravno opiše povezane podatke, baza pa sama zagotavlja tuje ključe, unikatnost in transakcije, ki so ključne za preprečevanje dvojnih rezervacij (glej [ADR-0006](0006-transakcija-pri-oddaji-rezervacije.md)). MongoDB bi povezave in celovitost prepustil aplikaciji, kar je pri tako povezanih podatkih vir napak. SQLite je odličen za prototipe, a slabše podpira hkratno pisanje več uporabnikov in se od produkcijske baze razlikuje. Med MySQL in PostgreSQL smo izbrali PostgreSQL zaradi strožjega upoštevanja standarda SQL, odlične podpore v Prisma ORM in naprednih zmožnosti (npr. tipi za časovne intervale in izključitvene omejitve), ki bi jih lahko kasneje uporabili za preverjanje prekrivanja terminov kar v bazi.

### Posledice

- Dobro, ker baza sama preprečuje neveljavne podatke (npr. postavka brez rezervacije, podvojen e-naslov).
- Dobro, ker transakcije omogočajo varno hkratno oddajo rezervacij.
- Dobro, ker je PostgreSQL brezplačen, zrel in na voljo pri večini ponudnikov gostovanja.
- Slabo, ker potrebujemo delujoč strežnik baze tudi pri lokalnem razvoju (rešeno z Dockerjem, glej [ADR-0011](0011-docker-compose-za-lokalni-razvoj.md)).
- Slabo, ker vsaka sprememba strukture podatkov zahteva migracijo sheme.
