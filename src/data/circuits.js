export function nouveauCircuit() {
  return {
    id: `circuit-${Date.now()}`,
    label: '',
    dossiersoortId: '',
    approbateurs: [],
    signataires: [],
  };
}

export function nouveauApprobateur(ordre) {
  return { nom: '', email: '', role: '', ordre };
}

export function nouveauSignataire(ordre) {
  return { nom: '', email: '', role: '', ordre };
}
