import { useState } from 'react';

const COUL_GRAV = { erreur: 'text-vb-rouge', avertissement: 'text-vb-jaune', info: 'text-vb-bleu' };
const BG_GRAV   = { erreur: 'bg-vb-rouge-clair', avertissement: 'bg-vb-jaune-clair', info: 'bg-vb-bleu-light' };

export default function RegleResultat({ r, i }) {
  const [ouvert, setOuvert] = useState(false);
  const estEchec = r.statut === 'echec';
  const coulCls  = r.statut === 'ok' ? 'text-vb-vert' : COUL_GRAV[r.gravite];
  const bgRow    = r.statut === 'echec'
    ? (r.gravite === 'erreur' ? 'bg-vb-rouge-clair/20' : 'bg-vb-jaune-clair/30')
    : (i % 2 === 0 ? 'bg-white' : 'bg-gray-50');

  return (
    <div className={`border-b border-vb-border ${bgRow}`}>
      <div
        className={`px-4 py-3 flex items-center gap-2.5 ${estEchec && r.correction ? 'cursor-pointer' : ''}`}
        onClick={() => { if (estEchec && r.correction) setOuvert(o => !o); }}
      >
        <span>{r.statut === 'ok' ? '✅' : r.statut === 'echec' ? (r.gravite === 'erreur' ? '❌' : '⚠️') : '👁️'}</span>
        <span className={`font-semibold text-[13px] flex-1 ${coulCls}`}>{r.label}</span>
        {estEchec && r.correction && (
          <span className={`text-[11px] opacity-70 ${coulCls}`}>{ouvert ? '▲' : '▼'}</span>
        )}
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${coulCls} bg-current/10`}>
          {r.statut === 'ok' ? 'Conforme' : r.statut === 'echec' ? (r.gravite === 'erreur' ? 'ERREUR' : 'Attention') : 'À vérifier'}
        </span>
      </div>

      {r.statut !== 'ok' && (
        <div className={`text-[12px] text-vb-gris pl-10 pr-4 pb-2.5 leading-relaxed ${ouvert ? 'pb-0' : ''}`}>
          {r.explication}
        </div>
      )}

      {estEchec && r.correction && ouvert && (
        <div className={`mx-4 mb-3 ml-10 border rounded-md p-3 ${BG_GRAV[r.gravite]} border-current/20`}>
          <div className={`text-[11px] font-bold mb-1.5 uppercase tracking-wide ${coulCls}`}>
            ✏️ Correction suggérée
          </div>
          <pre className={`m-0 text-[12px] text-vb-bleu whitespace-pre-wrap leading-relaxed`}
            style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            {r.correction}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(r.correction)}
            className={`mt-2 bg-white border rounded px-3 py-1 text-[11px] font-semibold cursor-pointer ${coulCls} border-current/30`}
          >
            📋 Copier
          </button>
        </div>
      )}
    </div>
  );
}
