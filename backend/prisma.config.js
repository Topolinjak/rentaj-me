import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// .env je v korenu repozitorija; pot je relativna na to datoteko, ne na trenutno mapo.
config({ path: new URL('../.env', import.meta.url) });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
