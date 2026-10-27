# Preverjanje in shranjevanje rezervacije v eni transakciji

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Pred shranjevanjem rezervacije backend preveri, ali se termin prekriva z obstoječimi rezervacijami s statusom `ODDANA`, `ODOBRENA` ali `IZDANA`. Če to naredimo v dveh ločenih korakih (najprej preverimo, nato shranimo), lahko dva uporabnika, ki rezervacijo za isti kos in termin oddata skoraj hkrati, oba preverjanje prestaneta, preden je katera koli rezervacija shranjena. Tako bi isti kos dobila dva uporabnika. Kako zagotoviti, da pri hkratni oddaji uspe le ena rezervacija?

## Obravnavane možnosti

- Preverjanje v aplikaciji brez transakcije
- Izključitvena omejitev v bazi (`EXCLUDE USING gist` nad časovnim intervalom)
- Transakcija z izolacijo `SERIALIZABLE` in ponovnim poskusom ob konfliktu
- Transakcija, ki najprej zaklene vrstice izbranih kosov opreme (`SELECT ... FOR UPDATE`), nato preveri prekrivanje in shrani rezervacijo

## Odločitev

Izbrana možnost: »transakcija z zaklepanjem vrstic kosov opreme«, ker zanesljivo prepreči dvojno rezervacijo in je ob tem preprosta za razumevanje. Druga hkratna zahteva za isti kos počaka, da se prva transakcija zaključi, nato vidi že shranjeno rezervacijo in dobi napako `409 Conflict`. Preverjanje brez transakcije problema ne reši. Izključitvena omejitev je najmočnejša rešitev, a mora upoštevati le nekatere statuse, terja razširitev `btree_gist` in ročno pisano migracijo, ki je Prisma ne podpira, in vrača manj razumljive napake. Izolacija `SERIALIZABLE` deluje, a zahteva logiko za ponovne poskuse in lahko zavrne tudi transakcije, ki si dejansko ne nasprotujejo.

Kose opreme zaklepamo vedno v naraščajočem vrstnem redu `id`, da se dve rezervaciji z več postavkami ne moreta medsebojno blokirati (deadlock).

### Posledice

- Dobro, ker je isti kos opreme v istem terminu mogoče rezervirati največ enkrat, tudi pri hkratnih zahtevah.
- Dobro, ker ob neuspešnem preverjanju v bazi ne nastane noben zapis (rezervacija se ne shrani delno).
- Dobro, ker zaklepanje vpliva le na zahteve za iste kose opreme, druge rezervacije tečejo nemoteno.
- Slabo, ker zaklepanje zahteva neposredni SQL v Prisma interaktivni transakciji (glej [ADR-0005](0005-prisma-orm.md)).
- Slabo, ker pravilnost zavisi od tega, da vsak del kode, ki ustvarja ali spreminja termine rezervacij, uporablja isti postopek; to je treba zagotoviti s skupno funkcijo v servisnem sloju in testom hkratne oddaje.
