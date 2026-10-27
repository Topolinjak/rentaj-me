# Dostop do baze prek Prisma ORM

- **Status:** sprejeto
- **Datum:** 2026-10-14
- **Nadomešča:** –

## Kontekst in problem

Backend mora brati in pisati podatke v bazo PostgreSQL (glej [ADR-0004](0004-relacijska-baza-postgresql.md)). Podatkovni model se bo med razvojem še spreminjal, zato potrebujemo nadzorovan način uvajanja sprememb sheme na vseh razvojnih okoljih. Hkrati želimo zmanjšati možnost napak, kot so tipkarske napake v SQL, napačna imena stolpcev in SQL injection. Kako naj backend dostopa do baze?

## Obravnavane možnosti

- Ročno pisan SQL z gonilnikom `pg`
- Gradnik poizvedb Knex.js z ločenimi migracijami
- Klasičen ORM (Sequelize ali TypeORM)
- Prisma ORM

## Odločitev

Izbrana možnost: »Prisma ORM«, ker je celotna shema na enem mestu (`schema.prisma`), iz nje se samodejno generirajo migracije (`prisma migrate`) in odjemalec za poizvedbe, ki poizvedbe parametrizira in ob napačnem imenu polja javi napako že med razvojem. Ročni SQL bi zahteval ločeno vodenje migracij in več ponavljajoče se kode. Knex je bolj prožen, a sheme ne opiše na enem mestu. Sequelize in TypeORM opisujeta model z razredi in dekoratorji, kar je pri Prismi preprostejše in preglednejše, migracije pa so pri Prismi bolje integrirane.

### Posledice

- Dobro, ker shema v `schema.prisma` hkrati služi kot dokumentacija podatkovnega modela.
- Dobro, ker migracije zagotovijo enako strukturo baze pri vseh razvijalcih.
- Dobro, ker parametrizirane poizvedbe preprečujejo SQL injection, skripta `seed.js` pa omogoča ponovljive začetne podatke.
- Slabo, ker nekaterih zmožnosti PostgreSQL (npr. zaklepanje vrstic `SELECT ... FOR UPDATE` ali izključitvene omejitve) Prisma ne podpira neposredno in jih je treba izvesti z neposrednim SQL (`$queryRaw`) oziroma ročno urejeno migracijo.
- Slabo, ker je po vsaki spremembi sheme treba ponovno generirati odjemalca (`prisma generate`).
- Slabo, ker ORM skrije dejanski SQL, zato je treba pri zahtevnejših poizvedbah paziti na učinkovitost.
