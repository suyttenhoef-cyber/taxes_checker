import { useMemo } from 'react';
import { lireDossiersLocaux } from '../services/signatureService.js';

function StatTile({ value, label, icon, colorClass }) {
  return (
    <div className={`rounded-xl px-4 py-3.5 text-center border ${colorClass}`}>
      <div className="text-[26px] font-extrabold leading-none mb-1">{value}</div>
      <div className="text-[11px] font-semibold">{icon} {label}</div>
    </div>
  );
}

export default function OngletDashboard({ profil, biblio, onNavigate }) {
  const dossiers = useMemo(() => lireDossiersLocaux(), []);

  const nbAttente = dossiers.filter(d => d.statut === 'en_attente').length;
  const nbSigne   = dossiers.filter(d => d.statut === 'signe').length;
  const nbCircuit = (profil?.circuits || []).length;
  const nbBiblio  = (biblio || []).filter(e => e._local).length;

  const commune    = profil?.nomCommune   || null;
  const dg         = profil?.nomDG        || null;
  const titreDG    = profil?.titreDG      || 'Directeur général';
  const typeComm   = profil?.typeCommune  || 'Commune';

  const recentsDossiers = dossiers.slice(0, 5);

  const statut = (s) => ({
    en_attente: { label: 'En attente',  cls: 'bg-vb-jaune-clair text-vb-jaune border-vb-jaune/40' },
    signe:      { label: 'Signé',       cls: 'bg-vb-vert-clair  text-vb-vert  border-vb-vert/40' },
    refuse:     { label: 'Refusé',      cls: 'bg-vb-rouge-clair text-vb-rouge border-vb-rouge/40' },
    expire:     { label: 'Expiré',      cls: 'bg-vb-gris-clair  text-vb-gris  border-vb-border' },
  })[s] ?? { label: s, cls: 'bg-vb-gris-clair text-vb-gris border-vb-border' };

  const fmtDate = iso => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return ''; }
  };

  const profilOk = commune && dg;

  return (
    <div className="space-y-5">
      {/* Entête commune */}
      <div className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1A3A5C 0%,#2A5A8C 100%)' }}>
        <div className="font-bold text-[17px] mb-0.5">
          {commune ? `${typeComm} de ${commune}` : 'Bienvenue dans Tax Checker'}
        </div>
        {dg && (
          <div className="text-[13px] opacity-85">{titreDG} : {dg}</div>
        )}
        {!profilOk && (
          <div className="mt-3 bg-white/15 border border-white/30 rounded-lg px-3 py-2 text-[12px]">
            ⚙️ Configurez votre profil commune pour personnaliser les documents générés.
            <button className="ml-2 underline opacity-90 cursor-pointer bg-transparent border-none text-white text-[12px] p-0"
              onClick={() => onNavigate?.('profil')}>
              Ouvrir le profil →
            </button>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-3">
        <StatTile value={nbAttente} label="En attente signature" icon="⏳"
          colorClass="bg-vb-jaune-clair text-vb-jaune border-vb-jaune/30" />
        <StatTile value={nbSigne}   label="Documents signés"    icon="✅"
          colorClass="bg-vb-vert-clair text-vb-vert border-vb-vert/30" />
        <StatTile value={nbCircuit} label="Circuits configurés" icon="✍️"
          colorClass="bg-vb-bleu-light text-vb-bleu border-vb-bleu/20" />
        <StatTile value={nbBiblio}  label="Règlements locaux"   icon="📚"
          colorClass="bg-vb-gris-clair text-vb-gris border-vb-border" />
      </div>

      {/* Raccourcis */}
      <div className="vb-card">
        <h3 className="text-vb-bleu mt-0 text-[14px] font-bold mb-3">Accès rapide</h3>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: '✏️ Générer un règlement',   tab: 'generer' },
            { label: '📋 Nouveau document séance', tab: 'documents' },
            { label: '✍️ Suivre les signatures',   tab: 'signatures' },
            { label: '✅ Vérifier un règlement',   tab: 'verifier' },
          ].map(({ label, tab }) => (
            <button key={tab} onClick={() => onNavigate?.(tab)}
              className="vb-btn bg-white text-vb-bleu border border-vb-bleu/30 px-4 py-2 text-[13px]">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dossiers récents */}
      {recentsDossiers.length > 0 && (
        <div className="vb-card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-vb-bleu mt-0 text-[14px] font-bold m-0">Derniers dossiers de signature</h3>
            <button onClick={() => onNavigate?.('signatures')}
              className="text-[12px] text-vb-bleu underline cursor-pointer bg-transparent border-none p-0">
              Voir tout →
            </button>
          </div>
          <div className="space-y-2">
            {recentsDossiers.map(d => {
              const s = statut(d.statut);
              return (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b border-vb-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-vb-bleu truncate">{d.titre}</div>
                    <div className="text-[11px] text-vb-gris">{fmtDate(d.dateCreation)}</div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recentsDossiers.length === 0 && (
        <div className="vb-card text-center py-8 text-vb-gris">
          <div className="text-[32px] mb-2">✍️</div>
          <p className="text-[13px] m-0">Aucun dossier de signature pour l'instant.</p>
          <p className="text-[12px] mt-1">Générez un document et envoyez-le pour signature.</p>
        </div>
      )}
    </div>
  );
}
