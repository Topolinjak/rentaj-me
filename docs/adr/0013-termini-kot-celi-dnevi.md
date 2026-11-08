# Termini kot celi dnevi v pasu Europe/Ljubljana, polodprti interval

- **Status:** sprejeto
- **Datum:** 2026-11-08
- **Nadomešča:** –

## Kontekst in problem

Uporabnik pri rezervaciji izbira cele dneve (npr. od 20. 10. do 24. 10.), model pa hrani `zacetek` in `konec` rezervacije kot trenutek v času (`datetime`). Brez skupnega dogovora bi koledar zasedenosti, oddaja rezervacije, preverjanje pravil in obrazec vsak po svoje pretvarjali datume: današnji datum, shranjen kot 00:00, bi bil že »v preteklosti«, zaporedni rezervaciji bi se lahko prekrivali ali pa med njima ostal prazen dan, ob prehodu na poletni čas pa bi se trajanje izračunalo napačno. Kako naj sistem predstavi, shrani in primerja termine?

## Obravnavane možnosti

- Zaprt interval `[prvi dan 00:00, zadnji dan 23:59:59]`
- Shranjevanje datumov brez časa (`date`) namesto `datetime`
- Polodprt interval `[zacetek, konec)` iz polnoči v pasu Europe/Ljubljana, shranjen v UTC

## Odločitev

Izbrana možnost: »polodprt interval iz polnoči v pasu Europe/Ljubljana«, ker formula za prekrivanje iz dokumenta 03 (`novZacetek < obstojeciKonec` in `novKonec > obstojeciZacetek`) z njim deluje brez posebnih primerov, zaporedni rezervaciji pa se ne prekrivata in med njima ne ostane vrzel. Zaprt interval bi zahteval »zadnjo sekundo dneva«, ki je ob prehodu na poletni ali zimski čas težko določljiva, primerjave pa bi bile odvisne od natančnosti časa. Tip `date` bi bil za ta namen sicer naraven, a rok vračila in zamuda sta trenutka v času (ADR-0007), polji `izdanoOb` in `vrnjenoOb` pa sta `datetime`; mešanje obeh tipov bi pomenilo pretvarjanje pri vsaki primerjavi.

Podrobnosti dogovora:

1. **Interval.** Termin je `[zacetek, konec)`. `zacetek` je 00:00 prvega dne, `konec` je 00:00 dneva **po** zadnjem dnevu, oboje po času v Ljubljani, shranjeno v UTC (`timestamptz`). Primer: od 20. 10. do 24. 10. pomeni `zacetek = 20. 10. 00:00`, `konec = 25. 10. 00:00`.
2. **Zaporedne rezervacije.** Vračilo 24. 10. in nova rezervacija od 25. 10. se ne prekrivata (`konec` prve je enak `zacetek` druge).
3. **Trajanje** je število koledarskih dni, vključno s prvim in zadnjim (od 20. 10. do 24. 10. je 5 dni), ne `(konec − zacetek) / 24 h`, ker je dan ob prehodu na poletni čas dolg 23 ur, ob prehodu na zimskega pa 25.
4. **Pretekli začetek.** Začetek je v preteklosti, če je prvi dan pred današnjim dnem v Ljubljani. Rezervacija z začetkom danes je dovoljena.
5. **Prikaz roka.** Uporabniku se kot rok vračila prikaže zadnji dan (`konec − 1 dan`), npr. »do 24. 10.«. Enako velja za sporočila, npr. »Arduino A-014 je zaseden od 22. 10. do 27. 10.«.
6. **Zamuda** nastopi ob `konec`, torej po izteku zadnjega dne (ADR-0007: `status = IZDANA` in `konec < zdaj`).
7. **API** sprejema in vrača datume v obliki `YYYY-MM-DD` (polji `od` in `do`, `do` je zadnji dan). Pretvorbo v `zacetek` in `konec` ter nazaj naredi backend na enem mestu (`backend/src/utils/datumi.js`); frontend ima enake pomožne funkcije za prikaz in izbiro datumov.

### Posledice

- Dobro, ker formula za prekrivanje in pogoj za zamudo ostaneta preprosta in enaka v vsej kodi.
- Dobro, ker so vse pretvorbe na enem mestu in pokrite z enotskimi testi, tudi za prehod na poletni in zimski čas.
- Dobro, ker API z datumi `YYYY-MM-DD` ni odvisen od časovnega pasu brskalnika.
- Slabo, ker se `do` v API-ju in `konec` v bazi razlikujeta za en dan; to je treba upoštevati pri vsaki poizvedbi in prikazu, zato se vedno uporabljajo pomožne funkcije.
- Slabo, ker izposoja za del dneva (npr. le dopoldne) ni mogoča; če bo potrebna, bo predmet novega ADR-ja.
