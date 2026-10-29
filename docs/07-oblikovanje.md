# Navodila za oblikovanje spletne aplikacije Rentaj.me

Ta dokument je navodilo za Claude Code. Na njegovi podlagi oblikuj in implementiraj uporabniški vmesnik aplikacije Rentaj.me. Poslovna pravila, podatkovni model in API so opisani v dokumentih 02–05 (v mapi `docs/`). Če se navodilo in ti dokumenti razlikujejo, velja dokument.

## 1. Kontekst

Rentaj.me je spletni sistem za izposojo opreme na oddelku za tehniko. Uporabljajo ga študenti, asistenti, profesorji, tehnik oddelka in administrator. Aplikacija mora biti:

- **jasna in zanesljiva:** uporabnik mora vedno vedeti, ali je oprema na voljo, kaj čaka na odobritev in kdaj mora vrniti opremo,
- **hitra za delo:** tehnik na dan obdela veliko rezervacij, zato morajo ključna dejanja biti največ dva klika stran,
- **odzivna:** uporablja se na namizju, prenosniku in telefonu (mobilna aplikacija ni del projekta, spletna pa mora delovati tudi na telefonu),
- **institucionalna, a sodobna:** rešitev za tehniški oddelek fakultete, brez občutka za »startup« ali marketinško stran.

## 2. Tehnološki okvir (ne spreminjaj)

- React + Vite, usmerjanje z React Router.
- Stiliranje s Tailwind CSS. Brez dodatnih UI knjižnic (Material UI, Bootstrap, Ant Design ipd.), razen če ti navodilo to izrecno dovoli.
- Frontend ne vsebuje poslovne logike. Preverjanja v obrazcih so samo za uporabniško izkušnjo, končno odločitev pa vedno vrne API (`400`, `403`, `409`).
- API kliče prek obstoječega modula v `frontend/src/api/`. Piškotki se pošiljajo s `credentials: 'include'`. Žetona ne shranjuj v `localStorage`.
- Struktura: `pages/` za strani, `components/` za ponovno uporabne komponente, `api/` za klice API-ja.

## 3. Vizualni slog

Aplikacija mora biti vizualno skladna s spletno stranjo Oddelka za tehniko FNM UM (<https://tehnika.fnm.um.si>). Oddelek nima priročnika celostne grafične podobe, zato so spodnja pravila povzeta po obstoječi spletni strani. Uporabnik, ki pride s strani oddelka v Rentaj.me, mora imeti občutek, da je ostal na istem mestu.

### 3.1 Ton

Kot spletna stran oddelka: čista, institucionalna, ploska. Veliko belega prostora, bela ozadja, tanke sive obrobe, skoraj brez senc in brez gradientov. Petrolejsko modra je edina izrazita barva v vmesniku, vse ostalo je belo in sivo. Naj spominja na dobro orodje za delo, ne na reklamo.

### 3.2 Barve

Določi paleto v Tailwind konfiguraciji kot tokene (`theme.extend.colors`), ne kot naključne hex vrednosti po komponentah.

**Barve oddelka:**

| Token | Vrednost | Uporaba |
|---|---|---|
| `brand-600` | `#006385` | Glavna barva oddelka (`theme-color` spletne strani). Primarni gumbi, aktivna povezava v meniju, naslovi razdelkov, povezave, ozadje noge, fokus. Kontrast z belo je 6,7 : 1. |
| `brand-700` | `#004F6B` | Lebdenje in pritisk na primarni gumb. |
| `brand-800` | `#003B50` | Pritisnjeno stanje, temnejši poudarki. |
| `brand-50` | `#E6F0F3` | Ozadje izbranih vrstic, izbranega dne v koledarju, informativnih obvestil. |
| `brand-100` | `#CCE0E7` | Obroba izbranih elementov. |
| `logo-red` | `#E2453F` | Rdeča iz logotipa oddelka. Uporablja se samo v logotipu, nikoli za gumbe, napake ali statuse, da je ni mogoče zamenjati z opozorilom. Natančno vrednost preveri iz datoteke logotipa. |

Za vmesne odtenke (`brand-200` do `brand-500`) ustvari lestvico iz `#006385`.

**Nevtralne barve (kot na spletni strani):**

| Token | Vrednost | Uporaba |
|---|---|---|
| `gray-900` | `#222222` | Naslovi strani, besedilo v meniju |
| `gray-700` | `#444444` | Osnovno besedilo |
| `gray-600` | `#666666` | Pomožno besedilo (najsvetlejša siva za besedilo na beli, kontrast 5,7 : 1) |
| `gray-300` | `#DDDDDD` | Obrobe kartic, tabel in polj |
| `gray-200` | `#E8E8E8` | Ločilne črte |
| `gray-100` | `#F5F5F5` | Ozadje glav harmonik, glave tabel, vrstic ob lebdenju |
| `white` | `#FFFFFF` | Ozadje strani, glave in kartic |

**Semantične barve (izbrane tako, da se ne tepejo z modro oddelka):**

| Namen | Polna | Svetlo ozadje |
|---|---|---|
| Uspeh | `#1E7B34` | `#E8F3EA` |
| Opozorilo | `#A15C00` | `#FDF1DE` |
| Napaka | `#B42318` | `#FDECEA` |
| Informacija | `brand-600` | `brand-50` |

Barva nikoli ne nosi pomena sama. Vsak status ima tudi besedilo in po možnosti ikono.

### 3.3 Statusne značke

Značka je pravokotnik z zaobljenimi vogali, besedilo v slovenščini, ikona levo.

**Statusi rezervacije:**

| Status | Besedilo | Barvni slog |
|---|---|---|
| Oddana | Oddana | nevtralna modra, ura |
| Odobrena | Odobrena | zelena, kljukica |
| Zavrnjena | Zavrnjena | rdeča, križec |
| Preklicana | Preklicana | siva, prečrtano |
| Izdana | Izdana | primarna, puščica ven |
| Vrnjena | Vrnjena | siva, kljukica |
| Zamujena (izpeljano) | Zamujena · N dni | rdeča, ura z oklepajem; ni shranjen status, prikaže se, ko je `IZDANA` in `konec < zdaj` |

**Statusi kosa opreme:**

| Status | Besedilo | Slog |
|---|---|---|
| `NA_VOLJO` | Na voljo | zelena |
| `V_OKVARI` | V okvari | oranžna |
| `UMAKNJEN` | Umaknjen | siva, v katalogu se ne prikazuje |

**Stanje opreme** (ob izdaji in vračilu): Brezhibno (zelena), Obrabljeno (rumena/oranžna), Poškodovano (rdeča).

### 3.4 Tipografija

- **Pisava:** Roboto (Google Fonts, uteži 400, 500, 700, podmnožici `latin` in `latin-ext` za č, š, ž, Č, Š, Ž). Spletna stran oddelka teče na WordPressu s temo, ki privzeto uporablja Roboto, videz posnetka se s tem ujema. Pred začetkom preveri: na tehnika.fnm.um.si v orodjih za razvijalce (Computed → `font-family`) potrdi pisavo naslovov, menija in besedila. Če se razlikuje, uporabi tisto.
- **Rezervna pisava:** `Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Naslov strani:** 28 px, krepko (700), barva `gray-900`, poravnan levo.
- **Naslov razdelka:** 22–24 px, krepko, barva `brand-600`. Na straneh s pregledom (npr. Katalog, Nadzorna plošča) lahko uporabiš slog s spletne strani: naslov na sredini s tanko svetlo sivo črto (`gray-200`) levo in desno.
- **Meni:** 14–15 px, srednje krepko (500–700), barva `gray-900`.
- **Besedilo:** 16 px (ne manj v obrazcih), pomožno besedilo 14 px v `gray-600`.
- Številke v tabelah in koledarju naj bodo tabelarne (`tabular-nums`), da se poravnajo.
- **Datumi** so v slovenskem formatu: `22. 10. 2026`, kratka oblika `22. 10.` Ure: `14.00` ali `14:00` (izberi eno in jo drži dosledno).

### 3.5 Razmiki, robovi, senca

- Osnovna enota 4 px. Uporabljaj lestvico 4, 8, 12, 16, 24, 32, 48.
- **Zaobljenost:** majhna, kot na spletni strani. 3 px za gumbe, polja, kartice, harmonike in značke; 0 px za glavno sliko in nogo. Okroglo (50 %) le za ikone družbenih omrežij in avatarje.
- **Senca:** glava ima komaj opazno senco ali spodnjo obrobo (`gray-200`). Kartice in tabele imajo rob 1 px `gray-300`, brez sence. Zmerno senco imajo le plavajoči elementi (pogovorna okna, spustni meniji).
- Največja širina vsebine na namizju 1200 px (kot na spletni strani), na mobilnih napravah 16 px levo in desno.

### 3.6 Logotipi in elementi spletne strani

- **Logotipi:** v glavi sta levo logotip Univerze v Mariboru / FNM in logotip Oddelka za tehniko, tako kot na spletni strani. Datoteke prenesi iz spletne strani oddelka (npr. `/wp-content/uploads/2025/02/Logo-ODT.jpg`) oziroma jih pridobi od oddelka, shrani jih v `frontend/src/assets/` in jih ne povezuj neposredno s strežnika oddelka. Logotipov ne prebarvaj, ne raztegni in jim ne dodajaj učinkov. Če je mogoče, uporabi SVG ali PNG s prozornim ozadjem.
- **Ime aplikacije:** desno od logotipov ali pod njimi napis Rentaj.me v `brand-600`, krepko, z manjšim podnaslovom »Izposoja opreme«. Ime ne sme biti večje od logotipov.
- **Glava:** bela, višina 80–96 px na namizju, logotipi levo, meni desno. Aktivna povezava v meniju ima tanko črto (2 px) pod besedilom v `brand-600`, kot povezava »Domov« na spletni strani. Desno od menija ime in vloga uporabnika ter *Odjava*. Spodaj tanka obroba ali komaj vidna senca.
- **Zgornja vrstica** (telefon in družbena omrežja na spletni strani) v aplikaciji ni potrebna. Če jo dodaš, naj bo tanka, svetla, z majhnim sivim besedilom.
- **Harmonika** (kot »Zaposljivost / Interdisciplinarni študij« na spletni strani): glava z ozadjem `gray-100`, rob 1 px `gray-300`, znak »+« oziroma »–« levo, krepek naslov. Uporabi jo za filtre na telefonu, zgodovino kosa in podrobnosti rezervacije.
- **Noga:** čez celotno širino, ozadje `brand-600`, belo besedilo. Levo naslov »Kontakt« in naslov oddelka (Oddelek za tehniko FNM, Koroška cesta 160, 2000 Maribor), pod njim ikone družbenih omrežij v belih okroglih okvirjih. Na dnu tanka svetlejša črta in desno »Rentaj.me · Oddelek za tehniko FNM 2026 – Vse pravice pridržane.« V aplikaciji naj bo noga nižja kot na spletni strani, ker so strani delovne.
- **Slike:** fotografija stavbe s spletne strani se lahko uporabi kot ozadje na strani za prijavo (zatemnjena, z belo kartico obrazca na sredini). Drugod se fotografije ne uporabljajo kot dekoracija.

## 4. Komponente, ki jih je treba izdelati

Najprej izdelaj ta nabor, nato strani. Vsaka komponenta mora imeti stanja: privzeto, lebdenje, fokus, aktivno, onemogočeno, nalaganje, napako.

- **Gumbi:** primarni, sekundarni, nevarni (Zavrni, Prekliči), gumb z ikono. Velikosti normalna in majhna.
- **Obrazci:** polje z oznako nad njim, pomožnim besedilom in sporočilom napake pod njim. Napaka se prikaže pri polju, ne samo kot splošno sporočilo. Obvezna polja označena z besedilom »obvezno«, ne samo z zvezdico.
- **Statusna značka** (glej 3.3).
- **Kartica opreme:** slika (ali siv placeholder z ikono kategorije), naziv, inventarna številka, značka statusa, gumb *Podrobnosti*. Kos v okvari ima onemogočen gumb in razlog v besedilu, ne samo sivega gumba.
- **Koledar zasedenosti:** mesečni prikaz, premikanje med meseci, zasedeni dnevi s šrafuro ali temnejšim ozadjem in oznako, ne samo barvo. Dostopen s tipkovnico (puščice, Enter). Pri zasedenem terminu samo obdobje od–do, brez imen.
- **Izbira termina:** dva datumska vnosa (od–do) z jasno prikazanim trajanjem v dnevih, ki se primerja z omejitvijo vloge.
- **Tabela z razvrščanjem:** na namizju klasična tabela, na telefonu seznam kartic z istimi podatki.
- **Zavihki:** za *Trenutne*/*Pretekle* in *Zgodovino* kosa.
- **Pogovorno okno za potrditev:** za preklic, razrešitev poškodbe, izdajo in vračilo. Nevarno dejanje ima jasen naslov in besedilo na gumbu (»Prekliči rezervacijo«, ne »V redu«).
- **Obvestila (toast):** potrditve (»Rezervacija oddana – čaka na odobritev tehnika«). Ostanejo 5 s, dostopna za bralnike zaslona.
- **Prazna stanja:** ilustracija ali ikona, kratko besedilo in gumb za naslednje dejanje (npr. »Nimate še nobene rezervacije« + *Na katalog*).
- **Nalaganje:** skeleti za kartice in tabele, ne vrtljivi krogi čez celotno stran.
- **Paginacija:** 20 kosov na stran, prikaz »1–20 od 143«.
- **Glava in navigacija:** po zgledu spletne strani oddelka (glej 3.6): logotipa UM/FNM in Oddelka za tehniko levo, ime Rentaj.me, meni glede na vlogo desno z aktivno povezavo podčrtano v `brand-600`, ime in vloga prijavljenega, gumb *Odjava*. Na telefonu skrit meni (gumb »Meni«), ki se odpre kot bel pladenj čez celo širino.
- **Noga:** po zgledu spletne strani oddelka (glej 3.6), nižja različica.
- **Harmonika:** po zgledu spletne strani oddelka (glej 3.6).

## 5. Strani in zasloni

Wireframi v dokumentu 06 pokrivajo katalog, podrobnosti, moje izposoje, nadzorno ploščo tehnika in vračilo. Ostale strani izpelji iz dokumentov 02 in 05, pri čemer upoštevaj isti slog.

### 5.1 Prijava (vsi)

Ozadje je zatemnjena fotografija stavbe FNM (prekrivna plast `brand-800` z 70–80 % prekrivnostjo), na sredini bela kartica z logotipoma, napisom Rentaj.me, obrazcem z e-pošto in geslom ter gumbom *Prijava* v `brand-600`. Glave z menijem na tej strani ni, noga je. Napaka: »Napačen e-poštni naslov ali geslo« (ne razkrije, kaj je narobe). Deaktiviran račun: »Račun je deaktiviran. Obrnite se na administratorja.«

### 5.2 Katalog (študent, asistent, profesor)

- Vrstica za iskanje, filter po kategoriji, *Od–Do*, stikalo *Samo prosti*. Na telefonu se filtri skrijejo v pladenj.
- Mreža kartic (3–4 stolpci na namizju, 1–2 na telefonu).
- Vrstica z aktivnimi filtri, ki jih je mogoče hitro odstraniti.

### 5.3 Podrobnosti kosa in rezervacija

- Dva stolpca na namizju: levo podatki in slika, desno koledar in obrazec. Na telefonu enojni stolpec, obrazec pod koledarjem.
- Obrazec: začetek, konec, namen, izbrani kosi. Pod obrazcem stalno vidna omejitev vloge (»Vaša vloga: največ 3 kosi, 7 dni«).
- Napaka `409` se prikaže nad gumbom in navede kos ter termin, npr. »Arduino A-014 je zaseden od 22. 10. do 27. 10.«
- Ob uspehu potrditev in preusmeritev na *Moje izposoje*.
- Profesor vidi stikalo *Dolgoročna izposoja*; ostali ga ne vidijo.

### 5.4 Moje izposoje (vsi uporabniki, ki lahko izposojajo)

- Zavihka *Trenutne* in *Pretekle*.
- Vsaka rezervacija kot kartica ali vrstica: oprema, termin, namen, značka statusa.
- Zamujena izposoja z rdečo oznako in številom dni.
- Zavrnjena z razlogom in komentarjem tehnika.
- Gumb *Prekliči* samo pri statusu `ODDANA`, s potrditvenim oknom.

### 5.5 Nadzorna plošča tehnika

- Vrh: kartice s številom oddanih, izdanih in zamujenih izposoj. Vsaka kartica je povezava na ustrezen seznam.
- Seznam oddanih rezervacij, najstarejše zgoraj. Pri vsaki: uporabnik in vloga, oprema z inventarnimi številkami, termin, namen, opozorila (zamude, poškodbe) in gumba *Odobri* ter *Zavrni*.
- Zavrnitev odpre pogovorno okno: obvezen spustni seznam razlogov (5 možnosti iz dokumenta 02), neobvezen komentar, gumb *Potrdi zavrnitev* onemogočen, dokler razlog ni izbran.
- Opozorila so vidna, a ne blokirajo odobritve.

### 5.6 Izdaja in vračilo

- **Izdaja:** za vsak kos izbira stanja (Brezhibno, Obrabljeno, Poškodovano), privzeto trenutno stanje kosa. Gumb *Potrdi izdajo* onemogočen, dokler niso izbrana vsa stanja.
- **Vračilo:** tabela z vrsticami za kose, stolpec »Ob izdaji« (samo branje) in »Ob vračilu« (izbira). Ob »Poškodovano« se prikaže obvezno polje *Opis poškodbe* v isti vrstici.
- Potrditev vračila v pogovornem oknu, ki našteje, koliko kosov je poškodovanih.

### 5.7 Zamujene izposoje (tehnik)

Tabela z uporabnikom, e-pošto, kosi, rokom in številom dni zamude. Razvrščeno od največje zamude. Vrstica vodi na stran vračila.

### 5.8 Poškodbe (tehnik)

Seznam nerazrešenih zapisov s filtrom »Razrešeni / Nerazrešeni«. Gumb *Označi kot razrešeno* s potrditvijo. Razrešen zapis ostane viden, označen kot razrešen z datumom.

### 5.9 Zgodovina kosa (tehnik)

Stran kosa z zavihkom *Zgodovina*. Vrstice od najnovejše, s stanji ob izdaji in vračilu. Če je stanje ob vračilu slabše, je vrstica vizualno izpostavljena (ikona in besedilo, ne samo barva). Filter »Samo izvedene izposoje«.

### 5.10 Administracija (administrator)

- **Uporabniki:** tabela z iskanjem, vlogo, statusom (aktiven/deaktiviran), gumb *Nov uporabnik* z obrazcem (ime, priimek, e-pošta, vloga, začetno geslo). Deaktivacija s potrditvijo.
- **Pravila izposoje:** tabela za Študenta, Asistenta, Profesorja z vrednostmi `maxKosov`, `maxDni`, za profesorja še `maxDniDolgorocno`. Shranjevanje z napako pri polju.
- **Kategorije:** preprost seznam z dodajanjem in urejanjem.
- **Oprema** (tehnik in administrator): seznam kosov, nov kos, sprememba statusa (`NA_VOLJO`, `V_OKVARI`, `UMAKNJEN`) s potrditvijo ob umiku.

## 6. Mobilna različica

- Breakpointi: telefon do 640 px, tablica do 1024 px, namizje nad 1024 px. Piši mobile-first.
- Tabele na telefonu preidejo v kartice s parom »oznaka: vrednost«.
- Dejanja (*Odobri*, *Zavrni*, *Izdaj*) so na telefonu fiksno na dnu zaslona ali v kartici z velikimi tipkami (vsaj 44 × 44 px).
- Koledar na telefonu prikaže en mesec, dnevi so vsaj 40 px visoki.
- Pogovorna okna na telefonu so čez celo širino (bottom sheet).

## 7. Dostopnost

- Kontrast besedila vsaj 4,5 : 1, velikih naslovov vsaj 3 : 1, tudi v značkah in v onemogočenih stanjih, kjer je to mogoče.
- Vidna fokusna obroba na vsakem interaktivnem elementu. Ne odstranjuj `outline` brez zamenjave.
- Vse je dostopno s tipkovnico, pogovorna okna ujamejo fokus in se zapirajo s tipko Esc.
- Vsaka ikona brez besedila ima `aria-label`. Obrazci imajo povezane oznake (`htmlFor`).
- Napake v obrazcih se napovejo bralnikom zaslona (`role="alert"` ali `aria-live`).
- Koledar: vsak dan ima `aria-label` z datumom in stanjem (npr. »22. oktober, zaseden«).

## 8. Microcopy (besedila v vmesniku)

Uporabljaj naslednja besedila, kjer se pojavijo. Ostalo piši v slovenščini, v vikanju (vi), kratko in neosebno, brez klicajev.

- »Rezervacija oddana – čaka na odobritev tehnika«
- »Napačen e-poštni naslov ali geslo«
- »Račun je deaktiviran. Obrnite se na administratorja.«
- »Nimate še nobene rezervacije«
- »Ni opreme, ki ustreza iskanju«
- »Ali res želite preklicati rezervacijo?«
- »Uporabnik s tem e-poštnim naslovom že obstaja«
- »Kos s to inventarno številko že obstaja«
- »Najdaljši čas izposoje za vašo vlogo je 7 dni«

Za napake API-ja uporabi sporočilo iz odgovora. Če ga ni, uporabi »Prišlo je do napake. Poskusite znova.«

Gumbi so glagoli: *Odobri*, *Zavrni*, *Izdaj*, *Prevzemi vračilo*, *Prekliči*, *Potrdi*. Ne uporabljaj »V redu« za nevarna dejanja.

## 9. Pravila, ki jih ne smeš kršiti

- Ne spreminjaj API poti, pričakovanih podatkov ali statusnih kod, razen če je to izrecno napisano.
- Ne preverjaj poslovnih pravil samo na frontendu. Prikaz omejitev je informativen, odločitev pa je API-jeva.
- Status »Zamujena« se ne shranjuje. Izračuna se iz `IZDANA` in `konec < zdaj`.
- Uporabnik ne vidi imen in e-poštnih naslovov drugih uporabnikov pri zasedenosti kosa.
- Gesla in `gesloHash` se nikjer ne prikazujejo.
- Ne dodajaj funkcionalnosti izven MVP (čakalna vrsta, QR kode, kompleti, statistika, e-pošta). Če jih pustiš v kodi, jih skrij, ne briši.
- Vsi časi in datumi so v časovnem pasu Europe/Ljubljana.

## 10. Postopek dela

1. **Preglej vire.** Preberi dokumente 01–06 in tokene barv ter tipografije, ki si jih določil.
2. **Najprej temelj.** Nastavi Tailwind tokene (barve, pisava, razmiki, zaobljenost, senca), globalno postavitev in glavo z navigacijo. Pokaži rezultat in počakaj na potrditev, preden nadaljuješ.
3. **Komponente.** Izdelaj komponente iz poglavja 4 z vsemi stanji. Vsako komponento preizkusi v pogledu na več širinah.
4. **Strani** po vrstnem redu: Prijava, Katalog, Podrobnosti in rezervacija, Moje izposoje, Nadzorna plošča tehnika, Izdaja in vračilo, nato administracija.
5. **Mobilna različica** med razvojem sproti, ne na koncu.
6. **Kontrola.** Preveri dostopnost (tipkovnica, kontrast, bralnik zaslona), slovenske znake, datume, prazna stanja in napake `400`/`401`/`403`/`409`.

Za vsako večjo odločitev (npr. izbira pisave, shema barv) napiši kratko obrazložitev v dokumentacijo komponent ali v `docs/oblikovanje.md`.

## 11. Kriteriji sprejemljivosti oblikovanja

- Vsak status je razviden iz besedila, ne samo iz barve.
- Študent odda rezervacijo z največ tremi kliki od kataloga (izbira kosa, termin, *Oddaj*).
- Tehnik odobri rezervacijo v enem kliku iz seznama.
- Zavrnitev ni mogoča brez izbranega razloga.
- Vsaka stran ima prazno stanje, stanje nalaganja in stanje napake.
- Vse je uporabno na telefonu širine 375 px brez vodoravnega drsenja strani.
- Vse je uporabno s tipkovnico.
- Slovenski znaki in datumi se prikazujejo pravilno.

## 12. Odprta vprašanja za naročnika

Te odločitve sprejmi pred začetkom ali zahtevaj predlog z možnostmi:

1. Ali lahko od oddelka dobimo logotipa UM/FNM in Oddelka za tehniko v vektorski obliki (SVG) ali kot PNG s prozornim ozadjem? Na spletni strani je logotip oddelka JPG z belim ozadjem.
2. Ali naj se uporabi jubilejni logotip »50 let UM« (kot na spletni strani) ali standardni logotip univerze?
3. Ali je pisava spletne strani res Roboto? (Preveri v orodjih za razvijalce, glej 3.4.)
4. Ali naj se v katalogu prikazujejo slike opreme, ki jih tehnik nalaga, ali zadostujejo ikone kategorij?
5. Ali naj bo aplikacija v temnem načinu? (Privzeto: ne, v MVP.)
