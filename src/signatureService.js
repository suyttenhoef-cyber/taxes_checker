const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';

async function uploadDocument(docxBlob, fileName) {
  const form = new FormData();
  form.append('pdfFile', docxBlob, fileName);

  const res = await fetch(`${WORKER_URL}/esignflow/upload`, {
    method: 'POST',
    body:   form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload eSignFlow erreur ${res.status}`);
  }

  const data = await res.json();
  return data.FileId;
}

async function creerDossier({ fileId, fileName, params, profil }) {
  const commune = profil?.nomCommune || 'commune';
  const annee   = params?.periodeDebut
    ? new Date(params.periodeDebut + '-01-01').getFullYear()
    : new Date().getFullYear();
  const objet   = params?.objet || 'règlement';

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const payload = {
    Documents: [
      {
        FileId:       fileId,
        FileName:     fileName,
        Title:        `Règlement-taxe — ${commune} ${annee}`,
        FileTitle:    `reglement_taxe_${commune}_${annee}`.toLowerCase().replace(/\s+/g, '_'),
        InternalNote: `Généré via Tax Checker (OrangeConnect — Vanden Broele). Objet : ${objet}`,
        ExternalNote: '',
        LanguageId:   2,
        DocumentType: 0,
        RequiresEid:  true,
        SendByPost:   false,
        ValidUntil:   validUntil.toISOString(),
        ReminderDays: 3,
        IsDraft:      false,
        Signers: [
          { UserEmail: 'sebastien.uyttenhoef@vandenbroele.be', Order: 1 },
          { UserEmail: 'jullie.lesuisse@vandenbroele.be',      Order: 2 },
        ],
        Approvers:      [],
        Receivers:      [],
        Attachments:    [],
        DestinationIds: [],
      },
    ],
  };

  const res = await fetch(`${WORKER_URL}/esignflow/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Création dossier eSignFlow erreur ${res.status}`);
  }

  return await res.json();
}

/**
 * Upload le DOCX et crée le dossier eSignFlow.
 * Les emails des signataires sont injectés par le Worker (secrets).
 */
export async function envoyerPourSignature({ docxBlob, params, profil }) {
  const commune  = profil?.nomCommune || 'commune';
  const annee    = params?.periodeDebut || new Date().getFullYear();
  const fileName = `reglement_taxe_${commune}_${annee}.docx`
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');

  const fileId  = await uploadDocument(docxBlob, fileName);
  const dossier = await creerDossier({ fileId, fileName, params, profil });

  return {
    dossierId: dossier.Id || dossier.Documents?.[0]?.Id,
    statut:    'en_attente',
  };
}

export async function consulterStatut(dossierId) {
  const res = await fetch(`${WORKER_URL}/esignflow/status/${dossierId}`);
  if (!res.ok) throw new Error(`Statut introuvable pour dossier ${dossierId}`);

  const data      = await res.json();
  const signers   = data.Documents?.[0]?.Signers || [];
  const tousSignes = signers.length > 0 && signers.every(s => s.Status === 2);
  const unRefuse   = signers.some(s => s.Status === 3);
  const expire     = data.Documents?.[0]?.ValidUntil &&
                     new Date(data.Documents[0].ValidUntil) < new Date();

  let statut = 'en_attente';
  if (tousSignes)    statut = 'signe';
  else if (unRefuse) statut = 'refuse';
  else if (expire)   statut = 'expire';

  return { statut, signers, raw: data };
}

const POLLING_SCHEDULE = [
  5  * 60 * 1000,
  10 * 60 * 1000,
  20 * 60 * 1000,
  30 * 60 * 1000,
];

export function demarrerPolling(dossierId, { onUpdate, onComplete }) {
  let step = 0;
  let timeoutId;

  function scheduleNext() {
    const delai = POLLING_SCHEDULE[Math.min(step, POLLING_SCHEDULE.length - 1)];
    step++;
    timeoutId = setTimeout(async () => {
      try {
        const { statut, signers } = await consulterStatut(dossierId);
        onUpdate({ statut, signers });

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
