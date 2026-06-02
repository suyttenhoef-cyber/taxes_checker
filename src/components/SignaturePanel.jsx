import { useState, useEffect, useRef } from 'react';
import { envoyerPourSignature, demarrerPolling } from '../services/signatureService.js';
import { nouveauApprobateur, nouveauSignataire } from '../data/circuits.js';

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
  return <div className="vb-card">{children}</div>;
}

// ─── Affichage visuel du circuit ──────────────────────────────────────────────

function CircuitFlow({ approbateurs = [], signataires = [], liveApprovers = [], liveSigners = [] }) {
  const mergeStatus = (list, live, emailKey = 'email') =>
    list.map((p, i) => {
      const found = live.find(l => l.UserEmail?.toLowerCase() === p[emailKey]?.toLowerCase());
      return { ...p, liveStatus: found?.Status };
    });

  const apps  = mergeStatus(approbateurs, liveApprovers);
  const sigs  = mergeStatus(signataires,  liveSigners);
  const hasApps = apps.length > 0;

  return (
    <div className="my-4 text-left">
      {hasApps && (
        <>
          <div className="text-[11px] font-semibold text-vb-gris mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-vb-jaune inline-block"></span>
            Approbateurs (validation avant signature)
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {apps.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-vb-jaune-clair border border-vb-jaune/30 rounded-lg px-2.5 py-1.5">
                <span className="text-[12px]">
                  {a.liveStatus !== undefined ? statusLabel(a.liveStatus) : '⏳'}
                </span>
                <div>
                  <div className="text-[12px] font-semibold text-vb-bleu">{a.nom || a.email}</div>
                  {a.role && <div className="text-[10px] text-vb-gris">{a.role}</div>}
                </div>
                {i < apps.length - 1 && <span className="text-vb-gris text-[12px] ml-1">→</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-vb-border"></div>
            <span className="text-[10px] text-vb-gris">puis</span>
            <div className="flex-1 h-px bg-vb-border"></div>
          </div>
        </>
      )}
      <div className="text-[11px] font-semibold text-vb-gris mb-1.5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-vb-vert inline-block"></span>
        Signataires (eID requis)
      </div>
      <div className="flex flex-wrap gap-2">
        {sigs.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-vb-vert-clair border border-vb-vert/30 rounded-lg px-2.5 py-1.5">
            <span className="text-[12px]">
              {s.liveStatus !== undefined ? statusLabel(s.liveStatus) : '⏳'}
            </span>
            <div>
              <div className="text-[12px] font-semibold text-vb-bleu">{s.nom || s.email}</div>
              {s.role && <div className="text-[10px] text-vb-gris">{s.role}</div>}
            </div>
            {i < sigs.length - 1 && <span className="text-vb-gris text-[12px] ml-1">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Formulaire ajout ad-hoc ──────────────────────────────────────────────────

function AdHocForm({ type, onAdd, onCancel }) {
  const [p, setP] = useState(type === 'approbateur' ? nouveauApprobateur(1) : nouveauSignataire(1));
  const ok = p.nom.trim() && p.email.includes('@');
  return (
    <div className="border border-vb-bleu/20 rounded-lg p-3 bg-vb-bleu-light/40 mt-2 text-left">
      <div className="text-[12px] font-semibold text-vb-bleu mb-2">
        + Ajouter un {type === 'approbateur' ? 'approbateur ad-hoc' : 'signataire ad-hoc'}
      </div>
      <div className="flex gap-2 mb-2">
        <input className="vb-input flex-1" placeholder="Nom" value={p.nom}
          onChange={e => setP(x => ({ ...x, nom: e.target.value }))} />
        <input className="vb-input flex-[2]" placeholder="email@vandenbroele.be" value={p.email}
          onChange={e => setP(x => ({ ...x, email: e.target.value }))} />
        <input className="vb-input flex-1" placeholder="Rôle" value={p.role}
          onChange={e => setP(x => ({ ...x, role: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => ok && onAdd(p)} disabled={!ok}
          className="vb-btn bg-vb-bleu text-white px-3 py-1.5 text-[12px] disabled:opacity-40">
          Ajouter
        </button>
        <button onClick={onCancel} className="vb-btn bg-white text-vb-gris border border-vb-border px-3 py-1.5 text-[12px]">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function SignaturePanel({ docxBlob, params, profil, onSigne, docLabel, docType }) {
  const circuits = profil?.circuits || [];
  const [circuitId,    setCircuitId]    = useState(() => circuits[0]?.id ?? null);
  const [etape,        setEtape]        = useState('pret');
  const [dossierId,    setDossierId]    = useState(null);
  const [liveSigners,  setLiveSigners]  = useState([]);
  const [liveApprovers,setLiveApprovers]= useState([]);
  const [erreur,       setErreur]       = useState(null);
  const [signedBlob,   setSignedBlob]   = useState(null);
  const [adHocType,    setAdHocType]    = useState(null);
  const [extraApps,    setExtraApps]    = useState([]);
  const [extraSigs,    setExtraSigs]    = useState([]);
  const annulerRef = useRef(null);

  useEffect(() => () => annulerRef.current?.(), []);

  const activeCircuit = circuits.find(c => c.id === circuitId) || circuits[0] || null;

  const allApprobateurs = [
    ...(activeCircuit?.approbateurs || []),
    ...extraApps.map((a, i) => ({ ...a, ordre: (activeCircuit?.approbateurs?.length || 0) + i + 1 })),
  ];
  const allSignataires = [
    ...(activeCircuit?.signataires || []),
    ...extraSigs.map((s, i) => ({ ...s, ordre: (activeCircuit?.signataires?.length || 0) + i + 1 })),
  ];

  const circuitForSend = activeCircuit
    ? { ...activeCircuit, approbateurs: allApprobateurs, signataires: allSignataires }
    : allSignataires.length > 0 ? { approbateurs: allApprobateurs, signataires: allSignataires } : null;

  async function lancerSignature() {
    try {
      setEtape('envoi'); setErreur(null);
      const { dossierId: id } = await envoyerPourSignature({
        docxBlob, params, profil,
        circuit: circuitForSend,
        docLabel,
        docType,
      });
      setDossierId(id);
      setEtape('en_attente');
      annulerRef.current = demarrerPolling(id, {
        onUpdate: ({ signers, approvers }) => {
          setLiveSigners(signers || []);
          setLiveApprovers(approvers || []);
        },
        onComplete: ({ statut, blob }) => {
          if (statut === 'signe') { setSignedBlob(blob); onSigne?.({ blob, dossierId: id }); }
          setEtape(statut);
        },
      });
    } catch (err) {
      setErreur(err.message); setEtape('erreur');
    }
  }

  function telechargerSigne(blob) {
    const slug = (docLabel || params?.commune || 'document').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_');
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${slug}_signe.pdf` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // ── Pret ──

  if (etape === 'pret') return (
    <Panel>
      <div className="text-[36px] mb-2 text-center">✍️</div>
      <p className="text-vb-bleu font-bold text-[15px] mb-3 text-center">Envoyer pour signature électronique</p>

      {docLabel && (
        <div className="text-center mb-3">
          <span className="bg-vb-bleu-light text-vb-bleu border border-vb-bleu/20 rounded-lg px-3 py-1 text-[12px] font-semibold">
            {docLabel}
          </span>
        </div>
      )}

      {/* Sélecteur circuit */}
      {circuits.length > 1 && (
        <div className="mb-3 max-w-[400px] mx-auto">
          <label className="vb-label">Circuit de signature</label>
          <select className="vb-input" value={circuitId || ''} onChange={e => {
            setCircuitId(e.target.value); setExtraApps([]); setExtraSigs([]);
          }}>
            {circuits.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      )}

      {/* Visualisation circuit */}
      <div className="max-w-[520px] mx-auto">
        <CircuitFlow
          approbateurs={allApprobateurs}
          signataires={allSignataires}
        />

        {/* Ajout ad-hoc */}
        {adHocType ? (
          <AdHocForm
            type={adHocType}
            onAdd={p => {
              if (adHocType === 'approbateur') setExtraApps(prev => [...prev, p]);
              else setExtraSigs(prev => [...prev, p]);
              setAdHocType(null);
            }}
            onCancel={() => setAdHocType(null)}
          />
        ) : (
          <div className="flex gap-2 mt-2">
            <button onClick={() => setAdHocType('approbateur')}
              className="vb-btn bg-vb-jaune-clair text-vb-jaune border border-vb-jaune/30 px-3 py-1.5 text-[11px]">
              + Approbateur ad-hoc
            </button>
            <button onClick={() => setAdHocType('signataire')}
              className="vb-btn bg-vb-vert-clair text-vb-vert border border-vb-vert/30 px-3 py-1.5 text-[11px]">
              + Signataire ad-hoc
            </button>
            {(extraApps.length > 0 || extraSigs.length > 0) && (
              <button onClick={() => { setExtraApps([]); setExtraSigs([]); }}
                className="vb-btn bg-vb-rouge-clair text-vb-rouge border border-vb-rouge/30 px-3 py-1.5 text-[11px]">
                ✕ Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      <div className="text-center mt-5">
        <button
          onClick={lancerSignature}
          disabled={!docxBlob || allSignataires.length === 0}
          className="vb-btn bg-vb-orange text-white px-7 py-3 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Envoyer pour signature
        </button>
        {!docxBlob && (
          <p className="text-vb-gris text-[12px] mt-2">
            Exportez d'abord le document en Word pour activer l'envoi.
          </p>
        )}
        {allSignataires.length === 0 && docxBlob && (
          <p className="text-vb-rouge text-[12px] mt-2">
            Configurez au moins un signataire dans le circuit ou ajoutez-en un ad-hoc.
          </p>
        )}
        {circuits.length === 0 && (
          <p className="text-vb-gris text-[11px] mt-3 opacity-70">
            Conseil : configurez des circuits réutilisables dans ⚙️ Profil commune.
          </p>
        )}
      </div>
    </Panel>
  );

  if (etape === 'envoi') return (
    <Panel>
      <div className="text-center">
        <div className="text-[32px] mb-3">⏳</div>
        <p className="text-vb-bleu font-semibold">Envoi vers eSignFlow en cours…</p>
      </div>
    </Panel>
  );

  if (etape === 'en_attente') return (
    <Panel>
      <div className="text-center mb-4">
        <Badge colorClass="bg-vb-jaune-clair text-vb-jaune border-vb-jaune/40">En attente de signature</Badge>
        <p className="text-vb-gris text-[12px] mb-1">Vérification automatique toutes les 5 à 30 minutes.</p>
      </div>
      <CircuitFlow
        approbateurs={allApprobateurs}
        signataires={allSignataires}
        liveApprovers={liveApprovers}
        liveSigners={liveSigners}
      />
      <div className="text-center mt-4">
        <button className="vb-btn bg-vb-gris-clair text-vb-gris border border-vb-border px-5 py-2"
          onClick={() => { annulerRef.current?.(); setEtape('pret'); }}>
          Annuler
        </button>
      </div>
    </Panel>
  );

  if (etape === 'signe') return (
    <Panel>
      <div className="text-center">
        <div className="text-[40px] mb-2">🎉</div>
        <Badge colorClass="bg-vb-vert-clair text-vb-vert border-vb-vert/40">✓ Signé par tous</Badge>
        <p className="text-vb-bleu text-[13px] mb-4">Le document a été signé par tous les signataires.</p>
        {signedBlob && (
          <button className="vb-btn bg-vb-vert text-white px-6 py-2.5 text-[14px]"
            onClick={() => telechargerSigne(signedBlob)}>
            ⬇ Télécharger le PDF/A signé
          </button>
        )}
      </div>
    </Panel>
  );

  if (etape === 'refuse') return (
    <Panel>
      <div className="text-center">
        <Badge colorClass="bg-vb-rouge-clair text-vb-rouge border-vb-rouge/40">✗ Signature refusée</Badge>
        <p className="text-vb-gris text-[13px] mb-4">Un des participants a refusé.</p>
        <button className="vb-btn bg-vb-orange text-white px-6 py-2.5" onClick={() => setEtape('pret')}>Renvoyer</button>
      </div>
    </Panel>
  );

  if (etape === 'expire') return (
    <Panel>
      <div className="text-center">
        <Badge colorClass="bg-vb-gris-clair text-vb-gris border-vb-border">Délai expiré</Badge>
        <p className="text-vb-gris text-[13px] mb-4">La demande de signature a expiré (30 jours).</p>
        <button className="vb-btn bg-vb-orange text-white px-6 py-2.5" onClick={() => setEtape('pret')}>Renvoyer</button>
      </div>
    </Panel>
  );

  if (etape === 'erreur') return (
    <Panel>
      <div className="text-center">
        <Badge colorClass="bg-vb-rouge-clair text-vb-rouge border-vb-rouge/40">Erreur</Badge>
        <p className="text-vb-rouge text-[13px] mb-4">{erreur}</p>
        <button className="vb-btn bg-vb-orange text-white px-6 py-2.5" onClick={() => setEtape('pret')}>Réessayer</button>
      </div>
    </Panel>
  );
}
