# Pravila izposoje so shranjena v bazi

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Vsaka vloga ima omejitve izposoje: največje število hkrati izposojenih kosov, najdaljši standardni čas izposoje in za profesorje najdaljši čas dolgoročne izposoje (začetno npr. študent 3 kosi in 7 dni, profesor 20 kosov in do 180 dni). Oddelek bo te vrednosti verjetno prilagajal, npr. pred zaključnimi nalogami ali ob nakupu nove opreme. Kje naj bodo pravila zapisana, da jih je mogoče spreminjati?

## Obravnavane možnosti

- Konstante v kodi backenda
- Konfiguracijska datoteka ali okoljske spremenljivke
- Tabela `PraviloIzposoje` v bazi, ki jo ureja administrator

## Odločitev

Izbrana možnost: »tabela v bazi«, ker lahko administrator omejitve spremeni sam prek vmesnika, brez sprememb kode, novega zagona ali posredovanja razvijalca. Konstante v kodi bi za vsako spremembo zahtevale novo različico aplikacije. Konfiguracijska datoteka ali okoljske spremenljivke bi zahtevale dostop do strežnika in ponovni zagon, ki ju administrator sistema praviloma nima.

### Posledice

- Dobro, ker administrator pravila prilagodi takoj in sam.
- Dobro, ker so pravila vidna in urejena na enem mestu, začetne vrednosti pa naloži `seed.js`.
- Slabo, ker potrebujemo dodaten vmesnik in endpoint za urejanje pravil (`/api/pravila`) s preverjanjem vnosov (npr. pozitivna števila).
- Slabo, ker mora backend pravilo prebrati ob vsaki oddaji rezervacije, kar pomeni dodatno poizvedbo (pri tem obsegu zanemarljivo).
- Slabo, ker sprememba pravil ne vpliva na že oddane rezervacije, kar je treba uporabnikom jasno sporočiti.
