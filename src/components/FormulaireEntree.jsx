import { useState } from 'react';
import { CATEGORIES } from '../data/categories.js';
import { extraireAvecIA } from '../services/openaiService.js';

const VIDE_ENTREE = () => ({
  id: `local-${Date.now()}`, commune: '', type: 'taxe', categorie: '', annee: new Date().getFullYear(),
  periode: '', objet: '', mots_cles: [], visas: [], tarifs: '', exonerations: [],
  points_forts: [], extrait: '', source: { numero_deliberation: '', date_seance: '' },
  qualite: 'brouillon', points_forts_valides: false, _local: true,
});

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="vb-label">{label}</label>
      {children}
    </div>
  );
}

export default function FormulaireEntree({ initial, onSave, onCancel }) {
  const [etape, setEtape] = useState(initial ? 'form' : 'paste');
  const [texte, setTexte] = useState('');
  const [busy,  setBusy]  = useState(false);
  const [errF,  setErrF]  = useState('');
  const [e, setE]         = useState(initial || VIDE_ENTREE());

  const upd    = (k, v) => setE(p => ({ ...p, [k]: v }));
  const updArr = (k, v) => upd(k, v.split('\n').map(s => s.trim()).filter(Boolean));
  const toLines = arr => (arr || []).join('\n');

  const extraire = async () => {
    if (!texte.trim()) return;
    setBusy(true); setErrF('');
    try {
      const ex = await extraireAvecIA(texte);
      setE(p => ({ ...p, ...ex, _local: true, id: p.id }));
      setEtape('form');
    } catch (err) { setErrF(err.message); }
    finally { setBusy(false); }
  };

  const sauver = () => {
    if (!e.commune || !e.objet || !e.categorie) { setErrF('Commune, objet et catégorie sont requis.'); return; }
    onSave(e);
  };

  return (
    <div className="vb-card">
      <div className="flex justify-between items-center mb-5">
        <h3 className="m-0 text-vb-bleu text-[16px] font-bold">{initial ? "Modifier l'entrée" : 'Ajouter un règlement'}</h3>
        <button onClick={onCancel} className="text-vb-gris text-xl bg-transparent border-none cursor-pointer leading-none">×</button>
      </div>

      {etape === 'paste' && (
        <>
          <p className="text-vb-gris text-[13px] mt-0">
            Collez le texte complet du règlement. L'IA en extraira automatiquement les informations structurées.
          </p>
          <textarea
            className="vb-input h-[220px] resize-y"
            style={{ fontFamily: 'Georgia, serif', fontSize: 12, lineHeight: 1.6 }}
            placeholder="Collez ici le texte du règlement communal…"
            value={texte}
            onChange={e => setTexte(e.target.value)}
          />
          {errF && <div className="mt-2 px-3 py-2 bg-vb-rouge-clair text-vb-rouge rounded-md text-[12px]">{errF}</div>}
          <div className="flex gap-2.5 mt-3.5">
            <button
              onClick={extraire} disabled={busy || !texte.trim()}
              className="vb-btn bg-vb-orange text-white px-5 py-2.5 disabled:bg-vb-gris"
            >
              {busy ? '⏳ Extraction…' : '✨ Extraire avec l\'IA'}
            </button>
            <button
              onClick={() => setEtape('form')}
              className="vb-btn bg-vb-gris-clair text-vb-gris border border-vb-border px-4 py-2.5"
            >
              Encoder manuellement
            </button>
          </div>
        </>
      )}

      {etape === 'form' && (
        <>
          <div className="grid grid-cols-2 gap-x-5">
            <Field label="Commune *">
              <input className="vb-input" value={e.commune} onChange={x => upd('commune', x.target.value)} />
            </Field>
            <Field label="Année">
              <input className="vb-input" value={e.annee} onChange={x => upd('annee', parseInt(x.target.value) || e.annee)} />
            </Field>
            <Field label="Type *">
              <select className="vb-input" value={e.type} onChange={x => upd('type', x.target.value)}>
                <option value="taxe">Taxe</option>
                <option value="redevance">Redevance</option>
              </select>
            </Field>
            <Field label="Qualité">
              <select className="vb-input" value={e.qualite} onChange={x => upd('qualite', x.target.value)}>
                <option value="brouillon">Brouillon</option>
                <option value="valide">Validé</option>
                <option value="reference">Référence</option>
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Catégorie *">
                <select className="vb-input" value={e.categorie} onChange={x => { upd('categorie', x.target.value); upd('sousCat', ''); }}>
                  <option value="">— Choisir —</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </Field>
            </div>
            {e.categorie && (
              <div className="col-span-2">
                <Field label="Sous-catégorie">
                  <select className="vb-input" value={e.sousCat || ''} onChange={x => upd('sousCat', x.target.value)}>
                    <option value="">— Non précisée —</option>
                    {(CATEGORIES.find(c => c.slug === e.categorie)?.sous || []).map(s => (
                      <option key={s.slug} value={s.slug}>{s.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            <div className="col-span-2"><Field label="Objet du règlement *"><input className="vb-input" value={e.objet} onChange={x => upd('objet', x.target.value)} /></Field></div>
            <div className="col-span-2"><Field label="Période (ex : 2025-2030)"><input className="vb-input" value={e.periode} onChange={x => upd('periode', x.target.value)} /></Field></div>
          </div>

          {[
            ['Visas (un par ligne)',           toLines(e.visas),        v => updArr('visas', v),        4],
            ['Tarifs',                          e.tarifs || '',          v => upd('tarifs', v),          2],
            ['Exonérations (une par ligne)',   toLines(e.exonerations), v => updArr('exonerations', v), 2],
            ['Mots-clés (un par ligne)',        toLines(e.mots_cles),   v => updArr('mots_cles', v),    2],
            ['Points forts (un par ligne)',     toLines(e.points_forts),v => updArr('points_forts', v), 3],
            ['Extrait du texte',               e.extrait || '',         v => upd('extrait', v),         6],
          ].map(([label, val, handler, rows]) => (
            <Field key={label} label={label}>
              <textarea
                className="vb-input resize-y"
                style={{ height: rows * 22 + 18 }}
                value={val}
                onChange={x => handler(x.target.value)}
              />
            </Field>
          ))}

          <div className="grid grid-cols-2 gap-x-5">
            <Field label="N° délibération">
              <input className="vb-input" value={e.source?.numero_deliberation || ''} onChange={x => upd('source', { ...e.source, numero_deliberation: x.target.value })} />
            </Field>
            <Field label="Date séance (YYYY-MM-DD)">
              <input className="vb-input" value={e.source?.date_seance || ''} onChange={x => upd('source', { ...e.source, date_seance: x.target.value })} />
            </Field>
          </div>

          <div className="flex items-center gap-2.5 mt-1 mb-4">
            <input type="checkbox" id="pfv" checked={!!e.points_forts_valides} onChange={x => upd('points_forts_valides', x.target.checked)} />
            <label htmlFor="pfv" className="text-[13px] text-vb-bleu cursor-pointer">Points forts validés par un juriste</label>
          </div>

          {errF && <div className="mb-3 px-3 py-2 bg-vb-rouge-clair text-vb-rouge rounded-md text-[12px]">{errF}</div>}

          <div className="flex gap-2.5">
            <button onClick={sauver} className="vb-btn bg-vb-vert text-white px-6 py-2.5">💾 Sauvegarder</button>
            {!initial && (
              <button onClick={() => setEtape('paste')} className="vb-btn bg-vb-gris-clair text-vb-gris border border-vb-border px-4 py-2.5">← Retour</button>
            )}
            <button onClick={onCancel} className="vb-btn bg-white text-vb-rouge border border-vb-rouge/30 px-4 py-2.5">Annuler</button>
          </div>
        </>
      )}
    </div>
  );
}
