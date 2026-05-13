import INDEX from "./index_valide.json";
import { useState, useRef, useCallback, useEffect } from "react";

const C = {
  orange:"#E87722", orangeLight:"#FFF4EC",
  bleu:"#1A3A5C", bleuLight:"#EEF3F8",
  gris:"#6B7280", grisClair:"#F3F4F6", blanc:"#FFFFFF",
  vert:"#15803D", vertClair:"#F0FDF4",
  rouge:"#DC2626", rougeClair:"#FEF2F2",
  jaune:"#D97706", jauneClair:"#FFFBEB",
  border:"#E5E7EB",
};

const CATEGORIES = [
  { slug:"actes-administratifs",  label:"Actes administratifs et état civil" },
  { slug:"domaine-public",        label:"Domaine public et voirie" },
  { slug:"dechets-environnement", label:"Déchets et environnement" },
  { slug:"hebergement-tourisme",  label:"Hébergement touristique et séjour" },
  { slug:"commerce-economie",     label:"Commerce et activités économiques" },
  { slug:"inhumation",            label:"Inhumation & Cimetière" },
  { slug:"animaux",               label:"Animaux" },
  { slug:"immondices",            label:"Immondices" },
  { slug:"location-salle",        label:"Location salle et matériel communal" },
  { slug:"mobilite",              label:"Mobilité" },
  { slug:"impots",                label:"Impôts" },
];

const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';
const ODWB = `${WORKER_URL}/odwb/api/explore/v2.1/catalog/datasets`;

async function searchCommunes(q) {
  if (!q || q.length < 2) return [];
  const qClean = q.replace(/"/g, "");
  const p = new URLSearchParams({
    where: `nom like "${qClean}%"`,
    select: "nom,nom_court,adresse,cp,localite,ins,email_general,site_web,telephone",
    order_by: "nom", limit: "8",
  });
  const r = await fetch(`${ODWB}/communes_s3/records?${p}`);
  if (!r.ok) throw new Error(`ODWB communes ${r.status}`);
  return (await r.json()).results || [];
}

async function getMandataires(ins) {
  const p = new URLSearchParams({
    where: `ins=${ins}`,
    select: "detail_civilite,detail_prenom,detail_nom,detail_fonction,detail_parti,attribution,coalition,population,province,arrondissement",
    limit: "50",
  });
  const r = await fetch(`${ODWB}/mandataires-locaux-des-villes-et-communes-de-wallonie/records?${p}`);
  if (!r.ok) throw new Error(`ODWB mandataires ${r.status}`);
  return (await r.json()).results || [];
}

const REFS = [
  {
    id:"ref-redevance-aiseau-2019", commune:"Aiseau-Presles",
    titre:"Règlement-redevance pour la délivrance de documents administratifs",
    type:"redevance", annee:2019,
    categorie:"actes-administratifs",
    mots_cles:["documents","administratifs","actes","délivrance","renseignements"],
    qualite:"bonne", points_forts_valides:true,
    points_forts:[
      "Visa art. 162 al. 2 et 170 §4 Constitution",
      "Visa CDLD L1122-30 et L1124-40",
      "Visa Charte européenne de l'autonomie locale art. 9.1",
      "Considérant de justification des coûts de traitement directs",
      "Délai 15 jours au débiteur avant commandement (loi 20/12/2002 art. 6 §3)",
      "Avis préalable Directeur financier (art. L1124-40 §1er, 4° CDLD)",
      "Clause entrée en vigueur conditionnée à la tutelle et publication L1133-1/2",
    ],
    extrait:`Le Conseil Communal, réuni en séance publique,\n\nVu la Constitution, notamment les articles 162 alinéa 2, 2° et 170 §4 ;\nVu la première partie du CDLD, notamment les articles L1122-30 et L1124-40 ;\n[…]\nConsidérant que les recherches entraînent des coûts de traitement répercutés sur les bénéficiaires ;\n[…]`,
  },
  {
    id:"ref-taxe-gembloux-2025", commune:"Gembloux",
    titre:"Règlement-taxe sur les agences de paris et courses de chevaux",
    type:"taxe", annee:2025,
    categorie:"commerce-economie",
    mots_cles:["paris","courses","chevaux","agences","CIR","commerce"],
    qualite:"bonne", points_forts_valides:true,
    points_forts:[
      "Visa art. 41, 162 et 170 §4 Constitution",
      "Visa CDLD L1122-30, L3321-1 à L3321-12",
      "Visa circulaire du 30 mai 2024",
      "Article Taxation d'office : L3321-6 CDLD, majoration 20%",
      "Article RGPD : responsable traitement, durée 30 ans",
      "Article Tutelle séparé : L3131-1 et suivants",
    ],
    extrait:`Le Conseil communal,\n\nVu la Constitution et notamment les articles 41, 162 et 170 §4 ;\nVu le CDLD, notamment L1122-30 et L3321-1 à L3321-12 ;\n[…]`,
  },
];

const SOURCE = (() => {
  try { return Array.isArray(INDEX) && INDEX.length > 0 ? INDEX : REFS; }
  catch { return REFS; }
})();

function trouverRefs(objet, type, categorie) {
  const mots = (objet || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,;.]+/).filter(m => m.length > 3);
  return SOURCE
    .filter(r => r.type===type && (!categorie||r.categorie===categorie) && r.qualite!=="insuffisante")
    .map(r => {
      const cles = (r.mots_cles||[]).join(" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      const score = mots.filter(m=>cles.includes(m)).length;
      return { ...r, _score: score + (r.points_forts_valides?2:0) };
    })
    .filter(r => r._score>0 || !categorie)
    .sort((a,b)=>b._score-a._score).slice(0,4);
}
const REGLES = [
  {
    id:"r-const-170", gravite:"erreur",
    label:"Visa art. 170 §4 Constitution (légalité fiscale)",
    explication:"Ce visa est absent du règlement. Sans lui, le fondement constitutionnel de la compétence fiscale communale n'est pas établi — risque d'annulation par la tutelle.",
    correction:"Ajouter dans le bloc « Vu » :\n« Vu la Constitution, notamment les articles 41, 162 et 170 §4 ; »",
    test: t => /170\s*[§s]\s*4/i.test(t),
  },
  {
    id:"r-const-162", gravite:"erreur",
    label:"Visa art. 162 Constitution (autonomie communale)",
    explication:"Ce visa est absent du règlement. Les tutelles provinciales wallonnes l'exigent systématiquement en complément de l'art. 170 §4.",
    correction:"Compléter le visa constitutionnel existant :\n« Vu la Constitution, notamment les articles 41, 162 et 170 §4 ; »\n(remplacer toute formulation qui ne cite que 170 §4 sans le 162)",
    test: t => /art\.?\s*162\b|article\s+162\b/i.test(t),
  },
  {
    id:"r-const-41", gravite:"avertissement",
    label:"Visa art. 41 Constitution",
    explication:"Ce visa est absent. Il est présent dans les règlements-taxes wallons récents et recommandé comme bonne pratique.",
    correction:"Ajouter l'art. 41 dans le visa constitutionnel :\n« Vu la Constitution, notamment les articles 41, 162 et 170 §4 ; »",
    test: t => /art\.?\s*41\b|article\s+41\b/i.test(t),
  },
  {
    id:"r-cdld-l1122", gravite:"erreur",
    label:"Visa CDLD art. L1122-30 (compétence Conseil communal)",
    explication:"Ce visa est absent. Sans lui, la compétence du Conseil communal pour adopter ce règlement n'est pas fondée légalement.",
    correction:"Ajouter dans le bloc « Vu » :\n« Vu le Code de la démocratie locale et de la décentralisation, notamment l'article L1122-30 ; »",
    test: t => /L1122-30/i.test(t),
  },
  {
    id:"r-cdld-l3321", gravite:"erreur",
    label:"Visa CDLD art. L3321-1 et suivants (fiscalité communale wallonne)",
    explication:"Ce visa est absent. Les articles L3321-1 à L3321-12 constituent le cadre légal wallon spécifique à la fiscalité communale — obligatoire pour tout règlement-taxe wallon.",
    correction:"Ajouter dans le bloc « Vu » :\n« Vu la cinquième partie du Code de la démocratie locale et de la décentralisation, notamment les articles L3321-1 à L3321-12 ; »",
    test: t => /L3321-1/i.test(t),
  },
  {
    id:"r-cdld-l1124", gravite:"avertissement",
    label:"Visa CDLD art. L1124-40 (recouvrement)",
    explication:"Ce visa est absent. Il fonde la procédure de recouvrement forcé et l'obligation d'avis préalable du Directeur financier.",
    correction:"Ajouter dans le bloc « Vu » :\n« Vu le Code de la démocratie locale et de la décentralisation, notamment l'article L1124-40 §1er ; »",
    test: t => /L1124-40/i.test(t),
  },
  {
    id:"r-dir-fin", gravite:"erreur",
    label:"Avis préalable Directeur financier (art. L1124-40 §1er, 4° CDLD)",
    explication:"Aucune mention de l'avis du Directeur financier n'a été trouvée. Cet avis est obligatoire avant toute délibération financière — son absence constitue une irrégularité de forme.",
    correction:"Ajouter dans le bloc « Considérant » :\n« Considérant la communication du dossier au Directeur financier faite conformément à l'article L1124-40, §1er, 4° du CDLD ;\nConsidérant l'avis de légalité du Directeur financier, positif, joint en annexe ; »",
    test: t => /directeur\s+financier/i.test(t) && /avis/i.test(t),
  },
  {
    id:"r-dir-fin-annexe", gravite:"info",
    label:"Avis Directeur financier mentionné comme joint en annexe",
    explication:"L'avis du Directeur financier est mentionné mais sans préciser qu'il est joint en annexe. Cette précision est une bonne pratique des règlements récents.",
    correction:"Compléter la mention existante :\n« Considérant l'avis de légalité du Directeur financier, positif, joint en annexe ; »",
    test: t => /directeur\s+financier/i.test(t) && /annex|joint/i.test(t),
  },
  {
    id:"r-college-prop", gravite:"avertissement",
    label:"Mention « Sur proposition du Collège communal »",
    explication:"Cette formule de clôture des Considérant est absente. Elle est standard dans les règlements wallons récents.",
    correction:"Ajouter à la fin du bloc « Considérant » :\n« Sur proposition du Collège communal ; »",
    test: t => /sur\s+proposition\s+du\s+coll[eè]ge/i.test(t),
  },
  {
    id:"r-delibere", gravite:"avertissement",
    label:"Mention « Après en avoir délibéré »",
    explication:"Cette formule procédurale est absente. Elle atteste formellement du vote du Conseil communal.",
    correction:"Ajouter avant « DÉCIDE » :\n« Après en avoir délibéré ; »",
    test: t => /apr[eè]s\s+en\s+avoir\s+d[eé]lib[eé]r[eé]/i.test(t),
  },
  {
    id:"r-redevable", gravite:"erreur",
    label:"Redevable clairement identifié",
    explication:"Le règlement ne désigne pas clairement qui est le débiteur. Cette identification est obligatoire — son absence est une cause fréquente d'annulation.",
    correction:"Ajouter un article dédié :\n« Article X — Redevable\nLa taxe/redevance est due par toute personne physique ou morale qui [description précise du fait générateur]. »",
    test: t => /(?:taxe|redevance)\s+est\s+due?\s+par|est\s+redevable|redevable\s*:/i.test(t),
  },
  {
    id:"r-tarif", gravite:"erreur",
    label:"Tarif fixé dans le règlement (art. 170 §4 Const.)",
    explication:"Aucun montant ou tarif n'a été trouvé. En vertu de l'art. 170 §4 de la Constitution, le taux doit figurer dans le règlement lui-même — toute délégation au Collège est inconstitutionnelle.",
    correction:"Ajouter un article avec le montant explicite :\n« Article X — Montant\nLe montant de la taxe/redevance est fixé à [MONTANT] euros par [unité]. »\n\u26a0\ufe0f Le tarif ne peut PAS être délégué au Collège communal (art. 170 §4 Constitution).",
    test: t => /\d[\d\s]*[,.]?\d*\s*€|\d+\s*euro|tableau\s+(?:des?\s+)?tarifs?/i.test(t),
  },
  {
    id:"r-periode", gravite:"erreur",
    label:"Période d'application définie (exercices)",
    explication:"Les exercices couverts par le règlement ne sont pas précisés. Sans délimitation temporelle, la taxe s'appliquerait indéfiniment sans réexamen du Conseil.",
    correction:"Préciser les exercices dans l'article d'objet :\n« Il est établi, pour les exercices [ANNÉE DÉBUT] à [ANNÉE FIN], une taxe/redevance communale sur… »",
    test: t => /exercices?\s+\d{4}|pour\s+l['']exercice\s+\d{4}/i.test(t),
  },
  {
    id:"r-declaration", gravite:"avertissement",
    label:"Article Déclaration des éléments d'imposition",
    explication:"Aucun article de déclaration n'a été trouvé. Son absence fragilise la procédure de taxation et rend difficile le recours à la taxation d'office.",
    correction:"Ajouter un article Déclaration :\n« Article X — Déclaration\nL'administration communale adresse au redevable un formulaire que celui-ci retourne dans un délai de 15 jours.\nLe redevable sans formulaire déclare spontanément au plus tard le 31 janvier de l'année suivant l'exercice. »",
    test: t => /d[eé]claration/i.test(t) && /formulaire|d[eé]lai/i.test(t),
  },
  {
    id:"r-taxation-office", gravite:"avertissement",
    label:"Article Taxation d'office (art. L3321-6 CDLD)",
    explication:"Aucune clause de taxation d'office n'a été trouvée. Sans elle, la commune ne peut pas sanctionner efficacement les non-déclarations.",
    correction:"Ajouter un article Taxation d'office :\n« Article X — Taxation d'office\nConformément à l'article L3321-6 du CDLD, la non-déclaration dans les délais entraîne l'enrôlement d'office de la taxe, majoré de 20 %. Le montant de la majoration est également enrôlé. »",
    test: t => /taxation\s+d['']office|enr[oô]lement\s+d['']office/i.test(t),
  },
  {
    id:"r-recl-mention", gravite:"erreur",
    label:"Procédure de réclamation mentionnée",
    explication:"Aucune procédure de réclamation n'est prévue dans ce règlement. C'est une cause fréquente d'annulation par la tutelle.",
    correction:"Ajouter un article Réclamation :\n« Article X — Réclamation\nToute réclamation doit être introduite, sous peine de déchéance, dans un délai de 6 mois à dater de l'envoi de la formule d'imposition, par lettre recommandée adressée au Collège communal, conformément à l'article L3321-9 du CDLD. »",
    test: t => /r[eé]clamation/i.test(t),
  },
  {
    id:"r-recl-6mois", gravite:"erreur",
    label:"Délai de réclamation de 6 mois (art. L3321-9 CDLD — ordre public)",
    explication:"Le délai de réclamation prévu est inférieur à 6 mois, ou n'est pas mentionné. Ce délai est d'ordre public : tout délai inférieur est illégal et entraîne la nullité de la clause.",
    correction:"Corriger le délai de réclamation :\n« …dans un délai de 6 mois à dater de l'envoi de la formule d'imposition… »\n\u26a0\ufe0f Ce délai est d'ordre public : il ne peut PAS être inférieur à 6 mois.",
    test: function(t) {
      if (!/r[eé]clamation/i.test(t)) return null;
      return /6\s*mois|six\s*mois/i.test(t) && !/[123]\s*mois|\b30\s*jours|\b15\s*jours/i.test(t);
    },
  },
  {
    id:"r-recl-college", gravite:"erreur",
    label:"Réclamation adressée au Collège communal",
    explication:"La réclamation n'est pas adressée au Collège communal. En vertu de l'art. L3321-9 CDLD, seul le Collège est compétent — toute autre désignation invalide la clause.",
    correction:"Corriger le destinataire :\n« …par lettre recommandée adressée au Collège communal… »\n\u26a0\ufe0f Pas au Conseil communal ni au Directeur général.",
    test: function(t) {
      if (!/r[eé]clamation/i.test(t)) return null;
      return /coll[eè]ge\s+communal|coll[eè]ge\s+des\s+bourgmestres/i.test(t);
    },
  },
  {
    id:"r-recl-recommande", gravite:"avertissement",
    label:"Réclamation par lettre recommandée",
    explication:"Le mode d'introduction de la réclamation n'est pas précisé. La jurisprudence du Conseil d'État exige la lettre recommandée pour garantir la preuve de la date d'introduction.",
    correction:"Préciser le mode d'introduction :\n« …doit être introduite, sous peine de déchéance, dans un délai de 6 mois, par lettre recommandée adressée au Collège communal… »",
    test: function(t) {
      if (!/r[eé]clamation/i.test(t)) return null;
      return /recommand[eé]/i.test(t);
    },
  },
  {
    id:"r-recl-decheance", gravite:"avertissement",
    label:"Mention « sous peine de déchéance »",
    explication:"Les effets du dépassement du délai de réclamation ne sont pas précisés. Sans cette mention, le redevable pourrait contester la forclusion.",
    correction:"Ajouter dans la clause de réclamation :\n« …doit être introduite, sous peine de déchéance, dans un délai de 6 mois… »",
    test: function(t) {
      if (!/r[eé]clamation/i.test(t)) return null;
      return /d[eé]ch[eé]ance/i.test(t);
    },
  },
  {
    id:"r-rgpd", gravite:"info",
    label:"Article protection des données personnelles (RGPD)",
    explication:"Aucun article RGPD n'a été trouvé. Les autorités de tutelle recommandent son inclusion dans tous les règlements impliquant un traitement de données personnelles.",
    correction:"Ajouter un article RGPD :\n« Article X — Protection des données\nResponsable de traitement : la Commune de [NOM].\nFinalité : établissement et recouvrement de la taxe/redevance.\nDurée de conservation : 30 ans.\nCommunication : uniquement aux tiers autorisés par la loi. »",
    test: t => /protection\s+des\s+donn[eé]es|responsable\s+de\s+traitement|RGPD/i.test(t),
  },
  {
    id:"r-tutelle-article", gravite:"avertissement",
    label:"Article Tutelle distinct (L3131-1 CDLD — tutelle spéciale d'approbation)",
    explication:"Aucun article distinct sur la tutelle n'a été trouvé. Les règlements-taxes récents consacrent un article séparé à la transmission au Gouvernement wallon.",
    correction:"Ajouter un article Tutelle :\n« Article X — Tutelle\nLe présent règlement sera transmis au Gouvernement wallon conformément aux articles L3131-1 et suivants du CDLD dans le cadre de la tutelle spéciale d'approbation. »",
    test: t => /L3131-1|gouvernement\s+wallon|tutelle\s+sp[eé]ciale/i.test(t),
  },
  {
    id:"r-publication", gravite:"erreur",
    label:"Clause de publication (art. L1133-1 et L1133-2 CDLD)",
    explication:"La clause de publication est absente. Sans elle, le règlement n'est pas opposable aux administrés.",
    correction:"Ajouter dans l'article final :\n« Le présent règlement sera publié conformément aux articles L1133-1 et L1133-2 du Code de la démocratie locale et de la décentralisation. »",
    test: t => /L1133-1|L1133-2/i.test(t),
  },
  {
    id:"r-entree-vigueur", gravite:"erreur",
    label:"Clause d'entrée en vigueur explicite",
    explication:"Aucune clause d'entrée en vigueur n'a été trouvée. Sans elle, la date à partir de laquelle le règlement est applicable est indéterminée.",
    correction:"Ajouter dans l'article final :\n« Le présent règlement entre en vigueur après accomplissement des formalités de publication prévues aux articles L1133-1 et L1133-2 du CDLD. »",
    test: t => /entr[eé]e\s+en\s+vigueur/i.test(t),
  },
  {
    id:"r-contrepartie", gravite:"avertissement",
    label:"Justification contrepartie directe (si redevance)",
    explication:"Le règlement qualifie l'acte de redevance mais ne justifie pas la contrepartie directe dans les Considérant. Sans cette justification, la tutelle peut requalifier l'acte en taxe.",
    correction:"Ajouter dans le bloc « Considérant » :\n« Considérant que [le service rendu] entraîne pour la Commune des coûts de traitement directs au profit du bénéficiaire ;\nConsidérant que ces coûts doivent être répercutés sur le(s) bénéficiaire(s) ; »",
    test: function(t) {
      if (!/redevance/i.test(t)) return null;
      return /co[uû]t[s]?\s+(de\s+traitement|engendr[eé]|r[eé]el)|contrepartie|service\s+rendu/i.test(t);
    },
  },
];

function verifier(t) {
  const texte = t
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/`([^`]+)`/g, "$1");
  return REGLES.map(r => {
    let s; try { s = r.test(texte); } catch { s = null; }
    return { ...r, statut: s===true?"ok": s===false?"echec":"manuel" };
  });
}

function buildPrompt(p, refs, mandataires) {
  const bourg = mandataires.find(m => /bourgmestre/i.test(m.detail_fonction));
  const bourgNom = bourg ? `${bourg.detail_civilite||""} ${bourg.detail_prenom||""} ${bourg.detail_nom||""}`.trim() : "[NOM BOURGMESTRE]";
  const dirGen = mandataires.find(m => /directeur|directrice\s+g[eé]n[eé]ral/i.test(m.detail_fonction));
  const dirGenNom = dirGen ? `${dirGen.detail_civilite||""} ${dirGen.detail_prenom||""} ${dirGen.detail_nom||""}`.trim() : "[NOM DIRECTEUR GÉNÉRAL]";
  const catLabel = CATEGORIES.find(c=>c.slug===p.categorie)?.label||"";
  const pf = refs.map(r =>
    `### ${r.titre} (${r.commune}, ${r.annee})\nPoints forts :\n${r.points_forts.map(x=>`- ${x}`).join("\n")}\nExtrait :\n${r.extrait}`
  ).join("\n\n---\n\n");

  return `Tu es un expert en droit communal wallon. Tu travailles pour Vanden Broele.

MISSION : Rédige un ${p.typeReglement==="taxe"?"règlement-taxe":"règlement-redevance"} communal wallon COMPLET et CONFORME.

COMMUNE : ${p.commune||"[COMMUNE]"}${p.ins?` (INS ${p.ins})`:""}${p.province?`, Province de ${p.province}`:""}
Bourgmestre : ${bourgNom}
Directeur(trice) général(e) : ${dirGenNom}
Population : ${p.population?p.population.toLocaleString("fr-BE")+" hab.":"non précisée"}

PARAMÈTRES :
- Catégorie : ${catLabel||"Non précisée"}
- Objet : ${p.objet}
- Type : ${p.typeReglement}
- Exercices : ${p.periodeDebut} à ${p.periodeFin}
- Redevable : ${p.redevable}
- Tarif : ${p.tarif}
- Exonérations : ${p.exonerations||"Aucune"}
- Compléments : ${p.infoCompl||"Aucun"}

RÈGLEMENTS DE RÉFÉRENCE VANDEN BROELE :
${pf.length>0?pf:"(aucune référence — appliquer strictement les exigences légales)"}

EXIGENCES JURIDIQUES IMPÉRATIVES :

VISAS (dans cet ordre) :
1. Vu la Constitution, notamment les articles 41, 162 et 170 §4
2. Vu le décret du 14/12/2000 et la loi du 24/06/2000 (Charte européenne autonomie locale, art. 9.1)
${p.typeReglement==="taxe"?"3. Vu le code des taxes assimilées aux impôts sur les revenus (si applicable)":""}
4. Vu le CDLD, notamment L1122-30${p.typeReglement==="taxe"?" et L3321-1 à L3321-12":""}
5. Vu les dispositions légales en matière d'établissement et de recouvrement des taxes communales
6. Vu la circulaire budgétaire du 30 mai 2024

CONSIDÉRANT :
- Nécessité de ressources propres (mission de service public)
${p.typeReglement==="redevance"?"- Justifier la CONTREPARTIE DIRECTE et les coûts engendrés":""}
- Communication au Directeur financier (L1124-40 §1er, 3° et 4°)
- Avis de légalité du Directeur financier, positif, joint en annexe
- Sur proposition du Collège communal — Après en avoir délibéré

ARTICLES OBLIGATOIRES :
Art. 1  — Objet : exercices ${p.periodeDebut} à ${p.periodeFin}, champ d'application exact
Art. 2  — Redevable et fait générateur
Art. 3  — Montant : ${p.tarif}
Art. 4  — Déclaration : formulaire, 15 jours, obligation spontanée au 31/01
Art. 5  — Taxation d'office (L3321-6 CDLD) : majoration 20%
Art. 6  — Paiement : voie de rôle, 2 mois
Art. 7  — Recouvrement : L3321-1 à L3321-12 CDLD + AR 12/04/1999 + sommation recommandée L3321-8bis
Art. 8  — Réclamation : 6 mois (L3321-9 CDLD — ORDRE PUBLIC), Collège communal, recommandé, sous peine de déchéance
Art. 9  — RGPD : responsable = ${p.commune||"la commune"}, finalité, durée 30 ans
Art. 10 — Tutelle : Gouvernement wallon, L3131-1 et suivants, tutelle spéciale d'approbation
Art. 11 — Publication et entrée en vigueur : L1133-1 et L1133-2 CDLD

FORMAT :
- En-tête : Extrait du registre aux délibérations du CONSEIL COMMUNAL — Séance publique du [DATE SÉANCE]
- Présents : [À COMPLÉTER]
- Blocs Vu / Considérant / Décide à [unanimité/majorité]
- Articles numérotés avec sous-titres
- Pied : Par le Conseil communal — ${dirGenNom} — ${bourgNom}
- Pour extrait conforme délivré le [DATE]

Crochets [XXXXX] pour tout élément à compléter.
Français administratif belge, sobre et précis. Aucun commentaire après le texte.
IMPORTANT : N'utilise AUCUN formatage Markdown. Pas de **, pas de __, pas de #, pas de *. Texte brut uniquement.`;
}

// ─── COMPOSANT AUTOCOMPLETE ───────────────────────────────────────────────────
function CommuneAutocomplete({ value, onChange, onSelect }) {
  const [sugg, setSugg] = useState([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [apiErr, setApiErr] = useState(false);
  const timer = useRef(null);
  const wrap = useRef(null);

  const handleChange = e => {
    const v = e.target.value; onChange(v); setApiErr(false);
    clearTimeout(timer.current);
    if (v.length < 2) { setSugg([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try { const res = await searchCommunes(v); setSugg(res); setOpen(res.length>0); }
      catch { setApiErr(true); setOpen(false); }
      finally { setBusy(false); }
    }, 350);
  };

  useEffect(() => {
    const h = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={wrap} style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <input style={{...iS,paddingRight:32}} placeholder="Commencez à taper le nom de la commune…"
          value={value} onChange={handleChange} onFocus={()=>sugg.length>0&&setOpen(true)} autoComplete="off"/>
        {busy&&<span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:C.gris,fontSize:13}}>⏳</span>}
      </div>
      {apiErr&&<div style={{fontSize:11,color:C.jaune,marginTop:4}}>⚠️ API ODWB inaccessible — saisissez manuellement.</div>}
      {open&&sugg.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:200,
          background:C.blanc,border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.13)",overflow:"hidden"}}>
          {sugg.map((c,i)=>(
            <div key={c.ins} onMouseDown={()=>{onSelect(c);setOpen(false);setSugg([]);}}
              style={{padding:"10px 14px",cursor:"pointer",borderBottom:i<sugg.length-1?`1px solid ${C.border}`:"none",background:C.blanc}}
              onMouseEnter={e=>e.currentTarget.style.background=C.orangeLight}
              onMouseLeave={e=>e.currentTarget.style.background=C.blanc}>
              <div style={{fontWeight:600,color:C.bleu,fontSize:14}}>{c.nom}</div>
              <div style={{fontSize:11,color:C.gris,marginTop:2}}>
                {c.cp&&`CP ${c.cp}`}
                <span style={{marginLeft:8,background:C.bleuLight,color:C.bleu,padding:"1px 6px",borderRadius:8,fontSize:10,fontWeight:700}}>INS {c.ins}</span>
              </div>
            </div>
          ))}
          <div style={{padding:"5px 14px",fontSize:10,color:C.gris,background:C.grisClair,borderTop:`1px solid ${C.border}`}}>
            Source UVCW · ODWB · Licence CC0
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT CARTE MANDATAIRES ──────────────────────────────────────────────
function CarteMandataires({ data, loading, commune }) {
  if (loading) return <div style={{padding:"14px",background:C.bleuLight,borderRadius:8,border:`1px solid ${C.bleu}22`,fontSize:13,color:C.gris,marginTop:12}}>⏳ Chargement des mandataires de {commune}…</div>;
  if (!data||data.length===0) return null;
  const bourg = data.filter(m=>/bourgmestre/i.test(m.detail_fonction));
  const echev = data.filter(m=>/[eé]chevin/i.test(m.detail_fonction));
  const pop = data[0]?.population, coal = data[0]?.coalition;
  const ligne = m=>`${m.detail_civilite||""} ${m.detail_prenom||""} ${m.detail_nom||""}`.trim()+(m.detail_parti?` (${m.detail_parti})`:"");
  return (
    <div style={{marginTop:12,background:C.bleuLight,borderRadius:8,border:`1px solid ${C.bleu}22`,padding:"12px 16px"}}>
      <div style={{fontWeight:700,color:C.bleu,fontSize:13,marginBottom:8}}>
        📋 Mandataires · {commune}
        {pop&&<span style={{marginLeft:10,fontWeight:400,color:C.gris,fontSize:12}}>{pop.toLocaleString("fr-BE")} hab.</span>}
        {coal&&<span style={{marginLeft:10,background:C.blanc,color:C.bleu,padding:"1px 8px",borderRadius:10,fontSize:11,fontWeight:600}}>{coal}</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {bourg.length>0&&(
          <div style={{background:C.blanc,borderRadius:6,padding:"8px 12px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.orange,fontWeight:700,marginBottom:3}}>🏛️ BOURGMESTRE</div>
            {bourg.map((m,i)=><div key={i} style={{fontSize:13,color:C.bleu,fontWeight:600}}>{ligne(m)}</div>)}
          </div>
        )}
        {echev.length>0&&(
          <div style={{background:C.blanc,borderRadius:6,padding:"8px 12px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.gris,fontWeight:700,marginBottom:3}}>ÉCHEVINS ({echev.length})</div>
            {echev.slice(0,3).map((m,i)=>(
              <div key={i} style={{fontSize:12,color:C.bleu}}>
                {ligne(m)}{m.attribution?.length>0&&<span style={{fontSize:10,color:C.gris,marginLeft:4}}>— {m.attribution.slice(0,2).join(", ")}{m.attribution.length>2?"…":""}</span>}
              </div>
            ))}
            {echev.length>3&&<div style={{fontSize:11,color:C.gris}}>+{echev.length-3} autres</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPOSANT RÉSULTAT DE RÈGLE ──────────────────────────────────────────────
function RegleResultat({ r, i, coulGrav }) {
  const [ouvert, setOuvert] = useState(false);
  const estEchec = r.statut === "echec";
  const grav = r.gravite;
  const couleur = r.statut==="ok" ? C.vert : coulGrav[grav];
  const bg = r.statut==="echec" ? (grav==="erreur" ? C.rougeClair+"33" : C.jauneClair+"55") : i%2===0 ? C.blanc : "#FAFAFA";

  return (
    <div style={{borderBottom:`1px solid ${C.border}`, background:bg}}>
      <div style={{padding:"12px 18px",display:"flex",alignItems:"center",gap:10,
        cursor: estEchec && r.correction ? "pointer" : "default"}}
        onClick={()=>{ if (estEchec && r.correction) setOuvert(o=>!o); }}>
        <span>{r.statut==="ok"?"✅":r.statut==="echec"?(grav==="erreur"?"❌":"⚠️"):"👁️"}</span>
        <span style={{fontWeight:600,fontSize:13,color:couleur,flex:1}}>{r.label}</span>
        {estEchec && r.correction && (
          <span style={{fontSize:11,color:couleur,opacity:.7}}>{ouvert?"▲":"▼"}</span>
        )}
        <span style={{fontSize:11,fontWeight:700,color:couleur,background:couleur+"18",
          padding:"2px 10px",borderRadius:20,whiteSpace:"nowrap"}}>
          {r.statut==="ok"?"Conforme":r.statut==="echec"?(grav==="erreur"?"ERREUR":"Attention"):"À vérifier"}
        </span>
      </div>

      {/* Explication (toujours visible si échec) */}
      {r.statut!=="ok" && (
        <div style={{fontSize:12,color:C.gris,paddingLeft:40,paddingRight:18,paddingBottom:ouvert?0:10,lineHeight:1.5}}>
          {r.explication}
        </div>
      )}

      {/* Correction dépliable */}
      {estEchec && r.correction && ouvert && (
        <div style={{margin:"8px 18px 12px 40px",background:grav==="erreur"?C.rougeClair:C.jauneClair,
          border:`1px solid ${couleur}33`,borderRadius:6,padding:"10px 14px"}}>
          <div style={{fontSize:11,fontWeight:700,color:couleur,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>
            ✏️ Correction suggérée
          </div>
          <pre style={{margin:0,fontSize:12,color:C.bleu,whiteSpace:"pre-wrap",fontFamily:"'Segoe UI',Arial,sans-serif",lineHeight:1.6}}>
            {r.correction}
          </pre>
          <button onClick={()=>navigator.clipboard.writeText(r.correction)}
            style={{marginTop:8,background:C.blanc,border:`1px solid ${couleur}44`,borderRadius:5,
              padding:"4px 12px",fontSize:11,color:couleur,cursor:"pointer",fontWeight:600}}>
            📋 Copier
          </button>
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function App() {
  const [onglet, setOnglet] = useState("generer");
  const [params, setParams] = useState({
    commune:"", ins:"", cp:"", province:"", arrondissement:"", population:null,
    nomCourt:"", adresse:"", emailGeneral:"", telephone:"",
    typeReglement:"taxe", categorie:"", objet:"",
    periodeDebut: String(new Date().getFullYear()+1),
    periodeFin:   String(new Date().getFullYear()+6),
    redevable:"", tarif:"", exonerations:"", infoCompl:"",
  });
  const [mandataires, setMandataires] = useState([]);
  const [mandLoading, setMandLoading] = useState(false);
  const [texteGenere, setTexteGenere] = useState("");
  const [texteVerif, setTexteVerif] = useState("");
  const [resultatsVerif, setResultatsVerif] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [etape, setEtape] = useState("formulaire");
  const streamRef = useRef("");

  const upd = (k,v) => setParams(p=>({...p,[k]:v}));

  const pickCommune = async c => {
    setParams(p=>({...p, commune:c.nom, ins:c.ins||"", cp:c.cp||"",
      province:"", arrondissement:"", nomCourt:c.nom_court||"",
      adresse:c.adresse||"", emailGeneral:c.email_general||"", telephone:c.telephone||"", population:null}));
    setMandataires([]);
    if (!c.ins) return;
    setMandLoading(true);
    try {
      const m = await getMandataires(c.ins);
      setMandataires(m);
      const first = m[0];
      if (first) setParams(p=>({...p, population:first.population||null, province:first.province||"", arrondissement:first.arrondissement||""}));
    } catch {}
    finally { setMandLoading(false); }
  };

  const generer = useCallback(async () => {
    if (!params.objet||!params.redevable||!params.tarif) { setErreur("Champs requis : objet, redevable et tarif."); return; }
    setErreur(""); setLoading(true); setTexteGenere(""); streamRef.current=""; setEtape("generation");
    const refs = trouverRefs(params.objet, params.typeReglement, params.categorie);
    try {
      const res = await fetch(`${WORKER_URL}/anthropic/v1/messages`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:4000, stream:true,
          messages:[{role:"user", content:buildPrompt(params,refs,mandataires)}]}),
      });
      if (!res.ok) { const e=await res.text(); throw new Error(`API ${res.status} : ${e}`); }
      const reader=res.body.getReader(), dec=new TextDecoder();
      while(true){
        const {done,value}=await reader.read(); if(done) break;
        for(const line of dec.decode(value,{stream:true}).split("\n")){
          if(!line.startsWith("data: ")) continue;
          const d=line.slice(6).trim(); if(d==="[DONE]") break;
          try{ const delta=JSON.parse(d)?.delta?.text||""; if(delta){streamRef.current+=delta; setTexteGenere(streamRef.current);} }catch{}
        }
      }
      setEtape("resultat");
    } catch(e){ setErreur(`Erreur : ${e.message}`); setEtape("formulaire"); }
    finally{ setLoading(false); }
  }, [params, mandataires]);

  const lancerVerif = () => {
    if (!texteVerif.trim()) { setErreur("Collez un texte à analyser."); return; }
    setErreur(""); setResultatsVerif(verifier(texteVerif));
  };

  const stats = resultatsVerif ? {
    ok:   resultatsVerif.filter(r=>r.statut==="ok").length,
    err:  resultatsVerif.filter(r=>r.statut==="echec"&&r.gravite==="erreur").length,
    warn: resultatsVerif.filter(r=>r.statut==="echec"&&r.gravite==="avertissement").length,
    man:  resultatsVerif.filter(r=>r.statut==="manuel").length,
  } : null;

  const coulGrav = {erreur:C.rouge, avertissement:C.jaune, info:C.bleu};
  const labelGrav = {erreur:"❌ Erreurs bloquantes", avertissement:"⚠️ Avertissements", info:"ℹ️ Bonnes pratiques"};
  const nbRefs = SOURCE.filter(r=>r.type===params.typeReglement&&(!params.categorie||r.categorie===params.categorie)&&r.qualite!=="insuffisante").length;

  return (
    <div style={{fontFamily:"'Segoe UI',Arial,sans-serif",background:C.grisClair,minHeight:"100vh"}}>

      <div style={{background:C.bleu,color:C.blanc,padding:"14px 24px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{background:C.orange,borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:18}}>VB</div>
        <div>
          <div style={{fontWeight:700,fontSize:16}}>Assistant Règlements — OrangeConnect</div>
          <div style={{fontSize:12,opacity:.75}}>Taxes et redevances wallonnes · v5 · {SOURCE.length} règlements</div>
        </div>
      </div>

      <div style={{background:C.blanc,borderBottom:`2px solid ${C.border}`,display:"flex",padding:"0 24px"}}>
        {[["generer","✏️ Rédiger"],["verifier","✅ Vérifier"]].map(([k,l])=>(
          <button key={k} onClick={()=>{setOnglet(k);setErreur("");}}
            style={{padding:"12px 20px",border:"none",background:"none",cursor:"pointer",fontWeight:600,fontSize:14,
              color:onglet===k?C.orange:C.gris,borderBottom:onglet===k?`3px solid ${C.orange}`:"3px solid transparent",marginBottom:-2}}>
            {l}
          </button>
        ))}
      </div>

      <div style={{padding:24,maxWidth:900,margin:"0 auto"}}>

        {/* ══ ONGLET RÉDIGER ══ */}
        {onglet==="generer" && (
          <>
            <div style={{background:C.blanc,borderRadius:10,border:`1px solid ${C.border}`,padding:24,marginBottom:20}}>
              <h3 style={{color:C.bleu,marginTop:0,fontSize:16,marginBottom:16}}>Paramètres du règlement</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

                <div style={{gridColumn:"1/-1"}}>
                  <label style={lS}>Commune <span style={{color:C.rouge}}>*</span></label>
                  <CommuneAutocomplete value={params.commune} onChange={v=>upd("commune",v)} onSelect={pickCommune}/>
                  {(params.ins||params.province)&&(
                    <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                      {params.ins&&<span style={{background:C.bleuLight,color:C.bleu,padding:"2px 10px",borderRadius:10,fontSize:11,fontWeight:700}}>INS {params.ins}</span>}
                      {params.cp&&<span style={{background:C.grisClair,color:C.gris,padding:"2px 10px",borderRadius:10,fontSize:11}}>CP {params.cp}</span>}
                      {params.arrondissement&&<span style={{background:C.grisClair,color:C.gris,padding:"2px 10px",borderRadius:10,fontSize:11}}>{params.arrondissement}</span>}
                      {params.province&&<span style={{background:C.grisClair,color:C.gris,padding:"2px 10px",borderRadius:10,fontSize:11}}>Prov. {params.province}</span>}
                    </div>
                  )}
                  <CarteMandataires data={mandataires} loading={mandLoading} commune={params.commune}/>
                </div>

                <div style={{gridColumn:"1/-1"}}>
                  <label style={lS}>Catégorie <span style={{color:C.rouge}}>*</span></label>
                  <select style={iS} value={params.categorie} onChange={e=>upd("categorie",e.target.value)}>
                    <option value="">— Sélectionner une catégorie —</option>
                    {CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                  {params.categorie&&<div style={{marginTop:5,fontSize:11,color:C.gris}}>📚 {nbRefs} règlement(s) de référence disponible(s)</div>}
                </div>

                <div>
                  <label style={lS}>Type d'acte</label>
                  <select style={iS} value={params.typeReglement} onChange={e=>upd("typeReglement",e.target.value)}>
                    <option value="taxe">Règlement-taxe (prélèvement unilatéral)</option>
                    <option value="redevance">Règlement-redevance (contrepartie directe)</option>
                  </select>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1}}><label style={lS}>Exercice début</label><input style={iS} value={params.periodeDebut} onChange={e=>upd("periodeDebut",e.target.value)}/></div>
                  <div style={{flex:1}}><label style={lS}>Exercice fin</label><input style={iS} value={params.periodeFin} onChange={e=>upd("periodeFin",e.target.value)}/></div>
                </div>

                <div style={{gridColumn:"1/-1"}}>
                  <label style={lS}>Objet du règlement <span style={{color:C.rouge}}>*</span></label>
                  <input style={iS} placeholder="ex. : délivrance de documents administratifs, occupation du domaine public…" value={params.objet} onChange={e=>upd("objet",e.target.value)}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={lS}>Redevable (qui paie ?) <span style={{color:C.rouge}}>*</span></label>
                  <input style={iS} placeholder="ex. : toute personne physique ou morale qui sollicite la délivrance d'un acte" value={params.redevable} onChange={e=>upd("redevable",e.target.value)}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={lS}>Tarif / montant <span style={{color:C.rouge}}>*</span></label>
                  <input style={iS} placeholder="ex. : 5 € par acte" value={params.tarif} onChange={e=>upd("tarif",e.target.value)}/>
                </div>
                <div>
                  <label style={lS}>Exonérations</label>
                  <input style={iS} placeholder="ex. : actes délivrés aux services publics…" value={params.exonerations} onChange={e=>upd("exonerations",e.target.value)}/>
                </div>
                <div>
                  <label style={lS}>Informations complémentaires</label>
                  <input style={iS} placeholder="particularités locales…" value={params.infoCompl} onChange={e=>upd("infoCompl",e.target.value)}/>
                </div>
              </div>

              {erreur&&<div style={{marginTop:12,padding:"10px 14px",background:C.rougeClair,border:`1px solid ${C.rouge}`,borderRadius:6,color:C.rouge,fontSize:13}}>{erreur}</div>}

              <div style={{marginTop:20,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                <button onClick={generer} disabled={loading}
                  style={{background:loading?C.gris:C.orange,color:C.blanc,border:"none",borderRadius:8,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:loading?"not-allowed":"pointer"}}>
                  {loading?"⏳ Génération…":"✏️ Générer le règlement"}
                </button>
                <span style={{fontSize:12,color:C.gris}}>⚠️ Validation juriste obligatoire avant adoption.</span>
              </div>
            </div>

            {texteGenere&&(
              <div style={{background:C.blanc,borderRadius:10,border:`1px solid ${C.border}`,padding:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                  <h3 style={{color:C.bleu,margin:0,fontSize:16}}>📄 Règlement généré</h3>
                  <div style={{display:"flex",gap:8}}>
                    {etape==="resultat"&&<button onClick={()=>{setTexteVerif(texteGenere);setOnglet("verifier");setResultatsVerif(null);}} style={{background:C.bleuLight,color:C.bleu,border:`1px solid ${C.bleu}`,borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>✅ Vérifier</button>}
                    <button onClick={()=>navigator.clipboard.writeText(texteGenere)} style={{background:C.grisClair,color:C.gris,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>📋 Copier</button>
                  </div>
                </div>
                <pre style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:13,lineHeight:1.7,background:"#FAFAFA",padding:20,borderRadius:6,border:`1px solid ${C.border}`,maxHeight:520,overflowY:"auto"}}>
                  {texteGenere}{loading&&<span style={{color:C.orange}}>▌</span>}
                </pre>
                {etape==="resultat"&&<div style={{marginTop:12,padding:"10px 14px",background:C.jauneClair,border:`1px solid ${C.jaune}`,borderRadius:6,fontSize:12,color:C.jaune}}>⚠️ <strong>Rappel :</strong> Aide à la rédaction uniquement. Validation obligatoire par un juriste avant adoption.</div>}
              </div>
            )}
          </>
        )}

        {/* ══ ONGLET VÉRIFIER ══ */}
        {onglet==="verifier"&&(
          <>
            <div style={{background:C.blanc,borderRadius:10,border:`1px solid ${C.border}`,padding:24,marginBottom:20}}>
              <h3 style={{color:C.bleu,marginTop:0,fontSize:16}}>Vérification de conformité ({REGLES.length} règles)</h3>
              <p style={{color:C.gris,fontSize:13,marginTop:0}}>Collez le texte complet d'un règlement-taxe ou redevance wallon. Cliquez sur une erreur pour voir la correction suggérée.</p>
              <textarea style={{...iS,height:220,resize:"vertical",fontFamily:"Georgia,serif",fontSize:13,lineHeight:1.6}}
                placeholder="Collez ici le texte complet du règlement à analyser…" value={texteVerif} onChange={e=>setTexteVerif(e.target.value)}/>
              {erreur&&<div style={{marginTop:8,padding:"10px 14px",background:C.rougeClair,border:`1px solid ${C.rouge}`,borderRadius:6,color:C.rouge,fontSize:13}}>{erreur}</div>}
              <button onClick={lancerVerif} style={{marginTop:14,background:C.bleu,color:C.blanc,border:"none",borderRadius:8,padding:"11px 26px",fontWeight:700,fontSize:14,cursor:"pointer"}}>✅ Analyser</button>
            </div>

            {resultatsVerif&&stats&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
                  {[
                    {l:"Conformes",         v:stats.ok,   bg:C.vertClair,  c:C.vert,  ic:"✅"},
                    {l:"Erreurs bloquantes",v:stats.err,  bg:C.rougeClair, c:C.rouge, ic:"❌"},
                    {l:"Avertissements",    v:stats.warn, bg:C.jauneClair, c:C.jaune, ic:"⚠️"},
                    {l:"Vérif. manuelle",   v:stats.man,  bg:C.bleuLight,  c:C.bleu,  ic:"👁️"},
                  ].map(({l,v,bg,c,ic})=>(
                    <div key={l} style={{background:bg,border:`1px solid ${c}22`,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
                      <div style={{fontSize:28,fontWeight:800,color:c}}>{v}</div>
                      <div style={{fontSize:12,color:c,fontWeight:600}}>{ic} {l}</div>
                    </div>
                  ))}
                </div>

                <div style={{background:C.blanc,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                  {["erreur","avertissement","info"].map(grav=>{
                    const grp = resultatsVerif.filter(r=>r.gravite===grav);
                    if (!grp.length) return null;
                    const nbEchecs = grp.filter(r=>r.statut==="echec").length;
                    return (
                      <div key={grav}>
                        <div style={{padding:"10px 18px",background:coulGrav[grav]+"18",fontWeight:700,fontSize:13,color:coulGrav[grav],borderBottom:`1px solid ${C.border}`}}>
                          {labelGrav[grav]} ({nbEchecs} sur {grp.length})
                        </div>
                        {grp.map((r,i)=>(
                          <RegleResultat key={r.id} r={r} i={i} coulGrav={coulGrav}/>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div style={{marginTop:14,padding:"10px 14px",background:C.jauneClair,border:`1px solid ${C.jaune}`,borderRadius:6,fontSize:12,color:C.jaune}}>
                  ⚠️ Vérification automatique — ne remplace pas l'examen d'un juriste. Cliquez sur ❌ ou ⚠️ pour voir la correction suggérée.
                </div>
              </>
            )}
          </>
        )}

        <div style={{marginTop:24,background:C.bleuLight,borderRadius:10,border:`1px solid ${C.bleu}22`,padding:18}}>
          <div style={{fontSize:11,color:C.gris}}>
            Données : <a href="https://www.odwb.be" target="_blank" rel="noreferrer" style={{color:C.bleu}}>odwb.be</a> · Licence CC0
          </div>
        </div>

      </div>
    </div>
  );
}

const iS={width:"100%",boxSizing:"border-box",padding:"9px 12px",border:"1px solid #D1D5DB",borderRadius:6,fontSize:13,fontFamily:"'Segoe UI',Arial,sans-serif",color:"#1A3A5C",outline:"none",background:"#FAFAFA"};
const lS={display:"block",fontWeight:600,fontSize:12,color:"#1A3A5C",marginBottom:5};
