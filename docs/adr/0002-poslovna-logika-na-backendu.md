# Vsa poslovna logika na backendu

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Sistem mora dosledno uveljavljati pravila: termini rezervacij se ne smejo prekrivati, vsaka vloga ima omejitve števila kosov in trajanja izposoje, prehodi med statusi rezervacije (oddana → odobrena → izdana → vrnjena) so dovoljeni le v določenem vrstnem redu in le določenim vlogam. Kje naj se ta pravila izvajajo, da jih uporabnik ne more obiti?

## Obravnavane možnosti

- Pravila v frontendu, backend le shranjuje podatke
- Pravila v podatkovni bazi (prožilci in shranjene procedure)
- Pravila v backendu (servisni sloj), frontend le osnovno preverjanje obrazcev

## Odločitev

Izbrana možnost: »pravila v backendu«, ker je backend edino mesto, ki ga uporabnik ne nadzoruje. Kodo v brskalniku lahko vsak spremeni ali pa zahteve na API pošlje mimo vmesnika, zato pravila v frontendu ne zagotavljajo ničesar. Pravila v bazi bi bila sicer varna, a jih je v prožilcih in procedurah težje pisati, testirati in brati kot v JavaScriptu. Frontend preverja vnose le zato, da uporabnik napako vidi takoj, končno odločitev pa vedno sprejme backend.

### Posledice

- Dobro, ker pravil ni mogoče obiti z ročnimi zahtevami ali spreminjanjem kode v brskalniku.
- Dobro, ker je logika na enem mestu (`backend/src/services/`) in jo je mogoče testirati z enotskimi testi.
- Dobro, ker jo lahko ponovno uporabijo tudi drugi odjemalci (glej [ADR-0001](0001-locen-frontend-in-backend.md)).
- Slabo, ker se del preverjanj (npr. obvezna polja, veljavnost datumov) ponovi v frontendu in ju je treba držati usklajena.
- Slabo, ker uporabnik za nekatere napake (npr. prekrivanje terminov) izve šele po odgovoru strežnika.
