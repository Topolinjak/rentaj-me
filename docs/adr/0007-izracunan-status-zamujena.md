# Status »zamujena« se izračuna, ne shrani

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Izposoja je zamujena, ko ima rezervacija status `IZDANA`, rok vračila (`konec`) pa je že potekel. Tehnik mora zamujene izposoje videti na posebnem seznamu, uporabnik pa pri svojih izposojah. Za razliko od drugih statusov zamude ne sproži nobena akcija uporabnika, ampak zgolj pretek časa. Ali naj bo »zamujena« shranjen status rezervacije ali naj se določi ob branju?

## Obravnavane možnosti

- Shranjen status `ZAMUJENA`, ki ga periodično nastavlja proces v ozadju (npr. cron opravilo)
- Shranjen status, ki se posodobi ob vsakem branju rezervacij
- Izračunan status: rezervacija je zamujena, če je `status = IZDANA` in `konec < zdaj`

## Odločitev

Izbrana možnost: »izračunan status«, ker je vedno točen in ne zahteva dodatnega procesa. Pri procesu v ozadju bi bil status med dvema zagonoma lahko napačen, proces bi bilo treba zagnati, nadzorovati in testirati, ob izpadu pa bi seznam zamud tiho postal napačen. Posodabljanje ob branju bi branje podatkov spremenilo v pisanje, kar je nepričakovano in oteži razumevanje kode. Pogoj za zamudo je preprost in ga baza učinkovito izračuna tudi pri filtriranju seznama.

### Posledice

- Dobro, ker status zamude nikoli ne zaostaja za dejanskim stanjem.
- Dobro, ker ni procesa v ozadju, ki bi ga bilo treba vzdrževati.
- Dobro, ker ostane nabor shranjenih statusov manjši in prehodi med njimi preprostejši.
- Slabo, ker mora vsako mesto, ki prikazuje ali filtrira zamude, uporabiti isti pogoj; zato ga zapišemo v eno skupno funkcijo v backendu.
- Slabo, ker ni zapisano, kdaj natanko je izposoja postala zamujena (to je sicer razvidno iz polja `konec`).
- Slabo, ker bi za samodejne opomnike o zamudah (npr. e-pošta) vseeno potrebovali proces v ozadju; to bo, če bo potrebno, predmet novega ADR-ja.
