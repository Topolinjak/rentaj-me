# Brez javne registracije: račune ustvarja administrator

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Sistem je namenjen izključno članom oddelka: študentom, asistentom, profesorjem in tehniku. Opreme si ne smejo izposojati zunanje osebe, vloga uporabnika pa določa njegove pravice in omejitve izposoje (npr. le profesorji imajo dolgoročno izposojo). Kako zagotoviti, da imajo dostop le člani oddelka in da ima vsak pravilno vlogo?

## Obravnavane možnosti

- Javna registracija, kjer uporabnik sam izbere vlogo
- Javna registracija, omejena na fakultetne e-naslove, s potrditvijo prek e-pošte
- Prijava prek fakultetnega sistema za identiteto (SSO)
- Brez javne registracije: račune ustvari administrator

## Odločitev

Izbrana možnost: »račune ustvari administrator«, ker na najpreprostejši način zagotovi, da do sistema dostopajo le člani oddelka s pravilno vlogo. Pri javni registraciji bi si lahko kdor koli ustvaril račun in izbral vlogo z več pravicami. Omejitev na fakultetne e-naslove reši preverjanje članstva, ne pa vloge (študentski in zaposleni naslovi ne povedo, ali je nekdo asistent ali profesor), poleg tega zahteva pošiljanje e-pošte. Integracija s fakultetnim SSO bi bila najboljša rešitev, a je zunaj obsega projekta, saj zahteva sodelovanje fakultetne informacijske službe.

### Posledice

- Dobro, ker zunanje osebe nimajo dostopa in vsak uporabnik ima vlogo, ki jo je potrdil administrator.
- Dobro, ker ne potrebujemo pošiljanja e-pošte, potrjevanja naslovov ali zaščite pred lažnimi registracijami.
- Dobro, ker lahko administrator uporabnika kadar koli deaktivira.
- Slabo, ker mora administrator ročno ustvariti vse račune, kar je na začetku semestra veliko dela; kasneje bi lahko dodali uvoz uporabnikov iz datoteke CSV.
- Slabo, ker mora administrator uporabniku na varen način sporočiti začetno geslo, uporabnik pa naj ga ob prvi prijavi zamenja.
