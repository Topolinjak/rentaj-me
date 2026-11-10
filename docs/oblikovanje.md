# Oblikovanje: odločitve in tokeni

Ta dokument zapisuje, kako so navodila iz [dokumenta 07](07-oblikovanje.md) uresničena v kodi in katere odločitve smo sprejeli ob tem. Tokeni so v [`frontend/src/index.css`](../frontend/src/index.css).

## Odgovori na odprta vprašanja (dokument 07, poglavje 12)

Odločil naročnik, 10. 11. 2026.

| Vprašanje | Odločitev |
|---|---|
| Logotipi v SVG ali PNG s prozornim ozadjem? | Datotek v teh oblikah nimamo. Uporabi se logotip s spletne strani oddelka, JPG z belim ozadjem. |
| Jubilejni logotip »50 let UM« ali standardni? | Prednost ima standardni logotip. Na spletni strani ga ni, zato se uporabi jubilejni, kot je na strani. |
| Je pisava spletne strani res Roboto? | Da, za naslove, meni in gumbe. Glej spodaj. |
| Slike opreme v katalogu? | Ne, v MVP so namesto slik ikone kategorij. |
| Temni način? | Ne, v MVP ga ni (`color-scheme: light`). |

## Pisava

Preverjeno na tehnika.fnm.um.si (10. 11. 2026, CSS spremenljivke teme The7 v `the7-css/css-vars.css`):

- naslovi `h1`–`h6`, meni, podmeni, naslov strani in gumbi: **Roboto**,
- osnovno besedilo (`--the7-base-font-family`): **Exo**, 15 px.

Aplikacija uporablja Roboto povsod, tudi za besedilo. Tako se ujema z naslovi in menijem spletne strani, ki ju uporabnik najprej opazi. Delovni zasloni z veliko obrazci in tabelami so z eno pisavo bolj enotni, brskalnik pa prenese manj datotek. Navodilo za besedilo v obrazcih je 16 px (dokument 07, 3.4), na spletni strani je 15 px.

Pisava se ne nalaga z Google Fonts, ampak iz paketa `@fontsource/roboto`, ki jo streže skupaj z aplikacijo. Uteži so 400, 500 in 700, podmnožici `latin` in `latin-ext` (č, š, ž). Razlogi:

- brskalnik ne pošilja zahtev na strežnike Googla (zasebnost uporabnikov, GDPR),
- aplikacija deluje tudi brez dostopa do zunanjih strežnikov (npr. v omrežju fakultete z omejitvami),
- različica pisave je zaklenjena v `package-lock.json`.

Rezervna pisava: `Roboto, "Helvetica Neue", Arial, sans-serif`.

## Logotipi

Na spletni strani je en sam logotip, ki združuje logotip Univerze v Mariboru (jubilejni, »50 let«), napis Fakulteta za naravoslovje in matematiko in logotip Oddelka za tehniko. Shranjen je v `frontend/src/assets/logo-um-fnm-odt.jpg` (550 × 120 px, JPG, belo ozadje) in se ne povezuje s strežnika oddelka. V glavo ga vstavi I-08. Ker ima belo ozadje, se uporablja le na beli podlagi (glava). Če oddelek kasneje priskrbi SVG ali standardni logotip UM, se zamenja le datoteka.

Rdeča iz logotipa (`logo-red`) je izmerjena iz datoteke: znak oddelka ima več ploskev različnih odtenkov, najbolj nasičena je `#D2483E`. Dokument 07 je navajal `#E2453F`. Token se uporablja le, če bi logotip kdaj risali sami. Za napake in statuse se ne uporablja.

## Tailwind 4: tokeni v `@theme`

Dokument 07 in issue I-07 omenjata `theme.extend.colors` v `tailwind.config.js`. To je način Tailwinda 3. Uporabljamo Tailwind 4, ki nastavitve bere iz CSS: tokeni so CSS spremenljivke v bloku `@theme`, iz njih Tailwind ustvari razrede (`--color-brand-600` → `bg-brand-600`, `text-brand-600` ...). Imena tokenov so enaka kot v dokumentu 07.

Privzete Tailwindove barve so izklopljene (`--color-*: initial`). Razred z barvo, ki ni token (npr. `bg-blue-500`), zato ne ustvari ničesar in se takoj opazi. Enako velja za zaobljenost (`--radius-*: initial`).

### Barve

| Token | Vrednost | Opomba |
|---|---|---|
| `brand-50` … `brand-100` | `#E6F0F3`, `#CCE0E7` | iz dokumenta 07 |
| `brand-200` … `brand-500` | `#99C1CE`, `#66A1B6`, `#33829D`, `#1A7391` | mešanica `brand-600` z belo: 40, 60, 80, 90 % modre (`brand-50` in `brand-100` sta po istem pravilu 10 in 20 %) |
| `brand-600` … `brand-800` | `#006385`, `#004F6B`, `#003B50` | iz dokumenta 07 |
| `gray-100`, `200`, `300`, `600`, `700`, `900` | kot v dokumentu 07 | drugih sivih ni |
| `uspeh`, `opozorilo`, `napaka` | `#1E7B34`, `#A15C00`, `#B42318` | polna barva za besedilo, ikone, obrobe |
| `uspeh-ozadje`, `opozorilo-ozadje`, `napaka-ozadje` | `#E8F3EA`, `#FDF1DE`, `#FDECEA` | svetla podlaga obvestil in značk |
| `info`, `info-ozadje` | = `brand-600`, `brand-50` | |
| `logo-red` | `#D2483E` | le logotip |

Test `frontend/tests/tokeni.test.js` preveri, da tokeni obstajajo, in izračuna kontrast po WCAG za pare besedilo/ozadje, ki jih vmesnik uporablja (vsi vsaj 4,5 : 1). Če se barva spremeni tako, da besedilo ni več berljivo, test pade.

### Tipografija, zaobljenost, razmiki, širina

| Namen | Razred | Vrednost |
|---|---|---|
| Naslov strani | `text-naslov font-bold text-gray-900` | 28 px |
| Naslov razdelka | `text-razdelek font-bold text-brand-600` | 24 px |
| Besedilo | privzeto (`text-base text-gray-700`) | 16 px |
| Pomožno besedilo | `text-sm text-gray-600` | 14 px |
| Meni v glavi | `text-meni font-medium` | 15 px |
| Številke v tabelah | `tabular-nums` | |
| Gumbi, polja, kartice, značke | `rounded-osnovni` | 3 px |
| Avatarji, ikone omrežij | `rounded-full` | 50 % |
| Razmiki 4, 8, 12, 16, 24, 32, 48 px | `p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8`, `p-12` (enako `m-`, `gap-`) | enota 0.25rem = 4 px |
| Širina vsebine | `mx-auto max-w-vsebina px-4` | 1200 px, ob robu 16 px |

Enota razmikov ostane v `rem` (Tailwindova privzeta), ne v px. Če si uporabnik v brskalniku poveča pisavo, se sorazmerno povečajo tudi razmiki.

Vsak interaktivni element ima vidno fokusno obrobo (`:focus-visible`, 2 px `brand-600`). Na modri podlagi (noga) jo element zamenja z belo (`focus-visible:outline-white`).

## Postavitev (I-08)

Strani prijavljenih uporabnikov so v skupni postavitvi (`components/Postavitev.jsx`): glava, vsebina (`<main>`) in noga. Stran za prijavo je zunaj nje, ker nima glave (dokument 07, 5.1); nogo vstavi sama.

- **Glava** (`components/Glava.jsx`): bela, 80 px na namizju in 64 px na telefonu, spodaj obroba `gray-200`. Levo logotip in »Rentaj.me« z »Izposoja opreme«, desno meni vloge, ime in vloga ter *Odjava*. Aktivna povezava ima 2 px črto `brand-600` pod besedilom.
- **Meni po vlogah** (`auth/vloge.js`):

  | Vloga | Meni | Začetna stran (US-01) |
  |---|---|---|
  | Študent, asistent, profesor | Katalog, Moje izposoje | Katalog |
  | Tehnik | Nadzorna plošča, Odobrene, Izdane, Zamujene, Inventar | Nadzorna plošča |
  | Administrator | Uporabniki, Kategorije, Inventar | Uporabniki |

- **Mobilni meni:** pod 1024 px (`lg`) se meni skrije za gumb »Meni«, ki odpre bel pladenj čez celo širino. Pladenj se zapre s ponovnim klikom, s tipko Esc ali ob izbiri povezave. Pri tehniku je v meniju pet povezav, ime in *Odjava*, kar na tablici ne gre v eno vrsto, zato je meja `lg` in ne `md`. Vrstice pladnja so visoke vsaj 44 px (dokument 07, 6).
- **Noga** (`components/Noga.jsx`): `brand-600`, kontakt in naslov oddelka, Facebook, Instagram in YouTube oddelka v belih okroglih okvirjih (44 px, odprejo se v novem zavihku), spodaj svetlejša črta (`brand-400`) in »Rentaj.me · Oddelek za tehniko FNM {leto} – Vse pravice pridržane.« Ikone so poti iz paketa simple-icons (CC0), kopirane v `components/ikoneOmrezij.js`, da zaradi treh ikon ni nove odvisnosti.
- **Preskoči na vsebino:** prva povezava na strani, vidna le ob fokusu s tipkovnico.

### Zaščitene poti

`components/ZascitenaPot.jsx` ovije skupino poti z vlogami, ki jih smejo videti. Neprijavljen uporabnik gre na prijavo (`state.od` hrani stran, na katero je hotel), uporabnik z drugo vlogo pa na začetno stran svoje vloge. Pot `/` prijavljenega pošlje na začetno stran vloge, ostale na prijavo. To je le usmerjanje v vmesniku, pravo zaščito izvaja backend (401, 403).

Kdo je prijavljen, frontend izve ob zagonu z `GET /api/auth/jaz` (`auth/UporabnikProvider.jsx`), ker je žeton v piškotku `httpOnly`, ki ga JavaScript ne vidi (ADR-0008). Dokler odgovor ne pride, zaščitene poti ne preusmerjajo. *Odjava* pokliče `POST /api/auth/odjava`, izprazni kontekst in preusmeri na prijavo.

## Datumi in ure

Funkcije so v `frontend/src/utils/datumi.js` in sledijo [ADR-0013](adr/0013-termini-kot-celi-dnevi.md):

| Funkcija | Primer |
|---|---|
| `datumZLetom('2026-10-22')` | `22. 10. 2026` |
| `kratekDatum('2026-10-22')` | `22. 10.` |
| `obdobje('2026-10-20', '2026-10-24')` | `20. 10. – 24. 10. 2026` |
| `ura('2026-10-22T12:00:00Z')` | `14.00` |
| `datumInUra('2026-10-22T12:00:00Z')` | `22. 10. 2026 ob 14.00` |

Ure so dosledno zapisane s piko (`14.00`), kot je v slovenščini pravopisno, ura je brez vodilne ničle (`9.07`). Vse se računa v pasu Europe/Ljubljana, ne v pasu brskalnika.
