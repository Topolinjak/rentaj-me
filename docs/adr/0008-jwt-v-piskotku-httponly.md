# Avtentikacija z JWT v piškotku httpOnly

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Backend mora pri vsaki zahtevi vedeti, kdo jo pošilja in kakšno vlogo ima (študent, asistent, profesor, tehnik, administrator), saj od tega zavisi dostop do endpointov. Prijavni podatki ne smejo biti dostopni morebitni vrinjeni skripti (XSS), zahteve pa ne smejo biti izvedljive s tujih spletnih strani (CSRF). Kako hraniti in prenašati podatke o prijavi?

## Obravnavane možnosti

- JWT v `localStorage` in glavi `Authorization: Bearer`
- Strežniške seje (npr. `express-session` s shrambo sej v bazi)
- Prijava prek zunanjega ponudnika identitet (npr. fakultetni SSO)
- JWT v piškotku z nastavitvami `httpOnly`, `sameSite: 'lax'` in v produkciji `secure`

## Odločitev

Izbrana možnost: »JWT v piškotku httpOnly«, ker JavaScript do žetona ne more dostopati, zato ga vrinjena skripta ne more ukrasti, kar pri `localStorage` ni zagotovljeno. Nastavitev `sameSite: 'lax'` preprečuje, da bi brskalnik piškotek poslal pri zahtevah `POST` in `PATCH`, sproženih s tujih strani, kar ščiti pred CSRF. JWT v sebi nosi ID in vlogo uporabnika, zato backendu ni treba hraniti sej, kot bi bilo potrebno pri strežniških sejah. Integracija s fakultetnim SSO bi bila za uporabnike najprijaznejša, a je zunaj obsega projekta (glej [ADR-0009](0009-brez-javne-registracije.md)).

Frontend žetona ne vidi; podatke o prijavljenem uporabniku dobi z `GET /api/auth/jaz`.

### Posledice

- Dobro, ker žetona ni mogoče ukrasti z XSS in je aplikacija zaščitena pred CSRF brez dodatnih žetonov.
- Dobro, ker brskalnik piškotek pošilja samodejno in frontendu ni treba upravljati žetona.
- Dobro, ker ni shrambe sej, ki bi jo bilo treba vzdrževati ali čistiti.
- Slabo, ker izdanega JWT ni mogoče preprosto preklicati: sprememba vloge ali deaktivacija uporabnika začne veljati šele ob izteku žetona, razen če middleware ob vsaki zahtevi v bazi preveri polje `aktiven`. Zato žetonu nastavimo kratko veljavnost.
- Slabo, ker zaščita pred CSRF z `sameSite: 'lax'` velja le, če zahteve `GET` nikoli ne spreminjajo podatkov; tega se moramo držati pri vseh endpointih.
- Slabo, ker morata biti frontend in backend za brskalnik na istem naslovu (glej [ADR-0012](0012-proxy-v-vite.md)).
