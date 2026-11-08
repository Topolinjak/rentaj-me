-- CreateEnum
CREATE TYPE "Vloga" AS ENUM ('STUDENT', 'ASISTENT', 'PROFESOR', 'TEHNIK', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusOpreme" AS ENUM ('NA_VOLJO', 'V_OKVARI', 'UMAKNJEN');

-- CreateEnum
CREATE TYPE "StanjeOpreme" AS ENUM ('BREZHIBNO', 'OBRABLJENO', 'POSKODOVANO');

-- CreateEnum
CREATE TYPE "StatusRezervacije" AS ENUM ('ODDANA', 'ODOBRENA', 'ZAVRNJENA', 'PREKLICANA', 'IZDANA', 'VRNJENA');

-- CreateEnum
CREATE TYPE "RazlogZavrnitve" AS ENUM ('ZAMUJENA_IZPOSOJA', 'NEPORAVNANA_POSKODBA', 'OPREMA_V_OKVARI', 'POTREBNA_ZA_VAJE', 'NEUSTREZEN_NAMEN');

-- CreateTable
CREATE TABLE "Uporabnik" (
    "id" SERIAL NOT NULL,
    "ime" TEXT NOT NULL,
    "priimek" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gesloHash" TEXT NOT NULL,
    "vloga" "Vloga" NOT NULL,
    "aktiven" BOOLEAN NOT NULL DEFAULT true,
    "ustvarjeno" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Uporabnik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kategorija" (
    "id" SERIAL NOT NULL,
    "naziv" TEXT NOT NULL,
    "opis" TEXT,

    CONSTRAINT "Kategorija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosOpreme" (
    "id" SERIAL NOT NULL,
    "inventarnaStevilka" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "opis" TEXT,
    "kategorijaId" INTEGER NOT NULL,
    "status" "StatusOpreme" NOT NULL DEFAULT 'NA_VOLJO',
    "trenutnoStanje" "StanjeOpreme" NOT NULL DEFAULT 'BREZHIBNO',

    CONSTRAINT "KosOpreme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rezervacija" (
    "id" SERIAL NOT NULL,
    "uporabnikId" INTEGER NOT NULL,
    "zacetek" TIMESTAMPTZ(3) NOT NULL,
    "konec" TIMESTAMPTZ(3) NOT NULL,
    "namen" TEXT NOT NULL,
    "dolgorocna" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusRezervacije" NOT NULL DEFAULT 'ODDANA',
    "razlogZavrnitve" "RazlogZavrnitve",
    "komentarTehnika" TEXT,
    "obdelalId" INTEGER,
    "ustvarjeno" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "izdanoOb" TIMESTAMPTZ(3),
    "vrnjenoOb" TIMESTAMPTZ(3),

    CONSTRAINT "Rezervacija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostavkaRezervacije" (
    "id" SERIAL NOT NULL,
    "rezervacijaId" INTEGER NOT NULL,
    "kosOpremeId" INTEGER NOT NULL,
    "stanjeObIzdaji" "StanjeOpreme",
    "stanjeObVracilu" "StanjeOpreme",

    CONSTRAINT "PostavkaRezervacije_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZapisPoskodbe" (
    "id" SERIAL NOT NULL,
    "postavkaId" INTEGER NOT NULL,
    "opis" TEXT NOT NULL,
    "razresen" BOOLEAN NOT NULL DEFAULT false,
    "ustvarjeno" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "razresenoOb" TIMESTAMPTZ(3),

    CONSTRAINT "ZapisPoskodbe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PraviloIzposoje" (
    "id" SERIAL NOT NULL,
    "vloga" "Vloga" NOT NULL,
    "maxKosov" INTEGER NOT NULL,
    "maxDni" INTEGER NOT NULL,
    "maxDniDolgorocno" INTEGER,

    CONSTRAINT "PraviloIzposoje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Uporabnik_email_key" ON "Uporabnik"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Kategorija_naziv_key" ON "Kategorija"("naziv");

-- CreateIndex
CREATE UNIQUE INDEX "KosOpreme_inventarnaStevilka_key" ON "KosOpreme"("inventarnaStevilka");

-- CreateIndex
CREATE INDEX "KosOpreme_kategorijaId_idx" ON "KosOpreme"("kategorijaId");

-- CreateIndex
CREATE INDEX "Rezervacija_uporabnikId_idx" ON "Rezervacija"("uporabnikId");

-- CreateIndex
CREATE INDEX "Rezervacija_obdelalId_idx" ON "Rezervacija"("obdelalId");

-- CreateIndex
CREATE INDEX "Rezervacija_status_idx" ON "Rezervacija"("status");

-- CreateIndex
CREATE INDEX "PostavkaRezervacije_kosOpremeId_idx" ON "PostavkaRezervacije"("kosOpremeId");

-- CreateIndex
CREATE UNIQUE INDEX "PostavkaRezervacije_rezervacijaId_kosOpremeId_key" ON "PostavkaRezervacije"("rezervacijaId", "kosOpremeId");

-- CreateIndex
CREATE UNIQUE INDEX "ZapisPoskodbe_postavkaId_key" ON "ZapisPoskodbe"("postavkaId");

-- CreateIndex
CREATE UNIQUE INDEX "PraviloIzposoje_vloga_key" ON "PraviloIzposoje"("vloga");

-- AddForeignKey
ALTER TABLE "KosOpreme" ADD CONSTRAINT "KosOpreme_kategorijaId_fkey" FOREIGN KEY ("kategorijaId") REFERENCES "Kategorija"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezervacija" ADD CONSTRAINT "Rezervacija_uporabnikId_fkey" FOREIGN KEY ("uporabnikId") REFERENCES "Uporabnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rezervacija" ADD CONSTRAINT "Rezervacija_obdelalId_fkey" FOREIGN KEY ("obdelalId") REFERENCES "Uporabnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostavkaRezervacije" ADD CONSTRAINT "PostavkaRezervacije_rezervacijaId_fkey" FOREIGN KEY ("rezervacijaId") REFERENCES "Rezervacija"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostavkaRezervacije" ADD CONSTRAINT "PostavkaRezervacije_kosOpremeId_fkey" FOREIGN KEY ("kosOpremeId") REFERENCES "KosOpreme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZapisPoskodbe" ADD CONSTRAINT "ZapisPoskodbe_postavkaId_fkey" FOREIGN KEY ("postavkaId") REFERENCES "PostavkaRezervacije"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
