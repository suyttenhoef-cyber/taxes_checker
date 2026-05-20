export function nouveauCircuit() {
  return { id: `circuit-${Date.now()}`, label: '', signataires: [] };
}

export function nouveauSignataire(ordre) {
  return { nom: '', email: '', role: '', ordre };
}
