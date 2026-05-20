export const DOC_TYPES = [
  {
    id: 'deliberation',
    label: 'Délibération',
    icon: '📋',
    desc: 'Acte de décision du conseil ou collège communal',
    hasAI: true,
    btnIA: 'Générer la délibération',
  },
  {
    id: 'rapport',
    label: 'Rapport',
    icon: '📝',
    desc: "Note de présentation d'un point à l'organe délibérant",
    hasAI: true,
    btnIA: 'Générer le rapport',
  },
  {
    id: 'ordre_du_jour',
    label: 'Ordre du jour',
    icon: '📅',
    desc: 'Liste des points et convocation de séance',
    hasAI: false,
  },
  {
    id: 'proces_verbal',
    label: 'Procès-verbal',
    icon: '🗒️',
    desc: 'Compte-rendu officiel de séance',
    hasAI: false,
  },
];

export const INSTANCES = [
  { id: 'conseil', label: 'Conseil communal' },
  { id: 'college', label: 'Collège communal' },
];

export function videParams(type) {
  switch (type) {
    case 'deliberation':
      return { instance: 'conseil', dateSeance: '', objet: '', service: '', visas: '', infosCompl: '' };
    case 'rapport':
      return { instance: 'conseil', dateSeance: '', objet: '', service: '', infosCompl: '' };
    case 'ordre_du_jour':
      return { instance: 'conseil', dateSeance: '', lieu: '', heure: '', points: [{ intitule: '', huis_clos: false }] };
    case 'proces_verbal':
      return { instance: 'conseil', dateSeance: '', heureOuverture: '', heureCloture: '', presences: '', points: [{ intitule: '', resume: '' }] };
    default:
      return { instance: 'conseil', dateSeance: '' };
  }
}
