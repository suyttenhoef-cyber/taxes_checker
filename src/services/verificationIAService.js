import { WORKER_URL } from '../config.js';
import { chargerBaseJuridique, getBaseForAgent } from '../data/legalKnowledge.js';

// ─── Output schema (shared by all agents) ────────────────────────────────────
//
// {
//   agent:    string,
//   score:    0-100,
//   statut:   'conforme' | 'avertissement' | 'non_conforme' | 'indetermine',
//   findings: [{
//     gravite:    'critique' | 'majeur' | 'mineur' | 'info',
//     titre:      string,
//     detail:     string,
//     article:    string,   // référence légale exacte
//     correction: string,   // reformulation suggérée ou action à prendre
//     extrait:    string,   // citation du texte analysé (ou '' si non trouvé)
//   }],
//   resume:   string,       // 2-3 phrases de synthèse
// }

const OUTPUT_SCHEMA = `Retourne UNIQUEMENT un objet JSON valide sans commentaires, avec exactement cette structure :
{
  "agent": "[nom_agent]",
  "score": [entier 0-100 représentant le niveau de conformité sur ce domaine],
  "statut": "[conforme | avertissement | non_conforme | indetermine]",
  "findings": [
    {
      "gravite": "[critique | ameliorer | conforme]",
      "titre": "[titre court du point analysé]",
      "detail": "[explication précise du problème ou de la conformité]",
      "article": "[référence légale exacte : 'Constitution, art. 170, §4' ou 'CDLD, art. L3321-10' etc.]",
      "correction": "[formulation corrigée suggérée ou action à prendre — vide si conforme]",
      "extrait": "[citation exacte du texte analysé, ou vide si non trouvé dans le texte]"
    }
  ],
  "resume": "[2-3 phrases synthétisant l'analyse de ce domaine]"
}

Règles de gravité — 3 niveaux UNIQUEMENT :
- critique  = article obligatoire ABSENT ou ERRONÉ → expose la commune à une annulation ou un rejet par la tutelle (rouge)
- ameliorer = élément présent mais à corriger ou améliorer pour la qualité juridique du texte (orange)
- conforme  = article présent et correctement rédigé → confirme la conformité, pas de problème (vert)

IMPORTANT : utiliser "conforme" pour tout élément correct. "critique" UNIQUEMENT si l'élément est absent ou manifestement erroné.
Score 90-100 = excellent · 80-89 = bon · 70-79 = acceptable · 60-69 = à améliorer · <60 = insuffisant`;

// ─── System prompts par agent ─────────────────────────────────────────────────

function buildSystem(agentKey, agentLabel) {
  const base = getBaseForAgent(agentKey);
  return `Tu es un outil d'analyse juridique spécialisé en droit communal wallon, opéré par Vanden Broele.

SOURCE EXCLUSIVE — RÈGLE FONDAMENTALE :
Tu dois baser TON ANALYSE UNIQUEMENT sur la "BASE JURIDIQUE DE RÉFÉRENCE" fournie ci-dessous.
- N'utilise JAMAIS tes connaissances d'entraînement sur le droit belge ou wallon.
- Si la base fournie contredit ce que tu crois savoir, la base fournie PRÉVAUT TOUJOURS.
- Si un aspect n'est pas traité dans la base fournie, réponds "non couvert par la base de référence" — ne l'invente pas.
- Les articles de loi, délais, destinataires et procédures à citer sont UNIQUEMENT ceux de la base fournie.

DOMAINE D'ANALYSE : ${agentLabel}

BASE JURIDIQUE DE RÉFÉRENCE (source exclusive — textes officiels et jurisprudence actuels) :
${base}

${OUTPUT_SCHEMA}

Pour chaque finding : cite uniquement les articles présents dans la base fournie. Si un élément n'est pas dans le texte analysé, dis-le explicitement — ne suppose jamais son existence.`;
}

const AGENTS_CONFIG = [
  {
    key:    'qualification',
    label:  'Qualification juridique (taxe vs redevance)',
    system: buildSystem('qualification',
      'Qualification juridique — confirmer si le règlement est correctement qualifié (taxe ou redevance) en comparant avec les types connus de la base, et signaler uniquement les erreurs manifestes de qualification.'),
    userPrefix: `Analyse la QUALIFICATION JURIDIQUE du règlement ci-dessous.

RÈGLE FONDAMENTALE — PRÉSOMPTION DE QUALIFICATION CORRECTE :
Pars du principe que la qualification retenue dans le règlement est CORRECTE.
Ne la remets en cause QUE si tu trouves un indice TRÈS CLAIR ET FORT d'une erreur manifeste.
La présence d'un service public (inhumations, égouts, etc.) dans une taxe NE SUFFIT PAS à la requalifier en redevance.
Une taxe reste une taxe quand il n'existe pas de rapport raisonnable et proportionnel entre le montant et le coût réel d'une prestation individualisée.

Procédure :
1. Cherche d'abord dans TYPES_REGLEMENT si ce type de règlement est connu.
   → Si le type est identifié ET la qualification conforme : signale-le comme point CONFORME (gravite: "conforme") — n'invente pas de problème.
   → Si le type est inconnu, applique les critères de DISTINCTION_TAXE_REDEVANCE.
2. Pour une redevance : la proportionnalité est-elle CLAIREMENT rompue (montant totalement disproportionné, aucune prestation individualisée) ?
3. Le titre du règlement est-il cohérent avec la qualification interne du texte ?
4. Y a-t-il une CONTRADICTION MANIFESTE dans le règlement lui-même (ex. : intitulé "taxe" mais le texte décrit une prestation avec tarification proportionnelle au coût) ?
5. Le fait générateur est-il clairement défini et cohérent avec la qualification retenue ?

IMPORTANT : Si la qualification est correcte, dis-le (gravite: "conforme"). Ne théorise PAS sur des alternatives de qualification si le règlement est cohérent avec son type. L'objectif est de détecter les erreurs MANIFESTES, pas de créer de l'incertitude là où il n'y en a pas.`,
  },
  {
    key:    'visas',
    label:  'Visas légaux et fondement juridique',
    system: buildSystem('visas',
      "Visas légaux — vérifier la présence, la formulation exacte et l'ordre des visas obligatoires et recommandés."),
    userPrefix: `Analyse les VISAS LÉGAUX du règlement ci-dessous.

RÈGLE DE GRAVITÉ OBLIGATOIRE (3 niveaux) :
- Visa ABSENT alors qu'il est obligatoire → gravite "critique"
- Visa PRÉSENT mais mal formulé ou dans le mauvais ordre → gravite "ameliorer"
- Visa PRÉSENT et CORRECTEMENT FORMULÉ → gravite "conforme" (ne jamais mettre "critique" pour un visa conforme)

Vérifie :
1. Tous les visas obligatoires sont-ils présents ? (Constitution art. 41, 162, 170 §4, 172 ; CDLD L1122-30 ; Loi 24/12/1996)
2. Les formulations sont-elles conformes aux formulations standards ?
3. L'ordre des visas est-il correct selon la pratique SPW Intérieur ?
   Ordre validé : Constitution → CDLD → Loi fédérale 24/12/1996 → Décrets sectoriels → Arrêtés.
   Le CDLD précède la loi 24/12/1996 (contrairement à la hiérarchie abstraite lois/décrets).
   Le décret du 14/12/2000 est intégré dans le CDLD — pas de visa séparé attendu pour lui.
4. Y a-t-il des visas obsolètes ou erronés ?
5. Des visas situationnels sont-ils nécessaires (RGPD, décrets sectoriels) ?`,
  },
  {
    key:       'structure',
    label:     'Structure et articles obligatoires',
    maxTokens: 2500,
    system: buildSystem('structure',
      "Structure du règlement — vérifier la présence et la qualité de chaque article obligatoire (objet, redevable, assiette, taux, exonérations, déclaration, enrôlement, taxation d'office, réclamation, transmission, entrée en vigueur)."),
    userPrefix: `Analyse la STRUCTURE ET LES ARTICLES OBLIGATOIRES du règlement ci-dessous.

RÈGLE DE GRAVITÉ OBLIGATOIRE (3 niveaux) :
- Article ABSENT alors qu'il est obligatoire → gravite "critique"
- Article PRÉSENT mais INCORRECTEMENT FORMULÉ → gravite "ameliorer"
- Article PRÉSENT et CORRECTEMENT RÉDIGÉ → gravite "conforme" (ne jamais mettre "critique" pour un article bien rédigé)

Vérifie la présence et la qualité de :
1. Article objet / matière imposable (clairement défini ?)
2. Article redevable (précisément désigné ?)
3. Article assiette / base imposable (univoque ?)
4. Article taux ou tarif (montant explicite, sans renvoi à un document non adopté ?)
5. Article exonérations (présent même si "aucune" ?)
6. Article déclaration avec délai PRÉCIS (obligatoire pour taxation d'office — CE 250.321/2021)
7. Article enrôlement (rôle rendu exécutoire par le collège ?)
8. Article taxation d'office (procédure, accroissements ?)
9. Article réclamation (délai 1 AN depuis 2023, auprès du Collège communal — L3321-9 CDLD)
10. Article transmission à la tutelle
11. Article entrée en vigueur (5ème jour suivant publication)
12. Article abrogation si nécessaire`,
  },
  {
    key:    'droits',
    label:  'Droits des contribuables et principes fondamentaux',
    system: buildSystem('droits',
      "Droits des contribuables — égalité fiscale, non-rétroactivité, RGPD, certitude juridique, voies de recours effectives."),
    userPrefix: `Analyse le respect des DROITS DES CONTRIBUABLES et des PRINCIPES FONDAMENTAUX dans le règlement ci-dessous.
Vérifie :
1. Égalité fiscale (art. 172 Constitution) : les distinctions entre redevables sont-elles objectivement justifiées ?
2. Non-rétroactivité : le règlement produit-il des effets pour des périodes passées sans autorisation légale ?
3. Certitude juridique : l'assiette et le taux sont-ils suffisamment précis pour que le contribuable connaisse sa situation ?
4. RGPD : si des données personnelles sont collectées (déclarations), les obligations légales sont-elles respectées ?
5. Voies de recours : la procédure de réclamation est-elle accessible, complète et conforme (délai, forme, compétence) ?
6. Proportionnalité (si redevance) : le montant est-il raisonnablement proportionnel au coût de la prestation ?`,
  },
  {
    key:    'coherence',
    label:  'Cohérence interne et risques pratiques',
    system: buildSystem('coherence',
      "Cohérence interne — contradictions entre articles, lacunes exploitables, risques contentieux pratiques, comparaison avec les bonnes pratiques wallonnes."),
    userPrefix: `Analyse la COHÉRENCE INTERNE et les RISQUES PRATIQUES du règlement ci-dessous.

RÈGLE FONDAMENTALE — TUTELLE (pour éviter les faux positifs) :
La tutelle SPÉCIALE D'APPROBATION (CDLD art. L3122-2 §1er) est le régime CORRECT et NORMAL pour toute taxe communale ordinaire.
→ Si le règlement mentionne la tutelle spéciale d'approbation pour une taxe ordinaire : c'est CONFORME, ne pas signaler comme erreur.
→ Ne signaler une incohérence de tutelle QUE dans ces cas précis :
   a) Le règlement est une taxe additionnelle IPP mais utilise la tutelle spéciale d'approbation (au lieu de la tutelle générale d'annulation).
   b) Le règlement est une redevance mais cite l'art. 170 §4 (au lieu de l'art. 173 Constitution).
   c) Le titre dit "taxe" mais tout le régime de fond est celui d'une redevance (ou inversement).

Vérifie :
1. Y a-t-il des contradictions entre les articles (ex. : titre dit "redevance" mais le texte dit "taxe") ?
2. Y a-t-il des lacunes qui pourraient être exploitées pour contester l'imposition ?
3. Les définitions utilisées sont-elles cohérentes tout au long du texte ?
4. L'exercice fiscal mentionné est-il encore en cours ou déjà écoulé ?
5. Des cas non prévus créent-ils une incertitude juridique ?
6. Le règlement abroge-t-il explicitement les dispositions antérieures si nécessaire ?
7. Incohérence de tutelle selon les règles ci-dessus uniquement — pas de signalement si la tutelle spéciale d'approbation est utilisée pour une taxe ordinaire.`,
  },
];

// ─── Appel individuel d'un agent ─────────────────────────────────────────────

async function runAgent(config, texte) {
  if (!WORKER_URL) throw new Error('VITE_WORKER_URL non configuré');

  const userContent = `${config.userPrefix}

RÈGLEMENT À ANALYSER :
---
${texte.slice(0, 12000)}
---`;

  const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      model:           'gpt-4o',
      max_tokens:      config.maxTokens || 1400,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: config.system },
        { role: 'user',   content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Agent ${config.key}: API ${res.status}${body ? ' — ' + body.slice(0, 120) : ''}`);
  }

  const data   = await res.json();
  const result = JSON.parse(data.choices[0].message.content);
  result.agent = config.key;
  return result;
}

// ─── Agent de synthèse ────────────────────────────────────────────────────────

async function runSynthese(texte, agentResults) {
  const resultsSummary = agentResults
    .filter(r => r.status === 'fulfilled')
    .map(r => {
      const v = r.value;
      const critiques = (v.findings || []).filter(f => f.gravite === 'critique');
      const ameliorer = (v.findings || []).filter(f => f.gravite === 'ameliorer');
      const lines = [...critiques, ...ameliorer]
        .map(f => `  - [${f.gravite.toUpperCase()}] ${f.titre}${f.article ? ' (' + f.article + ')' : ''}`)
        .join('\n');
      return `Agent ${v.agent} (score: ${v.score}/100, statut: ${v.statut})\nRésumé: ${v.resume}\nProblèmes principaux:\n${lines || '  (aucun)'}`;
    }).join('\n\n');

  const erreurAgents = agentResults
    .filter(r => r.status === 'rejected')
    .map(r => `Agent échoué: ${r.reason?.message}`).join('\n');

  const system = `Tu es un juriste administratif expert en droit communal wallon.
Tu reçois les résultats de 5 agents d'analyse spécialisés d'un règlement-taxe/redevance communal.
Tu dois produire une synthèse qualitative consolidée (le score numérique est calculé séparément).

Retourne UNIQUEMENT un objet JSON valide avec exactement ces 2 champs :
{
  "resumeExecutif": "[3-4 phrases : nature du règlement, points forts, points critiques à corriger en priorité]",
  "recommandationPrincipale": "[action la plus urgente à mener, 1 phrase]"
}`;

  const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      model:           'gpt-4o',
      max_tokens:      1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: `RÉSULTATS DES 5 AGENTS :\n\n${resultsSummary}\n\n${erreurAgents ? 'AGENTS EN ERREUR:\n' + erreurAgents : ''}` },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Agent synthèse: API ${res.status}${body ? ' — ' + body.slice(0, 120) : ''}`);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// ─── Scoring déterministe ─────────────────────────────────────────────────────
// Voir docs/SCORING.md pour la documentation complète de la formule.

const POIDS_FINDING = { critique: 15, ameliorer: 4 };

function calculerScore(agents) {
  const findings = agents
    .filter(a => a.ok)
    .flatMap(a => a.result?.findings || []);

  const Nc = findings.filter(f => f.gravite === 'critique').length;
  const Na = findings.filter(f =>
    f.gravite === 'ameliorer' || f.gravite === 'majeur' || f.gravite === 'mineur'
  ).length;

  let score = 100 - (Nc * POIDS_FINDING.critique) - (Na * POIDS_FINDING.ameliorer);
  score = Math.max(0, score);
  if (Nc >= 1) score = Math.min(score, 59);
  return Math.round(score);
}

function scoreToNiveau(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'bon';
  if (score >= 70) return 'acceptable';
  if (score >= 60) return 'a_ameliorer';
  return 'insuffisant';
}

// ─── Point d'entrée principal ─────────────────────────────────────────────────

/**
 * Lance les 5 agents en parallèle puis l'agent de synthèse.
 * @param {string}   texte      — Texte du règlement à analyser
 * @param {function} onProgress — Callback(phase: string, done: number, total: number)
 * @returns {{ agents: object[], synthese: object, meta: object }}
 */
export async function verifierAvecIA(texte, onProgress) {
  if (!texte?.trim()) throw new Error('Texte vide — veuillez coller ou saisir le règlement à analyser.');

  await chargerBaseJuridique();
  onProgress?.('lancement', 0, 6);

  const settled = await Promise.allSettled(
    AGENTS_CONFIG.map(cfg => runAgent(cfg, texte))
  );

  onProgress?.('agents_termines', 5, 6);

  const synthese = await runSynthese(texte, settled);

  const agents = settled.map((r, i) => ({
    key:    AGENTS_CONFIG[i].key,
    label:  AGENTS_CONFIG[i].label,
    ok:     r.status === 'fulfilled',
    result: r.status === 'fulfilled' ? r.value : null,
    error:  r.status === 'rejected'  ? r.reason?.message : null,
  }));

  // Aggregate findings — GPT only provides résumé/recommandation, score calculé séparément
  const allFindings = agents.filter(a => a.ok).flatMap(a => a.result?.findings || []);
  synthese.pointsCritiques = allFindings.filter(f => f.gravite === 'critique');
  synthese.avertissements  = allFindings.filter(f => f.gravite === 'ameliorer');
  synthese.pointsConformes = allFindings.filter(f => f.gravite === 'conforme');

  // Score déterministe — remplace l'estimation subjective de GPT (voir docs/SCORING.md)
  synthese.scoreGlobal = calculerScore(agents);
  synthese.niveau      = scoreToNiveau(synthese.scoreGlobal);

  onProgress?.('complet', 6, 6);

  return {
    agents,
    synthese,
    meta: {
      texteLength:     texte.length,
      agentsOk:        agents.filter(a => a.ok).length,
      agentsEchoues:   agents.filter(a => !a.ok).length,
      dateAnalyse:     new Date().toISOString(),
    },
  };
}

export { AGENTS_CONFIG };

// ─── Auto-correction ──────────────────────────────────────────────────────────

/**
 * Génère une version corrigée du règlement en appliquant les findings critiques/majeurs.
 * @param {string}   texte    — Texte original du règlement
 * @param {object[]} agents   — Résultats des agents (tableau de { ok, result: { findings } })
 * @param {function} onDelta  — Callback streaming (delta: string)
 */
export async function corrigerAvecIA(texte, agents, onDelta) {
  if (!WORKER_URL) throw new Error('VITE_WORKER_URL non configuré');

  const corrections = agents
    .filter(a => a.ok)
    .flatMap(a => (a.result?.findings || []).filter(f => f.gravite === 'critique' || f.gravite === 'ameliorer'));

  if (!corrections.length) throw new Error('Aucun problème critique ou majeur à corriger — le règlement est déjà conforme sur ces points.');

  const liste = corrections
    .map((f, i) => `${i + 1}. [${f.gravite.toUpperCase()}] ${f.titre}${f.article ? ` (${f.article})` : ''}
   Problème : ${f.detail}
   Correction à appliquer : ${f.correction || '(voir le détail)'}`)
    .join('\n\n');

  const system = `Tu es un juriste expert en droit communal wallon.
Tu reçois un règlement-taxe ou redevance communal wallon et une liste de corrections à apporter.
Ta mission : produire la version corrigée du règlement en appliquant TOUTES les corrections listées.

RÈGLES STRICTES :
- Conserve exactement la structure, le style officiel et le format du règlement original.
- Ne modifie QUE les passages nécessaires pour corriger les problèmes identifiés.
- Ne reformule pas et ne résume pas les passages déjà conformes.
- Le règlement corrigé doit être aussi complet que l'original.
- Retourne UNIQUEMENT le texte complet du règlement corrigé, sans introduction, sans commentaires.`;

  const user = `RÈGLEMENT À CORRIGER :
---
${texte.slice(0, 12000)}
---

CORRECTIONS À APPLIQUER (${corrections.length} problème(s) critique(s)/majeur(s)) :
${liste}

Produis maintenant le texte complet du règlement corrigé.`;

  const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      model:      'gpt-4o',
      max_tokens: 6000,
      stream:     true,
      messages:   [
        { role: 'system', content: system },
        { role: 'user',   content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Auto-correction : API ${res.status}${body ? ' — ' + body.slice(0, 120) : ''}`);
  }

  const reader = res.body.getReader();
  const dec    = new TextDecoder();
  let   buf    = '';

  const processLine = line => {
    if (!line.startsWith('data: ')) return;
    const d = line.slice(6).trim();
    if (d === '[DONE]') return;
    try {
      const delta = JSON.parse(d)?.choices?.[0]?.delta?.content || '';
      if (delta) onDelta?.(delta);
    } catch {}
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    lines.forEach(processLine);
  }
  if (buf) processLine(buf);
}
