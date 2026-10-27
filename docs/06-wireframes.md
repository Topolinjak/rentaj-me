# Wireframes

Wireframi prikazujejo osnovni izgled spletne aplikacije Rentaj.me za dve ključni vlogi: **študenta**, ki si opremo izposoja, in **tehnika**, ki izposoje obdeluje. Izdelani so v Figmi kot low-fidelity wireframi za namizni zaslon (1440 × 1024).

Vsi zasloni so v Figmi: [Rentaj.me – wireframes](https://www.figma.com/design/llDyBoH2h2LZVAgXbeiV5d/Rentaj.me?node-id=0-1)

Vsi zasloni imajo skupno zgornjo navigacijsko vrstico z logotipom, meniji glede na vlogo, imenom in vlogo prijavljenega uporabnika ter gumbom *Odjava*.

---

## 1. Katalog


Začetna stran za študenta, asistenta in profesorja. Na vrhu je vrstica za iskanje po nazivu ali inventarni številki, filter po kategoriji, izbira termina *Od–Do* in stikalo *Samo prosti*. Spodaj je mreža kartic opreme s sliko, nazivom, inventarno številko in oznako statusa. Kos z oznako *V okvari* ima onemogočen gumb, zato ga ni mogoče rezervirati.

*Uporabniški zgodbi: US-02 (prikaz razpoložljivosti), US-14 (iskanje in filtriranje).*

---

## 2. Podrobnosti in rezervacija

Stran posameznega kosa opreme. Na levi so slika in podatki o kosu, na desni pa mesečni koledar, ki sivo označi zasedene dni. Pri zasedenem terminu je viden le čas zasedenosti, ime uporabnika pa ne. Pod koledarjem je obrazec za oddajo rezervacije z začetkom, koncem in namenom izposoje ter namigom z omejitvami vloge. Wireframe prikazuje tudi napako ob prekrivanju termina: »Arduino A-014 je zaseden od 22. 10. do 27. 10.«

*Uporabniške zgodbe: US-02 (koledar zasedenosti), US-03 (oddaja s preverjanjem prekrivanja), US-04 (omejitve vloge).*

---

## 3. Moje izposoje

Pregled vseh rezervacij prijavljenega uporabnika, razdeljen na zavihka *Trenutne* in *Pretekle*. Tabela za vsako rezervacijo prikaže opremo, termin in status. Prikazani so vsi glavni statusi:

- *Oddana*, z gumbom *Prekliči*,
- *Odobrena*,
- *Zamujena*, z rdečo oznako in številom dni zamude,
- *Zavrnjena*, z razlogom, ki ga je navedel tehnik.

*Uporabniški zgodbi: US-10 (pregled lastnih izposoj), US-13 (preklic oddane rezervacije).*

---

## 4. Nadzorna plošča tehnika

Začetna stran tehnika. Na vrhu so kartice s številom oddanih, izdanih in zamujenih izposoj. Spodaj je seznam oddanih rezervacij, pri katerih so prikazani uporabnik in njegova vloga, oprema, termin in namen ter gumba *Odobri* in *Zavrni*. Ena rezervacija ima samodejno opozorilo »Uporabnik ima 1 zamujeno izposojo«, druga pa oznako *Dolgoročna* za profesorja. Odprto je pogovorno okno *Zavrnitev* z obveznim razlogom zavrnitve in neobveznim komentarjem.

*Uporabniške zgodbe: US-05 (odobritev), US-06 (zavrnitev z razlogom), US-09 (zamujene izposoje), US-11 (opozorila), US-12 (dolgoročna izposoja).*

---

## 5. Vračilo

Zaslon, na katerem tehnik prevzame vrnjeno opremo, tukaj za rezervacijo, ki je zamujena. Za vsak kos tabela prikaže stanje ob izdaji, tehnik pa izbere stanje ob vračilu (*Brezhibno*, *Obrabljeno* ali *Poškodovano*). Ko izbere *Poškodovano*, se prikaže obvezno polje *Opis poškodbe*. Z gumbom *Potrdi vračilo* se rezervacija zaključi, za poškodovane kose pa nastane zapis o poškodbi.

*Uporabniška zgodba: US-08 (vračilo s stanjem in poškodbo).*
