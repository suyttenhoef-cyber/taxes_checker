export const REGLES = [
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
    test: t => /art\.?\s*162\b|articles?\s[^;.]{0,30}\b162\b/i.test(t),
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
    correction:"Ajouter un article avec le montant explicite :\n« Article X — Montant\nLe montant de la taxe/redevance est fixé à [MONTANT] euros par [unité]. »\n⚠️ Le tarif ne peut PAS être délégué au Collège communal (art. 170 §4 Constitution).",
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
    correction:"Corriger le délai de réclamation :\n« …dans un délai de 6 mois à dater de l'envoi de la formule d'imposition… »\n⚠️ Ce délai est d'ordre public : il ne peut PAS être inférieur à 6 mois.",
    test: function(t) {
      if (!/r[eé]clamation/i.test(t)) return null;
      const idx = t.search(/r[eé]clamation/i);
      const ctx = t.slice(Math.max(0, idx - 100), idx + 500);
      return /6\s*mois|six\s*mois/i.test(ctx);
    },
  },
  {
    id:"r-recl-college", gravite:"erreur",
    label:"Réclamation adressée au Collège communal",
    explication:"La réclamation n'est pas adressée au Collège communal. En vertu de l'art. L3321-9 CDLD, seul le Collège est compétent — toute autre désignation invalide la clause.",
    correction:"Corriger le destinataire :\n« …par lettre recommandée adressée au Collège communal… »\n⚠️ Pas au Conseil communal ni au Directeur général.",
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
