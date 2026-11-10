// @vitest-environment node
// Oblikovni tokeni iz src/index.css (dokument 07, 3.2 in 7): prisotnost tokenov in kontrast
// besedila po WCAG 2.1 (AA: vsaj 4,5 : 1 za navadno besedilo).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

// Vrednosti --color-*, vključno z var(--color-...) sklici.
const surove = Object.fromEntries(
  [...css.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map(([, ime, vrednost]) => [ime, vrednost]),
);
const barva = (ime) => {
  const v = surove[ime];
  if (v === undefined) throw new Error(`Token --color-${ime} ne obstaja.`);
  const sklic = /^var\(--color-([\w-]+)\)$/.exec(v);
  return sklic ? barva(sklic[1]) : v;
};

// Relativna svetlost in kontrast po WCAG 2.1.
function svetlost(hex) {
  const kanali = hex
    .slice(1)
    .match(/../g)
    .map((k) => parseInt(k, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * kanali[0] + 0.7152 * kanali[1] + 0.0722 * kanali[2];
}
const kontrast = (a, b) => {
  const [svetla, temna] = [svetlost(barva(a)), svetlost(barva(b))].sort((x, y) => y - x);
  return (svetla + 0.05) / (temna + 0.05);
};

describe('tokeni iz dokumenta 07', () => {
  it.each([
    ...['50', '100', '200', '300', '400', '500', '600', '700', '800'].map((s) => `brand-${s}`),
    ...['100', '200', '300', '600', '700', '900'].map((s) => `gray-${s}`),
    'white',
    'logo-red',
    'uspeh',
    'uspeh-ozadje',
    'opozorilo',
    'opozorilo-ozadje',
    'napaka',
    'napaka-ozadje',
    'info',
    'info-ozadje',
  ])('--color-%s obstaja', (ime) => {
    expect(barva(ime)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('glavna barva je theme-color spletne strani oddelka', () => {
    expect(barva('brand-600')).toBe('#006385');
  });

  it('privzete Tailwindove barve so izklopljene', () => {
    expect(css).toMatch(/--color-\*:\s*initial;/);
  });
});

describe('kontrast besedila (WCAG AA, vsaj 4,5 : 1)', () => {
  it.each([
    ['brand-600', 'white'], // povezave, primarni gumb
    ['white', 'brand-700'], // primarni gumb ob lebdenju
    ['white', 'brand-600'], // noga
    ['brand-600', 'brand-50'], // informativno obvestilo, izbrana vrstica
    ['gray-900', 'white'],
    ['gray-700', 'white'],
    ['gray-600', 'white'], // pomožno besedilo
    ['gray-600', 'gray-100'], // pomožno besedilo v glavi tabele
    ['gray-700', 'gray-100'],
    ['uspeh', 'uspeh-ozadje'],
    ['opozorilo', 'opozorilo-ozadje'],
    ['napaka', 'napaka-ozadje'],
    ['uspeh', 'white'],
    ['opozorilo', 'white'],
    ['napaka', 'white'],
  ])('%s na %s', (besedilo, ozadje) => {
    expect(kontrast(besedilo, ozadje)).toBeGreaterThanOrEqual(4.5);
  });

  it('brand-600 na beli je 6,7 : 1, kot navaja dokument 07', () => {
    expect(kontrast('brand-600', 'white')).toBeCloseTo(6.7, 1);
  });
});
