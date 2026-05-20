import { REGLES } from '../data/regles.js';
import { catNorm } from '../data/categories.js';

export function verifier(t) {
  const texte = t
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/`([^`]+)`/g, '$1');
  return REGLES.map(r => {
    let s; try { s = r.test(texte); } catch { s = null; }
    return { ...r, statut: s === true ? 'ok' : s === false ? 'echec' : 'manuel' };
  });
}

export function trouverRefs(objet, type, categorie, source, sousCat) {
  const mots = (objet || '')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[\s,;.]+/).filter(m => m.length > 3);

  return source
    .filter(r =>
      r.type === type &&
      (!categorie || catNorm(r.categorie) === catNorm(categorie)) &&
      r.qualite !== 'insuffisante' && r.qualite !== 'brouillon'
    )
    .map(r => {
      const cles = [
        ...(r.mots_cles || []),
        ...(r.visas || []),
        r.objet || '', r.tarifs || '',
        ...(r.exonerations || []),
      ].join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const score = mots.filter(m => cles.includes(m)).length;
      const bonus = (r.points_forts_valides ? 2 : 0)
        + (r.qualite === 'reference' ? 3 : r.qualite === 'valide' ? 1 : 0)
        + (sousCat && r.sousCat === sousCat ? 2 : 0);
      return { ...r, _score: score + bonus };
    })
    .filter(r => r._score > 0 || !categorie)
    .sort((a, b) => b._score - a._score)
    .slice(0, 4);
}
