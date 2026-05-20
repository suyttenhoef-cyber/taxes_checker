import { WORKER_URL } from '../config.js';

const SYSTEM_DOC = `Tu es un juriste administratif expert en droit communal belge (Wallonie/Région wallonne).
Tu rédiges des documents officiels pour des communes wallonnes selon les règles du Code de la démocratie locale et de la décentralisation (CDLD).
Style : formel, juridique, français administratif belge. Rédige uniquement le document demandé, sans commentaires ni explications.`;

function fmtDate(dateStr) {
  if (!dateStr) return '[DATE DE SÉANCE]';
  return new Date(dateStr + 'T12:00:00')
    .toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function instLabel(instance) {
  return instance === 'college' ? 'Collège communal' : 'Conseil communal';
}

function buildDeliberationPrompt(params, profil) {
  const inst = instLabel(params.instance);
  const commune = profil?.nomCommune || 'la commune';
  const dg = profil?.nomDG || '[DIRECTEUR GÉNÉRAL]';
  const titreDG = profil?.titreDG || 'Directeur général';

  return `Rédige une délibération complète pour le ${inst} de la ${profil?.typeCommune || 'Commune'} de ${commune}, séance du ${fmtDate(params.dateSeance)}.

**Objet :** ${params.objet}
**Service initiateur :** ${params.service || 'Administration communale'}
**Visas légaux fournis :** ${params.visas || 'à compléter selon la matière (VU le CDLD art. 117 ; VU…)'}
**Contexte et informations :** ${params.infosCompl || 'aucune information complémentaire'}
**${titreDG} :** ${dg}

**Structure obligatoire :**
1. Titre centré : DÉLIBÉRATION — ${inst.toUpperCase()}
2. Ligne : Séance du ${fmtDate(params.dateSeance)}
3. PRÉSENTS : [liste à compléter par l'administration]
4. ABSENT(E)(S) EXCUSÉ(E)(S) : [liste]
5. **OBJET :** ${params.objet}  (en gras)
6. Visas : VU…; VU…; (un par ligne, point-virgule)
7. Considérants : ATTENDU QUE…; CONSIDÉRANT QUE…;
8. Formule : LE ${inst.toUpperCase()}, statuant [à l'unanimité / à la majorité des voix],
9. DÉCIDE :
10. Art. 1er. [dispositif principal]
    Art. 2. [transmission / publication si pertinent]
11. Bloc signature (2 colonnes) :
    Le ${titreDG},        Le Bourgmestre${params.instance === 'college' ? '/Président' : ''},
    ${dg}                 [NOM]`;
}

function buildRapportPrompt(params, profil) {
  const inst = instLabel(params.instance);
  const commune = profil?.nomCommune || 'la commune';
  const dg = profil?.nomDG || '[DIRECTEUR GÉNÉRAL]';
  const titreDG = profil?.titreDG || 'Directeur général';

  return `Rédige un rapport complet destiné au ${inst} de ${commune}, séance du ${fmtDate(params.dateSeance)}.

**Objet :** ${params.objet}
**Service :** ${params.service || 'Administration communale'}
**Contexte :** ${params.infosCompl || 'aucune information complémentaire'}
**${titreDG} :** ${dg}

**Structure obligatoire :**
1. Titre : RAPPORT AU ${inst.toUpperCase()}
2. Séance du ${fmtDate(params.dateSeance)}
3. SERVICE : ${params.service || 'Administration communale'}
4. OBJET : ${params.objet}
5. ---
6. 1. CONTEXTE ET HISTORIQUE
   [2-3 paragraphes de contexte factuel et réglementaire]
7. 2. ANALYSE
   [analyse technique et juridique, enjeux, options]
8. 3. PROPOSITION DE DÉCISION
   [formulation précise de la décision proposée à l'organe]
9. Signature : Le ${titreDG}, ${dg}`;
}

async function streamOpenAI(prompt, onDelta) {
  const res = await fetch(`${WORKER_URL}/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_DOC },
        { role: 'user',   content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Erreur API OpenAI : ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6);
      if (d === '[DONE]') return;
      try {
        const delta = JSON.parse(d).choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {}
    }
  }
}

export async function genererDocumentStream(type, params, profil, onDelta) {
  if (type === 'deliberation') {
    return streamOpenAI(buildDeliberationPrompt(params, profil), onDelta);
  }
  if (type === 'rapport') {
    return streamOpenAI(buildRapportPrompt(params, profil), onDelta);
  }
  throw new Error('Type de document non supporté pour la génération IA.');
}

export function construireTexteOdJ(params, profil) {
  const inst = instLabel(params.instance).toUpperCase();
  const commune = (profil?.nomCommune || '[COMMUNE]').toUpperCase();
  const typeComm = (profil?.typeCommune || 'Commune').toUpperCase();
  const dg = profil?.nomDG || '[DIRECTEUR GÉNÉRAL]';
  const titre = profil?.titreDG || 'Directeur général';
  const date = fmtDate(params.dateSeance).toUpperCase();

  const points = (params.points || [])
    .map((p, i) => `${i + 1}. ${p.intitule || '[Point à compléter]'}${p.huis_clos ? '  [huis clos]' : ''}`)
    .join('\n');

  return `ORDRE DU JOUR — ${inst}
${typeComm} DE ${commune}

Madame, Monsieur,

J'ai l'honneur de vous convoquer à la prochaine réunion du ${instLabel(params.instance).toLowerCase()} qui se tiendra :

Date    : ${date}
Heure   : ${params.heure || '[HEURE]'}
Lieu    : ${params.lieu || '[LIEU]'}

ORDRE DU JOUR :

${points || '1. [Point à compléter]'}

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${titre},
${dg}`;
}

export function construireTextePV(params, profil) {
  const inst = instLabel(params.instance).toUpperCase();
  const commune = (profil?.nomCommune || '[COMMUNE]').toUpperCase();
  const typeComm = (profil?.typeCommune || 'Commune').toUpperCase();
  const dg = profil?.nomDG || '[DIRECTEUR GÉNÉRAL]';
  const titre = profil?.titreDG || 'Directeur général';
  const date = fmtDate(params.dateSeance).toUpperCase();

  const points = (params.points || [])
    .map((p, i) => {
      const header = `${i + 1}. ${p.intitule || '[Intitulé du point]'}`;
      return p.resume ? `${header}\n\n${p.resume}` : header;
    })
    .join('\n\n---\n\n');

  return `PROCÈS-VERBAL
${inst} — ${typeComm} DE ${commune}
Séance du ${date}

${params.presences
  ? `PRÉSENTS : ${params.presences}`
  : 'PRÉSENTS : [liste des membres présents et qualités]'}

La séance est ouverte à ${params.heureOuverture || '[HEURE]'} sous la présidence de [LE(LA) PRÉSIDENT(E)].

---

${points || '1. [Point de l\'ordre du jour]'}

---

La séance est levée à ${params.heureCloture || '[HEURE]'}.

Pour extrait conforme,

${titre},                         Le Bourgmestre${params.instance === 'college' ? '/Président(e)' : ''},
${dg}                             [NOM]`;
}
