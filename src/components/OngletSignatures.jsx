import { useState, useCallback } from 'react';
import {
  lireDossiersLocaux, consulterStatut, recupererDocumentSigne, mettreAJourStatutLocal,
} from '../services/signatureService.js';

const STATUS_CFG = {
  en_attente: { label: 'En attente', cls: 'bg-vb-jaune-clair text-vb-jaune border-vb-jaune/40',   icon: '⏳' },
  signe:      { label: 'Signé',      cls: 'bg-vb-vert-clair  text-vb-vert  border-vb-vert/40',    icon: '✅' },
  refuse:     { label: 'Refusé',     cls: 'bg-vb-rouge-clair text-vb-rouge border-vb-rouge/40',    icon: '❌' },
  expire:     { label: 'Expiré',     cls: 'bg-vb-gris-clair  text-vb-gris  border-vb-border',      icon: '⌛' },
};
const signerStatus = s => ({ 0: '⏳', 1: '📧', 2: '✅', 3: '❌' })[s] ?? '—';

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function DossierCard({ dossier, onRefresh, onDownload }) {
  const [refreshing, setRefreshing] = useState(false);
  const [detail,     setDetail]     = useState(null);
  const [expanded,   setExpanded]   = useState(false);
  const cfg = STATUS_CFG[dossier.statut] ?? STATUS_CFG.en_attente;

  const refresh = async () => {
    setRefreshing(true);
    try {
      const result = await consulterStatut(dossier.id);
      mettreAJourStatutLocal(dossier.id, result.statut);
      setDetail(result);
      onRefresh(dossier.id, result.statut);
    } catch (e) {
      alert(`Impossible d'actualiser : ${e.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const download = async () => {
    try {
      const blob = await recupererDocumentSigne(dossier.id);
      onDownload(blob, dossier.titre);
    } catch (e) {
      alert(`Téléchargement impossible : ${e.message}`);
    }
  };

  const currentSigners   = detail?.signers   || [];
  const currentApprovers = detail?.approvers || [];

  return (
    <div className="vb-card p-0 overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[14px] text-vb-bleu truncate">{dossier.titre}</div>
          <div className="text-[11px] text-vb-gris mt-0.5">
            Créé le {fmtDate(dossier.dateCreation)}
            {dossier.circuit?.label && <span className="ml-2">· Circuit : {dossier.circuit.label}</span>}
          </div>
          {dossier.circuit && (
            <div className="text-[10px] text-vb-gris/70 mt-0.5">
              {dossier.circuit.nbApp > 0 && `${dossier.circuit.nbApp} approbateur(s) · `}
              {dossier.circuit.nbSig} signataire(s)
            </div>
          )}
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.cls}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Détail signataires (après refresh) */}
      {expanded && (currentSigners.length > 0 || currentApprovers.length > 0) && (
        <div className="px-4 pb-3 border-t border-vb-border bg-gray-50/50">
          {currentApprovers.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold text-vb-gris mb-1">Approbateurs</div>
              {currentApprovers.map((a, i) => (
                <div key={i} className="text-[12px] text-vb-bleu py-0.5">
                  {signerStatus(a.Status)} {a.UserEmail}
                </div>
              ))}
            </div>
          )}
          {currentSigners.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold text-vb-gris mb-1">Signataires</div>
              {currentSigners.map((s, i) => (
                <div key={i} className="text-[12px] text-vb-bleu py-0.5">
                  {signerStatus(s.Status)} {s.UserEmail}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-3 pt-1 flex-wrap">
        <button onClick={refresh} disabled={refreshing}
          className="vb-btn bg-vb-bleu-light text-vb-bleu border border-vb-bleu/20 px-3 py-1.5 text-[12px] disabled:opacity-50">
          {refreshing ? '⏳ Actualisation…' : '↺ Actualiser'}
        </button>
        {detail && (currentSigners.length > 0 || currentApprovers.length > 0) && (
          <button onClick={() => setExpanded(e => !e)}
            className="vb-btn bg-white text-vb-gris border border-vb-border px-3 py-1.5 text-[12px]">
            {expanded ? '▲ Masquer détail' : '▼ Voir détail'}
          </button>
        )}
        {dossier.statut === 'signe' && (
          <button onClick={download}
            className="vb-btn bg-vb-vert text-white px-3 py-1.5 text-[12px]">
            ⬇ PDF signé
          </button>
        )}
        <span className="ml-auto text-[10px] text-vb-gris/60 self-center font-mono truncate max-w-[180px]"
          title={dossier.id}>
          {dossier.id}
        </span>
      </div>
    </div>
  );
}

export default function OngletSignatures() {
  const [dossiers, setDossiers] = useState(() => lireDossiersLocaux());

  const handleRefresh = useCallback((id, newStatut) => {
    setDossiers(prev => prev.map(d => d.id === id ? { ...d, statut: newStatut } : d));
  }, []);

  const handleDownload = (blob, titre) => {
    const slug = (titre || 'document').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_');
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement('a'), { href: url, download: `${slug}_signe.pdf` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const reload = () => setDossiers(lireDossiersLocaux());

  const filterGrps = [
    { key: 'all',       label: 'Tous',     fn: () => true },
    { key: 'pending',   label: 'En attente', fn: d => d.statut === 'en_attente' },
    { key: 'signed',    label: 'Signés',   fn: d => d.statut === 'signe' },
    { key: 'other',     label: 'Autres',   fn: d => !['en_attente','signe'].includes(d.statut) },
  ];
  const [filter, setFilter] = useState('all');
  const visible = dossiers.filter(filterGrps.find(f => f.key === filter)?.fn ?? (() => true));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-vb-bleu font-bold text-[16px] m-0">✍️ Dossiers de signature ({dossiers.length})</h2>
        <button onClick={reload}
          className="vb-btn bg-white text-vb-gris border border-vb-border px-3 py-1.5 text-[12px]">
          ↺ Recharger
        </button>
      </div>

      {/* Filtre */}
      {dossiers.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {filterGrps.map(f => {
            const count = dossiers.filter(f.fn).length;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer
                  ${filter === f.key
                    ? 'bg-vb-bleu text-white border-vb-bleu'
                    : 'bg-white text-vb-gris border-vb-border hover:border-vb-bleu hover:text-vb-bleu'}`}>
                {f.label} {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map(d => (
            <DossierCard key={d.id} dossier={d}
              onRefresh={handleRefresh} onDownload={handleDownload} />
          ))}
        </div>
      ) : dossiers.length === 0 ? (
        <div className="vb-card text-center py-10 text-vb-gris">
          <div className="text-[36px] mb-2">📭</div>
          <p className="text-[14px] font-semibold m-0">Aucun dossier de signature</p>
          <p className="text-[12px] mt-1">Générez un document et envoyez-le pour signature pour le voir ici.</p>
        </div>
      ) : (
        <div className="text-center py-6 text-vb-gris text-[13px]">Aucun dossier dans ce filtre.</div>
      )}

      <div className="text-[11px] text-vb-gris/60 text-center">
        Les dossiers sont enregistrés localement dans ce navigateur.
      </div>
    </div>
  );
}
