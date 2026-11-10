// @vitest-environment node
import process from 'node:process';
import { afterEach, describe, expect, it } from 'vitest';
import nastavitve from '../vite.config.js';

const prej = process.env.VITE_USER_NODE_ENV;
afterEach(() => {
  if (prej === undefined) delete process.env.VITE_USER_NODE_ENV;
  else process.env.VITE_USER_NODE_ENV = prej;
});

describe('vite.config.js', () => {
  it('korenski .env ne vpliva na način gradnje (NODE_ENV backenda)', () => {
    delete process.env.VITE_USER_NODE_ENV;
    nastavitve({ mode: 'production', command: 'build' });
    // Vitejev loadEnv bi sem zapisal NODE_ENV=development iz korenskega .env in
    // »npm run build« bi zgradil razvojno različico.
    expect(process.env.VITE_USER_NODE_ENV).toBeUndefined();
  });

  it('proxy /api kaže na backend', () => {
    const { server } = nastavitve({ mode: 'development', command: 'serve' });
    expect(server.proxy['/api']).toMatch(/^http:\/\/[\w.-]+:\d+$/);
  });
});
