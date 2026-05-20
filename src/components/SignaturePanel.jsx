import { useState, useEffect, useRef } from 'react';
import { envoyerPourSignature, demarrerPolling } from '../services/signatureService.js';

function statusLabel(status) {
  return { 0: '⏳ En attente', 1: '📧 Notifié', 2: '✅ Signé', 3: '❌ Refusé' }[status] ?? '—';
}

function Badge({ colorClass, children }) {
  return (
    <div className={`inline-block px-3 py-1 rounded-full font-bold text-[13px] mb-3 border ${colorClass}`}>
      {children}
    </div>
  );
}

function Panel({ children }) {
  return <div className="vb-card text-center">{children}</div>;
}

function SignersList({ signataires }) {
  return (
    <p className="text-vb-bleu text-[13px] mb-5">
      {signataires.map((s, i) => (
        <span key={i}>
          {i > 0 && <span className="text-vb-gris mx-1">→</span>}
          <strong>{s.nom || s.email}</strong>
          {s.role ? <span className="text-vb-gris"> ({s.role})</span> : null}
        </span>
      ))}
    </p>
  );
}

export default function SignaturePanel({ docxBlob, params, profil, onSigne }) {
  const circuits = profil?.circuits || [];
  const [circuitId,  setCircuitId]  = useState(() => circuits[0]?.id ?? null);
  const [etape,      setEtape]      = useState('pret');
  const [dossierId,  setDossierId]  = useState(null);
  const [signers,    setSigners]    = useState([]);
  const [erreur,     setErreur]     = useState(null);
  const [signedBlob, setSignedBlob] = useState(null);
  const annulerRef = useRef(null);

  useEffect(() => () => annulerRef.current?.(), []);

  const activeCircuit = circuits.find(c => c.id === circuitId) || circuits[0] || null;

  async function lancerSignature() {
    try {
      setEtape('envoi'); setErreur(null);
      const { dossierId: id } = await envoyerPourSignature({
        docxBlob, params, profil, circuit: activeCircuit,
      });
      setDossierId(id);
      setEtape('en_attente');
      annulerRef.current = demarrerPolling(id, {
        onUpdate:   ({ signers: s }) => setSigners(s),
        onComplete: ({ statut, blob }) => {
          if (statut === 'signe') { setSignedBlob(blob); onSigne({ blob, dossierId: id }); }
          setEtape(statut);
        },
      });
    } catch (err) {
      setErreur(err.message); setEtape('erreur');
    }
  }

  function telechargerSigne(blob) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement('a'), {
      href: url, download: `reglement_signe_${params?.commune || ''}_${Date.now()}.pdf`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  if (etape === 'pret') return (
    <Panel>
      <div className="text-[40px] mb-3">✍️</div>
      <p className="text-vb-bleu font-bold text-[15px] mb-2">Prêt à envoyer pour signature électronique</p>

      {circuits.length > 1 && (
        <div className="mb-4 text-left max-w-[360px] mx-auto">
          <label className="vb-label">Circuit de signature</label>
          <select className="vb-input" value={circuitId || ''} onChange={e => setCircuitId(e.target.value)}>
            {circuits.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      )}

      {activeCircuit ? (
        <>
          <p className="text-vb-gris text-[13px] mb-1">
            {circuits.length <= 1 && <span className="font-semibold">{activeCircuit.label} — </span>}
            Le document sera envoyé séquentiellement à :
          </p>
          <SignersList signataires={activeCircuit.signataires} />
        </>
      ) : (
        <>
          <p className="text-vb-gris text-[13px] mb-1">Le règlement généré sera envoyé séquentiellement à :</p>
          <p className="text-vb-bleu text-[13px] mb-5">
            <strong>Sébastien Uyttenhoef</strong> (DG — ordre 1) →{' '}
            <strong>Julie Lesuisse</strong> (Bourgmestre — ordre 2)
          </p>
        </>
      )}

      <button
        onClick={lancerSignature} disabled={!docxBlob}
        className="vb-btn bg-vb-orange text-white px-6 py-2.5 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Envoyer pour signature
      </button>

      {!docxBlob && (
        <p className="text-vb-gris text-[12px] mt-2.5">
          Générez d'abord le règlement et téléchargez-le en Word (⬇ Word) pour activer l'envoi.
        </p>
      )}

      {circuits.length === 0 && (
        <p className="text-vb-gris text-[11px] mt-3 opacity-75">
          Conseil : configurez des circuits réutilisables dans ⚙️ Profil commune.
        </p>
      )}
    </Panel>
  );

  if (etape === 'envoi') return (
    <Panel>
      <div className="text-[32px] mb-3">⏳</div>
      <p className="text-vb-bleu font-semibold">Envoi vers eSignFlow en cours…</p>
    </Panel>
  );

  if (etape === 'en_attente') return (
    <Panel>
      <Badge colorClass="bg-vb-jaune-clair text-vb-jaune border-vb-jaune/40">En attente de signature</Badge>
      <ul className="list-none p-0 m-0 mb-4 text-left inline-block">
        {signers.length > 0
          ? signers.map((s, i) => (
              <li key={i} className="py-1.5 text-[13px] text-vb-bleu">{s.UserEmail} — {statusLabel(s.Status)}</li>
            ))
          : (activeCircuit?.signataires || []).map((s, i) => (
              <li key={i} className="py-1.5 text-[13px] text-vb-bleu">
                {s.email} — ⏳ En attente
              </li>
            ))
        }
      </ul>
      <p className="text-vb-gris text-[12px] mb-4">Vérification automatique toutes les 5 à 30 minutes.</p>
      <button className="vb-btn bg-vb-gris-clair text-vb-gris border border-vb-border px-5 py-2"
        onClick={() => { annulerRef.current?.(); setEtape('pret'); }}>
        Annuler
      </button>
    </Panel>
  );

  if (etape === 'signe') return (
    <Panel>
      <div className="text-[40px] mb-2">🎉</div>
      <Badge colorClass="bg-vb-vert-clair text-vb-vert border-vb-vert/40">✓ Signé</Badge>
      <p className="text-vb-bleu text-[13px] mb-4">Le document a été signé par tous les signataires.</p>
      {signedBlob && (
        <button className="vb-btn bg-vb-vert text-white px-6 py-2.5 text-[14px]" onClick={() => telechargerSigne(signedBlob)}>
          ⬇ Télécharger le PDF/A signé
        </button>
      )}
    </Panel>
  );

  if (etape === 'refuse') return (
    <Panel>
      <Badge colorClass="bg-vb-rouge-clair text-vb-rouge border-vb-rouge/40">✗ Signature refusée</Badge>
      <p className="text-vb-gris text-[13px] mb-4">Un des signataires a refusé de signer.</p>
      <button className="vb-btn bg-vb-orange text-white px-6 py-2.5" onClick={() => setEtape('pret')}>Renvoyer</button>
    </Panel>
  );

  if (etape === 'expire') return (
    <Panel>
      <Badge colorClass="bg-vb-gris-clair text-vb-gris border-vb-border">Délai expiré</Badge>
      <p className="text-vb-gris text-[13px] mb-4">La demande de signature a expiré (30 jours).</p>
      <button className="vb-btn bg-vb-orange text-white px-6 py-2.5" onClick={() => setEtape('pret')}>Renvoyer</button>
    </Panel>
  );

  if (etape === 'erreur') return (
    <Panel>
      <Badge colorClass="bg-vb-rouge-clair text-vb-rouge border-vb-rouge/40">Erreur</Badge>
      <p className="text-vb-rouge text-[13px] mb-4">{erreur}</p>
      <button className="vb-btn bg-vb-orange text-white px-6 py-2.5" onClick={() => setEtape('pret')}>Réessayer</button>
    </Panel>
  );
}
