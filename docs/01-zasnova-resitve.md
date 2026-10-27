# Zasnova rešitve

## Ime rešitve

**Rentaj.me** – spletni sistem za izposojo opreme na oddelku za tehniko.

## Namen rešitve in problem

Oddelek za tehniko ima veliko opreme, ki jo študenti in zaposleni potrebujejo pri vajah, projektih in zaključnih nalogah: mikrokrmilnike (Arduino, Raspberry Pi), senzorje, merilne instrumente (multimetri, osciloskopi), kamere, VR očala, 3D tiskalnike ipd.

Izposoja danes poteka neformalno – po e-pošti, osebno pri tehniku ali prek papirnatega zvezka. Zaradi tega prihaja do težav:

- študent ne ve, ali je oprema na voljo, dokler ne pride osebno do tehnika,
- isti kos opreme si lahko za isti termin dogovorita dve osebi,
- tehnik nima pregleda, kdo ima kateri kos opreme in do kdaj,
- vračila zamujajo, ker ni opomnikov in ne evidence rokov,
- poškodbe niso sistematično zabeležene, zato ni jasno, kdaj in pri kom je do njih prišlo.

**Rentaj.me** izposojo prenese v spletni sistem z jasnim postopkom: od rezervacije prek odobritve in prevzema do vračila s pregledom stanja opreme.

## Ciljni uporabniki

- **Študenti oddelka**, ki opremo potrebujejo za vaje, seminarske naloge, projekte in zaključna dela.
- **Asistenti**, ki opremo potrebujejo za izvedbo vaj, pogosto v večjih količinah (npr. komplet mikrokrmilnikov za celotno skupino), vendar za standardni čas izposoje.
- **Profesorji**, ki poleg izposoje večjih količin potrebujejo tudi **dolgoročno izposojo** opreme, npr. za celoten semester ali za raziskovalni projekt.
- **Tehnik oddelka** – na oddelku je en sam tehnik, ki skrbi za celoten inventar, odobrava izposoje ter izdaja in prevzema opremo. Ker vse izposoje gredo skozi eno osebo, mu sistem prihrani največ časa.
- **Administrator sistema**, ki upravlja uporabnike, kategorije opreme in pravila izposoje.

## Kratek opis delovanja

1. Študent se prijavi v sistem in v katalogu poišče opremo, ki jo potrebuje (npr. »Arduino Uno za projekt pri predmetu Vgrajeni sistemi«).
2. Za izbrani kos opreme vidi, v katerih terminih je že zaseden, in izbere prost termin izposoje.
3. Sistem preveri, ali se termin prekriva z obstoječimi rezervacijami in ali ustreza pravilom (npr. najdaljši čas izposoje za kategorijo). Če je vse v redu, se ustvari rezervacija s statusom **Oddana**.
4. Tehnik vidi seznam oddanih rezervacij in jih **odobri** ali **zavrne** z obrazložitvijo.
5. Ob prevzemu tehnik v sistemu označi, da je oprema **izdana**, in zabeleži njeno stanje.
6. Ko študent opremo vrne, tehnik zabeleži **vračilo** in stanje opreme. Če je oprema poškodovana, se ustvari zapis o poškodbi.
7. Če rok vračila poteče, sistem izposojo samodejno prikaže kot **zamujeno**, tehnik pa jo vidi na seznamu zamud.

Tako imajo vsi vpleteni ves čas pregled nad tem, kje je oprema, kdo jo ima in v kakšnem stanju je.
