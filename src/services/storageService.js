import { PROFIL_KEY, BIBLIO_KEY } from '../config.js';
import { REFS } from '../data/refs.js';

export function chargerProfil() {
  try { return JSON.parse(localStorage.getItem(PROFIL_KEY) || '{}'); }
  catch { return {}; }
}

export function sauverProfil(p) {
  localStorage.setItem(PROFIL_KEY, JSON.stringify(p));
}

export function chargerLocale() {
  try { return JSON.parse(localStorage.getItem(BIBLIO_KEY) || '[]'); }
  catch { return []; }
}

export function sauvegarderLocale(entries) {
  localStorage.setItem(BIBLIO_KEY, JSON.stringify(entries));
}

export function mergerBiblio(source) {
  const src = source || REFS;
  const locale = chargerLocale();
  const ids = new Set(locale.map(e => e.id));
  return [...src.filter(e => !ids.has(e.id)), ...locale];
}

export function exporterBiblio(entries) {
  const clean = entries.map(({ _local, _score, ...e }) => e);
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' })),
    download: 'index_valide.json',
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
