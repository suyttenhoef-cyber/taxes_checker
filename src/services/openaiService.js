import { WORKER_URL } from '../config.js';

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

export async function extraireAvecIA(texte) {
  const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o', max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_EXTRACTION },
        { role: 'user',   content: texte.slice(0, 10000) },
      ],
    }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`API ${res.status} : ${e}`); }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function qualifierTexteIA(texteLibre, catList) {
  const system = `Tu es un expert en droit communal wallon. Analyse la description d'un DG et retourne UNIQUEMENT un objet JSON valide.
Règle taxe vs redevance :
- taxe = prélèvement unilatéral (l'administré a un bien, une activité, une situation) — pas de prestation de la commune en échange direct.
- redevance = contrepartie directe d'une autorisation accordée (sousTypeRedevance = "autorisation") ou d'un service rendu par la commune (sousTypeRedevance = "service").`;

  const user = `Description : "${texteLibre}"

Retourne exactement ce JSON (tous les champs requis) :
{
  "typeReglement": "taxe" ou "redevance",
  "sousTypeRedevance": "autorisation" | "service" | "",
  "categorie": "[slug parmi la liste]",
  "sousCat": "[slug sous-cat parmi la liste]",
  "objet": "[formulation officielle courte, 15 mots max]",
  "redevable": "[qui est redevable, 15 mots max]",
  "tarif": "[montant(s) et unité tels que mentionnés dans la description — chaîne vide si non précisé]",
  "exonerations": "[cas d'exonération mentionnés dans la description — chaîne vide si non précisé]",
  "explication": "[justification du choix taxe/redevance et catégorie, 2 phrases max]"
}

CATÉGORIES DISPONIBLES :
${catList}`;

  if (!WORKER_URL) throw new Error('VITE_WORKER_URL non configuré — vérifiez votre fichier .env');

  const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o', max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}${body ? ` : ${body.slice(0, 200)}` : ''}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function genererReglementStream(messages, onDelta) {
  const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', max_tokens: 6000, stream: true, messages }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`API ${res.status} : ${e}`); }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';

  const processLine = line => {
    if (!line.startsWith('data: ')) return;
    const d = line.slice(6).trim();
    if (d === '[DONE]') return;
    try {
      const delta = JSON.parse(d)?.choices?.[0]?.delta?.content || '';
      if (delta) onDelta(delta);
    } catch {}
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    lines.forEach(processLine);
  }
  if (buf) processLine(buf);
}
