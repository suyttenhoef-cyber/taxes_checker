/**
 * Extrait le texte de tous les .docx dans "Modeles Reglements/"
 * et sauvegarde un JSON : { fichier, texte }[]
 *
 * Usage : node extraire_docx.mjs
 */
import mammoth from 'mammoth';
import { readdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const DOSSIER = resolve('./Modeles Reglements');
const SORTIE  = resolve('./src/data/modeles_textes.json');

const fichiers = (await readdir(DOSSIER)).filter(f => f.endsWith('.docx'));
console.log(`${fichiers.length} fichiers .docx trouvés\n`);

const resultats = [];
for (const fichier of fichiers) {
  const chemin = join(DOSSIER, fichier);
  try {
    const { value } = await mammoth.extractRawText({ path: chemin });
    const texte = value.trim();
    resultats.push({ fichier, texte, longueur: texte.length });
    console.log(`✅ ${fichier.padEnd(55)} ${texte.length} car.`);
  } catch (e) {
    resultats.push({ fichier, texte: '', longueur: 0, erreur: e.message });
    console.log(`❌ ${fichier} — ${e.message}`);
  }
}

await writeFile(SORTIE, JSON.stringify(resultats, null, 2), 'utf-8');
console.log(`\n💾 ${SORTIE}`);
console.log(`   ${resultats.filter(r => r.longueur > 100).length}/${resultats.length} fichiers exploitables`);
