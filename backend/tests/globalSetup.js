// Enkrat pred vsemi testi: ustvari testno bazo, če je ni, in uveljavi migracije.
import { execSync } from 'node:child_process';
import pg from 'pg';
import { naslovTestneBaze } from './testnaBaza.js';

export default async function () {
  const url = new URL(naslovTestneBaze());
  const imeBaze = url.pathname.slice(1);

  // CREATE DATABASE se izvede prek sistemske baze "postgres".
  const sistemska = new URL(url);
  sistemska.pathname = '/postgres';
  const odjemalec = new pg.Client({ connectionString: sistemska.toString() });
  await odjemalec.connect();
  try {
    const { rowCount } = await odjemalec.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      imeBaze,
    ]);
    if (rowCount === 0) {
      await odjemalec.query(`CREATE DATABASE "${imeBaze}"`);
    }
  } finally {
    await odjemalec.end();
  }

  // migrate deploy uveljavi samo manjkajoče migracije; podatke pred vsakim testom
  // počisti tests/setup.js.
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url.toString(), PRISMA_HIDE_UPDATE_MESSAGE: 'true' },
    stdio: 'pipe',
  });
}
