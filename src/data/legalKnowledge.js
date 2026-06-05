/**
 * Base juridique statique — droit communal wallon, taxes et redevances.
 * Sources:
 *   - CDLD (Code de la Démocratie Locale et de la Décentralisation)
 *   - Constitution belge
 *   - Circulaire budgétaire DGPL 2025 (CB 2025 - Communes), Chapitre VI
 *   - Jurisprudence CE / Cour constitutionnelle / Cour de cassation
 *   - AR 12 avril 1999 (réclamation) — modifié loi 20 décembre 2022
 *   - CRAF (loi 13 avril 2019)
 */

export const LEGAL_KNOWLEDGE_VERSION = '2026-06-enrichi';

// ─── Visas obligatoires ───────────────────────────────────────────────────────

export const VISAS_OBLIGATOIRES = [
  {
    id:          'const-41',
    reference:   'Constitution, art. 41',
    formulation: "VU la Constitution, spécialement l'article 41",
    obligatoire: true,
    contexte:    'tous',
    note:        "Autonomie communale : les intérêts exclusivement communaux sont réglés par les conseils communaux.",
  },
  {
    id:          'const-162',
    reference:   'Constitution, art. 162',
    formulation: "VU la Constitution, spécialement l'article 162",
    obligatoire: true,
    contexte:    'tous',
    note:        "Organisation des communes — principes de gestion décentralisée des intérêts communaux.",
  },
  {
    id:          'const-170-4',
    reference:   'Constitution, art. 170, §4',
    formulation: "VU la Constitution, spécialement l'article 170, §4",
    obligatoire: true,
    contexte:    'taxe',
    note:        "VISA LE PLUS IMPORTANT pour une taxe. Fonde le pouvoir fiscal communal : 'Aucun impôt communal ne peut être établi que par une décision du conseil.' Son absence rend le règlement-taxe juridiquement fragile et exposé à l'annulation.",
  },
  {
    id:          'const-172',
    reference:   'Constitution, art. 172',
    formulation: "VU la Constitution, spécialement l'article 172",
    obligatoire: true,
    contexte:    'taxe',
    note:        "Égalité fiscale (combiné aux art. 10 et 11) : 'Il ne peut être établi de privilège en matière d'impôts. Nulle exemption ou modération d'impôt ne peut être établie que par une loi.' Tout traitement différencié doit être objectivement et raisonnablement justifié.",
  },
  {
    id:          'cdld-l1122-30',
    reference:   'CDLD, art. L1122-30',
    formulation: "VU le Code de la Démocratie Locale et de la Décentralisation, notamment l'article L1122-30",
    obligatoire: true,
    contexte:    'tous',
    note:        "Compétence exclusive du conseil communal d'adopter les règlements. Le conseil ne peut déléguer son pouvoir fiscal au collège.",
  },
  {
    id:          'loi-24-12-1996',
    reference:   'Loi du 24 décembre 1996',
    formulation: "VU la loi du 24 décembre 1996 relative à l'établissement et au recouvrement des taxes provinciales et communales",
    obligatoire: true,
    contexte:    'taxe',
    note:        "Loi-cadre sur l'établissement et le recouvrement par voie de rôle. ATTENTION : depuis la loi du 20 décembre 2022, la procédure de réclamation est désormais régie par CDLD art. L3321-9 à L3321-12 (délai 1 an, auprès du Collège communal).",
  },
  {
    id:          'cdld-l3321',
    reference:   'CDLD, art. L3321-1 à L3321-12',
    formulation: "VU le Code de la Démocratie Locale et de la Décentralisation, notamment les articles L3321-1 à L3321-12",
    obligatoire: false,
    contexte:    'taxe',
    note:        "Recommandé. Fondent la compétence communale de lever des taxes et régissent toute la procédure fiscale (enrôlement L3321-4, taxation d'office L3321-6, réclamation L3321-9 à 12, dégrèvement).",
  },
  {
    id:          'cdld-l1321-1',
    reference:   'CDLD, art. L1321-1',
    formulation: "VU le Code de la Démocratie Locale et de la Décentralisation, notamment l'article L1321-1",
    obligatoire: false,
    contexte:    'tous',
    note:        "Publication des règlements communaux. Recommandé mais non systématiquement exigé.",
  },
];

export const VISAS_SITUATIONNELS = [
  {
    id:          'rgpd',
    reference:   'Règlement UE 2016/679 (RGPD)',
    formulation: "VU le Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD)",
    contexte:    'Si le règlement implique la collecte de données à caractère personnel (déclarations nominatives, enrôlement). Le redevable doit être informé de la base légale du traitement.',
  },
  {
    id:          'loi-29-07-1991',
    reference:   "Loi du 29 juillet 1991 (motivation formelle)",
    formulation: "VU la loi du 29 juillet 1991 relative à la motivation formelle des actes administratifs",
    contexte:    'Si le règlement ou la délibération contient des décisions individuelles',
  },
  {
    id:          'cir92-art465',
    reference:   'CIR92, art. 465 (centimes additionnels IPP)',
    formulation: "VU le Code des impôts sur les revenus 1992, notamment l'article 465",
    contexte:    "Uniquement pour les taxes additionnelles à l'impôt des personnes physiques (centimes additionnels IPP). Doit être adopté AVANT le 31 janvier de l'exercice.",
  },
  {
    id:          'decret-wallon-pertinent',
    reference:   'Décret wallon pertinent selon la matière',
    contexte:    'Ex. : décret déchets (30 mai 1985), décret eau, décret environnement — selon la matière taxée ou sur laquelle porte la redevance',
  },
];

// ─── Articles obligatoires dans le règlement ─────────────────────────────────

export const ARTICLES_OBLIGATOIRES = [
  {
    id:          'objet',
    titre:       "Objet / matière imposable",
    gravite:     'critique',
    description: "Le règlement doit définir clairement l'objet de la taxe/redevance. L'objet doit être suffisamment certain pour éviter les litiges d'interprétation. Un objet vague peut être annulé pour défaut de certitude juridique.",
    exemple:     "Art. 1er. — Il est établi au profit de la commune, pour les exercices [...], une taxe sur [matière imposable clairement définie].",
  },
  {
    id:          'redevable',
    titre:       "Désignation du redevable",
    gravite:     'critique',
    description: "Le règlement doit désigner avec précision qui est redevable, à quelle date (fait générateur) et dans quelle commune. La désignation vague est à éviter.",
    exemple:     "Art. [...]. — La taxe est due par [le propriétaire / l'exploitant / la personne qui...] au 1er janvier de l'exercice d'imposition.",
  },
  {
    id:          'assiette',
    titre:       "Assiette / base imposable",
    gravite:     'critique',
    description: "L'assiette (base de calcul) doit être clairement définie. Pour une taxe : valeur, superficie, nombre d'unités. Pour une redevance : la prestation fournie et son coût. L'ambiguïté de l'assiette peut être exploitée en réclamation.",
    exemple:     "Art. [...]. — La taxe est calculée sur [unité de mesure / valeur / nombre] au 1er janvier de l'exercice.",
  },
  {
    id:          'taux-tarif',
    titre:       "Taux ou tarif",
    gravite:     'critique',
    description: "Le montant, le taux ou la grille tarifaire doit être expressément fixé. Un renvoi à un document non adopté en même temps rend le règlement inapplicable. ATTENTION (Cour de cassation 19 avril 2021, F200132) : un taux forfaitaire UNIQUE pour une activité économique sans aucun critère d'ampleur (superficie, personnel, chiffre d'affaires) peut violer le principe d'égalité (art. 10, 11, 172 Constitution).",
    exemple:     "Art. [...]. — Le taux de la taxe est fixé à [montant] par [unité]. OU : La taxe est fixée forfaitairement à [montant] par an.",
  },
  {
    id:          'exonerations',
    titre:       "Exonérations",
    gravite:     'majeur',
    description: "Même si aucune exonération n'est prévue, le règlement doit l'indiquer. Les exonérations doivent respecter le principe d'égalité (art. 10, 11, 172 Constitution). Cour d'Appel de Mons 27 avril 2012 (Charleroi) : les exonérations pour bâtiments publics doivent être objectivement et raisonnablement justifiées.",
    exemple:     "Art. [...]. — Sont exonérés de la taxe : [liste précise avec justification]. OU : Aucune exonération n'est prévue.",
  },
  {
    id:          'declaration',
    titre:       "Déclaration et délai de déclaration",
    gravite:     'critique',
    description: "OBLIGATOIRE quand la taxe repose sur une déclaration du contribuable. Le règlement DOIT préciser le délai EXACT de déclaration. CE arrêt n°250.321 du 13 avril 2021 (Verviers) : l'absence de délai exact dans le règlement rend la taxation d'office impossible (CDLD L3321-6), compromettant l'applicabilité de la taxe.",
    article:     'CDLD, art. L3321-6 — CE arrêt n°250.321 du 13 avril 2021',
    exemple:     "Art. [...]. — Le redevable est tenu de remettre au collège communal, avant le 31 mars de l'exercice d'imposition, une déclaration sur formulaire établi par l'administration.",
  },
  {
    id:          'enrolement',
    titre:       "Enrôlement — rôle rendu exécutoire",
    gravite:     'majeur',
    description: "La taxe est recouvrée par voie de rôle (CDLD art. L3321-4) ou au comptant (L3321-1). Le rôle doit être rendu exécutoire par le COLLÈGE COMMUNAL (pas le bourgmestre seul). Délai d'imposition : 3 ans à compter du 1er janvier de l'exercice (+2 ans en cas de fraude). Après ce délai, la commune ne peut plus établir le rôle.",
    article:     'CDLD, art. L3321-1 et L3321-4',
    exemple:     "Art. [...]. — La taxe est recouvrée par voie de rôle rendu exécutoire par le collège communal.",
  },
  {
    id:          'taxation-office',
    titre:       "Taxation d'office",
    gravite:     'majeur',
    description: "Recommandé pour les taxes à déclaration. CDLD L3321-6 : en cas de non-déclaration ou déclaration incomplète, la commune peut établir une taxation d'office APRÈS notification préalable par recommandé (motifs, éléments, mode de détermination, montant envisagé) avec délai de réponse de 30 jours. Accroissements : max le DOUBLE du montant dû. Échelle recommandée DGPL 2025 : 10% (1re infraction) / 50% (2e) / 100% (3e) / 200% (4e et suivantes).",
    article:     'CDLD, art. L3321-6',
    exemple:     "Art. [...]. — À défaut de déclaration dans le délai prescrit, la commune procède à la taxation d'office conformément à l'art. L3321-6 du CDLD après notification préalable par recommandé accordant 30 jours de réponse.",
  },
  {
    id:          'reclamation',
    titre:       "Réclamation et voies de recours",
    gravite:     'critique',
    description: "ARTICLE OBLIGATOIRE — SOUVENT MAL RÉDIGÉ. Procédure depuis la loi du 20 décembre 2022 :\n- Délai : 1 AN à partir du 3ème jour ouvrable suivant l'envoi de l'AER [ATTENTION : avant 2023 c'était 3 mois — tout délai de '3 mois' est ERRONÉ et non conforme]\n- Destinataire : COLLÈGE COMMUNAL [ATTENTION : pas le Directeur général / financier]\n- Défaut de décision du collège dans 6 mois : réclamation réputée fondée\n- Recours judiciaire : Tribunal de 1ère instance, dans les 3 mois de la décision du collège",
    article:     'CDLD, art. L3321-9 à L3321-12 — AR 12 avril 1999 — Loi 20 décembre 2022',
    exemple:     "Art. [...]. — Les réclamations contre l'enrôlement doivent être introduites, par écrit, auprès du collège communal dans un délai d'un an à dater du troisième jour ouvrable suivant l'envoi de l'avertissement-extrait de rôle.",
  },
  {
    id:          'transmission',
    titre:       "Transmission à l'autorité de tutelle",
    gravite:     'majeur',
    description: "Le règlement-taxe est soumis à la tutelle SPÉCIALE D'APPROBATION du Gouvernement wallon (CDLD art. L3122-2 §1er). Procédure : transmission dans les 15 jours du vote → approbation formelle par arrêté ministériel OU accord tacite après 30 jours (silence = approuvé). Après réception de l'arrêté au Collège (dans les 5 jours), le règlement peut être publié. Sans approbation expresse ou tacite, le règlement-taxe n'a pas force exécutoire. Ne pas confondre : c'est bien une tutelle D'APPROBATION pour les taxes (pas d'annulation).",
    exemple:     "Art. [...]. — La présente délibération sera transmise à l'autorité de tutelle dans les délais légaux.",
  },
  {
    id:          'entree-en-vigueur',
    titre:       "Publication et entrée en vigueur",
    gravite:     'majeur',
    description: "CDLD art. L1133-1 à L1133-3 : après le délai de tutelle, DEUX actes simultanés LE MÊME JOUR sont obligatoires (Cour de Cassation) : (a) publication par affichage ou sur le site web, (b) inscription dans le registre des publications (AR 14 oct. 1991). Seul le BOURGMESTRE signe l'affiche (pas le DG). Entrée en vigueur : 5ème jour SUIVANT la publication. Avant ce délai : le règlement n'est pas opposable.",
    article:     'CDLD, art. L1133-1 à L1133-3',
    exemple:     "Art. [...]. — Le présent règlement entre en vigueur le 5ème jour suivant sa publication.",
  },
  {
    id:          'abrogation',
    titre:       "Abrogation du règlement précédent",
    gravite:     'mineur',
    description: "Si un règlement précédent existe sur le même objet, il doit être expressément abrogé. IMPORTANT (circulaire DGPL 2025, VI.3.5) : un règlement-taxe ne peut pas être modifié par un simple article modificatif — il doit être revoté dans son intégralité à chaque modification.",
    exemple:     "Art. [...]. — Le règlement du [date] relatif à [objet] est abrogé à partir du [date d'entrée en vigueur du présent règlement].",
  },
];

// ─── Distinction taxe vs redevance ────────────────────────────────────────────

export const DISTINCTION_TAXE_REDEVANCE = `
DISTINCTION FONDAMENTALE TAXE / REDEVANCE (droit communal wallon)
Source : Circulaire budgétaire DGPL 2025 — Chapitre VI.2

1. TAXE COMMUNALE — DÉFINITION VERBATIM DE RÉFÉRENCE
   Cour de cassation, 30 novembre 1950 et 13 juin 1961 :
   "prélèvement pratiqué par voie d'autorité par la commune sur les ressources des personnes
   (de droit public ou de droit privé), des sociétés sans personnification civile et des associations
   de fait ou communautés existant sur leur territoire ou possédant des intérêts, pour être affecté
   aux services d'utilité générale."

   Caractéristiques essentielles :
   - Prélèvement UNILATÉRAL (imposé par l'autorité sans consentement)
   - OBLIGATOIRE pour le redevable
   - SANS contrepartie directe et individualisée
   - Affecté aux services d'utilité GÉNÉRALE (bénéfice collectif, pas individuel)
   Fondement constitutionnel : art. 41, 162, 170 §4 Constitution.
   Base légale procédurale : CDLD art. L3321-1 à L3321-12.
   Tutelle : SPÉCIALE D'APPROBATION du Gouvernement wallon (CDLD art. L3122-2 §1er).
             Procédure : adoption → transmission dans 15 jours → approbation formelle
             (arrêté ministériel) OU accord tacite après 30 jours (silence = approuvé) →
             réception arrêté au Collège → publication → entrée en vigueur (5ème jour suivant).
             Sans approbation (expresse ou tacite), le règlement-taxe n'a pas force exécutoire.

2. REDEVANCE COMMUNALE — DÉFINITION VERBATIM DE RÉFÉRENCE
   Cour de cassation, 10 mai 2002 et 14 janvier 2013 ;
   Cour Constitutionnelle, arrêt 89/2010 :
   "une redevance est l'indemnisation que les autorités réclament à certains redevables en
   contrepartie d'un service spécial presté ou d'un avantage direct et particulier accordé
   dans leur intérêt personnel."

   CONDITION ESSENTIELLE — RAPPORT RAISONNABLE :
   Il doit exister un "rapport raisonnable" entre le coût réel du service ou de l'avantage accordé
   et le montant de la redevance. Un montant sans rapport avec le coût réel = taxe déguisée.

   Deux types :
   a) Redevance-SERVICE : contrepartie d'un service fourni à titre individuel
      (collecte déchets, distribution eau, inhumation, occupation domaine public).
   b) Redevance-AUTORISATION : contrepartie d'une autorisation ou d'un avantage particulier accordé.
   Recouvrement via : CDLD art. L1124-40 §1er (pas les art. L3321-1 à 12, réservés aux taxes).

3. TESTS DE QUALIFICATION (jurisprudence CE / Cour constitutionnelle)
   a) Y a-t-il une contrepartie DIRECTE et INDIVIDUALISÉE pour le redevable ?
      → NON = taxe / OUI = potentiellement une redevance
   b) La contrepartie est-elle PROPORTIONNELLE au coût réel de la prestation ?
      → Pas proportionnelle = risque de taxe déguisée (CE n°227.138 du 4 avril 2014)
   c) L'administré peut-il REFUSER la prestation ou l'autorisation ?
      → Non = indice fort de taxe / Oui = cohérent avec une redevance
   d) La commune dégage-t-elle un BÉNÉFICE NET au-delà du coût réel ?
      → Oui = indice de taxe déguisée
   e) PIÈGE FRÉQUENT : la qualification retenue par la commune ne lie pas le juge.
      Le CE et la CC analysent la nature RÉELLE du prélèvement, pas son appellation
      (CE 28 mars 2018, n°241.158).

4. JURISPRUDENCE CLÉ — TEXTES VERBATIM OU RÉSUMÉS

   Cour de cassation, 19 avril 2021 (F200132 — Ville de Charleroi c. DKMY)
   PRINCIPE : UNE TAXE FORFAITAIRE UNIQUE SANS CRITÈRE D'AMPLEUR VIOLE L'ÉGALITÉ :
   "en raison de son taux forfaitaire unique, un règlement-taxe sur les bars qui frappe l'exercice
   d'une activité économique sans avoir égard au moindre indice qui rende compte de son ampleur
   (superficie, personnel, chiffre d'affaires) traite de manière identique des établissements qui,
   tout en exerçant la même activité, se trouvent dans des situations essentiellement différentes
   du point de vue de leurs capacités contributives"
   → S'applique également aux : nights-shops, phone-shops, bars à chicha, débits de tabacs,
     cannabis-shops, et tout commerce où un taux forfaitaire ignore l'ampleur réelle.
   → La commune DOIT intégrer au moins un critère d'ampleur ou justifier objectivement le forfait.

   CE arrêt n°250.321 du 13 avril 2021 (Ville de Verviers)
   PRINCIPE : LE RÈGLEMENT DOIT PRÉVOIR UN DÉLAI EXACT DE DÉCLARATION :
   L'absence de délai de déclaration précis dans le règlement rend la taxation d'office impossible
   (CDLD L3321-6), ce qui compromet l'applicabilité pratique de la taxe.

   Cour d'Appel de Mons, 27 avril 2012 (Ville de Charleroi)
   PRINCIPE : EXONÉRATIONS POUR BÂTIMENTS PUBLICS — JUSTIFICATION REQUISE :
   Les exonérations accordées aux bâtiments de l'État, de la province, etc. doivent être
   objectivement et raisonnablement justifiées sous peine de violer l'art. 172 Constitution.

   Cour Constitutionnelle, arrêt n°19/2012 du 16 février 2012
   Taxe sur les spectacles basée sur les recettes brutes : licite (compatible avec art. 464,1° CIR).

   Cour Constitutionnelle, arrêt n°28/2013 du 7 mars 2013
   Égalité : les différences de traitement entre contribuables doivent être objectivement justifiées.
`;

// ─── Principes généraux du droit fiscal communal ─────────────────────────────

export const PRINCIPES_GENERAUX = `
PRINCIPES GÉNÉRAUX DU DROIT FISCAL COMMUNAL WALLON
Source : Circulaire budgétaire DGPL 2025 — Chapitre VI

1. LÉGALITÉ FISCALE (Constitution art. 41, 162, 170 §4)
   - Toute taxe doit être établie par une DÉCISION DU CONSEIL COMMUNAL (art. 170 §4).
   - Aucune taxe ne peut être perçue sans base légale votée par le conseil.
   - Le conseil ne peut déléguer son pouvoir fiscal : le collège ne peut que rendre le rôle exécutoire.
   - Trois catégories de taxes communales (DGPL 2025, VI.2.3) :
     a) Taxe additionnelle IPP (art. 465 CIR) : doit être adoptée AVANT le 31 janvier de l'exercice.
     b) Centimes additionnels PrI (art. 464/1 CIR), décimes additionnels taxe circulation (art. 42 §2 1°).
     c) Impôts purement communaux : Constitution art. 41, 162, 170 §4.

2. ÉGALITÉ FISCALE (Constitution art. 10, 11 et 172)
   - Art. 172 Constitution : "Il ne peut être établi de privilège en matière d'impôts. Nulle exemption
     ou modération d'impôt ne peut être établie que par une loi."
   - Tous ceux qui se trouvent dans la même situation doivent être traités identiquement.
   - Les différences de traitement ne sont admises que si elles sont :
     a) objectivement justifiées (motif légitime),
     b) raisonnablement proportionnées à l'objectif poursuivi.
   - RÈGLE PROCÉDURALE CRITIQUE : le juge ne peut tenir compte QUE des justifications figurant dans
     le PRÉAMBULE du règlement ou dans le DOSSIER ADMINISTRATIF. Une justification absente du
     préambule et improvisée devant le juge est irrecevable.

3. NON-RÉTROACTIVITÉ
   - Un règlement-taxe ne peut s'appliquer rétroactivement, sauf texte l'y autorisant expressément
     (CC n°176/2006 du 22 novembre 2006).
   - Exception tolérée : adoption tardive pour l'exercice en cours, à condition que la délibération
     intervienne dans l'exercice fiscal concerné.

4. PROPORTIONNALITÉ (pour les redevances)
   - Le montant d'une redevance ne peut excéder de manière déraisonnable le coût réel de la prestation.
   - L'excédent systématique transforme la redevance en taxe déguisée (CE n°227.138 du 4 avril 2014).

5. CERTITUDE JURIDIQUE
   - Le redevable doit pouvoir savoir avec certitude s'il est soumis, quelle est l'assiette et le taux.
   - Un règlement trop vague peut être annulé pour défaut de certitude juridique.

6. NON BIS IN IDEM
   - Interdit : taxe communale sur les revenus imposables à l'IPP/ISoc (art. 464 §1er 1° CIR).
   - Interdit : taxe communale sur les bénéfices, rémunérations, profits (art. 464 §1er 2° CIR).
   - Interdit : double taxe communale sur le même fait générateur.

7. PROCÉDURE DE RÉCLAMATION — RÈGLE MISE À JOUR (Loi 20 décembre 2022)
   ⚠️ DEPUIS LE 1er JANVIER 2023 — MODIFICATIONS FONDAMENTALES :
   - Délai : 1 AN (auparavant : 3 mois) — à compter du 3ème jour ouvrable suivant l'envoi AER
   - Destinataire : COLLÈGE COMMUNAL (auparavant : Directeur général)
   - Recours judiciaire : Tribunal de 1ère instance, dans les 3 mois de la décision du collège
   - Base légale : CDLD art. L3321-9 à L3321-12 + AR 12 avril 1999
   - Tout règlement-taxe mentionnant "3 mois" ou "Directeur général" est OBSOLÈTE et non conforme.

8. DURÉE DE VALIDITÉ ET MODIFICATIONS
   - Un règlement-taxe est valable jusqu'au 31 décembre de l'année suivant le renouvellement
     du conseil communal.
   - Chaque MODIFICATION d'un règlement-taxe impose de revoter le règlement dans son intégralité
     (pas d'article modificatif partiel — circulaire DGPL 2025, VI.3.5).
`;

// ─── Procédure de réclamation ─────────────────────────────────────────────────

export const PROCEDURE_RECLAMATION = `
PROCÉDURE DE RÉCLAMATION EN MATIÈRE FISCALE COMMUNALE
Source : CDLD art. L3321-9 à L3321-12 + AR 12 avril 1999 + Loi 20 décembre 2022

⚠️ MODIFICATION FONDAMENTALE — LOI 20 DÉCEMBRE 2022 (applicable depuis le 1er janvier 2023)
L'ancien délai de 3 mois EST REMPLACÉ par 1 AN.
L'ancien destinataire "Directeur général" EST REMPLACÉ par "Collège communal".
Tout règlement-taxe encore rédigé avec l'ancienne procédure est NON CONFORME au droit actuel.

PROCÉDURE EN 4 ÉTAPES :

ÉTAPE 1 — INTRODUCTION DE LA RÉCLAMATION (L3321-9 CDLD)
  - Délai : 1 AN à partir du 3ème jour OUVRABLE suivant l'envoi de l'AER (avertissement-extrait de rôle)
  - Destinataire : COLLÈGE COMMUNAL (pas le Directeur général / Directeur financier)
  - Forme : réclamation ÉCRITE, signée par le redevable ou son mandataire

ÉTAPE 2 — DÉCISION DU COLLÈGE (L3321-10 CDLD)
  - Délai de décision : 6 MOIS maximum à partir de la réception de la réclamation
  - Si aucune décision dans les 6 mois : réclamation réputée FONDÉE d'office (avantage au réclamant)

ÉTAPE 3 — RECOURS JUDICIAIRE (L3321-11 CDLD)
  - Juridiction compétente : Tribunal de première instance
  - Délai : 3 MOIS à partir de la décision du collège (ou de l'expiration du délai de 6 mois)
  - CONDITION DE RECEVABILITÉ : toute action judiciaire requiert qu'une réclamation ait
    préalablement été introduite auprès du collège (procédure préalable obligatoire)

ÉTAPE 4 — PRESCRIPTION DU RECOUVREMENT
  - CRAF (loi du 13 avril 2019), art. 23 §1er : délai de prescription de 5 ANS
  - Point de départ : date à laquelle le rôle est rendu exécutoire

FORMULATION TYPE CONFORME (à utiliser dans le règlement) :
"Les réclamations contre l'enrôlement doivent être introduites, par écrit, auprès du collège
communal dans un délai d'un an à dater du troisième jour ouvrable suivant l'envoi de
l'avertissement-extrait de rôle. À défaut de décision du collège dans les six mois de la
réception de la réclamation, celle-ci est réputée fondée. Les actions judiciaires doivent être
portées devant le tribunal de première instance dans les trois mois de la décision du collège."
`;

// ─── Procédure de publication (CDLD L1133-1 à L1133-3) ───────────────────────

export const PUBLICATION_TIMELINE = `
PROCÉDURE DE PUBLICATION DES RÈGLEMENTS-TAXES COMMUNAUX
Source : CDLD art. L1133-1 à L1133-3 + Circulaire DGPL 2025, section VI.3.6

LIGNE DU TEMPS OBLIGATOIRE — 7 ÉTAPES :

1. Communication du dossier au Directeur financier
   → Minimum 10 jours OUVRABLES avant la convocation du conseil

2. Convocation du Conseil communal
   → Minimum 7 jours FRANCS avant la séance

3. Vote au Conseil communal
   → Adoption du règlement-taxe (majorité simple des membres présents)

4. Transmission au Gouvernement wallon
   → Maximum 15 jours après le vote
   → Via le Directeur financier (tutelle générale d'annulation)

5. Délai de tutelle — TUTELLE SPÉCIALE D'APPROBATION (CDLD art. L3122-2 §1er)
   → 30 jours pour l'approbation formelle (arrêté ministériel) ou le refus
   → À l'expiration sans réaction : accord TACITE (réputé approuvé)
   → Prorogation possible dans les cas CDLD
   → ATTENTION : c'est une tutelle D'APPROBATION (pas d'annulation). Sans approbation
     (expresse ou tacite), le règlement-taxe n'acquiert pas force exécutoire.

6. Publication OBLIGATOIRE — DOUBLE ACTE SIMULTANÉ LE MÊME JOUR
   → Cour de Cassation : les DEUX actes suivants doivent intervenir LE MÊME JOUR :
     a) Publication par AFFICHAGE ou sur le SITE WEB de la commune
     b) Inscription dans le REGISTRE des publications (AR 14 octobre 1991)
   → Seul le BOURGMESTRE signe l'affiche (pas le Directeur général / Directeur financier)
   → Si les deux actes ne sont pas simultanés : publication irrégulière, règlement non opposable

7. Entrée en vigueur
   → 5ème jour SUIVANT la publication (art. L1133-2 CDLD)
   → Avant ce délai : le règlement n'est pas opposable aux contribuables

ERREURS FRÉQUENTES DE PUBLICATION :
- Affichage et inscription au registre non simultanés
- Affiche signée par le Directeur général (illégal — seul le bourgmestre compétent)
- Entrée en vigueur "le jour de la publication" (doit être le 5ème jour suivant)
- Omission de l'inscription au registre des publications
`;

// ─── Taxation d'office et accroissements ─────────────────────────────────────

export const TAXATION_OFFICE = `
TAXATION D'OFFICE, DÉLAI D'IMPOSITION ET ACCROISSEMENTS
Source : CDLD art. L3321-6 + Circulaire DGPL 2025, section VI.4.14

1. CONDITION D'APPLICATION DE LA TAXATION D'OFFICE
   - Non-déclaration dans le délai prévu au règlement
   - Déclaration incomplète, inexacte ou introduite tardivement
   - PRÉREQUIS ABSOLU : le règlement doit mentionner un délai de déclaration PRÉCIS.
     CE arrêt n°250.321 du 13 avril 2021 (Verviers) : sans délai précis dans le règlement,
     la taxation d'office est IMPOSSIBLE, rendant la taxe impraticable.

2. PROCÉDURE OBLIGATOIRE AVANT TAXATION D'OFFICE
   a) Notification au redevable par RECOMMANDÉ contenant obligatoirement :
      - Les motifs de la taxation d'office
      - Les éléments pris en compte pour la base imposable
      - Le mode de détermination de la base imposable
      - Le montant envisagé
   b) Délai de réponse accordé au redevable : 30 JOURS
   c) Si réponse insuffisante ou silence : établissement du rôle d'office

3. DÉLAI D'IMPOSITION (délai de prescription pour la commune — L3321-6 CDLD)
   - Délai général : 3 ANS à compter du 1er janvier de l'exercice d'imposition
   - En cas de FRAUDE : 3 ans + 2 ans supplémentaires = 5 ans maximum
   - Après expiration du délai : la commune ne peut plus établir le rôle (prescription acquise)

4. ACCROISSEMENTS — RÈGLES ET ÉCHELLE
   - Fondement légal : CDLD art. L3321-6
   - Plafond légal ABSOLU : maximum le DOUBLE (200%) du montant de la taxe due
   - Nature : non automatiques — doivent être expressément prévus dans le règlement et motivés
   - Échelle RECOMMANDÉE par la circulaire DGPL 2025 :
     - 1re infraction (1er rôle d'office) :  10 % du montant de la taxe
     - 2e infraction                      :  50 % du montant de la taxe
     - 3e infraction                      : 100 % du montant de la taxe
     - 4e infraction et suivantes         : 200 % du montant de la taxe (plafond légal)
   - ERREUR FRÉQUENTE : accroissements automatiques sans motivation = illégaux.
   - ERREUR FRÉQUENTE : accroissements dépassant le double = nullité.

5. RECOUVREMENT AMIABLE — SOMMATION (L3321-8bis CDLD)
   - Sommation de payer par RECOMMANDÉ, après minimum 10 jours calendrier post-échéance
   - La sommation prend effet à partir du 3ème jour ouvrable suivant l'envoi
   - Première mesure d'exécution forcée : après minimum 1 MOIS depuis l'effectivité de la sommation
   - RÈGLE SOCIALE : le 1er rappel doit être GRATUIT (pas de frais pour le premier rappel)
`;

// ─── Taxes interdites ─────────────────────────────────────────────────────────

export const TAXES_INTERDITES = `
TAXES COMMUNALES INTERDITES OU À HAUT RISQUE JURIDIQUE
Source : Circulaire DGPL 2025, sections VI.4.2 et VI.4.3 — CIR92 art. 464

1. INTERDICTIONS LÉGALES EXPLICITES (CIR92 art. 464 §1er)
   - Taxes sur les revenus, bénéfices, rémunérations ou profits imposables à l'IPP/ISoc
     (Exception autorisée : centimes additionnels à l'IPP via art. 465 CIR et PrI via art. 464/1)
   - Taxes sur les véhicules automobiles (hors régime additionnel légalement prévu)
   - Taxes sur les jeux et paris AUTRES QUE les courses de chevaux (art. 74 Code taxes assimilées)

2. INTERDICTIONS JURISPRUDENTIELLES (jurisprudence CE constante)
   - Taxes sur les CAPTAGES D'EAU (CE arrêts n°33.727, 26.210 et 87.161)
   - Taxes sur les BOIS exploités
   - Taxes sur la DISTRIBUTION D'ANNUAIRES téléphoniques officiels
   - Taxes sur les ANTENNES PARABOLIQUES
   - Taxes INDIRECTES sur les mines, minières et carrières

3. TAXES À RISQUE ÉLEVÉ — VIGILANCE PARTICULIÈRE
   - Taxe forfaitaire sur une activité économique sans critère d'ampleur
     → Risque d'annulation (Cour de cassation 19 avril 2021 F200132 — Charleroi/DKMY)
     → Concerne : bars, nights-shops, phone-shops, débits de tabacs, bars à chicha, cannabis-shops
   - Taxe sur les implantations commerciales de grande surface
     → Doit s'articuler avec la réglementation fédérale et régionale sans double imposition
   - Taxe sur les nuitées / taxe touristique
     → L'assiette doit être clairement définie et ne pas équivaloir à une taxe sur le revenu de l'exploitant
`;

// ─── Erreurs fréquentes observées ────────────────────────────────────────────

export const ERREURS_FREQUENTES = `
ERREURS FRÉQUENTES DANS LES RÈGLEMENTS COMMUNAUX WALLONS
(Mise à jour : Circulaire DGPL 2025 + Jurisprudence récente)

1. VISAS
   - Art. 170 §4 absent pour une taxe (erreur la plus grave — fondement du pouvoir fiscal).
   - Art. 172 Constitution absent (principe d'égalité fiscale).
   - Ordre incorrect des visas : l'ordre correct est Constitution → Lois fédérales → Décrets wallons
     → CDLD → Arrêtés.
   - Loi 24/12/1996 absente pour une taxe recouvrée par voie de rôle.
   - Références obsolètes au CDLD (anciennes coordinations).

2. RÉCLAMATION — ERREUR TRÈS FRÉQUENTE ET CRITIQUE
   ⚠️ Délai "3 mois" → ERRONÉ depuis 2023. Délai correct : 1 AN (loi 20/12/2022).
   ⚠️ Destinataire "Directeur général" → ERRONÉ. Correct : COLLÈGE COMMUNAL.
   ⚠️ Base légale "Loi 24/12/1996 art. 9" → Remplacée par CDLD art. L3321-9 à L3321-12.
   Les règlements antérieurs à 2023 non mis à jour sont non conformes au droit actuel.

3. QUALIFICATION
   - Qualifier de "redevance" ce qui est juridiquement une taxe (pour contourner la tutelle
     d'annulation ou par méconnaissance). La qualification ne lie pas le juge — seule la nature
     réelle compte.
   - Redevance sans "rapport raisonnable" entre montant et coût du service = taxe déguisée.

4. ARTICLES MANQUANTS OU ERRONÉS
   - Article déclaration absent ou sans délai précis : taxation d'office impossible (CE 250.321/2021).
   - Article enrôlement mentionnant le bourgmestre seul au lieu du collège.
   - Article exonérations absent (même si aucune exonération n'est prévue).
   - Article entrée en vigueur absent ou incorrect ("le jour de la publication" au lieu du 5ème jour).

5. TAUX FORFAITAIRE ET ÉGALITÉ
   - Taxe forfaitaire unique sur une activité économique sans aucun critère d'ampleur (superficie,
     personnel, CA) : risque élevé d'annulation (Cass. 19 avril 2021 F200132).
   - Exonérations sans justification objective dans le préambule.

6. TAXATION D'OFFICE
   - Règlement sans délai de déclaration précis : taxation d'office IMPOSSIBLE.
   - Accroissements automatiques non motivés : illégaux.
   - Accroissements dépassant le double de la taxe due : nullité.

7. PUBLICATION ET FORMALITÉS
   - Affichage et inscription au registre non simultanés (violation jurisprudence Cour de cassation).
   - Affiche signée par le Directeur général au lieu du bourgmestre.
   - Entrée en vigueur "le jour de la publication" (doit être le 5ème jour suivant).

8. COHÉRENCE RÉDACTIONNELLE
   - Règlement ne mentionnant pas l'abrogation explicite du règlement précédent.
   - Exercice fiscal mentionné dans le règlement déjà écoulé au moment de l'adoption.
   - Contradiction entre le titre ("redevance") et le corps du texte ("taxe" ou vice versa).
   - Tutelle d'ANNULATION mentionnée pour une taxe : ERREUR — les règlements-taxes wallons sont
     soumis à la tutelle SPÉCIALE D'APPROBATION (CDLD art. L3122-2 §1er), pas à la tutelle
     d'annulation. La mention d'une tutelle d'approbation est donc CORRECTE et OBLIGATOIRE.
   - Règlement modifié par article modificatif partiel au lieu d'être revoté dans son intégralité.
`;

// ─── Base juridique structurée pour injection dans les prompts ────────────────

export function getBaseForAgent(agentKey) {
  switch (agentKey) {
    case 'qualification':
      return DISTINCTION_TAXE_REDEVANCE + '\n\n' + PRINCIPES_GENERAUX + '\n\n' + TAXES_INTERDITES;

    case 'visas':
      return 'LISTE DES VISAS OBLIGATOIRES ET RECOMMANDÉS :\n\n' +
        [...VISAS_OBLIGATOIRES, ...VISAS_SITUATIONNELS].map(v =>
          `[${v.obligatoire !== false ? 'OBLIGATOIRE' : 'RECOMMANDÉ'}] ${v.reference}\n` +
          `Formulation standard : "${v.formulation || '(variable selon contexte)'}"\n` +
          `Contexte : ${v.contexte}\n` +
          (v.note ? `Note : ${v.note}` : '')
        ).join('\n\n') +
        '\n\n' + ERREURS_FREQUENTES;

    case 'structure':
      return 'ARTICLES OBLIGATOIRES DANS UN RÈGLEMENT-TAXE/REDEVANCE :\n\n' +
        ARTICLES_OBLIGATOIRES.map(a =>
          `[${a.gravite.toUpperCase()}] ${a.titre}\n` +
          `Description : ${a.description}\n` +
          (a.article ? `Référence légale : ${a.article}\n` : '') +
          `Exemple : ${a.exemple}`
        ).join('\n\n') +
        '\n\n' + PROCEDURE_RECLAMATION + '\n\n' + TAXATION_OFFICE + '\n\n' + ERREURS_FREQUENTES;

    case 'droits':
      return PRINCIPES_GENERAUX + '\n\n' + PROCEDURE_RECLAMATION + '\n\n' +
        'FOCUS DROITS DES CONTRIBUABLES :\n' +
        '- Égalité fiscale (art. 10, 11, 172 Constitution) : différences de traitement doivent être\n' +
        '  objectivement justifiées dans le PRÉAMBULE ou le dossier administratif.\n' +
        '- Taux forfaitaire unique sans critère d\'ampleur = risque d\'annulation\n' +
        '  (Cass. 19 avril 2021 F200132 — Charleroi/DKMY).\n' +
        '- Non-rétroactivité : le règlement ne peut avoir d\'effet rétroactif (CC n°176/2006).\n' +
        '- Réclamation (CDLD L3321-9) : délai IMPÉRATIF de 1 AN depuis 2023, auprès du COLLÈGE.\n' +
        '  Tout délai de "3 mois" ou destinataire "Directeur général" est ERRONÉ.\n' +
        '- RGPD : si collecte de données personnelles (déclarations), base légale et information requises.\n' +
        '- Certitude juridique : l\'administré doit connaître sa situation fiscale avec certitude.\n' +
        '- Proportionnalité (redevances) : montant en rapport raisonnable avec le coût de la prestation.\n' +
        '- Prescription recouvrement : 5 ans depuis exécutoire du rôle (CRAF art. 23 §1er, loi 13/4/2019).\n\n' +
        TAXATION_OFFICE;

    case 'coherence':
      return ERREURS_FREQUENTES + '\n\n' + PRINCIPES_GENERAUX + '\n\n' +
        DISTINCTION_TAXE_REDEVANCE + '\n\n' + PUBLICATION_TIMELINE + '\n\n' + TAXES_INTERDITES;

    default:
      return PRINCIPES_GENERAUX;
  }
}

// ─── Chargement de la base (fallback statique → future API FinancesConnect) ──

export async function chargerBaseJuridique() {
  return {
    version:              LEGAL_KNOWLEDGE_VERSION,
    source:               'static',
    visasObligatoires:    VISAS_OBLIGATOIRES,
    visasSituationnels:   VISAS_SITUATIONNELS,
    articlesObligatoires: ARTICLES_OBLIGATOIRES,
    distinctions:         DISTINCTION_TAXE_REDEVANCE,
    principes:            PRINCIPES_GENERAUX,
    procedureReclamation: PROCEDURE_RECLAMATION,
    publicationTimeline:  PUBLICATION_TIMELINE,
    taxationOffice:       TAXATION_OFFICE,
    taxesInterdites:      TAXES_INTERDITES,
    erreursFréquentes:    ERREURS_FREQUENTES,
    getBaseForAgent,
  };
}
