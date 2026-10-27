# Uporabniške zgodbe

Dokument pretvori funkcionalnosti iz [02-funkcionalnosti-in-obseg.md](02-funkcionalnosti-in-obseg.md) v uporabniške zgodbe s kriteriji sprejemljivosti. Pri statusih, poljih in pravilih se zgodbe sklicujejo na [03-podatkovni-model.md](03-podatkovni-model.md) in [04-arhitektura-in-tehnoloski-sklad.md](04-arhitektura-in-tehnoloski-sklad.md).

Oznake funkcionalnosti (F1–F13) se ujemajo s številčenjem v dokumentu 02. Zgodbe US-01, US-18 in US-19 pokrivajo podporne funkcionalnosti (prijavo ter upravljanje uporabnikov in opreme). Te so opisane pri vlogah v dokumentu 02 in so nujne za delovanje MVP.

## US-01: Prijava in odjava

- **Funkcionalnost:** Avtentikacija (podporna)
- **Vloga:** vsi uporabniki (študent, asistent, profesor, tehnik, administrator)

**Zgodba:** Kot uporabnik sistema želim se prijaviti z e-poštnim naslovom in geslom, da dostopam do funkcij, ki jih omogoča moja vloga.

**Kriteriji sprejemljivosti:**

1. Po prijavi s pravilnim e-poštnim naslovom in geslom aktivnega uporabnika sistem nastavi piškotek `httpOnly` z JWT. Uporabnika preusmeri na začetno stran njegove vloge: študenta, asistenta in profesorja na *Katalog*, tehnika na *Nadzorno ploščo tehnika*, administratorja na *Uporabnike*.
2. Ob napačnem e-poštnem naslovu ali geslu API vrne `401` in prikaže sporočilo »Napačen e-poštni naslov ali geslo«. Sporočilo ne razkrije, kateri od podatkov je napačen.
3. Uporabnik z `aktiven = false` se ne more prijaviti, tudi s pravilnim geslom. Prikaže se sporočilo »Račun je deaktiviran. Obrnite se na administratorja.«
4. Neprijavljen uporabnik, ki odpre zaščiteno stran, je preusmerjen na prijavo. Vsak klic API-ja (razen prijave) brez veljavnega piškotka vrne `401`.
5. Po kliku *Odjava* backend izbriše piškotek, uporabnik je preusmerjen na prijavo, naslednji klic `GET /api/auth/jaz` pa vrne `401`.

---

## US-02: Koledar zasedenosti kosa

- **Funkcionalnost:** F1 – Katalog opreme s prikazom razpoložljivosti po datumih [MVP]
- **Vloga:** študent

**Zgodba:** Kot študent želim za izbrani kos opreme videti koledar zasedenih terminov, da izberem prost termin, še preden oddam rezervacijo.

**Kriteriji sprejemljivosti:**

1. Stran kosa opreme prikaže mesečni koledar. Kot zasedeni so označeni vsi dnevi, na katere pade vsaj del rezervacije tega kosa s statusom `ODDANA`, `ODOBRENA` ali `IZDANA`.
2. Rezervacije s statusom `ZAVRNJENA`, `PREKLICANA` ali `VRNJENA` termina ne zasedajo in v koledarju niso označene.
3. Študent pri zasedenem terminu vidi le obdobje zasedenosti (od–do). Odgovor `GET /api/oprema/:id/zasedenost` ne vsebuje imena uporabnika, e-pošte ali namena izposoje.
4. Kos s statusom `V_OKVARI` je v katalogu označen z oznako »V okvari« in gumb *Rezerviraj* je onemogočen. Kos s statusom `UMAKNJEN` se v katalogu ne prikaže.
5. Uporabnik se lahko premika med meseci (naprej in nazaj), koledar pa ob vsakem premiku prikaže zasedenost za izbrani mesec.

---

## US-03: Oddaja rezervacije s preverjanjem prekrivanja

- **Funkcionalnost:** F2 – Rezervacija s samodejnim preverjanjem prekrivanja in pravil vloge [MVP]
- **Vloga:** študent

**Zgodba:** Kot študent želim oddati rezervacijo za enega ali več kosov opreme v izbranem terminu z navedenim namenom, da si zagotovim opremo za svoj projekt.

**Kriteriji sprejemljivosti:**

1. Obrazec zahteva vsaj en kos opreme, začetek, konec in namen izposoje. Če kateri od podatkov manjka, je konec pred začetkom ali je začetek v preteklosti, API vrne `400`, obrazec pa označi napačno polje.
2. Če se termin kateregakoli izbranega kosa prekriva z rezervacijo s statusom `ODDANA`, `ODOBRENA` ali `IZDANA` (`novZacetek < obstojeciKonec` in `novKonec > obstojeciZacetek`), API vrne `409`. Sporočilo navede kos in zaseden termin, npr. »Arduino A-014 je zaseden od 22. 10. do 27. 10.« V bazi ne nastane noben zapis, tudi za ostale kose v isti rezervaciji ne.
3. Če rezervacija vsebuje kos, katerega status ni `NA_VOLJO`, se ne shrani, sporočilo pa navede ta kos.
4. Ob uspešni oddaji nastane rezervacija s statusom `ODDANA` in po ena `PostavkaRezervacije` za vsak izbrani kos. Uporabnik vidi potrdilo »Rezervacija oddana – čaka na odobritev tehnika«, rezervacija pa se prikaže na strani *Moje izposoje*.
5. Če dva uporabnika istočasno oddata rezervacijo za isti kos v prekrivajočem se terminu, se shrani le ena, druga pa prejme `409`.

---

## US-04: Upoštevanje omejitev vloge ob oddaji

- **Funkcionalnost:** F2 – Rezervacija s samodejnim preverjanjem prekrivanja in pravil vloge [MVP]
- **Vloga:** asistent

**Zgodba:** Kot asistent želim izposoditi do 20 kosov hkrati za največ 7 dni, da pripravim komplet opreme za celotno skupino na vajah, hkrati pa takoj izvem, če moj zahtevek presega pravila.

**Kriteriji sprejemljivosti:**

1. Asistent lahko odda rezervacijo za 20 kosov, če seštevek kosov v njegovih rezervacijah s statusom `ODDANA`, `ODOBRENA` ali `IZDANA` skupaj z novo rezervacijo ne presega 20.
2. Če bi seštevek presegel `maxKosov` za njegovo vlogo, API vrne `400` s sporočilom, npr. »Presežena omejitev: imate 18 aktivnih kosov, dovoljenih je 20.« Rezervacija se ne shrani.
3. Če je razlika med `konec` in `zacetek` večja od `maxDni` (7 dni), API vrne `400` s sporočilom »Najdaljši čas izposoje za vašo vlogo je 7 dni«. Rezervacija se ne shrani.
4. Omejitve se ob vsaki oddaji preberejo iz tabele `PraviloIzposoje` za vlogo prijavljenega uporabnika. Študent pri enakem zahtevku za 4 kose dobi napako z omejitvijo 3 kosov.
5. Asistent v obrazcu ne vidi možnosti »Dolgoročna izposoja«. Zahtevek z `dolgorocna = true`, poslan neposredno na API, vrne `403`.

---

## US-05: Odobritev oddane rezervacije

- **Funkcionalnost:** F3 – Odobritev ali zavrnitev rezervacije z obveznim razlogom [MVP]
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim pregledati oddane rezervacije in jih odobriti, da uporabniki vedo, da lahko opremo prevzamejo.

**Kriteriji sprejemljivosti:**

1. Seznam *Oddane rezervacije* prikaže vse rezervacije s statusom `ODDANA`, razvrščene po času oddaje od najstarejše. Pri vsaki so prikazani ime in vloga uporabnika, kosi z inventarnimi številkami, termin in namen.
2. Po kliku *Odobri* rezervacija dobi status `ODOBRENA`, v `obdelalId` se zapiše ID tehnika, rezervacija pa izgine s seznama oddanih.
3. Odobriti je mogoče le rezervacijo s statusom `ODDANA`. Pri vsakem drugem statusu API vrne `409` in stanje se ne spremeni.
4. `PATCH /api/rezervacije/:id/odobritev` za vse vloge razen `TEHNIK` vrne `403`, tudi za administratorja in za profesorja pri lastni rezervaciji.
5. Uporabnik po odobritvi pri svoji rezervaciji na strani *Moje izposoje* vidi status »Odobrena«.

---

## US-06: Zavrnitev z obveznim razlogom

- **Funkcionalnost:** F3 – Odobritev ali zavrnitev rezervacije z obveznim razlogom [MVP]
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim zavrniti oddano rezervacijo z izbranim razlogom in neobveznim komentarjem, da uporabnik razume, zakaj opreme ne bo dobil.

**Kriteriji sprejemljivosti:**

1. Gumb *Zavrni* odpre obrazec s spustnim seznamom petih razlogov in neobveznim poljem za komentar. Razlogi so: Zamujena izposoja, Neporavnana poškodba, Oprema v okvari ali na servisu, Oprema potrebna za izvedbo vaj, Neustrezen namen izposoje.
2. Brez izbranega razloga gumb *Potrdi zavrnitev* ni aktiven. Zahtevek brez `razlogZavrnitve`, poslan neposredno na API, vrne `400`.
3. Po potrditvi ima rezervacija status `ZAVRNJENA`, izpolnjena polja `razlogZavrnitve` in `obdelalId` ter `komentarTehnika`, če je bil vnesen.
4. Termin zavrnjene rezervacije se sprosti: kosi so v koledarju zasedenosti za ta termin spet prosti in jih je mogoče rezervirati.
5. Uporabnik na strani *Moje izposoje* pri rezervaciji vidi status »Zavrnjena«, razlog in komentar tehnika.

---

## US-07: Izdaja opreme s stanjem

- **Funkcionalnost:** F4 – Izdaja in vračilo opreme z beleženjem stanja [MVP]
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim ob prevzemu označiti rezervacijo kot izdano in zabeležiti stanje vsakega kosa, da je evidentirano, v kakšnem stanju je oprema zapustila oddelek.

**Kriteriji sprejemljivosti:**

1. Gumb *Izdaj* je prikazan le pri rezervacijah s statusom `ODOBRENA`. Pri drugih statusih API vrne `409`.
2. Obrazec za izdajo za vsak kos v rezervaciji prikaže izbiro stanja (Brezhibno, Obrabljeno, Poškodovano). Privzeto je izbrana trenutna vrednost `trenutnoStanje` kosa.
3. Izdaje ni mogoče potrditi, dokler stanje ni izbrano za vse kose. Zahtevek z manjkajočim stanjem vrne `400`.
4. Po potrditvi ima rezervacija status `IZDANA` in `izdanoOb` nastavljen na trenutni čas, vsaka postavka pa izpolnjen `stanjeObIzdaji`.
5. Izdana rezervacija se na nadzorni plošči tehnika prikaže na seznamu *Izdano* z imenom uporabnika in rokom vračila.

---

## US-08: Vračilo opreme s stanjem in poškodbo

- **Funkcionalnost:** F4 – Izdaja in vračilo opreme z beleženjem stanja [MVP]; zapis poškodbe iz F11
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim ob vračilu zabeležiti stanje vsakega kosa in po potrebi opisati poškodbo, da je jasno, pri katerem uporabniku je do poškodbe prišlo.

**Kriteriji sprejemljivosti:**

1. Gumb *Prevzemi vračilo* je prikazan le pri rezervacijah s statusom `IZDANA`, tudi pri zamujenih.
2. Za vsak kos tehnik izbere `stanjeObVracilu`. Če izbere »Poškodovano«, postane polje *Opis poškodbe* obvezno. Brez opisa API vrne `400`.
3. Po potrditvi ima rezervacija status `VRNJENA` in `vrnjenoOb` nastavljen na trenutni čas. Za vsak kos s stanjem »Poškodovano« nastane `ZapisPoskodbe` z `razresen = false`, vezan na ustrezno postavko.
4. Polje `trenutnoStanje` vsakega vrnjenega kosa se nastavi na vrednost `stanjeObVracilu`.
5. Rezervacija, ki je bila zamujena, se po vračilu ne prikazuje več na seznamu zamujenih izposoj.

---

## US-09: Seznam zamujenih izposoj

- **Funkcionalnost:** F5 – Samodejno označevanje zamujenih izposoj [MVP]
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim na enem mestu videti vse zamujene izposoje, da lahko uporabnike pravočasno pozovem k vračilu.

**Kriteriji sprejemljivosti:**

1. Rezervacija je prikazana kot *Zamujena* natanko takrat, ko ima status `IZDANA` in je `konec` manjši od trenutnega časa. Shranjeni status v bazi ostane `IZDANA`.
2. Seznam *Zamujene izposoje* prikaže ime in e-pošto uporabnika, izposojene kose, rok vračila in število dni zamude. Razvrščen je od največje zamude navzdol.
3. Rezervacija, ki ji je rok potekel, se na seznamu prikaže ob naslednjem nalaganju strani, brez ročnega posega in brez procesa v ozadju.
4. Rezervacija s statusom `VRNJENA` se na seznamu ne prikaže, tudi če je bila vrnjena po roku.
5. Nadzorna plošča tehnika prikazuje število trenutno zamujenih izposoj. Klik na število odpre seznam zamud.

---

## US-10: Pregled lastnih izposoj

- **Funkcionalnost:** F6 – Pregled lastnih izposoj in statusov [MVP]
- **Vloga:** študent

**Zgodba:** Kot študent želim videti vse svoje rezervacije s statusi in roki, da vem, kaj moram prevzeti ali vrniti in do kdaj.

**Kriteriji sprejemljivosti:**

1. Stran *Moje izposoje* prikaže le rezervacije prijavljenega uporabnika. `GET /api/rezervacije/moje` nikoli ne vrne rezervacij drugih uporabnikov.
2. Rezervacije so razdeljene na zavihka *Trenutne* (`ODDANA`, `ODOBRENA`, `IZDANA`) in *Pretekle* (`VRNJENA`, `ZAVRNJENA`, `PREKLICANA`).
3. Za vsako rezervacijo so prikazani kosi, termin, namen in status. Zamujena izposoja je označena z rdečo oznako »Zamujena« in številom dni zamude.
4. Pri zavrnjeni rezervaciji sta prikazana razlog zavrnitve in komentar tehnika, če obstaja.
5. Če uporabnik nima nobene rezervacije, se prikaže sporočilo »Nimate še nobene rezervacije« in gumb *Na katalog*.

---

## US-11: Opozorila o zamudah in poškodbah

- **Funkcionalnost:** F7 – Opozorila tehniku o zamudah in poškodbah uporabnika [MVP]
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim pri pregledu oddane rezervacije samodejno videti, ali ima uporabnik zamujene izposoje ali neporavnane poškodbe, da mi tega ni treba preverjati ročno.

**Kriteriji sprejemljivosti:**

1. Če ima uporabnik vsaj eno zamujeno izposojo, se pri vsaki njegovi oddani rezervaciji prikaže opozorilo »Uporabnik ima N zamujenih izposoj«.
2. Če ima uporabnik vsaj en `ZapisPoskodbe` z `razresen = false` na postavki katere od svojih rezervacij, se prikaže opozorilo »Uporabnik ima N neporavnanih poškodb«.
3. Če uporabnik nima ne zamud ne neporavnanih poškodb, opozorilo ni prikazano.
4. Opozorilo ne onemogoči odobritve. Če tehnik pri rezervaciji z opozorilom klikne *Zavrni*, je v obrazcu že izbran ustrezen razlog (Zamujena izposoja oziroma Neporavnana poškodba), ki ga lahko spremeni.
5. Klik na opozorilo prikaže seznam zamujenih rezervacij oziroma neporavnanih poškodb tega uporabnika.

---

## US-12: Dolgoročna izposoja

- **Funkcionalnost:** F8 – Dolgoročna izposoja za profesorje
- **Vloga:** profesor

**Zgodba:** Kot profesor želim oddati dolgoročno izposojo za obdobje do 6 mesecev, da imam opremo na voljo za izvedbo predmeta skozi celoten semester.

**Kriteriji sprejemljivosti:**

1. Profesor v obrazcu za rezervacijo vidi stikalo »Dolgoročna izposoja«. Uporabnikom drugih vlog stikalo ni prikazano.
2. Ko je stikalo vklopljeno, je najdaljše dovoljeno obdobje `maxDniDolgorocno` (180 dni). Ko je izklopljeno, velja `maxDni` (7 dni).
3. Dolgoročna rezervacija, daljša od 180 dni, vrne `400` s sporočilom o najdaljšem dovoljenem obdobju in se ne shrani.
4. Za dolgoročno rezervacijo veljajo enako preverjanje prekrivanja, omejitev 20 kosov in odobritev tehnika kot za standardno.
5. Rezervacija ima `dolgorocna = true` in je na seznamih pri profesorju in tehniku označena z oznako »Dolgoročna«.

---

## US-13: Preklic oddane rezervacije

- **Funkcionalnost:** F9 – Preklic rezervacije s strani uporabnika
- **Vloga:** študent

**Zgodba:** Kot študent želim preklicati svojo oddano rezervacijo, da sprostim termin za druge, če opreme ne potrebujem več.

**Kriteriji sprejemljivosti:**

1. Gumb *Prekliči* je prikazan le pri lastnih rezervacijah s statusom `ODDANA`.
2. Pred preklicem se prikaže pogovorno okno »Ali res želite preklicati rezervacijo?«. Rezervacija se prekliče šele po potrditvi.
3. Po preklicu ima rezervacija status `PREKLICANA`, njeni kosi pa so v koledarju zasedenosti za ta termin spet prosti.
4. Preklic tuje rezervacije vrne `403`. Preklic rezervacije s statusom, ki ni `ODDANA` (npr. `ODOBRENA`), vrne `409`.
5. Preklicana rezervacija se prikaže v zavihku *Pretekle* in je ni mogoče ponovno aktivirati.

---

## US-14: Iskanje in filtriranje opreme

- **Funkcionalnost:** F10 – Iskanje in filtriranje opreme
- **Vloga:** študent

**Zgodba:** Kot študent želim iskati opremo po imenu in jo filtrirati po kategoriji ter razpoložljivosti v izbranem terminu, da hitro najdem kos, ki si ga lahko izposodim.

**Kriteriji sprejemljivosti:**

1. Iskanje po nazivu ali inventarni številki ne razlikuje med velikimi in malimi črkami ter vrača tudi delna ujemanja (»ardu« najde »Arduino Uno R3«).
2. Filter po kategoriji prikaže le kose izbrane kategorije. Filter in iskalni niz se lahko uporabita hkrati.
3. Ko uporabnik vnese termin od–do in vključi »Samo prosti«, se prikažejo le kosi s statusom `NA_VOLJO`, ki v tem terminu nimajo rezervacije s statusom `ODDANA`, `ODOBRENA` ali `IZDANA`.
4. Če ni zadetkov, se prikaže sporočilo »Ni opreme, ki ustreza iskanju« in gumb *Počisti filtre*.
5. Rezultati so razdeljeni na strani z največ 20 kosi na stran.

---

## US-15: Razrešitev poškodbe

- **Funkcionalnost:** F11 – Zapis in razreševanje poškodb
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim neporavnano poškodbo označiti kot razrešeno, ko je oprema popravljena ali nadomeščena, da uporabniku odstranim opozorilo.

**Kriteriji sprejemljivosti:**

1. Stran *Poškodbe* prikaže vse zapise z `razresen = false`. Pri vsakem so prikazani uporabnik, kos z inventarno številko, datum in opis poškodbe.
2. Po kliku *Označi kot razrešeno* in potrditvi se nastavi `razresen = true`, `razresenoOb` pa na trenutni čas.
3. Po razrešitvi se pri oddanih rezervacijah tega uporabnika opozorilo o neporavnani poškodbi ne prikaže več, če uporabnik nima drugih neporavnanih poškodb.
4. Zapisa o poškodbi ni mogoče izbrisati. Razrešen zapis ostane viden v zgodovini kosa.
5. Razreševanje je dostopno le tehniku. Za druge vloge API vrne `403`.

---

## US-16: Zgodovina kosa opreme

- **Funkcionalnost:** F12 – Zgodovina posameznega kosa opreme
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim za posamezen kos opreme videti vse pretekle izposoje z zabeleženimi stanji, da ugotovim, kdaj in pri kom je prišlo do poškodbe.

**Kriteriji sprejemljivosti:**

1. Zavihek *Zgodovina* na strani kosa prikaže vse rezervacije, ki vsebujejo ta kos, razvrščene od najnovejše. Pri vsaki so prikazani uporabnik, termin, status, `izdanoOb` in `vrnjenoOb`.
2. Za vsako izposojo sta prikazana `stanjeObIzdaji` in `stanjeObVracilu`. Vrstica, v kateri je stanje ob vračilu slabše od stanja ob izdaji, je vizualno izpostavljena.
3. Pri postavki z zapisom o poškodbi sta prikazana opis poškodbe in status razrešitve.
4. Filter »Samo izvedene izposoje« skrije zavrnjene in preklicane rezervacije.
5. Študent, asistent in profesor zgodovine kosa ne vidijo. Za te vloge API vrne `403`.

---

## US-17: Urejanje pravil izposoje

- **Funkcionalnost:** F13 – Upravljanje pravil izposoje
- **Vloga:** administrator

**Zgodba:** Kot administrator želim za vsako vlogo nastaviti največje število kosov in najdaljši čas izposoje, da lahko omejitve prilagodim brez sprememb v kodi.

**Kriteriji sprejemljivosti:**

1. Stran *Pravila izposoje* prikaže tabelo za vloge Študent, Asistent in Profesor s polji `maxKosov` in `maxDni`, za profesorja pa tudi `maxDniDolgorocno`.
2. Vse vrednosti morajo biti cela števila, večja ali enaka 1. Ob neveljavni vrednosti API vrne `400`, obrazec pa prikaže napako pri polju.
3. Shranjena sprememba takoj velja za vse nove oddaje. Ko administrator npr. zmanjša `maxKosov` za študente na 2, je študentova oddaja tretjega kosa zavrnjena.
4. Sprememba pravil ne vpliva na že shranjene rezervacije, ki ohranijo svoj status.
5. Tehnik in ostale vloge pravil ne morejo spreminjati. Za te vloge `PUT/PATCH /api/pravila` vrne `403`.

---

## US-18: Upravljanje uporabniških računov

- **Funkcionalnost:** Upravljanje uporabnikov (podporna)
- **Vloga:** administrator

**Zgodba:** Kot administrator želim ustvarjati uporabniške račune in jim dodeliti vlogo, da dostop do sistema dobijo le člani oddelka.

**Kriteriji sprejemljivosti:**

1. Obrazec *Nov uporabnik* zahteva ime, priimek, e-poštni naslov, vlogo in začetno geslo. E-poštni naslov mora biti veljavne oblike, sicer API vrne `400`.
2. Če uporabnik z istim e-poštnim naslovom že obstaja, API vrne `409` s sporočilom »Uporabnik s tem e-poštnim naslovom že obstaja«.
3. Geslo se shrani le kot bcrypt zgoščena vrednost. Noben odgovor API-ja ne vsebuje gesla ali polja `gesloHash`.
4. Administrator lahko uporabnika deaktivira. Deaktiviran uporabnik se ne more prijaviti, njegove rezervacije in zgodovina pa ostanejo v bazi.
5. Javne registracije ni. Endpointi `/api/uporabniki` za vse vloge razen `ADMIN` vrnejo `403`.

---

## US-19: Dodajanje in umik opreme

- **Funkcionalnost:** Upravljanje opreme (podporna)
- **Vloga:** tehnik

**Zgodba:** Kot tehnik želim dodajati nove kose opreme ter pokvarjene ali odpisane kose umakniti iz izposoje, da katalog odraža dejansko stanje inventarja.

**Kriteriji sprejemljivosti:**

1. Obrazec *Nov kos opreme* zahteva inventarno številko, naziv, kategorijo in začetno stanje. Opis je neobvezen. Nov kos ima status `NA_VOLJO`.
2. Če inventarna številka že obstaja, API vrne `409` s sporočilom »Kos s to inventarno številko že obstaja«.
3. Ko tehnik kosu nastavi status `V_OKVARI`, se kos v katalogu prikaže z oznako »V okvari«, nove rezervacije zanj pa niso mogoče. Če ima kos odprte rezervacije s statusom `ODDANA` ali `ODOBRENA`, sistem tehniku prikaže njihovo število.
4. Ko tehnik kosu nastavi status `UMAKNJEN`, kos izgine iz kataloga, njegov zapis in zgodovina izposoj pa ostaneta v bazi.
5. Ko tehnik kosu s statusom `V_OKVARI` nastavi status `NA_VOLJO`, ga je spet mogoče rezervirati.

---

## Predpostavke

Nekateri kriteriji sprejemljivosti dopolnjujejo podrobnosti, ki v dokumentih 03 in 04 še niso izrecno zapisane. Ob implementaciji jih je treba dodati tudi tja:

- Ob oddaji se preveri, da so vsi kosi v statusu `NA_VOLJO` (US-03), da je `zacetek < konec` in da začetek ni v preteklosti (US-03).
- Ob vračilu se `trenutnoStanje` kosa posodobi na `stanjeObVracilu` (US-08).
- Endpointi za upravljanje opreme, razreševanje poškodb in zgodovino kosa (US-15, US-16, US-19) še niso navedeni v seznamu API endpointov v dokumentu 04.
