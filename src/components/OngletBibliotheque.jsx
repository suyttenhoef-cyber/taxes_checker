import { useState } from 'react';
import { CATEGORIES } from '../data/categories.js';
import { sauvegarderLocale, exporterBiblio } from '../services/storageService.js';
import { publierBiblio } from '../services/githubService.js';
import FormulaireEntree from './FormulaireEntree.jsx';

const BDG_Q = {
  reference: { bg: 'bg-vb-vert-clair text-vb-vert',    label: 'Référence' },
  valide:    { bg: 'bg-vb-bleu-light text-vb-bleu',     label: 'Validé'    },
  brouillon: { bg: 'bg-vb-jaune-clair text-vb-jaune',   label: 'Brouillon' },
};
const BDG_T = {
  taxe:      'bg-vb-orange-light text-vb-orange',
  redevance: 'bg-vb-bleu-light text-vb-bleu',
};

export default function OngletBibliotheque({ biblio, setBiblio }) {
  const [vue,        setVue]  = useState('liste');
  const [entreeEdit, setEdit] = useState(null);
  const [recherche,  setRech] = useState('');
  const [filtreType, setFT]   = useState('');
  const [filtreCat,  setFC]   = useState('');
  const [filtreQ,    setFQ]   = useState('');
  const [pub, setPub]         = useState({ busy: false, msg: '', ok: null });

  const sauverEntree = entry => {
    setBiblio(prev => {
      const idx  = prev.findIndex(x => x.id === entry.id);
      const next = idx >= 0 ? prev.map((x, i) => i === idx ? entry : x) : [...prev, entry];
      sauvegarderLocale(next.filter(x => x._local));
      return next;
    });
    setVue('liste'); setEdit(null);
  };

  const publier = async () => {
    setPub({ busy: true, msg: 'Publication en cours…', ok: null });
    try {
      await publierBiblio(biblio);
      const nb = biblio.filter(r => r._local).length;
      setPub({ busy: false, msg: `✅ ${biblio.length} règlements publiés (dont ${nb} locaux). Redéploiement GitHub Actions en cours (~2 min).`, ok: true });
    } catch (err) {
      setPub({ busy: false, msg: `❌ ${err.message}`, ok: false });
    }
  };

  const supprimer = id => {
    if (!confirm('Supprimer cette entrée ?')) return;
    setBiblio(prev => {
      const next = prev.filter(x => x.id !== id);
      sauvegarderLocale(next.filter(x => x._local));
      return next;
    });
  };

  const filtre = biblio
    .filter(r => !filtreType || r.type === filtreType)
    .filter(r => !filtreCat  || r.categorie === filtreCat)
    .filter(r => !filtreQ    || r.qualite === filtreQ)
    .filter(r => {
      if (!recherche) return true;
      const q = recherche.toLowerCase();
      return [r.commune, r.objet, r.categorie, ...(r.mots_cles || [])].join(' ').toLowerCase().includes(q);
    });

  const stats = {
    total: biblio.length,
    local: biblio.filter(r => r._local).length,
    ref:   biblio.filter(r => r.qualite === 'reference').length,
    valid: biblio.filter(r => r.qualite === 'valide').length,
  };

  if (vue === 'form' || vue === 'edit') return (
    <FormulaireEntree
      initial={entreeEdit}
      onSave={sauverEntree}
      onCancel={() => { setVue('liste'); setEdit(null); }}
    />
  );

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { l: 'Total',      v: stats.total, cls: 'bg-vb-bleu-light text-vb-bleu' },
          { l: 'Locaux',     v: stats.local, cls: 'bg-vb-jaune-clair text-vb-jaune' },
          { l: 'Validés',    v: stats.valid, cls: 'bg-vb-bleu-light text-vb-bleu' },
          { l: 'Références', v: stats.ref,   cls: 'bg-vb-vert-clair text-vb-vert' },
        ].map(({ l, v, cls }) => (
          <div key={l} className={`${cls} border border-current/20 rounded-lg px-3.5 py-2.5 text-center`}>
            <div className="text-[24px] font-extrabold">{v}</div>
            <div className="text-[11px] font-semibold">{l}</div>
          </div>
        ))}
      </div>

      {/* Barre d'outils */}
      <div className="vb-card mb-4 flex gap-2.5 flex-wrap items-center">
        <input className="vb-input flex-1 min-w-[140px]" placeholder="Rechercher…" value={recherche} onChange={e => setRech(e.target.value)} />
        <select className="vb-input w-32" value={filtreType} onChange={e => setFT(e.target.value)}>
          <option value="">Tous types</option>
          <option value="taxe">Taxe</option>
          <option value="redevance">Redevance</option>
        </select>
        <select className="vb-input w-48" value={filtreCat} onChange={e => setFC(e.target.value)}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
        <select className="vb-input w-32" value={filtreQ} onChange={e => setFQ(e.target.value)}>
          <option value="">Toutes qualités</option>
          <option value="reference">Référence</option>
          <option value="valide">Validé</option>
          <option value="brouillon">Brouillon</option>
        </select>
        <button onClick={() => { setEdit(null); setVue('form'); }} className="vb-btn bg-vb-orange text-white whitespace-nowrap">+ Ajouter</button>
        <button onClick={() => exporterBiblio(biblio)} className="vb-btn bg-vb-bleu-light text-vb-bleu border border-vb-bleu/30 whitespace-nowrap">⬇ Exporter JSON</button>
        <button onClick={publier} disabled={pub.busy} className="vb-btn bg-vb-vert text-white whitespace-nowrap disabled:bg-vb-gris">
          {pub.busy ? '⏳ Publication…' : '🚀 Publier dans le repo'}
        </button>
      </div>

      {pub.msg && (
        <div className={`mb-3.5 px-3.5 py-2.5 rounded-lg text-[13px] border ${pub.ok ? 'bg-vb-vert-clair text-vb-vert border-vb-vert' : pub.ok === false ? 'bg-vb-rouge-clair text-vb-rouge border-vb-rouge' : 'bg-vb-jaune-clair text-vb-jaune border-vb-jaune'}`}>
          {pub.msg}
        </div>
      )}

      <div className="text-[12px] text-vb-gris mb-2.5">{filtre.length} règlement(s) affiché(s)</div>

      <div className="flex flex-col gap-2.5">
        {filtre.length === 0 && (
          <div className="vb-card py-8 text-center text-vb-gris">Aucun règlement ne correspond aux filtres.</div>
        )}
        {filtre.map(r => {
          const q = BDG_Q[r.qualite] || BDG_Q.brouillon;
          const tCls = BDG_T[r.type] || BDG_T.taxe;
          return (
            <div key={r.id} className="vb-card flex gap-3.5 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex gap-1.5 flex-wrap mb-1.5">
                  <span className={`vb-badge uppercase ${tCls}`}>{r.type}</span>
                  <span className={`vb-badge ${q.bg}`}>{q.label}</span>
                  {r._local && <span className="vb-badge bg-vb-jaune-clair text-vb-jaune">Local</span>}
                </div>
                <div className="font-bold text-[14px] text-vb-bleu mb-0.5">{r.commune || '—'} {r.annee ? `(${r.annee})` : ''}</div>
                <div className="text-[13px] text-vb-gris mb-1">{r.objet || r.titre || '—'}</div>
                <div className="flex gap-3 text-[11px] text-vb-gris flex-wrap">
                  {r.categorie && <span>{CATEGORIES.find(c => c.slug === r.categorie)?.label || r.categorie}</span>}
                  {(r.visas || []).length > 0 && <span>📋 {r.visas.length} visa(s)</span>}
                  {(r.points_forts || []).length > 0 && <span>⭐ {r.points_forts.length} point(s) fort(s)</span>}
                  {r.points_forts_valides && <span className="text-vb-vert">✅ Juriste</span>}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => { setEdit(r); setVue('edit'); }} className="bg-vb-bleu-light text-vb-bleu border-none rounded-md px-3 py-1.5 text-[12px] font-semibold cursor-pointer">✏️</button>
                {r._local && (
                  <button onClick={() => supprimer(r.id)} className="bg-vb-rouge-clair text-vb-rouge border-none rounded-md px-3 py-1.5 text-[12px] cursor-pointer">🗑️</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
