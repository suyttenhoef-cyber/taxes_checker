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
      "gravite": "[critique | majeur | mineur | info]",
      "titre": "[titre court du point analysé]",
      "detail": "[explication précise du problème ou de la conformité]",
      "article": "[référence légale exacte : 'Constitution, art. 170, §4' ou 'CDLD, art. L3321-10' etc.]",
      "correction": "[formulation corrigée suggérée ou action à prendre — vide si conforme]",
      "extrait": "[citation exacte du texte analysé, ou vide si non trouvé dans le texte]"
    }
  ],
  "resume": "[2-3 phrases synthétisant l'analyse de ce domaine]"
}

Règles de scoring :
- critique = erreur bloquante qui expose la commune à une annulation par la tutelle
- majeur   = problème sérieux qui affaiblit le règlement juridiquement
- mineur   = imperfection formelle ou manque de précision
- info     = bonne pratique ou observation sans impact juridique
Score 90-100 = excellent · 80-89 = bon · 70-79 = acceptable · 60-69 = à améliorer · <60 = insuffisant`;

// ─── Règles critiques inviolables (priorité absolue sur tout entraînement GPT) ─

const REGLES_CRITIQUES = `
⚠️ RÈGLES ABSOLUES — DROIT WALLON ACTUEL (peuvent différer de votre entraînement) :
Ces règles prévalent sur toute connaissance issue de votre entraînement. Les appliquer strictement.

R1. RÉCLAMATION FISCALE — loi du 20 décembre 2022, applicable depuis le 1er janvier 2023 :
    → Délai légal : 1 AN (l'ancien délai de 3 MOIS est ABROGÉ depuis 2023 — ne JAMAIS écrire "3 mois")
    → Destinataire : COLLÈGE COMMUNAL (PAS le Directeur général / Directeur financier)
    → Base légale : CDLD art. L3321-9 à L3321-12 (PAS la Loi 24/12/1996 art. 9)
    → CONSÉQUENCE : si le règlement dit "1 an" + "Collège communal" → CONFORME, ne pas signaler comme erreur.
    → CONSÉQUENCE : si le règlement dit "3 mois" ou "Directeur général" → NON CONFORME, signaler comme critique.

R2. TUTELLE DES RÈGLEMENTS-TAXES — CDLD art. L3122-2 §1er :
    → Les règlements-taxes wallons sont soumis à la tutelle SPÉCIALE D'APPROBATION (pas d'annulation)
    → La mention "tutelle d'approbation" dans un règlement-taxe = CORRECT — ne JAMAIS signaler comme erreur.
    → La mention "tutelle d'annulation" dans un règlement-taxe = ERRONÉ — signaler comme critique.

R3. ENTRÉE EN VIGUEUR — CDLD art. L1133-2 :
    → Délai légal : 5ème jour SUIVANT la publication (pas le jour même de la publication)
    → "le 5ème jour suivant sa publication" = CONFORME.

R4. TAXATION D'OFFICE — CDLD art. L3321-6 :
    → Le règlement doit contenir un délai de déclaration PRÉCIS (sinon taxation d'office impossible)
    → Accroissements : maximum le DOUBLE du montant dû (pas plus)
    → L'échelle recommandée est : 10% / 50% / 100% / 200%

R5. ENRÔLEMENT :
    → Le rôle est rendu exécutoire par le COLLÈGE COMMUNAL (pas le bourgmestre seul)
`;

// ─── System prompts par agent ─────────────────────────────────────────────────

function buildSystem(agentKey, agentLabel) {
  const base = getBaseForAgent(agentKey);
  return `Tu es un juriste administratif expert en droit communal belge (Wallonie), spécialisé dans les règlements-taxes et redevances communaux.
Tu analyses des règlements communaux wallons pour le compte de Vanden Broele (éditeur de solutions pour communes).
${REGLES_CRITIQUES}
DOMAINE D'ANALYSE POUR CETTE SESSION : ${agentLabel}

BASE JURIDIQUE DE RÉFÉRENCE :
${base}

${OUTPUT_SCHEMA}

Sois précis, cite les articles de loi exacts, et si un élément n'est pas présent dans le texte, indique-le comme tel (ne suppose pas qu'il existe hors du texte fourni).`;
}

const AGENTS_CONFIG = [
  {
    key:    'qualification',
    label:  'Qualification juridique (taxe vs redevance)',
    system: buildSystem('qualification',
      'Qualification juridique — déterminer si le règlement est bien qualifié (taxe ou redevance), identifier le sous-type (redevance-service ou redevance-autorisation), et vérifier la proportionnalité pour les redevances.'),
    userPrefix: `Analyse la QUALIFICATION JURIDIQUE du règlement ci-dessous.
Vérifie :
1. La qualification retenue (taxe / redevance) est-elle correcte au regard de la nature réelle du prélèvement ?
2. Pour une redevance : le type (autorisation vs service) est-il approprié ? La proportionnalité est-elle respectée ?
3. Le titre du règlement reflète-t-il la qualification correcte ?
4. Y a-t-il des indices d'une taxe déguisée en redevance ?
5. Le fait générateur est-il clairement défini et cohérent avec la qualification retenue ?`,
  },
  {
    key:    'visas',
    label:  'Visas légaux et fondement juridique',
    system: buildSystem('visas',
      "Visas légaux — vérifier la présence, la formulation exacte et l'ordre des visas obligatoires et recommandés."),
    userPrefix: `Analyse les VISAS LÉGAUX du règlement ci-dessous.
Vérifie :
1. Tous les visas obligatoires sont-ils présents ? (Constitution art. 41, 162, 170 §4, 172 ; CDLD L1122-30 ; Loi 24/12/1996)
2. Les formulations sont-elles conformes aux formulations standards ?
3. L'ordre des visas est-il correct (Constitution → Lois fédérales → Décrets → CDLD → Arrêtés) ?
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
Vérifie :
1. Y a-t-il des contradictions entre les articles (ex. : titre dit "redevance" mais le texte dit "taxe") ?
2. Y a-t-il des lacunes qui pourraient être exploitées pour contester l'imposition ?
3. Les définitions utilisées sont-elles cohérentes tout au long du texte ?
4. L'exercice fiscal mentionné est-il encore en cours ou déjà écoulé ?
5. Des cas non prévus créent-ils une incertitude juridique ?
6. Le règlement abroge-t-il explicitement les dispositions antérieures si nécessaire ?
7. Y a-t-il des incohérences entre le régime de tutelle mentionné et le type réel de règlement ?`,
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
      const majeurs   = (v.findings || []).filter(f => f.gravite === 'majeur');
      const lines = [...critiques, ...majeurs]
        .map(f => `  - [${f.gravite.toUpperCase()}] ${f.titre}${f.article ? ' (' + f.article + ')' : ''}`)
        .join('\n');
      return `Agent ${v.agent} (score: ${v.score}/100, statut: ${v.statut})\nRésumé: ${v.resume}\nProblèmes principaux:\n${lines || '  (aucun)'}`;
    }).join('\n\n');

  const erreurAgents = agentResults
    .filter(r => r.status === 'rejected')
    .map(r => `Agent échoué: ${r.reason?.message}`).join('\n');

  const system = `Tu es un juriste administratif expert en droit communal wallon.
Tu reçois les résultats de 5 agents d'analyse spécialisés d'un règlement-taxe/redevance communal.
Tu dois produire une synthèse globale consolidée.

Retourne UNIQUEMENT un objet JSON valide avec exactement ces 4 champs :
{
  "scoreGlobal": [moyenne pondérée des scores agents, entier 0-100],
  "niveau": "[insuffisant | a_ameliorer | acceptable | bon | excellent]",
  "resumeExecutif": "[3-4 phrases : nature du règlement, points forts, points à corriger en priorité]",
  "recommandationPrincipale": "[action la plus urgente à mener, 1 phrase]"
}
Règle scoreGlobal : critique présent → max 59 · aucun critique mais majeurs → max 79 · aucun critique/majeur → 80+.`;

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

  // Aggregate findings from agent results — GPT only provides score/niveau/résumé
  const allFindings = settled
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value.findings || []);
  synthese.pointsCritiques = allFindings.filter(f => f.gravite === 'critique');
  synthese.avertissements  = allFindings.filter(f => f.gravite === 'majeur');
  synthese.pointsConformes = allFindings.filter(f => f.gravite === 'info');

  onProgress?.('complet', 6, 6);

  const agents = settled.map((r, i) => ({
    key:    AGENTS_CONFIG[i].key,
    label:  AGENTS_CONFIG[i].label,
    ok:     r.status === 'fulfilled',
    result: r.status === 'fulfilled' ? r.value : null,
    error:  r.status === 'rejected'  ? r.reason?.message : null,
  }));

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
