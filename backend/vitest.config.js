import { defineConfig } from 'vitest/config';
import { naslovTestneBaze } from './tests/testnaBaza.js';

export default defineConfig({
  test: {
    // Testi si delijo eno testno bazo, zato datoteke tečejo zaporedno.
    fileParallelism: false,
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setup.js'],
    env: {
      DATABASE_URL: naslovTestneBaze(),
      JWT_SECRET: process.env.JWT_SECRET ?? 'testna-skrivnost',
      NODE_ENV: 'test',
    },
  },
});
