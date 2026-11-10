# Razvojna slika za frontend (ADR-0011). Koda se v docker-compose.yml priklopi kot bind mount,
# Vite ob spremembi osveži stran v brskalniku (HMR).
FROM node:24-alpine

WORKDIR /app

# Ne kot root: datoteke, ki jih vsebnik zapiše v priklopljeno mapo, ostanejo v lasti
# razvijalca (uporabnik node ima UID 1000).
RUN chown node:node /app
USER node

# Najprej samo package*.json: sloj z odvisnostmi se ponovno zgradi le, ko se te spremenijo.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 5173

# --host: Vite posluša na vseh vmesnikih, ne le na localhost znotraj vsebnika.
CMD ["npm", "run", "dev", "--", "--host"]
