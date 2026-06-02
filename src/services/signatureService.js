const WORKER_URL    = import.meta.env.VITE_WORKER_URL || '';
const DOSSIERS_KEY  = 'vb_esignflow_dossiers';

// ─── Local dossier storage ────────────────────────────────────────────────────

export function lireDossiersLocaux() {
  try { return JSON.parse(localStorage.getItem(DOSSIERS_KEY) || '[]'); }
  catch { return []; }
}

export function sauverDossierLocal(dossier) {
  const existing = lireDossiersLocaux();
  const updated  = [dossier, ...existing.filter(d => d.id !== dossier.id)];
  localStorage.setItem(DOSSIERS_KEY, JSON.stringify(updated.slice(0, 100)));
}

export function mettreAJourStatutLocal(id, statut) {
  const existing = lireDossiersLocaux();
  localStorage.setItem(DOSSIERS_KEY, JSON.stringify(
    existing.map(d => d.id === id ? { ...d, statut, dateMaj: new Date().toISOString() } : d)
  ));
}

// ─── eSignFlow API ────────────────────────────────────────────────────────────

export async function chargerDossiersoorts() {
  try {
    const res = await fetch(`${WORKER_URL}/esignflow/dossiersoorts`);
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function uploadDocument(docxBlob, fileName) {
  const form = new FormData();
  form.append('pdfFile', docxBlob, fileName);

  const res = await fetch(`${WORKER_URL}/esignflow/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload eSignFlow erreur ${res.status}`);
  }

  const data = await res.json();
  const fileId = typeof data === 'string' ? data : (data.FileId ?? data.fileId ?? data.Id ?? data.id);
  if (!fileId) throw new Error(`Upload eSignFlow : FileId introuvable — réponse: ${JSON.stringify(data)}`);
  return fileId;
}

async function creerDossier({ fileId, fileName, params, profil, circuit, docLabel }) {
  const commune = profil?.nomCommune || 'commune';
  const annee   = params?.periodeDebut
    ? new Date(params.periodeDebut + '-01-01').getFullYear()
    : (params?.dateSeance ? new Date(params.dateSeance).getFullYear() : new Date().getFullYear());
  const objet   = params?.objet || docLabel || 'document';

  const signers    = circuit?.signataires?.length > 0
    ? circuit.signataires.map(s => ({ UserEmail: s.email, Order: s.ordre }))
    : null;
  const approvers  = circuit?.approbateurs?.length > 0
    ? circuit.approbateurs.map(a => ({ UserEmail: a.email, Order: a.ordre }))
    : [];
  const dossiersoortId = circuit?.dossiersoortId ? Number(circuit.dossiersoortId) : 3324;

  const title = docLabel
    ? `${docLabel} — ${commune} ${annee}`
    : `Règlement-taxe — ${commune} ${annee}`;

  const payload = {
    DossiersoortId: dossiersoortId,
    Documents: [{
      FileId:       fileId,
      FileName:     fileName,
      Title:        title,
      FileTitle:    title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
                         .replace(/[^a-z0-9_]+/g, '_').slice(0, 60),
      InternalNote: `Généré via Tax Checker (OrangeConnect — Vanden Broele). Objet : ${objet}`,
      ExternalNote: '',
      LanguageId:   2,
      IsDraft:      false,
      Approvers:    approvers,
      Receivers:    [],
      ...(signers ? { Signers: signers } : {}),
    }],
  };

  const res = await fetch(`${WORKER_URL}/esignflow/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    const err = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
    throw new Error(err.Message || err.message || `Création dossier eSignFlow erreur ${res.status}: ${raw}`);
  }

  return await res.json();
}

export async function envoyerPourSignature({ docxBlob, params, profil, circuit, docLabel, docType }) {
  const commune  = profil?.nomCommune || 'commune';
  const annee    = params?.periodeDebut || params?.dateSeance?.slice(0, 4) || new Date().getFullYear();
  const slug     = (docLabel || 'document').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_');
  const fileName = `${slug}_${commune}_${annee}.docx`
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');

  const fileId  = await uploadDocument(docxBlob, fileName);
  const dossier = await creerDossier({ fileId, fileName, params, profil, circuit, docLabel });

  const dossierId = dossier.Id || dossier.Documents?.[0]?.Id;
  if (dossierId) {
    sauverDossierLocal({
      id:           dossierId,
      titre:        docLabel ? `${docLabel} — ${commune}` : `Règlement — ${commune}`,
      type:         docType || 'reglement',
      commune,
      circuit:      circuit ? { label: circuit.label, nbApp: circuit.approbateurs?.length || 0, nbSig: circuit.signataires?.length || 0 } : null,
      dateCreation: new Date().toISOString(),
      statut:       'en_attente',
    });
  }

  return { dossierId, statut: 'en_attente' };
}

export async function consulterStatut(dossierId) {
  const res = await fetch(`${WORKER_URL}/esignflow/status/${dossierId}`);
  if (!res.ok) throw new Error(`Statut introuvable pour dossier ${dossierId}`);

  const data      = await res.json();
  const doc       = data.Documents?.[0] || {};
  const signers   = doc.Signers   || [];
  const approvers = doc.Approvers || [];

  const tousSignes  = signers.length > 0 && signers.every(s => s.Status === 2);
  const unRefuse    = [...signers, ...approvers].some(s => s.Status === 3);
  const expire      = doc.ValidUntil && new Date(doc.ValidUntil) < new Date();

  let statut = 'en_attente';
  if (tousSignes)    statut = 'signe';
  else if (unRefuse) statut = 'refuse';
  else if (expire)   statut = 'expire';

  return { statut, signers, approvers, raw: data };
}

const POLLING_SCHEDULE = [5, 10, 20, 30].map(m => m * 60 * 1000);

export function demarrerPolling(dossierId, { onUpdate, onComplete }) {
  let step = 0;
  let timeoutId;

  function scheduleNext() {
    const delai = POLLING_SCHEDULE[Math.min(step, POLLING_SCHEDULE.length - 1)];
    step++;
    timeoutId = setTimeout(async () => {
      try {
        const { statut, signers, approvers } = await consulterStatut(dossierId);
        onUpdate({ statut, signers, approvers });
        mettreAJourStatutLocal(dossierId, statut);

        if (statut === 'signe') {
          const blob = await recupererDocumentSigne(dossierId);
          onComplete({ statut: 'signe', blob });
        } else if (statut === 'refuse' || statut === 'expire') {
          onComplete({ statut });
        } else {
          scheduleNext();
        }
      } catch (err) {
        console.warn('Polling eSignFlow:', err.message);
        scheduleNext();
      }
    }, delai);
  }

  scheduleNext();
  return () => clearTimeout(timeoutId);
}

export async function recupererDocumentSigne(dossierId) {
  const res = await fetch(`${WORKER_URL}/esignflow/download/${dossierId}`);
  if (!res.ok) throw new Error(`Téléchargement impossible — dossier ${dossierId}`);
  return await res.blob();
}
