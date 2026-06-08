import { CATEGORIES } from '../data/categories.js';
import { NOTES_SOUS_CAT } from '../data/notes.js';
import { MODELES_ARTICLES, TYPES_REGLEMENT } from '../data/legalKnowledge.js';

export function buildSystemPrompt(dateSeance, listePresents, listeAbsents, nomDG, nomBourg) {
  const dateStr  = dateSeance
    ? new Date(dateSeance).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    : '[DATE DE LA SÉANCE]';
  const presStr  = listePresents || '[LISTE DES CONSEILLERS PRÉSENTS]';
  const absStr   = listeAbsents  || 'Néant';
  const dgStr    = nomDG   || '[NOM ET SIGNATURE DG]';
  const bourgStr = nomBourg || '[NOM ET SIGNATURE BOURGMESTRE]';

  return `Tu es un expert en droit communal wallon travaillant pour Vanden Broele.
Tu rédiges des règlements communaux wallons complets et conformes à la législation wallonne.

RÈGLES DE FORME ABSOLUES :
- Aucun formatage Markdown (pas de **, ##, *, _, ---)
- Texte brut uniquement, français administratif belge sobre et précis
- Crochets [XXXXX] uniquement pour les éléments qui restent à compléter par la commune (vote, date de publication…)
- Aucun commentaire ni explication après le texte du règlement

STRUCTURE OBLIGATOIRE — respecte exactement ce squelette, section par section :

EXTRAIT DU REGISTRE AUX DÉLIBÉRATIONS DU CONSEIL COMMUNAL
Séance publique du ${dateStr}

Présents : ${presStr}
Absent(s) excusé(s) : ${absStr}

OBJET : [INTITULÉ COMPLET DU RÈGLEMENT]


VU [première référence légale]
VU [référence suivante]
[continuer tous les visas requis, un par ligne, en commençant chaque ligne par VU]

CONSIDÉRANT [premier élément de motivation]
CONSIDÉRANT [élément suivant]
[continuer tous les considérants requis, un par ligne, en commençant chaque ligne par CONSIDÉRANT]

Sur proposition du Collège communal,
Après en avoir délibéré,

DÉCIDE, à [unanimité / majorité de X voix contre X],

Article 1er — [INTITULÉ]
[Texte complet de l'article]

Article 2 — [INTITULÉ]
[Texte complet de l'article]

[... continuer pour tous les articles requis ...]


Par le Conseil communal,

Le(La) Directeur(trice) général(e),          Le(La) Bourgmestre,

${dgStr}                         ${bourgStr}


Pour extrait conforme délivré le [DATE]`;
}

export function buildMessages(p, refs, mandataires, presences, profil) {
  const nomM = m => `${m.detail_civilite || ''} ${m.detail_prenom || ''} ${m.detail_nom || ''}`.trim();
  const bourg    = mandataires.find(m => /bourgmestre/i.test(m.detail_fonction));
  const bourgNom = bourg ? nomM(bourg) : '[NOM BOURGMESTRE]';
  const dirGen   = mandataires.find(m => /directeur\s*(trice)?\s*g[eé]n[eé]ral/i.test(m.detail_fonction));
  const dirGenNom = dirGen ? nomM(dirGen) : (profil?.nomDG || '[NOM DIRECTEUR GÉNÉRAL]');

  const conseil      = mandataires.filter(m => !/directeur|directrice/i.test(m.detail_fonction));
  const listePresents = conseil.filter((_, i) => presences[i] !== false).map(nomM).join(', ');
  const listeAbsents  = conseil.filter((_, i) => presences[i] === false).map(nomM).join(', ') || null;

  const considRedevance = p.typeReglement === 'redevance'
    ? `- La redevance constitue la contrepartie directe ${
        p.sousTypeRedevance === 'autorisation'
          ? `de l'avantage particulier que représente l'occupation du domaine public communal pour ${p.objet || "l'activité concernée"}, les frais de gestion, de contrôle et d'entretien du domaine étant couverts par le tarif de ${p.tarif}`
          : `du service rendu par la commune consistant en ${p.objet || "l'activité concernée"}, les coûts directs de ce service étant répercutés sur le bénéficiaire à hauteur du tarif de ${p.tarif}`
      }`
    : '';

  const catLabel     = CATEGORIES.find(c => c.slug === p.categorie)?.label || '';
  const sousCatObj   = CATEGORIES.flatMap(c => c.sous || []).find(s => s.slug === p.sousCat);
  const sousCatLabel = sousCatObj?.label || '';
  const notesSousCat = NOTES_SOUS_CAT[p.sousCat] || '';
  const pf = refs.map(r =>
    `${r.titre} (${r.commune}, ${r.annee})\nPoints forts :\n${r.points_forts.map(x => `- ${x}`).join('\n')}\nExtrait :\n${r.extrait}`
  ).join('\n\n---\n\n');

  const userContent =
`MISSION : Rédige un ${p.typeReglement === 'taxe' ? 'règlement-taxe' : 'règlement-redevance'} communal wallon.

COMMUNE : ${p.commune || '[COMMUNE]'}${p.ins ? ` (INS ${p.ins})` : ''}${p.province ? `, Province de ${p.province}` : ''}
Bourgmestre : ${bourgNom}
Directeur(trice) général(e) : ${dirGenNom}
Population : ${p.population ? p.population.toLocaleString('fr-BE') + ' hab.' : 'non précisée'}

PARAMÈTRES DU RÈGLEMENT :
- Catégorie : ${catLabel || 'Non précisée'}${sousCatLabel ? ' — ' + sousCatLabel : ''}
- Objet : ${p.objet}
- Type : ${p.typeReglement}${p.typeReglement === 'redevance' ? ' (' + (p.sousTypeRedevance === 'autorisation' ? "autorisation d'occupation du domaine public" : 'service rendu / usage') + ')' : ''}
- Exercices : ${p.periodeDebut} à ${p.periodeFin}
- Redevable : ${p.redevable}
- Tarif : ${p.tarif}
- Exonérations : ${p.exonerations || 'Aucune'}
- Compléments : ${p.infoCompl || 'Aucun'}
${notesSousCat ? `\nEXIGENCES JURIDIQUES SPÉCIFIQUES À CETTE SOUS-CATÉGORIE :\n${notesSousCat}` : ''}


VISAS OBLIGATOIRES (dans cet ordre — pratique SPW Intérieur / wallex.wallonie.be) :
1. Vu la Constitution, notamment les articles 41, 162 et 170 §4${p.typeReglement === 'redevance' ? ' et 173' : ''}
2. Vu le Code de la démocratie locale et de la décentralisation (CDLD), notamment les articles L1122-30${p.typeReglement === 'taxe' ? ', L3321-1 à L3321-12' : ' et L1124-40'}
3. Vu la loi du 24 décembre 1996 relative à l'établissement et au recouvrement des taxes provinciales et communales${p.typeReglement === 'taxe' ? '\n4. Vu le code des taxes assimilées aux impôts sur les revenus (CTAIR)' : ''}
${p.typeReglement === 'taxe' ? '5.' : '4.'} Vu la circulaire budgétaire du 30 mai 2024
${p.typeReglement === 'taxe' ? '6.' : '5.'} Vu l'avis de légalité du Directeur financier, positif, joint en annexe
Note : le décret du 14/12/2000 est intégré dans le CDLD — ne pas le viser séparément

CONSIDÉRANTS OBLIGATOIRES :
- Nécessité de disposer de ressources propres pour financer les missions de service public
${considRedevance}
- Le Directeur financier a été informé conformément à l'article L1124-40 §1er, 3° et 4° du CDLD
- Sur proposition du Collège communal

ARTICLES OBLIGATOIRES :
Art. 1er — Objet et exercices (${p.periodeDebut}–${p.periodeFin}) : définir précisément le champ d'application
Art. 2   — Redevable et fait générateur
Art. 3   — Montant (${p.tarif})${p.exonerations ? ' avec les exonérations suivantes : ' + p.exonerations : ''}
${p.typeReglement === 'redevance' && p.sousTypeRedevance === 'autorisation'
  ? `Art. 4   — Autorisation préalable : le redevable introduit une demande d'autorisation auprès du Collège communal avant toute occupation ; la redevance est calculée sur la durée accordée et notifiée avec la décision d'autorisation
Art. 5   — Occupation sans autorisation : en cas d'occupation sans autorisation préalable, une redevance majorée de 100 % est réclamée, sans préjudice des mesures de police administrative et de la mise en demeure de libérer le domaine public (L2213-1 et suiv. CDLD)`
  : `Art. 4   — Déclaration : formulaire communal, délai 15 jours${p.typeReglement === 'redevance' ? ' suivant la naissance du fait générateur' : ', obligation spontanée au 31 janvier'}
Art. 5   — ${p.typeReglement === 'redevance' ? "Défaut de déclaration : redevance établie d'office par le Collège sur base des éléments en sa possession, avec frais de procédure à charge du redevable" : "Taxation d'office en cas de défaut (L3321-6 CDLD) : majoration de 20 %"}`}
${p.typeReglement === 'redevance'
  ? "Art. 6   — Mode de perception et exigibilité : redevance exigible dès l'obtention de l'autorisation, payable au comptant à la caisse communale contre reçu ; à défaut, payable dans les 30 jours suivant la réception de l'invitation à payer, intérêts légaux de plein droit"
  : "Art. 6   — Paiement par voie de rôle, délai 2 mois à compter de l'envoi de l'avertissement-extrait de rôle"}
Art. 7   — Recouvrement${p.typeReglement === 'redevance' ? ' par voie de contrainte (L1124-40 §1er CDLD), mise en demeure recommandée préalable, frais à charge du débiteur' : ' (L3321-1 à L3321-12 CDLD, AR 12/04/1999) avec sommation recommandée (L3321-8bis)'}
Art. 8   — Réclamation dans le délai d'UN AN à dater du 3ème jour ouvrable suivant l'envoi de l'avertissement-extrait de rôle (L3321-9 CDLD — loi 20/12/2022), par écrit au Collège communal, sous peine de déchéance${p.typeReglement === 'redevance' ? ' ; délai de 6 mois pour statuer, recours TPI si absence de décision dans ce délai' : ' ; recours TPI possible si absence de décision du Collège dans les 6 mois (9 mois pour taxation d\'office)'}
Art. 9   — Protection des données (RGPD) : responsable = ${p.commune || 'la commune'}, finalité fiscale, conservation 30 ans
Art. 10  — Tutelle : Gouvernement wallon, L3131-1 et suivants, tutelle spéciale d'approbation
Art. 11  — Publication et entrée en vigueur (L1133-1 et L1133-2 CDLD)

RÈGLEMENTS DE RÉFÉRENCE VANDEN BROELE :
${pf.length > 0 ? pf : '(aucune référence disponible — appliquer strictement les exigences légales ci-dessus)'}

BASE JURIDIQUE DE RÉFÉRENCE — RÈGLES IMPÉRATIVES (source exclusive) :
${TYPES_REGLEMENT}

FORMULATIONS TYPES OFFICIELLES :
${MODELES_ARTICLES}`;

  return [
    { role: 'system', content: buildSystemPrompt(p.dateSeance, listePresents, listeAbsents, dirGenNom, bourgNom) },
    { role: 'user',   content: userContent },
  ];
}
