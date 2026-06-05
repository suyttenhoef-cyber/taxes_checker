/**
 * Base juridique statique — droit communal wallon, taxes et redevances.
 * Source: CDLD (Code de la Démocratie Locale et de la Décentralisation),
 * Constitution belge, Loi 24/12/1996, circulaires DGPL, jurisprudence CE/CC.
 *
 * Architecture FinancesConnect : cette base statique est le fallback.
 * Quand l'API FinancesConnect sera disponible, chargerBaseJuridique()
 * la remplacera automatiquement par des données à jour.
 */

export const LEGAL_KNOWLEDGE_VERSION = '2026-06';

// ─── Visas obligatoires ───────────────────────────────────────────────────────

export const VISAS_OBLIGATOIRES = [
  {
    id:          'const-41',
    reference:   'Constitution, art. 41',
    formulation: "VU la Constitution, spécialement l'article 41",
    obligatoire: true,
    contexte:    'tous',
    note:        "Consacre l'autonomie des communes comme institutions décentralisées.",
  },
  {
    id:          'const-162',
    reference:   'Constitution, art. 162',
    formulation: "VU la Constitution, spécialement l'article 162",
    obligatoire: true,
    contexte:    'tous',
    note:        "Fixe les principes d'organisation et de fonctionnement des communes.",
  },
  {
    id:          'const-170-4',
    reference:   'Constitution, art. 170, §4',
    formulation: "VU la Constitution, spécialement l'article 170, §4",
    obligatoire: true,
    contexte:    'taxe',
    note:        "VISA LE PLUS IMPORTANT. Fonde le pouvoir fiscal communal. Toute taxe sans ce visa est juridiquement fragile.",
  },
  {
    id:          'const-172',
    reference:   'Constitution, art. 172',
    formulation: "VU la Constitution, spécialement l'article 172",
    obligatoire: true,
    contexte:    'taxe',
    note:        "Principe d'égalité fiscale : tout avantage accordé doit s'appliquer à tous ceux dans la même situation.",
  },
  {
    id:          'cdld-l1122-30',
    reference:   'CDLD, art. L1122-30',
    formulation: "VU le Code de la Démocratie Locale et de la Décentralisation, notamment l'article L1122-30",
    obligatoire: true,
    contexte:    'tous',
    note:        "Confère au conseil communal la compétence exclusive d'établir les règlements.",
  },
  {
    id:          'loi-24-12-1996',
    reference:   'Loi du 24 décembre 1996',
    formulation: "VU la loi du 24 décembre 1996 relative à l'établissement et au recouvrement des taxes provinciales et communales",
    obligatoire: true,
    contexte:    'taxe',
    note:        "Loi-cadre sur le recouvrement. Articles 1 à 12 régissent les procédures d'enrôlement, réclamation et dégrèvement.",
  },
  {
    id:          'cdld-l3321-1',
    reference:   'CDLD, art. L3321-1',
    formulation: "VU le Code de la Démocratie Locale et de la Décentralisation, notamment l'article L3321-1",
    obligatoire: false,
    contexte:    'taxe',
    note:        "Recommandé. Fonde la compétence communale de lever des taxes.",
  },
  {
    id:          'cdld-l1321-1',
    reference:   'CDLD, art. L1321-1',
    formulation: "VU le Code de la Démocratie Locale et de la Décentralisation, notamment l'article L1321-1",
    obligatoire: false,
    contexte:    'tous',
    note:        "Règlements communaux — obligation de publication. Recommandé mais non systématiquement exigé.",
  },
];

export const VISAS_SITUATIONNELS = [
  {
    id:          'rgpd',
    reference:   'Règlement UE 2016/679 (RGPD)',
    formulation: "VU le Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD)",
    contexte:    'Si le règlement implique la collecte de données à caractère personnel (déclarations, enrôlement nominatif)',
  },
  {
    id:          'loi-29-07-1991',
    reference:   "Loi du 29 juillet 1991 (motivation formelle)",
    formulation: "VU la loi du 29 juillet 1991 relative à la motivation formelle des actes administratifs",
    contexte:    'Si le règlement ou la délibération contient des décisions individuelles',
  },
  {
    id:          'decret-wallon-pertinent',
    reference:   'Décret wallon pertinent selon la matière',
    contexte:    'Ex. : décret déchets, décret eau, etc. selon la matière taxée',
  },
];

// ─── Articles obligatoires dans le règlement ─────────────────────────────────

export const ARTICLES_OBLIGATOIRES = [
  {
    id:          'objet',
    titre:       "Objet / matière imposable",
    gravite:     'critique',
    description: "Le règlement doit définir clairement et précisément l'objet de la taxe ou redevance. L'objet doit être suffisamment certain pour éviter les litiges d'interprétation.",
    exemple:     "Art. 1er. — Il est établi au profit de la commune, pour les exercices [...], une taxe sur [matière imposable clairement définie].",
  },
  {
    id:          'redevable',
    titre:       "Désignation du redevable",
    gravite:     'critique',
    description: "Le règlement doit désigner avec précision qui est redevable de la taxe/redevance. La désignation vague ('toute personne') doit être évitée.",
    exemple:     "Art. [...]. — La taxe est due par [le propriétaire / l'exploitant / la personne qui...] au [...] janvier de l'exercice d'imposition.",
  },
  {
    id:          'assiette',
    titre:       "Assiette / base imposable",
    gravite:     'critique',
    description: "L'assiette (base de calcul) doit être clairement définie. Pour une taxe : la valeur, la superficie, le nombre d'unités... Pour une redevance : la prestation fournie.",
    exemple:     "Art. [...]. — La taxe est calculée sur [unité de mesure / valeur / nombre].",
  },
  {
    id:          'taux-tarif',
    titre:       "Taux ou tarif",
    gravite:     'critique',
    description: "Le montant, le taux ou la grille tarifaire doit être expressément mentionné(e). Un renvoi à un autre document ou un montant non défini rend le règlement inapplicable.",
    exemple:     "Art. [...]. — Le taux de la taxe est fixé à [montant/taux] par [unité].",
  },
  {
    id:          'exonerations',
    titre:       "Exonérations",
    gravite:     'majeur',
    description: "Même si aucune exonération n'est prévue, le règlement doit l'indiquer explicitement pour éviter toute ambiguïté. Les exonérations doivent respecter le principe d'égalité (art. 172 Constitution).",
    exemple:     "Art. [...]. — Sont exonérés de la taxe : [liste]. OU : Aucune exonération n'est prévue.",
  },
  {
    id:          'declaration',
    titre:       "Déclaration",
    gravite:     'majeur',
    description: "Le règlement doit préciser comment le redevable doit déclarer sa situation (formulaire, délai, modalités). Obligatoire pour les taxes basées sur une déclaration du contribuable.",
    exemple:     "Art. [...]. — Le redevable est tenu de remettre au collège communal, avant le [date], une déclaration sur formulaire établi par l'administration.",
  },
  {
    id:          'enrolement',
    titre:       "Enrôlement",
    gravite:     'majeur',
    description: "La procédure d'enrôlement doit être mentionnée (CDLD art. L3321-6). La taxe est recouvrée par voie de rôle approuvé par le collège communal.",
    article:     'CDLD, art. L3321-6',
    exemple:     "Art. [...]. — La taxe est recouvrée par voie de rôle rendu exécutoire par le collège communal.",
  },
  {
    id:          'reclamation',
    titre:       "Réclamation et voies de recours",
    gravite:     'critique',
    description: "Article obligatoire. La procédure de réclamation doit être clairement décrite : délai de 3 mois à dater de l'envoi de l'avertissement-extrait de rôle, adresse de la réclamation (DG), forme écrite. Loi 24/12/1996, art. 9.",
    article:     'Loi 24/12/1996, art. 9 — CDLD, art. L3321-10',
    exemple:     "Art. [...]. — Les réclamations contre l'enrôlement doivent être introduites, par écrit, auprès du Directeur général dans un délai de trois mois à dater de l'envoi de l'avertissement-extrait de rôle.",
  },
  {
    id:          'transmission',
    titre:       "Transmission à l'autorité de tutelle",
    gravite:     'majeur',
    description: "Le règlement-taxe est soumis à la tutelle générale d'annulation. La délibération doit mentionner sa transmission au Gouverneur de province et au Gouvernement wallon.",
    exemple:     "Art. [...]. — La présente délibération sera transmise au Directeur général en vue de sa transmission à l'autorité de tutelle.",
  },
  {
    id:          'entree-en-vigueur',
    titre:       "Entrée en vigueur",
    gravite:     'majeur',
    description: "La date d'entrée en vigueur doit être précisée. Un règlement ne peut avoir d'effet rétroactif que si la loi le prévoit expressément.",
    exemple:     "Art. [...]. — Le présent règlement entre en vigueur le [date de publication].",
  },
  {
    id:          'abrogation',
    titre:       "Abrogation du règlement précédent",
    gravite:     'mineur',
    description: "Si un règlement précédent existe sur le même objet, il doit être expressément abrogé pour éviter les conflits de normes.",
    exemple:     "Art. [...]. — Le règlement du [date] relatif à [objet] est abrogé.",
  },
];

// ─── Distinction taxe vs redevance ────────────────────────────────────────────

export const DISTINCTION_TAXE_REDEVANCE = `
DISTINCTION FONDAMENTALE TAXE / REDEVANCE (droit communal wallon)

1. TAXE COMMUNALE
   - Définition : prélèvement obligatoire imposé unilatéralement par la commune, sans contrepartie directe et individualisée pour le redevable.
   - Fondement : Constitution art. 170 §4 — le pouvoir fiscal est EXCLUSIF aux organes fiscaux.
   - Critère : l'administré est redevable en raison d'une situation de fait (possession d'un bien, exercice d'une activité, fait générateur défini).
   - Exemples : taxe sur les secondes résidences, taxe sur les pylônes, taxe sur les enseigne publicitaires, taxe sur les entreprises.
   - Tutelle : tutelle générale d'ANNULATION (transmission au gouverneur).
   - Base légale principale : Constitution art. 170 §4, CDLD art. L3321-1, Loi 24/12/1996.

2. REDEVANCE COMMUNALE
   - Définition : contrepartie financière d'une PRESTATION INDIVIDUALISÉE fournie par la commune à l'administré.
   - Deux types :
     a) Redevance-service : contrepartie d'un service rendu (ex. : collecte déchets, distribution eau, inhumation).
     b) Redevance-autorisation : contrepartie d'une autorisation délivrée (ex. : occupation du domaine public, droit d'accès à une infrastructure).
   - Principe de PROPORTIONNALITÉ : le montant doit être en rapport raisonnable avec le coût réel de la prestation ou de l'autorisation.
   - Tutelle : tutelle générale d'APPROBATION (règles plus strictes).
   - Piège fréquent : qualifier une taxe de "redevance" pour contourner la tutelle d'annulation. Le CE et la CC analysent la nature réelle, pas l'appellation.

3. TESTS DE QUALIFICATION (jurisprudence CE)
   - Y a-t-il une contrepartie directe et individualisée ? → NON = taxe / OUI = redevance potentielle
   - La contrepartie est-elle proportionnelle au coût de la prestation ? → Non proportionnelle = taxe déguisée
   - L'administré peut-il refuser la prestation ? → Non = taxe / Oui = redevance possible
   - La commune retire-t-elle un bénéfice net au-delà du coût ? → Oui = indice de taxe déguisée

4. JURISPRUDENCE DE RÉFÉRENCE
   - CE 4 avril 2014, n° 227.138 : une redevance dont le montant dépasse largement le coût du service constitue une taxe déguisée.
   - CE 28 mars 2018, n° 241.158 : la qualification retenue par la commune ne lie pas le juge administratif.
   - CC 22 novembre 2006, n° 176/2006 : principe de non-rétroactivité fiscale.
   - CC 7 mars 2013, n° 28/2013 : égalité de traitement — les différences de traitement doivent être objectivement justifiées.
`;

// ─── Principes généraux du droit fiscal communal ─────────────────────────────

export const PRINCIPES_GENERAUX = `
PRINCIPES GÉNÉRAUX DU DROIT FISCAL COMMUNAL WALLON

1. LÉGALITÉ FISCALE (art. 170 Constitution)
   - Toute taxe doit être établie par un règlement du conseil communal.
   - Aucune taxe ne peut être perçue sans base légale.
   - Le pouvoir de délégation au collège est strictement limité aux modalités d'exécution.

2. ÉGALITÉ FISCALE (art. 172 Constitution)
   - Tous ceux qui se trouvent dans la même situation doivent être traités identiquement.
   - Les exonérations sont permises si elles reposent sur des critères objectifs et raisonnablement justifiés.
   - Attention aux discriminations indirectes (ex. : exonération basée sur l'origine).

3. NON-RÉTROACTIVITÉ
   - Un règlement-taxe ne peut s'appliquer rétroactivement, sauf loi l'y autorisant expressément.
   - Exception tolérée : adoption tardive d'un règlement pour l'exercice en cours, MAIS la délibération doit intervenir dans l'exercice fiscal concerné.

4. PROPORTIONNALITÉ (pour les redevances)
   - Le montant d'une redevance ne peut excéder de manière déraisonnable le coût réel de la prestation.
   - L'excédent systématique transforme la redevance en taxe déguisée.

5. CERTITUDE JURIDIQUE
   - Le redevable doit pouvoir savoir avec certitude s'il est soumis à la taxe, quelle est l'assiette et le taux.
   - Un règlement trop vague ou ambigu peut être annulé pour défaut de certitude.

6. PROCÉDURE DE RÉCLAMATION (Loi 24/12/1996, art. 9)
   - Délai : 3 mois à dater de l'envoi de l'avertissement-extrait de rôle.
   - Forme : réclamation écrite adressée au Directeur général.
   - Procédure : le collège statue en première instance. Appel devant le tribunal de première instance.

7. TUTELLE (CDLD, Livre Ier, Partie III)
   - Règlements-taxes : tutelle générale d'ANNULATION (pas d'approbation préalable, mais transmission obligatoire au gouverneur).
   - Redevances : tutelle générale d'ANNULATION également, mais contrôle plus strict de la proportionnalité.
   - Délai de tutelle : 30 jours pour les actes soumis à transmission.
`;

// ─── Erreurs fréquentes observées ────────────────────────────────────────────

export const ERREURS_FREQUENTES = `
ERREURS FRÉQUENTES DANS LES RÈGLEMENTS COMMUNAUX WALLONS

1. VISAS
   - Visa art. 170 §4 absent ou incomplet (erreur la plus fréquente et la plus grave).
   - Visas en ordre incorrect (Convention internationale, Constitution, lois, décrets, arrêtés).
   - Visa loi 24/12/1996 absent pour une taxe.
   - Visas obsolètes référençant d'anciennes coordinations du CDLD.

2. QUALIFICATION
   - Utiliser "redevance" pour ce qui est juridiquement une taxe (pour contourner la tutelle ou par erreur).
   - Omission de la qualification dans le titre du règlement.
   - Absence de justification de la contrepartie pour les redevances.

3. ARTICLES MANQUANTS
   - Article réclamation absent ou délai erroné (autre que 3 mois).
   - Article enrôlement absent ou mention du rôle rendu exécutoire par le bourgmestre au lieu du collège.
   - Article exonération absent (même si aucune exonération).
   - Pas d'article sur l'entrée en vigueur.

4. ASSIETTE ET TAUX
   - Assiette définie de manière trop vague ("selon l'importance de l'établissement").
   - Taux ou tarif renvoyant à une annexe non adoptée en même temps.
   - Grille tarifaire discriminatoire sans justification objective.

5. COHÉRENCE
   - Règlement ne mentionnant pas l'abrogation du règlement précédent.
   - Exercice fiscal mentionné dans le règlement déjà écoulé au moment de l'adoption.
   - Contradiction entre le titre (redevance) et le texte (taxe).
   - Article de transmission indiquant la tutelle d'approbation pour une taxe (qui ne requiert que la tutelle d'annulation).
`;

// ─── Base juridique structurée pour injection dans les prompts ────────────────

export function getBaseForAgent(agentKey) {
  switch (agentKey) {
    case 'qualification':
      return DISTINCTION_TAXE_REDEVANCE + '\n\n' + PRINCIPES_GENERAUX;

    case 'visas':
      return 'LISTE DES VISAS OBLIGATOIRES ET RECOMMANDÉS:\n\n' +
        [...VISAS_OBLIGATOIRES, ...VISAS_SITUATIONNELS].map(v =>
          `[${v.obligatoire !== false ? 'OBLIGATOIRE' : 'RECOMMANDÉ'}] ${v.reference}\n` +
          `Formulation standard: "${v.formulation || '(variable selon contexte)'}"\n` +
          `Contexte: ${v.contexte}\n` +
          (v.note ? `Note: ${v.note}` : '')
        ).join('\n\n') +
        '\n\n' + ERREURS_FREQUENTES;

    case 'structure':
      return 'ARTICLES OBLIGATOIRES DANS UN RÈGLEMENT-TAXE/REDEVANCE:\n\n' +
        ARTICLES_OBLIGATOIRES.map(a =>
          `[${a.gravite.toUpperCase()}] ${a.titre}\n` +
          `Description: ${a.description}\n` +
          (a.article ? `Référence légale: ${a.article}\n` : '') +
          `Exemple: ${a.exemple}`
        ).join('\n\n') +
        '\n\n' + ERREURS_FREQUENTES;

    case 'droits':
      return PRINCIPES_GENERAUX + '\n\n' +
        'FOCUS DROITS DES CONTRIBUABLES:\n' +
        '- Principe d\'égalité fiscale (art. 172 Constitution) : les différences de traitement doivent être objectivement justifiées\n' +
        '- Non-rétroactivité : le règlement ne peut avoir d\'effet rétroactif\n' +
        '- Procédure de réclamation (Loi 24/12/1996 art. 9) : délai impératif de 3 mois\n' +
        '- RGPD : si collecte de données personnelles, base légale et information des personnes requises\n' +
        '- Certitude juridique : l\'administré doit pouvoir connaître sa situation fiscale avec certitude\n' +
        '- Proportionnalité (redevances) : montant en rapport avec le coût de la prestation\n';

    case 'coherence':
      return ERREURS_FREQUENTES + '\n\n' + PRINCIPES_GENERAUX + '\n\n' + DISTINCTION_TAXE_REDEVANCE;

    default:
      return PRINCIPES_GENERAUX;
  }
}

// ─── Chargement de la base (fallback statique → future API FinancesConnect) ──

export async function chargerBaseJuridique() {
  // Future: try FinancesConnect API first
  // try {
  //   const res = await fetch(`${FINANCECONNECT_API}/legal-knowledge/taxes-redevances`);
  //   if (res.ok) return await res.json();
  // } catch {}

  return {
    version:              LEGAL_KNOWLEDGE_VERSION,
    source:               'static',
    visasObligatoires:    VISAS_OBLIGATOIRES,
    visasSituationnels:   VISAS_SITUATIONNELS,
    articlesObligatoires: ARTICLES_OBLIGATOIRES,
    distinctions:         DISTINCTION_TAXE_REDEVANCE,
    principes:            PRINCIPES_GENERAUX,
    erreursFréquentes:    ERREURS_FREQUENTES,
    getBaseForAgent,
  };
}
