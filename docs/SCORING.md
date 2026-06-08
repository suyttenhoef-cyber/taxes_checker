# Calcul du score de conformité — Tax Checker

## Principe

Le score global (0–100) est calculé de façon **déterministe** à partir des findings réels retournés par les 5 agents IA. Il ne dépend pas d'une estimation subjective de GPT-4o.

---

## Formule

```
score = 100 − (Nc × 15) − (Na × 4)
score = max(0, score)

si Nc ≥ 1 : score = min(score, 59)   ← plafond zone critique
```

| Variable | Définition |
|----------|-----------|
| `Nc` | Nombre de findings `critique` (article obligatoire absent ou manifestement erroné) |
| `Na` | Nombre de findings `ameliorer` (présent mais à corriger pour la qualité) |

Les findings `conforme` (vert) n'entrent pas dans le calcul — ils valident sans pénaliser.

---

## Zones et niveaux

| Score | Niveau | Interprétation |
|-------|--------|---------------|
| 90 – 100 | **Excellent** | Aucun problème identifié |
| 80 – 89 | **Bon** | Quelques améliorations mineures (1–5 `ameliorer`) |
| 70 – 79 | **Acceptable** | Plusieurs points à améliorer (6–7 `ameliorer`) |
| 60 – 69 | **À améliorer** | Nombreux points à corriger (8–10 `ameliorer`) |
| 0 – 59 | **Insuffisant** | Au moins un point `critique` présent |

Le plafond à 59 garantit que tout règlement avec un `critique` reste dans la zone rouge, quelle que soit la qualité du reste du texte.

---

## Exemples

| Nc | Na | Calcul | Cap | Score | Niveau |
|----|----|--------|-----|-------|--------|
| 0 | 0 | 100 | — | **100** | Excellent |
| 0 | 1 | 96 | — | **96** | Excellent |
| 0 | 3 | 88 | — | **88** | Bon |
| 0 | 5 | 80 | — | **80** | Bon |
| 0 | 6 | 76 | — | **76** | Acceptable |
| 0 | 10 | 60 | — | **60** | À améliorer |
| 0 | 15 | 40 | — | **40** | Insuffisant |
| 1 | 0 | 85 | 59 | **59** | Insuffisant |
| 1 | 3 | 73 | 59 | **59** | Insuffisant |
| 2 | 0 | 70 | 59 | **59** | Insuffisant |
| 3 | 0 | 55 | — | **55** | Insuffisant |
| 4 | 2 | 32 | — | **32** | Insuffisant |
| 6 | 0 | 10 | — | **10** | Insuffisant |

> **Remarque :** avec 1 ou 2 critiques, le plafond à 59 s'applique (les deux donnent 59). À partir de 3 critiques, la formule donne naturellement un score inférieur à 59 — la différenciation est assurée par le calcul.

---

## Implémentation

Fichier : [`src/services/verificationIAService.js`](../src/services/verificationIAService.js)

```javascript
const POIDS_FINDING = { critique: 15, ameliorer: 4 };

function calculerScore(agents) {
  const findings = agents
    .filter(a => a.ok)
    .flatMap(a => a.result?.findings || []);

  const Nc = findings.filter(f => f.gravite === 'critique').length;
  const Na = findings.filter(f =>
    f.gravite === 'ameliorer' || f.gravite === 'majeur' || f.gravite === 'mineur'
  ).length;

  let score = 100 - (Nc * POIDS_FINDING.critique) - (Na * POIDS_FINDING.ameliorer);
  score = Math.max(0, score);
  if (Nc >= 1) score = Math.min(score, 59);

  return Math.round(score);
}

function scoreToNiveau(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'bon';
  if (score >= 70) return 'acceptable';
  if (score >= 60) return 'a_ameliorer';
  return 'insuffisant';
}
```

Le score GPT éventuellement retourné par l'agent de synthèse est **ignoré et remplacé** par ce calcul déterministe après l'agrégation des findings.

---

## Ce que le score ne mesure pas

- **La qualité rédactionnelle** — deux règlements avec les mêmes findings ont le même score, même si l'un est mieux rédigé.
- **La pondération par domaine** — les 5 agents (qualification, visas, structure, droits, cohérence) contribuent de façon égale au pool de findings.
- **La criticité relative entre critiques** — un critère absent vaut 15 points, qu'il s'agisse d'un visa ou de l'article réclamation.

Ces choix sont volontaires pour garder le calcul simple, reproductible et auditable.
