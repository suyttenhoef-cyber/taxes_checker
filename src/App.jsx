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
  // ── Additionnels ──────────────────────────────────────────────────────────
  { slug:"impots", label:"Centimes additionnels", sous:[
    { slug:"add-ipp",         label:"Additionnels à l'impôt des personnes physiques (IPP)" },
    { slug:"add-pi",          label:"Additionnels au précompte immobilier" },
    { slug:"add-circulation", label:"Décime additionnel à la taxe de circulation" },
  ]},
  // ── Actes administratifs ──────────────────────────────────────────────────
  { slug:"actes-administratifs", label:"Actes administratifs et état civil", sous:[
    { slug:"actes-documents",   label:"Délivrance de documents administratifs et état civil" },
    { slug:"actes-nom-prenom",  label:"Changement de nom et/ou de prénom" },
    { slug:"actes-mariage",     label:"Constitution de dossiers de mariage et nationalité" },
    { slug:"actes-passeport",   label:"Passeports, cartes d'identité et titres de séjour" },
    { slug:"actes-legalisation",label:"Légalisations de signatures et apostilles" },
  ]},
  // ── Urbanisme ─────────────────────────────────────────────────────────────
  { slug:"urbanisme-permis", label:"Urbanisme, permis et environnement", sous:[
    { slug:"urb-permis-urba",  label:"Permis d'urbanisme et certificats d'urbanisme" },
    { slug:"urb-permis-urban", label:"Permis d'urbanisation (constructions groupées)" },
    { slug:"urb-permis-envir", label:"Permis d'environnement (classe 3)" },
    { slug:"urb-implantation", label:"Vérification des implantations et procès-verbaux" },
    { slug:"urb-rens-urba",    label:"Renseignements urbanistiques et copies de plans" },
  ]},
  // ── Domaine public ────────────────────────────────────────────────────────
  { slug:"domaine-public", label:"Domaine public et voirie", sous:[
    { slug:"domaine-terrasses", label:"Terrasses horeca sur voirie" },
    { slug:"domaine-chantiers", label:"Chantiers et installations temporaires" },
    { slug:"domaine-enseignes", label:"Enseignes saillantes et présentoirs" },
    { slug:"domaine-etalages",  label:"Étalages et marchands ambulants" },
    { slug:"domaine-depots",    label:"Dépôts et encombrants sur voirie" },
    { slug:"domaine-comm",      label:"Occupation à des fins commerciales ou publicitaires" },
    { slug:"domaine-affiches",  label:"Enlèvement d'affiches apposées en lieux non autorisés" },
    { slug:"domaine-versages",  label:"Enlèvement des versages sauvages" },
  ]},
  // ── Marchés et foires ─────────────────────────────────────────────────────
  { slug:"marches-foires", label:"Marchés, foires et kermesses", sous:[
    { slug:"marche-hebdo",    label:"Marchés hebdomadaires et marchés bio" },
    { slug:"marche-foire",    label:"Foires saisonnières et marchés spéciaux" },
    { slug:"marche-kermesse", label:"Kermesses, braderies et fêtes foraines" },
    { slug:"marche-fleurs",   label:"Vente de fleurs et droits de place spéciaux" },
  ]},
  // ── Mobilité ──────────────────────────────────────────────────────────────
  { slug:"mobilite", label:"Mobilité et stationnement", sous:[
    { slug:"mob-zone-bleue",     label:"Stationnement zones bleues et horodateurs" },
    { slug:"mob-parking-comm",   label:"Parking communal payant / carte de riverain" },
    { slug:"mob-parking-priv",   label:"Exploitation de parkings privés payants ouverts au public" },
    { slug:"mob-absence-parc",   label:"Absence d'emplacement de parcage (obligation légale)" },
    { slug:"mob-veh-abandonnes", label:"Véhicules abandonnés et dépôts de mitraille" },
    { slug:"mob-taxis",          label:"Exploitation d'un service de taxis" },
    { slug:"mob-force-motrice",  label:"Force motrice (utilisation de la voirie publique)" },
    { slug:"mob-boxes-velos",    label:"Boxes à vélos et stationnement cycles" },
    { slug:"mob-veh-electr",     label:"Recharge véhicules électriques à borne communale" },
  ]},
  // ── Immobilier ────────────────────────────────────────────────────────────
  { slug:"immobilier", label:"Immobilier et logement", sous:[
    { slug:"immo-inoccupe",          label:"Logements inoccupés / abandonnés (Décr. 06/02/2014)" },
    { slug:"immo-non-bati",          label:"Terrains non bâtis et parcelles en zone urbanisée" },
    { slug:"immo-seconde-residence", label:"Secondes résidences et résidences de tourisme" },
    { slug:"immo-loues-meubles",     label:"Logements loués meublés" },
    { slug:"immo-surfaces-comm",     label:"Surfaces commerciales et implantations commerciales" },
    { slug:"immo-surfaces-bureaux",  label:"Surfaces de bureaux" },
    { slug:"immo-piscines-priv",     label:"Piscines privées" },
  ]},
  // ── Commerce et économie ──────────────────────────────────────────────────
  { slug:"commerce-economie", label:"Commerce et activités économiques", sous:[
    { slug:"com-horeca-nuit",     label:"Établissements ouverts la nuit (bars tardifs, discothèques)" },
    { slug:"com-debits-boissons", label:"Débits de boissons fermentées et assimilés" },
    { slug:"com-dancings",        label:"Dancings, clubs privés et bals publics" },
    { slug:"com-spectacles",      label:"Spectacles, cinéma, divertissements et agences de paris" },
    { slug:"com-night-shops",     label:"Night-shops, phone shops et commerces à horaires décalés" },
    { slug:"com-cannabis",        label:"Cannabis shops et commerces assimilés" },
    { slug:"com-frites",          label:"Commerces de frites et produits comparables" },
    { slug:"com-guichets",        label:"Établissements bancaires et guichets automatiques (ATM)" },
    { slug:"com-distributeurs",   label:"Distributeurs automatiques (boissons, tabac, services)" },
    { slug:"com-antennes",        label:"Antennes, pylônes et infrastructures télécom / 5G" },
    { slug:"com-taxis",           label:"Exploitation d'un service de taxis" },
    { slug:"com-etabl-danger",    label:"Établissements dangereux, insalubres et incommodes (cl. 1-2)" },
  ]},
  // ── Publicité ─────────────────────────────────────────────────────────────
  { slug:"publicite-ecrits", label:"Publicité et communication", sous:[
    { slug:"pub-panneaux",  label:"Panneaux publicitaires fixes et mobiles" },
    { slug:"pub-enseignes", label:"Enseignes et publicités assimilées" },
    { slug:"pub-ecrits",    label:"Distribution d'écrits publicitaires (toutes boîtes)" },
    { slug:"pub-voie",      label:"Diffusion publicitaire sur la voie publique" },
  ]},
  // ── Tourisme ──────────────────────────────────────────────────────────────
  { slug:"hebergement-tourisme", label:"Tourisme et hébergement", sous:[
    { slug:"tour-sejour",   label:"Taxe de séjour / taxe hôtelière (par nuitée et par personne)" },
    { slug:"tour-gites",    label:"Gîtes, meublés touristiques, B&B" },
    { slug:"tour-campings", label:"Campings, parcs résidentiels et caravaniers" },
  ]},
  // ── Déchets ───────────────────────────────────────────────────────────────
  { slug:"dechets-environnement", label:"Déchets et environnement", sous:[
    { slug:"dech-collecte",    label:"Collecte des ordures ménagères et déchets assimilés" },
    { slug:"dech-sacs",        label:"Sacs poubelles, sacs PMC et bio" },
    { slug:"dech-conteneurs",  label:"Conteneurs pour collectes spécifiques" },
    { slug:"dech-encombrants", label:"Enlèvement des encombrants et déchets extraordinaires" },
    { slug:"dech-versages",    label:"Enlèvement des versages sauvages" },
    { slug:"dech-dechetterie", label:"Accès à la déchetterie communale" },
    { slug:"dech-organique",   label:"Collecte et traitement des déchets organiques" },
  ]},
  // ── Infrastructure ────────────────────────────────────────────────────────
  { slug:"infrastructure-reseaux", label:"Infrastructure et réseaux", sous:[
    { slug:"infra-egouts",   label:"Raccordement aux égouts (avec ou sans traversée de voirie)" },
    { slug:"infra-eau",      label:"Raccordement et consommation eau de distribution publique" },
    { slug:"infra-elec",     label:"Raccordement à un coffret électrique communal" },
    { slug:"infra-borne-ev", label:"Recharge véhicules électriques à borne communale" },
  ]},
  // ── Énergie et industrie ──────────────────────────────────────────────────
  { slug:"energie-industrie", label:"Énergie et industrie extractive", sous:[
    { slug:"ener-eoliennes",     label:"Éoliennes à production industrielle d'électricité" },
    { slug:"ener-mats",          label:"Mâts éoliens et infrastructures de grande hauteur" },
    { slug:"ener-mines",         label:"Mines, minières et carrières" },
    { slug:"ener-photovolt",     label:"Installations photovoltaïques industrielles" },
  ]},
  // ── Funéraire ─────────────────────────────────────────────────────────────
  { slug:"inhumation", label:"Funéraire et cimetières", sous:[
    { slug:"fun-inhumation",    label:"Inhumations, dispersions des cendres et mises en columbarium" },
    { slug:"fun-concessions",   label:"Concessions de sépultures (pleine terre, caveaux, cavurnes)" },
    { slug:"fun-renouvellement",label:"Renouvellement de concessions" },
    { slug:"fun-exhumation",    label:"Exhumations, translations et ouvertures de caveaux" },
    { slug:"fun-caveau-attente",label:"Caveau d'attente" },
    { slug:"fun-columbarium",   label:"Columbariums, ossuaires et cellules cinéraires" },
    { slug:"fun-prestations",   label:"Prestations diverses liées aux cimetières" },
    { slug:"fun-plaques",       label:"Plaques commémoratives et stèles mémorielles" },
  ]},
  // ── Enseignement ──────────────────────────────────────────────────────────
  { slug:"enseignement-jeunesse", label:"Enseignement et jeunesse", sous:[
    { slug:"ens-extrascolaire", label:"Accueil extrascolaire (ATL)" },
    { slug:"ens-repas",         label:"Repas scolaires et distribution de repas / potage" },
    { slug:"ens-frais",         label:"Frais scolaires divers" },
    { slug:"ens-academie",      label:"Inscription à l'académie de musique" },
  ]},
  // ── Équipements communaux ─────────────────────────────────────────────────
  { slug:"location-salle", label:"Équipements et services communaux", sous:[
    { slug:"equip-salles",    label:"Location de salles et locaux communaux" },
    { slug:"equip-materiel",  label:"Location de matériel (podiums, barrières, Nadar, sono)" },
    { slug:"equip-chapiteau", label:"Location de chapiteaux, tonnelles et structures éphémères" },
    { slug:"equip-sport",     label:"Infrastructures sportives (terrains, gymnases, courts)" },
    { slug:"equip-piscine",   label:"Piscine communale" },
    { slug:"equip-golf",      label:"Golf et mini-golf communal" },
    { slug:"equip-tech",      label:"Prestations techniques du département communal" },
  ]},
  // ── Culture ───────────────────────────────────────────────────────────────
  { slug:"culture-bibliotheque", label:"Culture, bibliothèque et loisirs", sous:[
    { slug:"cult-biblio",     label:"Bibliothèque communale (inscriptions, prêts, photocopies)" },
    { slug:"cult-ludotheque", label:"Ludothèque (location jeux, déguisements)" },
    { slug:"cult-musee",      label:"Musée communal" },
    { slug:"cult-academie",   label:"Académie de musique (cours, instruments)" },
    { slug:"cult-welcome",    label:"Welcome bags et accueil des nouveaux habitants" },
  ]},
  // ── Animaux ───────────────────────────────────────────────────────────────
  { slug:"animaux", label:"Animaux", sous:[
    { slug:"anim-chiens",    label:"Chiens (taxe ou redevance d'identification / divagation)" },
    { slug:"anim-fourriere", label:"Fourrière animale et conservation" },
    { slug:"anim-nuisibles", label:"Dératisation et nuisibles" },
  ]},
  // ── Divers ────────────────────────────────────────────────────────────────
  { slug:"divers-prestations", label:"Divers prestations communales", sous:[
    { slug:"div-mariages",    label:"Célébration de mariages" },
    { slug:"div-plaques-num", label:"Plaques de numérotation des maisons" },
    { slug:"div-hygiene",     label:"Prestations d'hygiène publique" },
    { slug:"div-expulsion",   label:"Biens mis sur voie publique en exécution de jugements" },
    { slug:"div-repas-pers",  label:"Repas confectionnés pour le personnel et associations" },
  ]},
];

// Notes juridiques spécifiques par sous-catégorie — injectées dans le prompt
const NOTES_SOUS_CAT = {
  // ── Additionnels ────────────────────────────────────────────────────────
  "add-ipp": `Le règlement établit le taux en centimes additionnels à l'IPP ou en % de l'impôt État de base. Référence : art. 464 à 470bis CIR92. Préciser l'exercice d'imposition (revenus de l'année X = exercice X+1). Le taux est voté avant le 31 décembre de l'année précédant l'exercice.`,
  "add-pi":  `Le taux est exprimé en centimes additionnels au précompte immobilier. Référence : art. 251 à 259bis CIR92 + Code wallon de la taxation (décret 06/05/1999). Assiette : revenu cadastral × taux PI de base × centimes additionnels.`,
  // ── Urbanisme ───────────────────────────────────────────────────────────
  "urb-permis-urba": `Référence : CoDT, art. D.IV.56 et suiv. La redevance est perçue pour le traitement administratif du dossier (instruction, vérification, notification). Inclure : tableau tarifaire selon la nature des travaux (construction neuve, transformation, changement d'affectation), délai de traitement, exemptions (pouvoirs publics, logements sociaux). Ne pas confondre avec les taxes d'urbanisme régionales.`,
  "urb-permis-envir": `Référence : Décret wallon du 11 mars 1999 relatif au permis d'environnement (DPEP). La redevance couvre l'instruction du dossier de classe 3. Inclure : délai d'instruction (30 jours), modalités de recours, exemptions pour exploitations agricoles < seuil.`,
  "urb-implantation": `Redevance pour les prestations d'implantation de construction par le géomètre communal et l'établissement des procès-verbaux en résultant. Inclure : tarif par déplacement et par heure, délai de réalisation, responsabilité en cas d'erreur.`,
  // ── Domaine public ──────────────────────────────────────────────────────
  "domaine-terrasses": `Inclure obligatoirement : plan ou croquis joint à la demande, dimensions exactes (m²), mobilier conforme au règlement de police, attestation d'assurance RC, période standard (15 mars – 15 novembre sauf dérogation), renouvellement annuel. Visa L2213-1 CDLD.`,
  "domaine-chantiers": `Inclure : emprise maximale, balisage et signalisation (RGPPT), durée maximale sans prolongation, responsabilité civile de l'entrepreneur, remise en état après travaux.`,
  "domaine-enseignes": `Différencier enseigne parallèle au mur (pas d'occupation) vs enseigne saillante (débord sur espace public → redevance ou taxe sur domaine aérien).`,
  "domaine-versages": `Inclure : procédure de constatation par le fonctionnaire communal, mise en demeure préalable, frais d'enlèvement à charge du responsable identifié, barème par volume (m³ ou camion).`,
  // ── Marchés ─────────────────────────────────────────────────────────────
  "marche-hebdo": `Inclure : règlement de marché annexé ou référencé, tarif par mètre linéaire ou par emplacement, priorité aux commerçants titulaires d'une carte ambulante (loi 25/06/1993), procédure d'attribution des emplacements, horaires, obligation de propreté.`,
  "marche-foire": `Référence : loi du 25 juin 1993 sur l'exercice d'activités ambulantes. Inclure : dates des foires, tarif par emplacement (journalier ou sur la durée), conditions d'accès, assurance des forains.`,
  // ── Mobilité ────────────────────────────────────────────────────────────
  "mob-zone-bleue": `Préciser le périmètre de la zone bleue par référence au plan annexé ou au règlement complémentaire de circulation, la durée maximale de stationnement, la procédure de contrôle (agents constateurs), le tarif et la modalité (horodateur, disque). Référence : arrêté royal du 01/12/1975 (code de la route), art. 25.`,
  "mob-absence-parc": `Certaines communes imposent aux propriétaires de bâtiments à usage de bureaux/commerces qui ne respectent pas les normes de parking prévues au plan communal d'aménagement une taxe compensatoire. Vérifier la base légale locale.`,
  "mob-veh-abandonnes": `Inclure : définition du véhicule abandonné (immobile > 30 jours, état de délabrement), procédure d'identification du propriétaire (DIV), mise en demeure recommandée, délai d'enlèvement, frais de fourrière à charge du propriétaire. Référence : L2213-1 CDLD.`,
  "mob-taxis": `Référence : décret wallon du 18 octobre 2007 relatif aux services de taxis. La taxe est communale mais doit respecter les conditions du décret. Inclure : nombre de véhicules autorisés, tarif par véhicule autorisé, renouvellement annuel.`,
  "mob-force-motrice": `En déclin. Frappe l'utilisation de la voirie par des véhicules de force (camions, tracteurs). Vérifier l'opportunité. Exemptions : agriculteurs, services publics. Référence : art. 173 et suiv. LGCP.`,
  // ── Immobilier ──────────────────────────────────────────────────────────
  "immo-inoccupe": `Références : Décret wallon du 6 février 2014 (MW 26/02/2014). Inclure : définition de l'inoccupation (12 mois consécutifs), constatation par fonctionnaire, délai de contestation (30 jours), exemptions obligatoires (travaux autorisés, force majeure, succession < 2 ans, mise en vente récente), majoration progressive après 1re année.`,
  "immo-non-bati": `Références : CoDT, art. D.IV.54. Définir les zones concernées (plan de secteur), exemptions pour terrain agricole/forestier, procédure de relevé cadastral.`,
  "immo-seconde-residence": `Définition : bien non occupé comme résidence principale au Registre national. Exemptions : résidences de convalescence. Interaction avec taxe de séjour si applicable.`,
  "immo-loues-meubles": `Définition : logement fourni avec mobilier suffisant pour y séjourner, loué à des fins autres que résidence principale. Inclure : obligation de déclaration par le propriétaire, exemptions pour logements sociaux, base de calcul (par chambre ou par logement).`,
  "immo-surfaces-comm": `Référence : loi du 13 août 2011 sur les implantations commerciales (loi Laruelle). Inclure : définition des surfaces imposables (m² de surface de vente nette), exemptions pour petits commerces (< seuil), déclaration annuelle.`,
  // ── Commerce ────────────────────────────────────────────────────────────
  "com-antennes": `Jurisprudence abondante. Différencier emprise physique (pylône) vs puissance émettrice. Référence : Cass. 10/06/2011. Taxe sur emprise physique = admise ; taxe sur puissance = souvent annulée. Décret wallon 03/04/2014.`,
  "com-dancings": `Inclure : définition de l'établissement (superficie, heure de fermeture), tarif forfaitaire annuel, exemptions pour associations sans but lucratif organisant des bals occasionnels (< X fois/an), procédure de déclaration.`,
  "com-spectacles": `Inclure : définition du spectacle taxable (public payant, représentation publique), exemptions (manifestations scolaires, culturelles subventionnées, associations reconnues), base de calcul (par représentation ou sur recettes).`,
  "com-etabl-danger": `Référence : Décret wallon du 11 mars 1999 (permis d'environnement classes 1-2). La taxe frappe l'exploitation de l'établissement, pas le permis lui-même. Inclure : liste des catégories d'établissements visés, tarif par classe et par tranche, déclaration annuelle.`,
  // ── Publicité ───────────────────────────────────────────────────────────
  "pub-panneaux": `Préciser : face visible depuis voie publique, superficie minimale imposable (> X m²), exemptions (panneaux électoraux, enseignes identifiant l'établissement propre), tarif par face et par m². Différencier des enseignes (voir pub-enseignes).`,
  "pub-ecrits": `Référence : loi du 25 juin 1993 (activités ambulantes) pour les distributeurs. Inclure : définition des écrits visés (publicité non adressée, toutes boîtes), exemptions (presse d'information générale, publications des pouvoirs publics), tarif par adresse ou par tranche de distribution.`,
  // ── Tourisme ────────────────────────────────────────────────────────────
  "tour-sejour": `Inclure obligatoirement : registre journalier des nuitées, déclaration mensuelle/trimestrielle au Collège, solidarité de l'exploitant, exemptions (< 16 ans, séjours médicaux, résidents permanents). Référence : Décret wallon du 10 novembre 2016.`,
  "tour-gites": `Référence : Décret wallon du 10 novembre 2016. Inclure : attestation de classement CGT, exemptions pour gîtes 1 épis.`,
  "tour-campings": `Référence : Décret wallon du 10 novembre 2016. Distinguer résidence permanente (→ taxe secondes résidences) vs séjour touristique.`,
  // ── Déchets ─────────────────────────────────────────────────────────────
  "dech-collecte": `Dans la plupart des communes wallonnes, la collecte est assurée par une intercommunale (BEP, IDELUX, TIBI, IPALLE, InBW…) qui facture directement. Si commune en régie : inclure fréquence, types de déchets, calcul par ménage ou par volume.`,
  "dech-sacs": `Inclure : tarif par type de sac (résidu, PMC, organique, verre), volume des sacs, modalités de distribution (points de vente agréés), exemptions pour ménages à faibles revenus.`,
  "dech-versages": `Inclure : définition du versage sauvage, procédure de constatation, identification du responsable, mise en demeure recommandée, frais d'enlèvement + barème administratif par volume.`,
  // ── Infrastructure ──────────────────────────────────────────────────────
  "infra-egouts": `Inclure : définition du raccordement (avec ou sans traversée de voirie), tarif selon longueur et complexité des travaux, délai d'exécution, responsabilité des dégradations de voirie, obligation de raccordement (CWEA art. 375 et suiv.).`,
  "infra-eau": `Préciser : distinction abonnement compteur vs consommation, tarif par m³, tranches de consommation, ajustement annuel, procédure en cas de non-paiement. Souvent géré par intercommunale mais certaines communes ont encore une régie eau.`,
  // ── Énergie ─────────────────────────────────────────────────────────────
  "ener-eoliennes": `Référence : décret wallon du 12 avril 2001 (électricité). La taxe frappe l'exploitation industrielle. Inclure : définition de la puissance imposable (kW installés ou MW), tarif par unité de puissance, déclaration annuelle, interaction avec la taxe sur les mâts si distincte.`,
  "ener-mines": `Référence : loi du 26 mars 1844 sur les mines (toujours applicable). Inclure : définition des substances imposables, tarif par tonne extraite ou par exploitation, déclaration trimestrielle, exemptions pour petites extractions.`,
  // ── Funéraire ───────────────────────────────────────────────────────────
  "fun-inhumation": `La taxe (ou redevance) frappe l'acte d'inhumation, de mise en columbarium ou de dispersion des cendres. Différencier selon le mode (pleine terre, caveau, columbarium, dispersion). Inclure exemptions pour indigents (L1122-30 CDLD).`,
  "fun-concessions": `Inclure : tableau des durées (10/20/30 ans/perpétuelle), procédure de renouvellement avec notification recommandée avant expiration, clause de déchéance pour abandon (> 2 ans mauvais entretien), droit de reprise après déchéance.`,
  "fun-renouvellement": `Préciser la procédure de notification préalable à l'expiration (délai recommandé : 6 mois avant), tarif de renouvellement (souvent inférieur à la concession initiale), conséquences du non-renouvellement.`,
  "fun-exhumation": `Inclure : distinction exhumation administrative vs exhumation de confort (à la demande de la famille, réalisée par un entrepreneur de pompes funèbres mandaté par la commune), tarif selon le type d'opération.`,
  "fun-caveau-attente": `Inclure : durée maximale d'occupation (généralement 6 à 12 mois), tarif journalier ou forfaitaire, conditions de prorogation, procédure en cas de non-libération.`,
  // ── Enseignement ────────────────────────────────────────────────────────
  "ens-extrascolaire": `Référence : décret wallon du 3 juillet 2003 (accueil temps libre, ATL). La redevance couvre les prestations de surveillance et d'animation extrascolaires. Inclure : tarif par heure/demi-journée/journée, tranches selon revenus (modulation possible), modalités de facturation mensuelle.`,
  "ens-repas": `Inclure : tarif par repas selon le niveau d'enseignement, modalités de commande et d'annulation, tarification sociale (quotient familial), paiement mensuel ou en ligne.`,
  // ── Équipements ─────────────────────────────────────────────────────────
  "equip-salles": `Inclure : tableau tarifaire par salle et tranche horaire, caution remboursable, responsabilité pour dégradations, nettoyage, priorité aux associations locales (tarif réduit), contrat de location obligatoire.`,
  "equip-sport": `Inclure : tableau tarifaire par infrastructure et par heure, priorité aux clubs affiliés, conditions de réservation, règlement intérieur annexé, assurance des utilisateurs.`,
  // ── Animaux ─────────────────────────────────────────────────────────────
  "anim-chiens": `Taxe supprimée dans de nombreuses communes wallonnes — vérifier l'opportunité. Si maintenue : exemptions (chiens d'assistance, éleveurs agréés), déclaration annuelle en janvier, tarif par animal.`,
};


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

function trouverRefs(objet, type, categorie, source, sousCat) {
  const src = source || SOURCE;
  // Backward compat : immondices est un ancien slug fusionn\u00e9 dans dechets-environnement
  const SLUG_COMPAT = { "immondices":"dechets-environnement" };
  const catNorm = c => SLUG_COMPAT[c] || c;
  const mots = (objet || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,;.]+/).filter(m => m.length > 3);
  return src
    .filter(r => r.type===type && (!categorie||catNorm(r.categorie)===catNorm(categorie)) && r.qualite!=="insuffisante" && r.qualite!=="brouillon")
    .map(r => {
      const cles = [
        ...(r.mots_cles||[]),
        ...(r.visas||[]),
        r.objet||"", r.tarifs||"",
        ...(r.exonerations||[]),
      ].join(" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      const score = mots.filter(m=>cles.includes(m)).length;
      const bonus = (r.points_forts_valides?2:0)
        + (r.qualite==="reference"?3:r.qualite==="valide"?1:0)
        + (sousCat && r.sousCat===sousCat ? 2 : 0);
      return { ...r, _score: score + bonus };
    })
    .filter(r => r._score>0 || !categorie)
    .sort((a,b)=>b._score-a._score).slice(0,4);
}
// ─── PROFIL COMMUNE ───────────────────────────────────────────────────────────
const PROFIL_KEY = "vb_profil_commune";
function chargerProfil() {
  try { return JSON.parse(localStorage.getItem(PROFIL_KEY) || "{}"); }
  catch { return {}; }
}
function sauverProfil(p) { localStorage.setItem(PROFIL_KEY, JSON.stringify(p)); }

// ─── BIBLIOTHÈQUE ─────────────────────────────────────────────────────────────
const BIBLIO_KEY = "vb_biblio_locale";

function chargerLocale() {
  try { return JSON.parse(localStorage.getItem(BIBLIO_KEY) || "[]"); }
  catch { return []; }
}
function sauvegarderLocale(entries) {
  localStorage.setItem(BIBLIO_KEY, JSON.stringify(entries));
}
function mergerBiblio() {
  const locale = chargerLocale();
  const ids = new Set(locale.map(e => e.id));
  return [...SOURCE.filter(e => !ids.has(e.id)), ...locale];
}
function exporterBiblio(entries) {
  const clean = entries.map(({ _local, _score, ...e }) => e);
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([JSON.stringify(clean, null, 2)], { type:"application/json" })),
    download: "index_valide.json",
  });
  a.click(); URL.revokeObjectURL(a.href);
}

const GITHUB_REPO = "suyttenhoef-cyber/taxes_checker";
const GITHUB_PATH = "src/index_valide.json";
const GITHUB_BRANCH = "main";

async function publierBiblio(entries) {
  const base = `${WORKER_URL}/github/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
  const getRes = await fetch(`${base}?ref=${GITHUB_BRANCH}`);
  if (!getRes.ok) throw new Error(`Lecture fichier GitHub impossible (${getRes.status})`);
  const { sha } = await getRes.json();

  const clean = entries.map(({ _local, _score, ...e }) => e);
  const json  = JSON.stringify(clean, null, 2);
  const content = btoa(unescape(encodeURIComponent(json)));
  const today = new Date().toISOString().slice(0, 10);

  const putRes = await fetch(base, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `chore: mise à jour bibliothèque règlements (${today})`,
      content,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });
  if (!putRes.ok) { const e = await putRes.text(); throw new Error(`Commit GitHub impossible (${putRes.status}) : ${e}`); }
  return await putRes.json();
}

const SYSTEM_EXTRACTION = `Tu es un expert en droit communal wallon.
Extrait les informations structurées du règlement communal fourni.
Retourne UNIQUEMENT un objet JSON valide avec exactement ces champs :
{
  "commune": "nom exact de la commune",
  "type": "taxe" ou "redevance",
  "categorie": "slug exact parmi : actes-administratifs | domaine-public | dechets-environnement | hebergement-tourisme | commerce-economie | inhumation | animaux | immondices | location-salle | mobilite | impots",
  "annee": YYYY (entier),
  "periode": "YYYY" ou "YYYY-YYYY",
  "objet": "description courte et précise de l'objet du règlement",
  "mots_cles": ["mot1", "mot2", "..."],
  "visas": ["Vu la Constitution art. 170 §4", "Vu le CDLD L1122-30", "..."],
  "tarifs": "description complète des montants et grilles tarifaires",
  "exonerations": ["cas d'exonération 1", "..."],
  "points_forts": ["formulation juridique remarquable 1", "..."],
  "extrait": "extrait représentatif du texte (500 mots max, conserver la forme officielle)",
  "source": { "numero_deliberation": "", "date_seance": "YYYY-MM-DD ou vide" },
  "qualite": "brouillon"
}
Si une information est absente, utilise "" ou [] selon le type. Ne commente pas.`;

async function extraireAvecIA(texte) {
  const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"gpt-4o", max_tokens:2000,
      response_format:{ type:"json_object" },
      messages:[
        { role:"system", content:SYSTEM_EXTRACTION },
        { role:"user", content:texte.slice(0, 10000) },
      ],
    }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`API ${res.status} : ${e}`); }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

const VIDE_ENTREE = () => ({
  id:`local-${Date.now()}`, commune:"", type:"taxe", categorie:"", annee:new Date().getFullYear(),
  periode:"", objet:"", mots_cles:[], visas:[], tarifs:"", exonerations:[],
  points_forts:[], extrait:"", source:{numero_deliberation:"",date_seance:""},
  qualite:"brouillon", points_forts_valides:false, _local:true,
});

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

function buildSystemPrompt(dateSeance, listePresents, listeAbsents) {
  const dateStr = dateSeance
    ? new Date(dateSeance).toLocaleDateString("fr-BE", {day:"numeric", month:"long", year:"numeric"})
    : "[DATE DE LA SÉANCE]";
  const presStr = listePresents || "[LISTE DES CONSEILLERS PRÉSENTS]";
  const absStr  = listeAbsents  || "Néant";
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

[NOM ET SIGNATURE DG]                         [NOM ET SIGNATURE BOURGMESTRE]


Pour extrait conforme délivré le [DATE]`;
}

function buildMessages(p, refs, mandataires, presences) {
  const nomM = m => `${m.detail_civilite||""} ${m.detail_prenom||""} ${m.detail_nom||""}`.trim();
  const bourg = mandataires.find(m => /bourgmestre/i.test(m.detail_fonction));
  const bourgNom = bourg ? nomM(bourg) : "[NOM BOURGMESTRE]";
  const dirGen = mandataires.find(m => /directeur|directrice\s+g[eé]n[eé]ral/i.test(m.detail_fonction));
  const dirGenNom = dirGen ? nomM(dirGen) : "[NOM DIRECTEUR GÉNÉRAL]";

  // Listes présents / absents depuis les cases à cocher
  const conseil = mandataires.filter(m => !/directeur|directrice/i.test(m.detail_fonction));
  const listePresents = conseil.filter((_, i) => presences[i] !== false).map(nomM).join(", ");
  const listeAbsents  = conseil.filter((_, i) => presences[i] === false).map(nomM).join(", ") || null;

  // CONSIDÉRANT contrepartie redevance (sans placeholder)
  const considRedevance = p.typeReglement==="redevance"
    ? `- La redevance constitue la contrepartie directe ${
        p.sousTypeRedevance==="autorisation"
          ? `de l'avantage particulier que représente l'occupation du domaine public communal pour ${p.objet||"l'activité concernée"}, les frais de gestion, de contrôle et d'entretien du domaine étant couverts par le tarif de ${p.tarif}`
          : `du service rendu par la commune consistant en ${p.objet||"l'activité concernée"}, les coûts directs de ce service étant répercutés sur le bénéficiaire à hauteur du tarif de ${p.tarif}`
      }`
    : "";

  const catLabel    = CATEGORIES.find(c=>c.slug===p.categorie)?.label||"";
  const sousCatObj  = CATEGORIES.flatMap(c=>c.sous||[]).find(s=>s.slug===p.sousCat);
  const sousCatLabel= sousCatObj?.label||"";
  const notesSousCat= NOTES_SOUS_CAT[p.sousCat]||"";
  const pf = refs.map(r =>
    `${r.titre} (${r.commune}, ${r.annee})\nPoints forts :\n${r.points_forts.map(x=>`- ${x}`).join("\n")}\nExtrait :\n${r.extrait}`
  ).join("\n\n---\n\n");

  const userContent =
`MISSION : Rédige un ${p.typeReglement==="taxe"?"règlement-taxe":"règlement-redevance"} communal wallon.

COMMUNE : ${p.commune||"[COMMUNE]"}${p.ins?` (INS ${p.ins})`:""}${p.province?`, Province de ${p.province}`:""}
Bourgmestre : ${bourgNom}
Directeur(trice) général(e) : ${dirGenNom}
Population : ${p.population?p.population.toLocaleString("fr-BE")+" hab.":"non précisée"}

PARAMÈTRES DU RÈGLEMENT :
- Catégorie : ${catLabel||"Non précisée"}${sousCatLabel?" — "+sousCatLabel:""}
- Objet : ${p.objet}
- Type : ${p.typeReglement}${p.typeReglement==="redevance"?" ("+( p.sousTypeRedevance==="autorisation"?"autorisation d'occupation du domaine public":"service rendu / usage")+")":""}
- Exercices : ${p.periodeDebut} à ${p.periodeFin}
- Redevable : ${p.redevable}
- Tarif : ${p.tarif}
- Exonérations : ${p.exonerations||"Aucune"}
- Compléments : ${p.infoCompl||"Aucun"}
${notesSousCat?`\nEXIGENCES JURIDIQUES SPÉCIFIQUES À CETTE SOUS-CATÉGORIE :\n${notesSousCat}`:""}


VISAS OBLIGATOIRES (dans cet ordre) :
1. Vu la Constitution, notamment les articles 41, 162 et 170 §4
2. Vu le décret du 14/12/2000 et la loi du 24/06/2000 (Charte européenne de l'autonomie locale, art. 9.1)
${p.typeReglement==="taxe"?"3. Vu le code des taxes assimilées aux impôts sur les revenus (CTAIR)":"3. Vu les dispositions du CDLD relatives aux redevances communales"}
4. Vu le CDLD, notamment les articles L1122-30${p.typeReglement==="taxe"?", L3321-1 à L3321-12":" et L1124-40"}
5. Vu la circulaire budgétaire du 30 mai 2024
6. Vu l'avis de légalité du Directeur financier, positif, joint en annexe

CONSIDÉRANTS OBLIGATOIRES :
- Nécessité de disposer de ressources propres pour financer les missions de service public
${considRedevance}
- Le Directeur financier a été informé conformément à l'article L1124-40 §1er, 3° et 4° du CDLD
- Sur proposition du Collège communal

ARTICLES OBLIGATOIRES :
Art. 1er — Objet et exercices (${p.periodeDebut}–${p.periodeFin}) : définir précisément le champ d'application
Art. 2   — Redevable et fait générateur
Art. 3   — Montant (${p.tarif})${p.exonerations?" avec les exonérations suivantes : "+p.exonerations:""}
${p.typeReglement==="redevance" && p.sousTypeRedevance==="autorisation"
  ? `Art. 4   — Autorisation préalable : le redevable introduit une demande d'autorisation auprès du Collège communal avant toute occupation ; la redevance est calculée sur la durée accordée et notifiée avec la décision d'autorisation
Art. 5   — Occupation sans autorisation : en cas d'occupation sans autorisation préalable, une redevance majorée de 100 % est réclamée, sans préjudice des mesures de police administrative et de la mise en demeure de libérer le domaine public (L2213-1 et suiv. CDLD)`
  : `Art. 4   — Déclaration : formulaire communal, délai 15 jours${p.typeReglement==="redevance" ? " suivant la naissance du fait générateur" : ", obligation spontanée au 31 janvier"}
Art. 5   — ${p.typeReglement==="redevance" ? "Défaut de déclaration : redevance établie d'office par le Collège sur base des éléments en sa possession, avec frais de procédure à charge du redevable" : "Taxation d'office en cas de défaut (L3321-6 CDLD) : majoration de 20 %"}`}
${p.typeReglement==="redevance"
  ? "Art. 6   — Mode de perception et exigibilité : redevance exigible dès l'obtention de l'autorisation, payable au comptant à la caisse communale contre reçu ; à défaut, payable dans les 30 jours suivant la réception de l'invitation à payer, intérêts légaux de plein droit"
  : "Art. 6   — Paiement par voie de rôle, délai 2 mois à compter de l'envoi de l'avertissement-extrait de rôle"}
Art. 7   — Recouvrement${p.typeReglement==="redevance" ? " par voie de contrainte (L1124-40 §1er CDLD), mise en demeure recommandée préalable, frais à charge du débiteur" : " (L3321-1 à L3321-12 CDLD, AR 12/04/1999) avec sommation recommandée (L3321-8bis)"}
Art. 8   — Réclamation dans les 6 mois (L3321-9 CDLD — ordre public), par recommandé au Collège, sous peine de déchéance${p.typeReglement==="redevance" ? " ; délai de 3 mois pour statuer, accusé de réception dans les 8 jours, décision notifiée par recommandé" : ""}
Art. 9   — Protection des données (RGPD) : responsable = ${p.commune||"la commune"}, finalité fiscale, conservation 30 ans
Art. 10  — Tutelle : Gouvernement wallon, L3131-1 et suivants, tutelle spéciale d'approbation
Art. 11  — Publication et entrée en vigueur (L1133-1 et L1133-2 CDLD)

RÈGLEMENTS DE RÉFÉRENCE VANDEN BROELE :
${pf.length>0?pf:"(aucune référence disponible — appliquer strictement les exigences légales ci-dessus)"}`;

  return [
    { role: "system", content: buildSystemPrompt(p.dateSeance, listePresents, listeAbsents) },
    { role: "user",   content: userContent },
  ];
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

// ─── PANEL PRÉSENTS / ABSENTS ─────────────────────────────────────────────────
function PanelPresences({ mandataires, presences, onChange }) {
  if (!mandataires || mandataires.length === 0) return null;
  const conseil = mandataires.filter(m => !/directeur|directrice/i.test(m.detail_fonction));
  if (conseil.length === 0) return null;

  const nomM = m => `${m.detail_civilite||""} ${m.detail_prenom||""} ${m.detail_nom||""}`.trim();
  const toggle = i => onChange(prev => {
    const next = {...prev};
    if (next[i] === false) delete next[i]; else next[i] = false;
    return next;
  });

  const nbPresents = conseil.filter((_, i) => presences[i] !== false).length;
  const nbAbsents  = conseil.length - nbPresents;

  const groupes = [
    { label:"Bourgmestre",          filtre: m => /bourgmestre/i.test(m.detail_fonction) },
    { label:"Échevins",             filtre: m => /[eé]chevin/i.test(m.detail_fonction)  },
    { label:"Conseillers communaux",filtre: m => !/bourgmestre|[eé]chevin/i.test(m.detail_fonction) },
  ];

  return (
    <div style={{marginTop:12, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden"}}>
      <div style={{background:C.grisClair, padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <span style={{fontSize:13, fontWeight:700, color:C.bleu}}>
          Présents au conseil — {nbPresents}/{conseil.length}
          {nbAbsents > 0 && <span style={{marginLeft:8, background:C.jauneClair, color:C.jaune, padding:"1px 8px", borderRadius:10, fontSize:11}}>{nbAbsents} absent{nbAbsents>1?"s":""} excusé{nbAbsents>1?"s":""}</span>}
        </span>
        {nbAbsents > 0 && (
          <button onClick={()=>onChange({})} style={{background:"none", border:"none", fontSize:11, color:C.gris, cursor:"pointer", textDecoration:"underline"}}>
            Tous présents
          </button>
        )}
      </div>
      <div style={{padding:"10px 14px", display:"flex", flexDirection:"column", gap:10}}>
        {groupes.map(({label, filtre}) => {
          const membres = conseil.map((m,i)=>({m,i})).filter(({m})=>filtre(m));
          if (membres.length === 0) return null;
          return (
            <div key={label}>
              <div style={{fontSize:10, fontWeight:700, color:C.gris, textTransform:"uppercase", letterSpacing:".5px", marginBottom:4}}>{label}</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:"4px 16px"}}>
                {membres.map(({m, i}) => {
                  const present = presences[i] !== false;
                  return (
                    <label key={i} style={{display:"flex", alignItems:"center", gap:5, cursor:"pointer", fontSize:12,
                      color: present ? C.bleu : C.gris, opacity: present ? 1 : .55}}>
                      <input type="checkbox" checked={present} onChange={()=>toggle(i)}
                        style={{accentColor: C.bleu, width:13, height:13, cursor:"pointer"}}/>
                      {nomM(m)}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
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

// ─── BIBLIOTHÈQUE — FORMULAIRE ────────────────────────────────────────────────
function FormulaireEntree({ initial, onSave, onCancel }) {
  const [etape, setEtape]     = useState(initial ? "form" : "paste");
  const [texte, setTexte]     = useState("");
  const [busy, setBusy]       = useState(false);
  const [errF, setErrF]       = useState("");
  const [e, setE]             = useState(initial || VIDE_ENTREE());

  const upd = (k,v) => setE(p=>({...p,[k]:v}));
  const updArr = (k,v) => upd(k, v.split("\n").map(s=>s.trim()).filter(Boolean));
  const toLines = arr => (arr||[]).join("\n");

  const extraire = async () => {
    if (!texte.trim()) return;
    setBusy(true); setErrF("");
    try {
      const ex = await extraireAvecIA(texte);
      setE(p=>({ ...p, ...ex, _local:true, id:p.id }));
      setEtape("form");
    } catch(err) { setErrF(err.message); }
    finally { setBusy(false); }
  };

  const sauver = () => {
    if (!e.commune||!e.objet||!e.categorie) { setErrF("Commune, objet et catégorie sont requis."); return; }
    onSave(e);
  };

  const tA = (label, val, onChange, rows=3) => (
    <div style={{marginBottom:12}}>
      <label style={lS}>{label}</label>
      <textarea style={{...iS,height:rows*22+18,resize:"vertical"}} value={val} onChange={e=>onChange(e.target.value)}/>
    </div>
  );
  const iF = (label, val, onChange) => (
    <div style={{marginBottom:12}}>
      <label style={lS}>{label}</label>
      <input style={iS} value={val||""} onChange={e=>onChange(e.target.value)}/>
    </div>
  );

  return (
    <div style={{background:C.blanc,borderRadius:10,border:`1px solid ${C.border}`,padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{margin:0,color:C.bleu,fontSize:16}}>{initial?"Modifier l'entrée":"Ajouter un règlement"}</h3>
        <button onClick={onCancel} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.gris}}>×</button>
      </div>

      {etape==="paste" && (
        <>
          <p style={{color:C.gris,fontSize:13,marginTop:0}}>Collez le texte complet du règlement. L'IA en extraira automatiquement les informations structurées.</p>
          <textarea style={{...iS,height:220,resize:"vertical",fontFamily:"Georgia,serif",fontSize:12,lineHeight:1.6}}
            placeholder="Collez ici le texte du règlement communal…" value={texte} onChange={e=>setTexte(e.target.value)}/>
          {errF && <div style={{marginTop:8,padding:"8px 12px",background:C.rougeClair,color:C.rouge,borderRadius:6,fontSize:12}}>{errF}</div>}
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button onClick={extraire} disabled={busy||!texte.trim()}
              style={{background:busy?C.gris:C.orange,color:C.blanc,border:"none",borderRadius:7,padding:"10px 22px",fontWeight:700,fontSize:13,cursor:busy?"not-allowed":"pointer"}}>
              {busy?"⏳ Extraction…":"✨ Extraire avec l'IA"}
            </button>
            <button onClick={()=>setEtape("form")}
              style={{background:C.grisClair,color:C.gris,border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 18px",fontSize:13,cursor:"pointer"}}>
              Encoder manuellement
            </button>
          </div>
        </>
      )}

      {etape==="form" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
            {iF("Commune *", e.commune, v=>upd("commune",v))}
            {iF("Année", e.annee, v=>upd("annee",parseInt(v)||e.annee))}
            <div style={{marginBottom:12}}>
              <label style={lS}>Type *</label>
              <select style={iS} value={e.type} onChange={x=>upd("type",x.target.value)}>
                <option value="taxe">Taxe</option>
                <option value="redevance">Redevance</option>
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <label style={lS}>Qualité</label>
              <select style={iS} value={e.qualite} onChange={x=>upd("qualite",x.target.value)}>
                <option value="brouillon">Brouillon</option>
                <option value="valide">Validé</option>
                <option value="reference">Référence</option>
              </select>
            </div>
            <div style={{gridColumn:"1/-1",marginBottom:12}}>
              <label style={lS}>Catégorie *</label>
              <select style={iS} value={e.categorie} onChange={x=>{upd("categorie",x.target.value); upd("sousCat","");}}>
                <option value="">— Choisir —</option>
                {CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </div>
            {e.categorie && (
              <div style={{gridColumn:"1/-1",marginBottom:12}}>
                <label style={lS}>Sous-catégorie</label>
                <select style={iS} value={e.sousCat||""} onChange={x=>upd("sousCat",x.target.value)}>
                  <option value="">— Non précisée —</option>
                  {(CATEGORIES.find(c=>c.slug===e.categorie)?.sous||[]).map(s=>(
                    <option key={s.slug} value={s.slug}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{gridColumn:"1/-1"}}>
              {iF("Objet du règlement *", e.objet, v=>upd("objet",v))}
            </div>
            <div style={{gridColumn:"1/-1"}}>
              {iF("Période (ex : 2025-2030)", e.periode, v=>upd("periode",v))}
            </div>
          </div>

          {tA("Visas (un par ligne)", toLines(e.visas), v=>updArr("visas",v), 4)}
          {tA("Tarifs", e.tarifs||"", v=>upd("tarifs",v), 2)}
          {tA("Exonérations (une par ligne)", toLines(e.exonerations), v=>updArr("exonerations",v), 2)}
          {tA("Mots-clés (un par ligne)", toLines(e.mots_cles), v=>updArr("mots_cles",v), 2)}
          {tA("Points forts (un par ligne)", toLines(e.points_forts), v=>updArr("points_forts",v), 3)}
          {tA("Extrait du texte", e.extrait||"", v=>upd("extrait",v), 6)}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
            {iF("N° délibération", e.source?.numero_deliberation, v=>upd("source",{...e.source,numero_deliberation:v}))}
            {iF("Date séance (YYYY-MM-DD)", e.source?.date_seance, v=>upd("source",{...e.source,date_seance:v}))}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4,marginBottom:16}}>
            <input type="checkbox" id="pfv" checked={!!e.points_forts_valides} onChange={x=>upd("points_forts_valides",x.target.checked)}/>
            <label htmlFor="pfv" style={{fontSize:13,color:C.bleu,cursor:"pointer"}}>Points forts validés par un juriste</label>
          </div>

          {errF && <div style={{marginBottom:12,padding:"8px 12px",background:C.rougeClair,color:C.rouge,borderRadius:6,fontSize:12}}>{errF}</div>}
          <div style={{display:"flex",gap:10}}>
            <button onClick={sauver}
              style={{background:C.vert,color:C.blanc,border:"none",borderRadius:7,padding:"10px 24px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              💾 Sauvegarder
            </button>
            {!initial && <button onClick={()=>setEtape("paste")}
              style={{background:C.grisClair,color:C.gris,border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 16px",fontSize:13,cursor:"pointer"}}>
              ← Retour
            </button>}
            <button onClick={onCancel}
              style={{background:C.blanc,color:C.rouge,border:`1px solid ${C.rouge}33`,borderRadius:7,padding:"10px 16px",fontSize:13,cursor:"pointer"}}>
              Annuler
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── BIBLIOTHÈQUE — ONGLET ────────────────────────────────────────────────────
function OngletBibliotheque({ biblio, setBiblio }) {
  const [vue, setVue]         = useState("liste");
  const [entreeEdit, setEdit] = useState(null);
  const [recherche, setRech]  = useState("");
  const [filtreType, setFT]   = useState("");
  const [filtreCat, setFC]    = useState("");
  const [filtreQ, setFQ]      = useState("");
  const [publication, setPub] = useState({ busy:false, msg:"", ok:null });

  const sauverEntree = (e) => {
    setBiblio(prev => {
      const idx = prev.findIndex(x=>x.id===e.id);
      const next = idx>=0 ? prev.map((x,i)=>i===idx?e:x) : [...prev,e];
      sauvegarderLocale(next.filter(x=>x._local));
      return next;
    });
    setVue("liste"); setEdit(null);
  };

  const publier = async () => {
    setPub({ busy:true, msg:"Publication en cours…", ok:null });
    try {
      await publierBiblio(biblio);
      const nb = biblio.filter(r=>r._local).length;
      setPub({ busy:false, msg:`✅ ${biblio.length} règlements publiés (dont ${nb} locaux). Redéploiement GitHub Actions en cours (~2 min).`, ok:true });
    } catch(err) {
      setPub({ busy:false, msg:`❌ ${err.message}`, ok:false });
    }
  };

  const supprimerEntree = (id) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    setBiblio(prev => {
      const next = prev.filter(x=>x.id!==id);
      sauvegarderLocale(next.filter(x=>x._local));
      return next;
    });
  };

  const filtre = biblio
    .filter(r => (!filtreType||r.type===filtreType))
    .filter(r => (!filtreCat||r.categorie===filtreCat))
    .filter(r => (!filtreQ||r.qualite===filtreQ))
    .filter(r => {
      if (!recherche) return true;
      const q = recherche.toLowerCase();
      return [r.commune,r.objet,r.categorie,...(r.mots_cles||[])].join(" ").toLowerCase().includes(q);
    });

  const stats = {
    total: biblio.length,
    local: biblio.filter(r=>r._local).length,
    ref:   biblio.filter(r=>r.qualite==="reference").length,
    valid: biblio.filter(r=>r.qualite==="valide").length,
  };

  const bdgQ = { reference:{bg:C.vertClair,c:C.vert,l:"Référence"}, valide:{bg:C.bleuLight,c:C.bleu,l:"Validé"}, brouillon:{bg:C.jauneClair,c:C.jaune,l:"Brouillon"} };
  const bdgT = { taxe:{bg:C.orangeLight,c:C.orange}, redevance:{bg:C.bleuLight,c:C.bleu} };

  if (vue==="form" || vue==="edit") return (
    <FormulaireEntree
      initial={entreeEdit}
      onSave={sauverEntree}
      onCancel={()=>{ setVue("liste"); setEdit(null); }}
    />
  );

  return (
    <div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {l:"Total",       v:stats.total, bg:C.bleuLight,  c:C.bleu},
          {l:"Locaux",      v:stats.local, bg:C.jauneClair, c:C.jaune},
          {l:"Validés",     v:stats.valid, bg:C.bleuLight,  c:C.bleu},
          {l:"Références",  v:stats.ref,   bg:C.vertClair,  c:C.vert},
        ].map(({l,v,bg,c})=>(
          <div key={l} style={{background:bg,border:`1px solid ${c}22`,borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
            <div style={{fontSize:11,color:c,fontWeight:600}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Barre d'outils */}
      <div style={{background:C.blanc,borderRadius:10,border:`1px solid ${C.border}`,padding:16,marginBottom:16,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{...iS,flex:"1 1 180px",minWidth:140}} placeholder="Rechercher…" value={recherche} onChange={e=>setRech(e.target.value)}/>
        <select style={{...iS,flex:"0 0 130px"}} value={filtreType} onChange={e=>setFT(e.target.value)}>
          <option value="">Tous types</option>
          <option value="taxe">Taxe</option>
          <option value="redevance">Redevance</option>
        </select>
        <select style={{...iS,flex:"0 0 200px"}} value={filtreCat} onChange={e=>setFC(e.target.value)}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
        <select style={{...iS,flex:"0 0 130px"}} value={filtreQ} onChange={e=>setFQ(e.target.value)}>
          <option value="">Toutes qualités</option>
          <option value="reference">Référence</option>
          <option value="valide">Validé</option>
          <option value="brouillon">Brouillon</option>
        </select>
        <button onClick={()=>{setEdit(null);setVue("form");}}
          style={{background:C.orange,color:C.blanc,border:"none",borderRadius:7,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
          + Ajouter
        </button>
        <button onClick={()=>exporterBiblio(biblio)}
          style={{background:C.bleuLight,color:C.bleu,border:`1px solid ${C.bleu}33`,borderRadius:7,padding:"9px 16px",fontSize:13,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>
          ⬇ Exporter JSON
        </button>
        <button onClick={publier} disabled={publication.busy}
          style={{background:publication.busy?C.gris:C.vert,color:C.blanc,border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,cursor:publication.busy?"not-allowed":"pointer",fontWeight:700,whiteSpace:"nowrap"}}>
          {publication.busy?"⏳ Publication…":"🚀 Publier dans le repo"}
        </button>
      </div>

      {publication.msg && (
        <div style={{marginBottom:14,padding:"10px 14px",background:publication.ok?C.vertClair:publication.ok===false?C.rougeClair:C.jauneClair,
          border:`1px solid ${publication.ok?C.vert:publication.ok===false?C.rouge:C.jaune}`,borderRadius:7,fontSize:13,
          color:publication.ok?C.vert:publication.ok===false?C.rouge:C.jaune}}>
          {publication.msg}
        </div>
      )}

      {/* Liste */}
      <div style={{fontSize:12,color:C.gris,marginBottom:10}}>{filtre.length} règlement(s) affiché(s)</div>
      <div style={{display:"grid",gap:10}}>
        {filtre.length===0 && (
          <div style={{background:C.blanc,borderRadius:10,border:`1px solid ${C.border}`,padding:32,textAlign:"center",color:C.gris}}>
            Aucun règlement ne correspond aux filtres.
          </div>
        )}
        {filtre.map(r=>{
          const q = bdgQ[r.qualite]||bdgQ.brouillon;
          const t = bdgT[r.type]||bdgT.taxe;
          return (
            <div key={r.id} style={{background:C.blanc,borderRadius:10,border:`1px solid ${C.border}`,padding:"14px 18px",display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                  <span style={{background:t.bg,color:t.c,padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{r.type}</span>
                  <span style={{background:q.bg,color:q.c,padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:600}}>{q.l}</span>
                  {r._local&&<span style={{background:C.jauneClair,color:C.jaune,padding:"2px 9px",borderRadius:10,fontSize:11}}>Local</span>}
                </div>
                <div style={{fontWeight:700,fontSize:14,color:C.bleu,marginBottom:2}}>{r.commune||"—"} {r.annee?`(${r.annee})`:""}</div>
                <div style={{fontSize:13,color:C.gris,marginBottom:4}}>{r.objet||r.titre||"—"}</div>
                <div style={{display:"flex",gap:12,fontSize:11,color:C.gris,flexWrap:"wrap"}}>
                  {r.categorie&&<span>{CATEGORIES.find(c=>c.slug===r.categorie)?.label||r.categorie}</span>}
                  {(r.visas||[]).length>0&&<span>📋 {r.visas.length} visa(s)</span>}
                  {(r.points_forts||[]).length>0&&<span>⭐ {r.points_forts.length} point(s) fort(s)</span>}
                  {r.points_forts_valides&&<span style={{color:C.vert}}>✅ Juriste</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>{setEdit(r);setVue("edit");}}
                  style={{background:C.bleuLight,color:C.bleu,border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>
                  ✏️
                </button>
                {r._local&&<button onClick={()=>supprimerEntree(r.id)}
                  style={{background:C.rougeClair,color:C.rouge,border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>
                  🗑️
                </button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PANEL PROFIL COMMUNE ─────────────────────────────────────────────────────
function PanelProfil({ profil, onSave, onClose }) {
  const [p, setP] = useState({
    typeCommune:"Commune", nomCommune:"", province:"", arrondissement:"",
    nomDG:"", titreDG:"Directeur général", logo:null,
    ...profil,
  });
  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));

  const handleLogo = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300_000) { alert("Image trop lourde (max 300 ko)."); return; }
    const reader = new FileReader();
    reader.onload = ev => upd("logo", ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.blanc,borderRadius:12,padding:28,width:"min(520px,92vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.22)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,color:C.bleu,fontSize:16}}>⚙️ Profil de la commune</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.gris,lineHeight:1}}>×</button>
        </div>

        <div style={{display:"grid",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12}}>
            <div>
              <label style={lS}>Type</label>
              <select style={iS} value={p.typeCommune} onChange={e=>upd("typeCommune",e.target.value)}>
                <option>Commune</option><option>Ville</option><option>CPAS</option>
              </select>
            </div>
            <div>
              <label style={lS}>Nom</label>
              <input style={iS} value={p.nomCommune} onChange={e=>upd("nomCommune",e.target.value)} placeholder="ex. : La Bruyère"/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={lS}>Province</label>
              <input style={iS} value={p.province} onChange={e=>upd("province",e.target.value)} placeholder="ex. : Namur"/>
            </div>
            <div>
              <label style={lS}>Arrondissement</label>
              <input style={iS} value={p.arrondissement} onChange={e=>upd("arrondissement",e.target.value)} placeholder="ex. : Namur"/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
            <div>
              <label style={lS}>Nom du Directeur général</label>
              <input style={iS} value={p.nomDG} onChange={e=>upd("nomDG",e.target.value)} placeholder="ex. : Fernand Flabat"/>
            </div>
            <div>
              <label style={lS}>Titre</label>
              <input style={iS} value={p.titreDG} onChange={e=>upd("titreDG",e.target.value)} placeholder="Directeur général"/>
            </div>
          </div>
          <div>
            <label style={lS}>Logo (PNG/JPG, max 300 ko)</label>
            {p.logo && <img src={p.logo} alt="logo" style={{height:50,marginBottom:6,display:"block",borderRadius:4,border:`1px solid ${C.border}`}}/>}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="file" accept="image/png,image/jpeg,image/gif" onChange={handleLogo} style={{fontSize:12}}/>
              {p.logo && <button onClick={()=>upd("logo",null)} style={{background:"none",border:"none",color:C.rouge,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Supprimer</button>}
            </div>
          </div>
          <div style={{marginTop:4,padding:"10px 14px",background:C.bleuLight,borderRadius:6,fontSize:12,color:C.bleu}}>
            Ces informations sont sauvegardées dans votre navigateur et pré-remplissent automatiquement l'en-tête de chaque export Word.
          </div>
        </div>

        <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:C.grisClair,color:C.gris,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 18px",fontSize:13,cursor:"pointer"}}>Annuler</button>
          <button onClick={()=>{ sauverProfil(p); onSave(p); onClose(); }}
            style={{background:C.bleu,color:C.blanc,border:"none",borderRadius:7,padding:"9px 22px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            💾 Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function App() {
  const [onglet, setOnglet] = useState("generer");
  const [biblio, setBiblio] = useState(()=>mergerBiblio());
  const [params, setParams] = useState({
    commune:"", ins:"", cp:"", province:"", arrondissement:"", population:null,
    nomCourt:"", adresse:"", emailGeneral:"", telephone:"",
    typeReglement:"taxe", sousTypeRedevance:"autorisation", categorie:"", sousCat:"", objet:"", dateSeance:"",
    periodeDebut: String(new Date().getFullYear()+1),
    periodeFin:   String(new Date().getFullYear()+6),
    redevable:"", tarif:"", exonerations:"", infoCompl:"",
  });
  const [mandataires, setMandataires] = useState([]);
  const [mandLoading, setMandLoading] = useState(false);
  const [presences, setPresences] = useState({});
  const [texteGenere, setTexteGenere] = useState("");
  const [texteVerif, setTexteVerif] = useState("");
  const [resultatsVerif, setResultatsVerif] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [etape, setEtape] = useState("formulaire");
  const [profil, setProfil] = useState(()=>chargerProfil());
  const [showProfil, setShowProfil] = useState(false);
  const streamRef = useRef("");

  const upd = (k,v) => setParams(p=>({...p,[k]:v}));

  const pickCommune = async c => {
    setParams(p=>({...p, commune:c.nom, ins:c.ins||"", cp:c.cp||"",
      province:"", arrondissement:"", nomCourt:c.nom_court||"",
      adresse:c.adresse||"", emailGeneral:c.email_general||"", telephone:c.telephone||"", population:null}));
    setMandataires([]); setPresences({});
    if (!c.ins) return;
    setMandLoading(true);
    try {
      const m = await getMandataires(c.ins);
      setMandataires(m); setPresences({});
      const first = m[0];
      if (first) setParams(p=>({...p, population:first.population||null, province:first.province||"", arrondissement:first.arrondissement||""}));
    } catch {}
    finally { setMandLoading(false); }
  };

  const generer = useCallback(async () => {
    if (!params.objet||!params.redevable||!params.tarif) { setErreur("Champs requis : objet, redevable et tarif."); return; }
    setErreur(""); setLoading(true); setTexteGenere(""); streamRef.current=""; setEtape("generation");
    const refs = trouverRefs(params.objet, params.typeReglement, params.categorie, biblio, params.sousCat);
    try {
      const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({model:"gpt-4o", max_tokens:6000, stream:true,
          messages:buildMessages(params,refs,mandataires,presences)}),
      });
      if (!res.ok) { const e=await res.text(); throw new Error(`API ${res.status} : ${e}`); }
      const reader=res.body.getReader(), dec=new TextDecoder();
      let buf="";
      const processLine = line => {
        if(!line.startsWith("data: ")) return;
        const d=line.slice(6).trim(); if(d==="[DONE]") return;
        try{ const delta=JSON.parse(d)?.choices?.[0]?.delta?.content||""; if(delta){streamRef.current+=delta; setTexteGenere(streamRef.current);} }catch{}
      };
      while(true){
        const {done,value}=await reader.read(); if(done) break;
        buf += dec.decode(value,{stream:true});
        const lines=buf.split("\n");
        buf=lines.pop(); // conserver la ligne incomplète pour le prochain chunk
        lines.forEach(processLine);
      }
      if(buf) processLine(buf); // traiter l'éventuel reste
      setEtape("resultat");
    } catch(e){ setErreur(`Erreur : ${e.message}`); setEtape("formulaire"); }
    finally{ setLoading(false); }
  }, [params, mandataires]);

  const handleExportDocx = async () => {
    try {
      const { exportDocx } = await import("./exportDocx.js");
      await exportDocx({ texteGenere, params, profil });
    } catch (e) {
      setErreur(`Export Word impossible : ${e.message}`);
    }
  };

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
  const SLUG_COMPAT = {"immondices":"dechets-environnement"};
  const catNorm = c => SLUG_COMPAT[c]||c;
  const nbRefs = biblio.filter(r=>r.type===params.typeReglement&&(!params.categorie||catNorm(r.categorie)===catNorm(params.categorie))&&r.qualite!=="insuffisante"&&r.qualite!=="brouillon").length;

  return (
    <div style={{fontFamily:"'Segoe UI',Arial,sans-serif",background:C.grisClair,minHeight:"100vh"}}>

      {showProfil && <PanelProfil profil={profil} onSave={setProfil} onClose={()=>setShowProfil(false)}/>}

      <div style={{background:C.bleu,color:C.blanc,padding:"14px 24px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{background:C.orange,borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:18}}>VB</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:16}}>Assistant Règlements — OrangeConnect</div>
          <div style={{fontSize:12,opacity:.75}}>Taxes et redevances wallonnes · v6 · {biblio.length} règlements</div>
        </div>
        <button onClick={()=>setShowProfil(true)}
          style={{background:"rgba(255,255,255,.15)",color:C.blanc,border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"7px 14px",fontSize:12,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>
          ⚙️ {profil.nomCommune || "Profil commune"}
        </button>
      </div>

      <div style={{background:C.blanc,borderBottom:`2px solid ${C.border}`,display:"flex",padding:"0 24px"}}>
        {[["generer","✏️ Rédiger"],["verifier","✅ Vérifier"],["bibliotheque","📚 Bibliothèque"]].map(([k,l])=>(
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
                  <PanelPresences mandataires={mandataires} presences={presences} onChange={setPresences}/>
                </div>

                <div style={{gridColumn:"1/-1"}}>
                  <label style={lS}>Catégorie <span style={{color:C.rouge}}>*</span></label>
                  <select style={iS} value={params.categorie}
                    onChange={e=>{upd("categorie",e.target.value); upd("sousCat","");}}>
                    <option value="">— Sélectionner une catégorie —</option>
                    {CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                </div>
                {params.categorie && (
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={lS}>Sous-catégorie</label>
                    <select style={iS} value={params.sousCat} onChange={e=>upd("sousCat",e.target.value)}>
                      <option value="">— Préciser la sous-catégorie (recommandé) —</option>
                      {(CATEGORIES.find(c=>c.slug===params.categorie)?.sous||[]).map(s=>(
                        <option key={s.slug} value={s.slug}>{s.label}</option>
                      ))}
                    </select>
                    <div style={{marginTop:5,fontSize:11,color:C.gris}}>
                      📚 {nbRefs} règlement(s) de référence disponible(s)
                      {params.sousCat && NOTES_SOUS_CAT[params.sousCat] && (
                        <span style={{marginLeft:8,color:C.orange,fontWeight:700}}>⚡ Exigences juridiques spécifiques disponibles</span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label style={lS}>Type d'acte</label>
                  <select style={iS} value={params.typeReglement} onChange={e=>upd("typeReglement",e.target.value)}>
                    <option value="taxe">Règlement-taxe (prélèvement unilatéral)</option>
                    <option value="redevance">Règlement-redevance (contrepartie directe)</option>
                  </select>
                </div>
                {params.typeReglement==="redevance" && (
                  <div>
                    <label style={lS}>Sous-type de redevance</label>
                    <select style={iS} value={params.sousTypeRedevance} onChange={e=>upd("sousTypeRedevance",e.target.value)}>
                      <option value="autorisation">Autorisation d'occupation (terrasse, enseigne, chantier…)</option>
                      <option value="service">Service rendu / usage (déchets, documents admin…)</option>
                    </select>
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1}}>
                    <label style={lS}>Date de séance</label>
                    <input type="date" style={iS} value={params.dateSeance} onChange={e=>upd("dateSeance",e.target.value)}/>
                  </div>
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
                    {etape==="resultat"&&<button onClick={handleExportDocx} style={{background:C.vertClair,color:C.vert,border:`1px solid ${C.vert}`,borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>⬇ Word</button>}
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

        {/* ══ ONGLET BIBLIOTHÈQUE ══ */}
        {onglet==="bibliotheque"&&(
          <OngletBibliotheque biblio={biblio} setBiblio={setBiblio}/>
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
