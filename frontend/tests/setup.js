import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  // V testih z okoljem node (tokeni, vite.config) sessionStorage ne obstaja.
  globalThis.sessionStorage?.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// jsdom (še) nima metod elementa <dialog>. Nadomestek le nastavi atribut open; ujemanje fokusa
// in zapiranje z Esc v brskalniku naredi brskalnik sam, v testih pa sprožimo dogodek »cancel«.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
