# Funkcionalnosti in obseg

## Uporabniške vloge

### Pravila izposoje po vlogah

| Vloga | Največ kosov hkrati | Najdaljši čas izposoje |
|---|---|---|
| Študent | 3 | 7 dni |
| Asistent | 20 | 7 dni |
| Profesor | 20 | 7 dni (standardno) ali do 6 mesecev (dolgoročno) |

### Študent

**Lahko:**
- pregleduje katalog opreme in razpoložljivost posameznih kosov po datumih,
- odda rezervacijo za prost termin, do največ 3 kose hkrati in za največ 7 dni,
- prekliče svojo rezervacijo, dokler ta še ni odobrena,
- pregleduje svoje trenutne in pretekle izposoje ter njihove statuse.

**Ne more:**
- odobriti, zavrniti ali spreminjati rezervacij,
- videti rezervacij drugih uporabnikov (vidi le, da je termin zaseden),
- oddati dolgoročne izposoje,
- urejati opreme, kategorij ali uporabnikov.

### Asistent

**Lahko:**
- vse, kar lahko študent,
- izposodi si do 20 kosov hkrati (npr. komplet opreme za skupino na vajah).

**Ne more:**
- oddati dolgoročne izposoje (čas izposoje je omejen na 7 dni),
- odobriti, zavrniti ali spreminjati rezervacij,
- urejati opreme, kategorij ali uporabnikov.

### Profesor

**Lahko:**
- vse, kar lahko asistent,
- odda **dolgoročno izposojo** za obdobje do 6 mesecev (npr. za celoten semester ali raziskovalni projekt).

**Ne more:**
- odobriti, zavrniti ali spreminjati rezervacij (tudi lastnih),
- preseči omejitve 20 kosov hkrati,
- urejati opreme, kategorij ali uporabnikov.

### Tehnik oddelka

**Lahko:**
- pregleduje vse rezervacije in izposoje,
- odobri ali zavrne oddane rezervacije z obrazložitvijo,
- označi izdajo opreme ob prevzemu in vračilo opreme,
- ob izdaji in vračilu zabeleži stanje opreme ter ustvari zapis o poškodbi,
- dodaja, ureja in umika kose opreme iz izposoje (npr. ob okvari),
- pregleduje seznam zamujenih izposoj.

**Ne more:**
- ustvarjati, urejati ali brisati uporabniških računov,
- spreminjati vlog uporabnikov,
- spreminjati pravil izposoje (omejitev kosov in rokov).

### Administrator

**Lahko:**
- ustvarja, ureja in deaktivira uporabniške račune ter jim dodeljuje vloge,
- upravlja kategorije opreme,
- nastavlja pravila izposoje (največje število kosov in najdaljši čas izposoje po vlogah),
- pregleduje vse podatke v sistemu.

**Ne more:**
- odobravati rezervacij ter izdajati ali prevzemati opreme – to je naloga tehnika, ki fizično upravlja z opremo,
- brisati zgodovine izposoj in zapisov o poškodbah (ti ostanejo kot trajna evidenca).

## Pravila za odobritev in zavrnitev rezervacij

Preverjanje rezervacije poteka na dveh ravneh.

### 1. Samodejno preverjanje ob oddaji

Sistem rezervacijo zavrne že ob oddaji, zato ta sploh ne pride do tehnika, če:

- se izbrani termin prekriva z obstoječo odobreno ali oddano rezervacijo istega kosa opreme,
- bi uporabnik z novo rezervacijo presegel največje dovoljeno število kosov za svojo vlogo,
- izbrani čas izposoje presega najdaljši dovoljeni rok za njegovo vlogo.

Uporabnik v tem primeru takoj prejme sporočilo z razlogom, zakaj rezervacije ni mogoče oddati.

### 2. Ročna odločitev tehnika

Rezervacije, ki prestanejo samodejno preverjanje, dobijo status **Oddana** in čakajo na tehnika. Tehnik rezervacijo zavrne, če velja eden od naslednjih razlogov:

| Razlog zavrnitve | Opis |
|---|---|
| Zamujena izposoja | Uporabnik ima vsaj eno izposojo, katere rok vračila je potekel. Dokler opreme ne vrne, ne more dobiti nove. |
| Neporavnana poškodba | Uporabnik ima odprt zapis o poškodbi iz ene od prejšnjih izposoj. |
| Oprema v okvari ali na servisu | Stanje opreme se je spremenilo po oddaji rezervacije in je ni mogoče izdati. |
| Oprema potrebna za izvedbo vaj | Pedagoški proces ima prednost pred osebno izposojo. |
| Neustrezen namen izposoje | Navedeni namen ni povezan s študijskim ali raziskovalnim delom. |

Ob zavrnitvi tehnik **obvezno izbere razlog** s seznama in po želji doda komentar. Uporabnik razlog in komentar vidi pri svoji rezervaciji.

Za prva dva razloga sistem tehniku pri pregledu rezervacije **samodejno prikaže opozorilo** (npr. »Uporabnik ima 1 zamujeno izposojo«), končna odločitev pa ostane tehniku.

## Predvidene funkcionalnosti

Funkcionalnosti, označene z **[MVP]**, so del prve delujoče različice.

1. **[MVP] Katalog opreme s prikazom razpoložljivosti po datumih**
   Uporabnik za vsak kos opreme vidi koledar, v katerih terminih je zaseden in kdaj je prost, preden odda rezervacijo.

2. **[MVP] Rezervacija s samodejnim preverjanjem prekrivanja in pravil vloge**
   Uporabnik izbere kose opreme, termin in namen izposoje. Sistem preveri, da se termin ne prekriva z drugimi rezervacijami ter da uporabnik ne presega omejitve kosov in najdaljšega roka za svojo vlogo.

3. **[MVP] Odobritev ali zavrnitev rezervacije z obveznim razlogom**
   Tehnik pregleda oddane rezervacije in jih odobri ali zavrne. Pri zavrnitvi izbere razlog s seznama in po želji doda komentar, ki ga vidi uporabnik.

4. **[MVP] Izdaja in vračilo opreme z beleženjem stanja**
   Ob prevzemu tehnik označi rezervacijo kot izdano, ob vračilu pa kot vrnjeno. Pri obeh korakih zabeleži stanje opreme (brezhibno, obrabljeno, poškodovano).

5. **[MVP] Samodejno označevanje zamujenih izposoj**
   Sistem izposojo, katere rok vračila je potekel, oprema pa še ni vrnjena, samodejno prikaže kot *Zamujeno*. Status se izračuna ob vsakem branju, zato je vedno točen. Tehnik ima pregled vseh zamujenih izposoj na enem mestu.

6. **[MVP] Pregled lastnih izposoj in statusov**
   Uporabnik vidi svoje trenutne in pretekle rezervacije, njihove statuse, roke vračila in morebitne razloge zavrnitve.

7. **[MVP] Opozorila tehniku o zamudah in poškodbah uporabnika**
   Pri pregledu oddane rezervacije sistem tehniku samodejno prikaže, ali ima uporabnik zamujene izposoje ali neporavnane poškodbe.

8. **Dolgoročna izposoja za profesorje**
   Profesor lahko odda rezervacijo za obdobje do 6 mesecev, npr. za izvedbo predmeta skozi semester ali za raziskovalni projekt.

9. **Preklic rezervacije s strani uporabnika**
   Uporabnik lahko prekliče svojo rezervacijo, dokler ta še ni odobrena. Termin se s tem sprosti za druge.

10. **Iskanje in filtriranje opreme**
    Iskanje opreme po imenu ter filtriranje po kategoriji in razpoložljivosti v izbranem terminu.

11. **Zapis in razreševanje poškodb**
    Tehnik ob vračilu ustvari zapis o poškodbi z opisom. Ko je poškodba poravnana (popravilo ali nadomestilo), zapis označi kot razrešen, s čimer se uporabniku odstrani opozorilo.

12. **Zgodovina posameznega kosa opreme**
    Za vsak kos opreme je viden seznam vseh preteklih izposoj, uporabnikov in zabeleženih stanj, kar omogoča ugotavljanje, kdaj in pri kom je prišlo do poškodbe.

13. **Upravljanje pravil izposoje**
    Administrator za vsako vlogo nastavi največje število kosov in najdaljši čas izposoje, sistem pa nova pravila takoj upošteva pri preverjanju rezervacij.

## Kasnejše nadgradnje

1. **Samodejna zavrnitev rezervacij**
   Uporabnik z zamujeno izposojo ali neporavnano poškodbo ne more oddati nove rezervacije, saj jo sistem zavrne že ob oddaji, brez posredovanja tehnika.

2. **Čakalna vrsta za zasedeno opremo**
   Uporabnik se lahko uvrsti v čakalno vrsto za zaseden kos opreme. Ko se ta sprosti, sistem obvesti prvega v vrsti.

3. **E-poštni opomniki**
   Samodejno obvestilo uporabniku dan pred rokom vračila in ob nastopu zamude.

4. **QR kode na opremi**
   Vsak kos opreme ima svojo QR kodo, ki jo tehnik ob izdaji in vračilu skenira, namesto da kos išče na seznamu.

5. **Kompleti opreme**
   Vnaprej sestavljeni kompleti (npr. »Komplet za video«: kamera, stativ, mikrofon), ki jih uporabnik rezervira z enim dejanjem.

6. **Statistika uporabe**
   Pregled najbolj in najmanj izposojene opreme ter pogostosti poškodb, kar oddelku pomaga pri odločitvah o nakupu nove opreme.

## Izven obsega

V tem projektu **ne bomo** implementirali:

- integracije s študentskim informacijskim sistemom ali prijave s fakultetnim računom – uporabniške račune ustvarja administrator v sistemu,
- izposoje osebam zunaj oddelka za tehniko,
- zaračunavanja poškodb ter drugih plačil in kavcij – sistem poškodbe le beleži, poravnava poteka zunaj sistema,
- mobilne aplikacije – rešitev bo odzivna spletna aplikacija, uporabna tudi na telefonu,
- dostave ali pošiljanja opreme – prevzem in vračilo vedno potekata osebno pri tehniku.
