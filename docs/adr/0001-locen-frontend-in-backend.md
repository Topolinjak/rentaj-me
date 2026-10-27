# Ločen frontend (React) in backend (Express)

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Rentaj.me potrebuje interaktiven uporabniški vmesnik (katalog s filtri, koledar zasedenosti, nadzorne plošče za tehnika in administratorja) in strežniški del, ki izvaja pravila izposoje in hrani podatke. Odločiti se moramo, ali bo aplikacija en sam strežniški projekt, ki generira strani, ali pa bosta prikaz in poslovna logika ločena dela, ki komunicirata prek API-ja. Na oddelku se omenja tudi možnost kasnejše mobilne aplikacije ali skenerja QR kod ob izdaji opreme.

## Obravnavane možnosti

- Strežniško generirane strani (Express + predloge, npr. EJS)
- Full-stack ogrodje (npr. Next.js), ki združuje prikaz in API v enem projektu
- Ločen SPA frontend (React) in samostojen backend z API-jem (Express)

## Odločitev

Izbrana možnost: »ločen SPA frontend (React) in samostojen backend (Express)«, ker jasno loči odgovornosti (frontend skrbi za prikaz, backend za pravila in podatke) in ker je API mogoče brez sprememb uporabiti tudi za druge odjemalce, npr. mobilno aplikacijo ali skener QR kod. Strežniško generirane strani bi otežile interaktivne dele vmesnika, kot je koledar zasedenosti. Full-stack ogrodje bi meje med prikazom in logiko zabrisalo in bi API za druge odjemalce težje ponudili kot samostojno storitev.

### Posledice

- Dobro, ker lahko frontend in backend razvijamo, testiramo in zaganjamo neodvisno.
- Dobro, ker je backend ponovno uporaben za morebitne druge odjemalce.
- Dobro, ker sta React in Express zelo razširjena, z veliko dokumentacije in primerov.
- Slabo, ker imamo dva projekta z ločenimi odvisnostmi, konfiguracijo in postopkom zagona.
- Slabo, ker moramo vzdrževati dogovor (pogodbo) o obliki API-ja med obema deloma; sprememba na eni strani lahko zlomi drugo.
- Slabo, ker je treba rešiti komunikacijo med dvema naslovoma v razvoju (glej [ADR-0012](0012-proxy-v-vite.md)).
