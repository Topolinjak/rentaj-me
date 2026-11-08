# Razvojna slika za backend (ADR-0011). Koda se v docker-compose.yml priklopi kot
# bind mount, zato sprememba na gostitelju takoj sproži ponovni zagon (node --watch).
FROM node:24-alpine

WORKDIR /app

# Ne kot root: datoteke, ki jih vsebnik zapiše v priklopljeno mapo (npr. src/generated),
# morajo na gostitelju ostati v lasti razvijalca (uporabnik node ima UID 1000).
RUN chown node:node /app
USER node

# Najprej samo package*.json: sloj z odvisnostmi se ponovno zgradi le, ko se te spremenijo.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 3000

# Ob zagonu: uveljavi migracije brez vprašanj, generiraj Prisma odjemalca, zaženi z --watch.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run dev"]
