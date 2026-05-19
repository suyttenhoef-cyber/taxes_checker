import { useState, useEffect, useRef } from 'react';
import { envoyerPourSignature, demarrerPolling, recupererDocumentSigne } from './signatureService';

const C = {
  orange:'#E87722', bleu:'#1A3A5C', gris:'#6B7280',
  vert:'#15803D', vertClair:'#F0FDF4',
  rouge:'#DC2626', rougeClair:'#FEF2F2',
  jaune:'#D97706', jauneClair:'#FFFBEB',
  grisClair:'#F3F4F6', blanc:'#FFFFFF', border:'#E5E7EB',
};

function Badge({ color, children }) {
  return (
    <div style={{
      display:'inline-block', padding:'4px 12px', borderRadius:20,
      background: color + '18', border:`1px solid ${color}44`,
      color, fontWeight:700, fontSize:13, marginBottom:12,
    }}>{children}</div>
  );
}

function statusLabel(status) {
  return { 0:'⏳ En attente', 1:'📧 Notifié', 2:'✅ Signé', 3:'❌ Refusé' }[status] ?? '—';
}

export default function SignaturePanel({ docxBlob, params, profil, onSigne }) {
  const [etape, setEtape]         = useState('pret');
  const [dossierId, setDossierId] = useState(null);
  const [signers, setSigners]     = useState([]);
  const [erreur, setErreur]       = useState(null);
  const [signedBlob, setSignedBlob] = useState(null);
  const annulerRef                = useRef(null);

  useEffect(() => () => annulerRef.current?.(), []);

  async function lancerSignature() {
    try {
      setEtape('envoi');
      setErreur(null);

      const { dossierId: id } = await envoyerPourSignature({ docxBlob, params, profil });
      setDossierId(id);
      setEtape('en_attente');

      annulerRef.current = demarrerPolling(id, {
        onUpdate:   ({ signers: s }) => setSigners(s),
        onComplete: ({ statut, blob }) => {
          if (statut === 'signe') {
            setSignedBlob(blob);
            onSigne({ blob, dossierId: id });
          }
          setEtape(statut);
        },
      });
    } catch (err) {
      setErreur(err.message);
      setEtape('erreur');
    }
  }

  function telechargerSigne(blob) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `reglement_signe_${params?.commune || ''}_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  const panelStyle = {
    background: C.blanc, borderRadius: 10, border: `1px solid ${C.border}`,
    padding: 24, textAlign: 'center',
  };
  const btnPrimary = {
    background: C.orange, color: C.blanc, border: 'none', borderRadius: 8,
    padding: '11px 26px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  };
  const btnSecondary = {
    background: C.grisClair, color: C.gris, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: '9px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
  };

  if (etape === 'pret') return (
    <div style={panelStyle}>
      <div style={{fontSize:40,marginBottom:12}}>✍️</div>
      <p style={{color:C.bleu,fontWeight:700,fontSize:15,marginBottom:8}}>Prêt à envoyer pour signature électronique</p>
      <p style={{color:C.gris,fontSize:13,marginBottom:4}}>Le règlement généré sera envoyé séquentiellement à :</p>
      <p style={{color:C.bleu,fontSize:13,marginBottom:20}}>
        <strong>Sébastien Uyttenhoef</strong> (DG — ordre 1) →{' '}
        <strong>Julie Lesuisse</strong> (Bourgmestre — ordre 2)
      </p>
      <button onClick={lancerSignature} disabled={!docxBlob} style={{
        ...btnPrimary, opacity: docxBlob ? 1 : 0.5, cursor: docxBlob ? 'pointer' : 'not-allowed',
      }}>
        Envoyer pour signature
      </button>
      {!docxBlob && (
        <p style={{color:C.gris,fontSize:12,marginTop:10}}>
          Générez d'abord le règlement et téléchargez-le en Word (⬇ Word) pour activer l'envoi.
        </p>
      )}
    </div>
  );

  if (etape === 'envoi') return (
    <div style={panelStyle}>
      <div style={{fontSize:32,marginBottom:12}}>⏳</div>
      <p style={{color:C.bleu,fontWeight:600}}>Envoi vers eSignFlow en cours…</p>
    </div>
  );

  if (etape === 'en_attente') return (
    <div style={panelStyle}>
      <Badge color={C.jaune}>En attente de signature</Badge>
      <ul style={{listStyle:'none',padding:0,margin:'0 0 16px',textAlign:'left',display:'inline-block'}}>
        {signers.length > 0
          ? signers.map((s, i) => (
              <li key={i} style={{padding:'6px 0',fontSize:13,color:C.bleu}}>
                {s.UserEmail} — {statusLabel(s.Status)}
              </li>
            ))
          : (
            <>
              <li style={{padding:'6px 0',fontSize:13,color:C.bleu}}>sebastien.uyttenhoef@vandenbroele.be — ⏳ En attente</li>
              <li style={{padding:'6px 0',fontSize:13,color:C.bleu}}>jullie.lesuisse@vandenbroele.be — ⏳ En attente</li>
            </>
          )
        }
      </ul>
      <p style={{color:C.gris,fontSize:12,marginBottom:16}}>Vérification automatique toutes les 5 à 30 minutes.</p>
      <button style={btnSecondary} onClick={() => { annulerRef.current?.(); setEtape('pret'); }}>
        Annuler
      </button>
    </div>
  );

  if (etape === 'signe') return (
    <div style={panelStyle}>
      <div style={{fontSize:40,marginBottom:8}}>🎉</div>
      <Badge color={C.vert}>✓ Signé</Badge>
      <p style={{color:C.bleu,fontSize:13,marginBottom:16}}>Le document a été signé par les deux signataires.</p>
      {signedBlob && (
        <button style={{...btnPrimary,background:C.vert}} onClick={() => telechargerSigne(signedBlob)}>
          ⬇ Télécharger le PDF/A signé
        </button>
      )}
    </div>
  );

  if (etape === 'refuse') return (
    <div style={panelStyle}>
      <Badge color={C.rouge}>✗ Signature refusée</Badge>
      <p style={{color:C.gris,fontSize:13,marginBottom:16}}>Un des signataires a refusé de signer.</p>
      <button style={btnPrimary} onClick={() => setEtape('pret')}>Renvoyer</button>
    </div>
  );

  if (etape === 'expire') return (
    <div style={panelStyle}>
      <Badge color={C.gris}>Délai expiré</Badge>
      <p style={{color:C.gris,fontSize:13,marginBottom:16}}>La demande de signature a expiré (30 jours).</p>
      <button style={btnPrimary} onClick={() => setEtape('pret')}>Renvoyer</button>
    </div>
  );

  if (etape === 'erreur') return (
    <div style={panelStyle}>
      <Badge color={C.rouge}>Erreur</Badge>
      <p style={{color:C.rouge,fontSize:13,marginBottom:16}}>{erreur}</p>
      <button style={btnPrimary} onClick={() => setEtape('pret')}>Réessayer</button>
    </div>
  );
}
