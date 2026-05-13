/**
 * SCRIPT D'EXTRACTION — Vanden Broele
 * PDF → index.json (Option C)
 *
 * Usage :
 *   node extraire_reglements.mjs ./pdfs ./output/index.json
 *
 * Prérequis :
 *   npm install pdf-parse dotenv
 *   Fichier .env avec VITE_ANTHROPIC_KEY=sk-ant-...
 *
 * Structure attendue du dossier pdfs/ :
 *   pdfs/
 *     actes-administratifs/    ← nom = slug de catégorie
 *       gembloux_actes_2025.pdf
 *       namur_actes_2024.pdf
 *     domaine-public/
 *       liege_voirie_2023.pdf
 *     dechets-environnement/
 *       ...
 */

import fs   from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Charger .env manuellement (pas de dépendance dotenv obligatoire)
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const API_KEY        = process.env.VITE_ANTHROPIC_KEY;
const DOSSIER        = process.argv[2] || "./pdfs";
const SORTIE         = process.argv[3] || "./index.json";
const FILTRE_CAT     = process.argv[4] || null; // optionnel : slug de catégorie
const PAUSE_MS       = 1200; // pause entre appels API (éviter rate limit)

// ─── CATÉGORIES ACCEPTÉES ──────────────────────────────────────────────────
const CATEGORIES = {
  "actes-administratifs":   "Actes administratifs et état civil",
  "domaine-public":         "Domaine public et voirie",
  "dechets-environnement":  "Déchets et environnement",
  "hebergement-tourisme":   "Hébergement touristique et séjour",
  "commerce-economie":      "Commerce et activités économiques",
  "inhumation":              "Inhumation et cimetière",
  "animaux":                "Animaux",
  "immondices":             "Immondices",
  "location-salle":         "Location salle et matériel communal",
  "mobilite":               "Mobilité",
  "impots":               "Impôts",
};

// ─── PROMPT D'EXTRACTION ──────────────────────────────────────────────────
function buildExtractionPrompt(texte, categorieSlug) {
  const cat = CATEGORIES[categorieSlug] || categorieSlug;
  // On tronque à ~6000 caractères pour rester dans les limites de tokens
  const extrait_brut = texte.slice(0, 6000);

  return `Tu es un expert en droit communal wallon. Analyse ce règlement communal wallon et extrais les informations demandées.

CATÉGORIE CONNUE : ${cat}

TEXTE DU RÈGLEMENT :
"""
${extrait_brut}
"""

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, sans balises markdown.
Format exact :
{
  "commune": "Nom officiel de la commune",
  "type": "taxe" ou "redevance",
  "annee": année d'adoption (nombre entier),
  "periode": "AAAA-AAAA" (exercices couverts) ou null,
  "objet": "Description courte de l'objet (max 10 mots)",
  "mots_cles": ["mot1", "mot2", "mot3", "mot4", "mot5"],
  "visas_presents": ["art. 170 §4 Constitution", "CDLD L1122-30", ...],
  "points_forts": [
    "Point juridique notable 1 (formulation précise)",
    "Point juridique notable 2",
    "Point juridique notable 3"
  ],
  "extrait": "Les 800 premiers caractères significatifs du règlement (à partir du premier Vu)",
  "qualite": "bonne" ou "partielle" ou "insuffisante"
}

Pour "points_forts" : identifie 3 à 7 éléments juridiquement notables (visas inhabituels, clauses bien rédigées, procédures complètes, formulations à reproduire).
Pour "qualite" : "bonne" = règlement complet et bien structuré, "partielle" = incomplet ou mal structuré, "insuffisante" = extraction impossible.`;
}

// ─── APPEL API ANTHROPIC ──────────────────────────────────────────────────
async function extraireAvecClaude(texte, categorieSlug) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", // Haiku : rapide et économique pour l'extraction en masse
      max_tokens: 1000,
      messages: [{ role: "user", content: buildExtractionPrompt(texte, categorieSlug) }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status} : ${err}`);
  }

  const data  = await res.json();
  const texteReponse = data.content?.[0]?.text || "";

  // Nettoyer les éventuelles balises markdown
  const clean = texteReponse.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`JSON invalide reçu : ${clean.slice(0, 200)}`);
  }
}

// ─── EXTRACTION D'UN PDF ──────────────────────────────────────────────────
async function traiterPDF(cheminPDF, categorieSlug) {
  const buffer = fs.readFileSync(cheminPDF);
  const parsed = await pdfParse(buffer);
  const texte  = parsed.text.trim();

  if (texte.length < 200) {
    console.warn(`  ⚠️  Texte trop court (${texte.length} car.) — PDF peut-être scanné ou vide`);
    return null;
  }

  return extraireAvecClaude(texte, categorieSlug);
}

// ─── GÉNÉRER UN ID UNIQUE ─────────────────────────────────────────────────
function genId(commune, type, annee, categorieSlug) {
  const c = (commune || "inconnu").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${type || "reg"}-${categorieSlug}-${c}-${annee || "xxxx"}`;
}

// ─── PAUSE ────────────────────────────────────────────────────────────────
const pause = ms => new Promise(r => setTimeout(r, ms));

// ─── PROGRAMME PRINCIPAL ──────────────────────────────────────────────────
async function main() {
  if (!API_KEY) { console.error("❌ VITE_ANTHROPIC_KEY manquante dans .env"); process.exit(1); }
  if (!fs.existsSync(DOSSIER)) { console.error(`❌ Dossier introuvable : ${DOSSIER}`); process.exit(1); }

  // Charger l'index existant si présent (reprise en cas d'interruption)
  let index = [];
  const idsExistants = new Set();
  if (fs.existsSync(SORTIE)) {
    index = JSON.parse(fs.readFileSync(SORTIE, "utf-8"));
    index.forEach(r => idsExistants.add(r._source));
    console.log(`📂 Index existant chargé : ${index.length} entrées`);
  }

  // Parcourir les sous-dossiers (= catégories)
  const categories = fs.readdirSync(DOSSIER).filter(f =>
    fs.statSync(path.join(DOSSIER, f)).isDirectory() &&
    (!FILTRE_CAT || f === FILTRE_CAT)
  );

  if (FILTRE_CAT && categories.length === 0) {
    console.error(`❌ Catégorie introuvable : "${FILTRE_CAT}"`);
    console.error(`   Catégories disponibles : ${Object.keys(CATEGORIES).join(", ")}`);
    process.exit(1);
  }

  let traites = 0, erreurs = 0, ignores = 0;

  for (const cat of categories) {
    if (!CATEGORIES[cat]) {
      console.warn(`⚠️  Catégorie inconnue : "${cat}" — ignorée (voir CATEGORIES dans le script)`);
      continue;
    }

    const dossierCat = path.join(DOSSIER, cat);
    const pdfs = fs.readdirSync(dossierCat).filter(f => f.toLowerCase().endsWith(".pdf"));

    console.log(`\n📁 ${CATEGORIES[cat]} (${pdfs.length} PDFs)`);

    for (const nomPDF of pdfs) {
      const cheminComplet = path.join(dossierCat, nomPDF);
      const sourceKey = `${cat}/${nomPDF}`;

      // Reprise : ignorer les fichiers déjà traités
      if (idsExistants.has(sourceKey)) {
        console.log(`  ⏭️  ${nomPDF} — déjà traité`);
        ignores++;
        continue;
      }

      process.stdout.write(`  📄 ${nomPDF} … `);

      try {
        const extrait = await traiterPDF(cheminComplet, cat);
        if (!extrait) { console.log("ignoré"); ignores++; continue; }

        const id = genId(extrait.commune, extrait.type, extrait.annee, cat);
        const entree = {
          id,
          _source: sourceKey,       // clé de reprise (pas exposée dans l'app)
          commune:     extrait.commune     || "Inconnue",
          type:        extrait.type        || "taxe",
          categorie:   cat,
          annee:       extrait.annee       || null,
          periode:     extrait.periode     || null,
          objet:       extrait.objet       || "",
          mots_cles:   extrait.mots_cles   || [],
          points_forts:extrait.points_forts|| [],
          extrait:     extrait.extrait     || "",
          qualite:     extrait.qualite     || "partielle",
          // champ réservé aux juristes (vide à ce stade)
          points_forts_valides: false,
        };

        index.push(entree);
        idsExistants.add(sourceKey);

        // Sauvegarder après chaque PDF (sécurité en cas d'interruption)
        fs.writeFileSync(SORTIE, JSON.stringify(index, null, 2), "utf-8");

        console.log(`✅ ${extrait.commune} · ${extrait.type} · ${extrait.annee} · qualité: ${extrait.qualite}`);
        traites++;

      } catch (e) {
        console.log(`❌ ${e.message.slice(0, 80)}`);
        erreurs++;
      }

      await pause(PAUSE_MS);
    }
  }

  // Résumé
  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Traités   : ${traites}`);
  console.log(`⏭️  Ignorés   : ${ignores}`);
  console.log(`❌ Erreurs   : ${erreurs}`);
  console.log(`📦 Total index : ${index.length} entrées`);
  console.log(`💾 Sauvegardé : ${SORTIE}`);

  // Statistiques par catégorie
  console.log("\n📊 Répartition par catégorie :");
  for (const [slug, label] of Object.entries(CATEGORIES)) {
    const n = index.filter(r => r.categorie === slug).length;
    if (n > 0) console.log(`   ${label.padEnd(40)} ${n} règlements`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });