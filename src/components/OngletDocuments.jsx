import { useState, useRef, useCallback } from 'react';
import { DOC_TYPES, INSTANCES, videParams } from '../data/docTypes.js';
import { genererDocumentStream, construireTexteOdJ, construireTextePV } from '../services/documentService.js';
import SignaturePanel from './SignaturePanel.jsx';

// ─── Sous-formulaires ────────────────────────────────────────────────

function InstanceToggle({ value, onChange }) {
  return (
    <div className="flex gap-2 mb-4">
      {INSTANCES.map(inst => (
        <button key={inst.id} onClick={() => onChange(inst.id)}
          className={`px-4 py-2 rounded-lg font-semibold text-[13px] border cursor-pointer transition-colors
            ${value === inst.id
              ? 'bg-vb-bleu text-white border-vb-bleu'
              : 'bg-white text-vb-gris border-vb-border hover:border-vb-bleu/40'}`}>
          {inst.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="mb-3">
      <label className="vb-label">{label}{required && <span className="text-vb-rouge ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function FormDeliberation({ params, upd }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de séance">
          <input type="date" className="vb-input" value={params.dateSeance || ''}
            onChange={e => upd('dateSeance', e.target.value)} />
        </Field>
        <Field label="Service initiateur">
          <input className="vb-input" value={params.service || ''}
            onChange={e => upd('service', e.target.value)}
            placeholder="ex. : Service finances, Urbanisme…" />
        </Field>
        <div className="col-span-2">
          <Field label="Objet de la délibération" required>
            <input className="vb-input" value={params.objet || ''}
              onChange={e => upd('objet', e.target.value)}
              placeholder="ex. : Approbation du budget ordinaire 2027" />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Visas légaux (un par ligne)">
            <textarea className="vb-input h-20 resize-y" value={params.visas || ''}
              onChange={e => upd('visas', e.target.value)}
              placeholder={"VU le CDLD, art. 117 ;\nVU le décret du 22 novembre 2018…"} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Contexte pour l'IA (motivations, enjeux, décisions souhaitées…)">
            <textarea className="vb-input h-20 resize-y" value={params.infosCompl || ''}
              onChange={e => upd('infosCompl', e.target.value)}
              placeholder="Décrivez librement le contexte, les raisons de la délibération, ce qui doit être décidé…" />
          </Field>
        </div>
      </div>
    </>
  );
}

function FormRapport({ params, upd }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de séance">
          <input type="date" className="vb-input" value={params.dateSeance || ''}
            onChange={e => upd('dateSeance', e.target.value)} />
        </Field>
        <Field label="Service">
          <input className="vb-input" value={params.service || ''}
            onChange={e => upd('service', e.target.value)}
            placeholder="ex. : Service urbanisme" />
        </Field>
        <div className="col-span-2">
          <Field label="Objet du rapport" required>
            <input className="vb-input" value={params.objet || ''}
              onChange={e => upd('objet', e.target.value)}
              placeholder="ex. : Octroi d'une subvention à l'ASBL Culture Vive" />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Contexte / informations pour l'IA">
            <textarea className="vb-input h-24 resize-y" value={params.infosCompl || ''}
              onChange={e => upd('infosCompl', e.target.value)}
              placeholder="Décrivez le contexte, les données chiffrées, les enjeux, ce que l'organe doit décider…" />
          </Field>
        </div>
      </div>
    </>
  );
}

function FormOdJ({ params, upd }) {
  const addPoint = () => upd('points', [...(params.points || []), { intitule: '', huis_clos: false }]);
  const delPoint = i  => upd('points', (params.points || []).filter((_, idx) => idx !== i));
  const updPoint = (i, k, v) => upd('points', (params.points || []).map((p, idx) => idx === i ? { ...p, [k]: v } : p));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Date de séance">
          <input type="date" className="vb-input" value={params.dateSeance || ''}
            onChange={e => upd('dateSeance', e.target.value)} />
        </Field>
        <Field label="Heure">
          <input type="time" className="vb-input" value={params.heure || ''}
            onChange={e => upd('heure', e.target.value)} />
        </Field>
        <div className="col-span-2">
          <Field label="Lieu">
            <input className="vb-input" value={params.lieu || ''}
              onChange={e => upd('lieu', e.target.value)}
              placeholder="Salle du conseil, Maison communale…" />
          </Field>
        </div>
      </div>
      <label className="vb-label">Points à l'ordre du jour</label>
      {(params.points || []).map((p, i) => (
        <div key={i} className="flex gap-2 mb-2 items-center">
          <span className="text-[11px] text-vb-gris font-bold w-6 shrink-0 text-center">{i + 1}.</span>
          <input className="vb-input flex-1" placeholder="Intitulé du point"
            value={p.intitule} onChange={e => updPoint(i, 'intitule', e.target.value)} />
          <label className="flex items-center gap-1.5 text-[12px] text-vb-gris whitespace-nowrap cursor-pointer shrink-0">
            <input type="checkbox" checked={!!p.huis_clos} onChange={e => updPoint(i, 'huis_clos', e.target.checked)} />
            Huis clos
          </label>
          <button onClick={() => delPoint(i)} disabled={(params.points || []).length <= 1}
            className="shrink-0 px-2 py-1 text-[12px] bg-vb-rouge-clair text-vb-rouge rounded border border-vb-rouge/30 cursor-pointer disabled:opacity-30">✕</button>
        </div>
      ))}
      <button onClick={addPoint}
        className="vb-btn bg-vb-bleu-light text-vb-bleu border border-vb-bleu/30 px-3 py-1.5 text-[12px] mt-1">
        + Ajouter un point
      </button>
    </>
  );
}

function FormPV({ params, upd }) {
  const addPoint = () => upd('points', [...(params.points || []), { intitule: '', resume: '' }]);
  const delPoint = i  => upd('points', (params.points || []).filter((_, idx) => idx !== i));
  const updPoint = (i, k, v) => upd('points', (params.points || []).map((p, idx) => idx === i ? { ...p, [k]: v } : p));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Date de séance">
          <input type="date" className="vb-input" value={params.dateSeance || ''}
            onChange={e => upd('dateSeance', e.target.value)} />
        </Field>
        <div className="col-span-1">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Heure d'ouverture">
              <input type="time" className="vb-input" value={params.heureOuverture || ''}
                onChange={e => upd('heureOuverture', e.target.value)} />
            </Field>
            <Field label="Heure de clôture">
              <input type="time" className="vb-input" value={params.heureCloture || ''}
                onChange={e => upd('heureCloture', e.target.value)} />
            </Field>
          </div>
        </div>
        <div className="col-span-2">
          <Field label="Présents (noms et qualités)">
            <textarea className="vb-input h-20 resize-y" value={params.presences || ''}
              onChange={e => upd('presences', e.target.value)}
              placeholder="M. Dupont, Bourgmestre ; Mme Martin, Échevine ; …" />
          </Field>
        </div>
      </div>
      <label className="vb-label">Points traités</label>
      {(params.points || []).map((p, i) => (
        <div key={i} className="mb-3 border border-vb-border rounded-lg p-3">
          <div className="flex gap-2 items-center mb-2">
            <span className="text-[11px] text-vb-gris font-bold w-6 shrink-0 text-center">{i + 1}.</span>
            <input className="vb-input flex-1" placeholder="Intitulé du point"
              value={p.intitule} onChange={e => updPoint(i, 'intitule', e.target.value)} />
            <button onClick={() => delPoint(i)} disabled={(params.points || []).length <= 1}
              className="shrink-0 px-2 py-1 text-[12px] bg-vb-rouge-clair text-vb-rouge rounded border border-vb-rouge/30 cursor-pointer disabled:opacity-30">✕</button>
          </div>
          <textarea className="vb-input h-16 resize-y" placeholder="Résumé des débats (optionnel)"
            value={p.resume} onChange={e => updPoint(i, 'resume', e.target.value)} />
        </div>
      ))}
      <button onClick={addPoint}
        className="vb-btn bg-vb-bleu-light text-vb-bleu border border-vb-bleu/30 px-3 py-1.5 text-[12px] mt-1">
        + Ajouter un point
      </button>
    </>
  );
}

// ─── Composant principal ─────────────────────────────────────────────

export default function OngletDocuments({ profil }) {
  const [docType,   setDocType]   = useState(null);
  const [params,    setParams]    = useState({});
  const [texte,     setTexte]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [erreur,    setErreur]    = useState('');
  const [etape,     setEtape]     = useState('form');
  const [docxBlob,  setDocxBlob]  = useState(null);
  const streamRef = useRef('');

  const upd = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const selectType = type => {
    setDocType(type); setParams(videParams(type));
    setTexte(''); setEtape('form'); setDocxBlob(null); setErreur('');
  };

  const generer = useCallback(async () => {
    if (!params.objet?.trim()) { setErreur("L'objet du document est requis."); return; }
    setErreur(''); setLoading(true); setTexte(''); streamRef.current = ''; setEtape('preview');
    try {
      await genererDocumentStream(docType, params, profil, delta => {
        streamRef.current += delta;
        setTexte(streamRef.current);
      });
    } catch (e) {
      setErreur(`Erreur : ${e.message}`); setEtape('form');
    } finally {
      setLoading(false);
    }
  }, [docType, params, profil]);

  const previsualiser = () => {
    const txt = docType === 'ordre_du_jour'
      ? construireTexteOdJ(params, profil)
      : construireTextePV(params, profil);
    setTexte(txt); setEtape('preview'); setDocxBlob(null);
  };

  const handleExport = async () => {
    try {
      const { exportDocument } = await import('../exportDocument.js');
      const blob = await exportDocument({ type: docType, texte, params, profil });
      setDocxBlob(blob);
    } catch (e) {
      setErreur(`Export Word impossible : ${e.message}`);
    }
  };

  const typeInfo = DOC_TYPES.find(t => t.id === docType);

  // ── Sélecteur de type ──
  if (!docType) return (
    <div>
      <h3 className="text-vb-bleu text-[16px] font-bold mb-1">Documents de séance</h3>
      <p className="text-vb-gris text-[13px] mb-5">Sélectionnez le type de document à rédiger.</p>
      <div className="grid grid-cols-2 gap-4">
        {DOC_TYPES.map(t => (
          <button key={t.id} onClick={() => selectType(t.id)}
            className="vb-card text-left cursor-pointer hover:border-vb-bleu/40 hover:bg-vb-bleu-light/20 transition-all p-5 group border-2 border-transparent">
            <div className="text-[32px] mb-2">{t.icon}</div>
            <div className="font-bold text-[15px] text-vb-bleu mb-1 group-hover:text-vb-orange transition-colors">{t.label}</div>
            <div className="text-[12px] text-vb-gris mb-2.5">{t.desc}</div>
            {t.hasAI && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-vb-orange-light text-vb-orange">✨ Assisté IA</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Formulaire + prévisualisation ──
  return (
    <div>
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => { setDocType(null); setTexte(''); setDocxBlob(null); }}
          className="text-vb-gris text-[13px] hover:text-vb-bleu bg-transparent border-none cursor-pointer p-0 underline">
          ← Documents de séance
        </button>
        <span className="text-vb-border">›</span>
        <span className="text-[13px] font-semibold text-vb-bleu">{typeInfo?.icon} {typeInfo?.label}</span>
      </div>

      {/* Formulaire */}
      <div className="vb-card mb-4">
        <InstanceToggle value={params.instance} onChange={v => upd('instance', v)} />

        {docType === 'deliberation' && <FormDeliberation params={params} upd={upd} />}
        {docType === 'rapport'      && <FormRapport      params={params} upd={upd} />}
        {docType === 'ordre_du_jour'&& <FormOdJ          params={params} upd={upd} />}
        {docType === 'proces_verbal'&& <FormPV           params={params} upd={upd} />}

        {erreur && etape === 'form' && (
          <div className="mt-3 px-3.5 py-2.5 bg-vb-rouge-clair border border-vb-rouge rounded-md text-vb-rouge text-[13px]">{erreur}</div>
        )}

        <div className="mt-5">
          {typeInfo?.hasAI ? (
            <button onClick={generer} disabled={loading}
              className="vb-btn bg-vb-orange text-white px-6 py-2.5 text-[14px] disabled:bg-vb-gris">
              {loading ? '⏳ Génération…' : `✨ ${typeInfo.btnIA}`}
            </button>
          ) : (
            <button onClick={previsualiser}
              className="vb-btn bg-vb-bleu text-white px-6 py-2.5 text-[14px]">
              👁️ Prévisualiser
            </button>
          )}
        </div>
      </div>

      {/* Prévisualisation */}
      {etape === 'preview' && (texte || loading) && (
        <div className="vb-card mb-4">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-vb-bleu m-0 text-[16px] font-bold">
              {typeInfo?.icon} {typeInfo?.label}
            </h3>
            <div className="flex gap-2 flex-wrap">
              {typeInfo?.hasAI && !loading && (
                <button onClick={generer}
                  className="bg-vb-orange-light text-vb-orange border border-vb-orange/30 rounded-md px-3 py-1.5 text-[12px] cursor-pointer">
                  ↺ Régénérer
                </button>
              )}
              <button onClick={() => { setEtape('form'); setDocxBlob(null); }}
                className="bg-vb-gris-clair text-vb-gris border border-vb-border rounded-md px-3 py-1.5 text-[12px] cursor-pointer">
                ✎ Paramètres
              </button>
              <button onClick={() => navigator.clipboard.writeText(texte)}
                className="bg-vb-gris-clair text-vb-gris border border-vb-border rounded-md px-3 py-1.5 text-[12px] cursor-pointer">
                📋 Copier
              </button>
              <button onClick={handleExport} disabled={!texte || loading}
                className="bg-vb-vert-clair text-vb-vert border border-vb-vert rounded-md px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer disabled:opacity-40">
                ⬇ Word
              </button>
            </div>
          </div>

          <textarea
            className="w-full border border-vb-border rounded-md p-4 text-[13px] leading-[1.75] bg-gray-50 min-h-[420px] resize-y outline-none"
            style={{ fontFamily: 'Georgia, serif' }}
            value={texte}
            onChange={e => { setTexte(e.target.value); setDocxBlob(null); }}
          />

          {loading && <div className="mt-2 text-vb-orange text-[13px] font-semibold animate-pulse">⏳ Génération en cours…</div>}

          {erreur && (
            <div className="mt-2 px-3.5 py-2.5 bg-vb-rouge-clair border border-vb-rouge rounded-md text-vb-rouge text-[13px]">{erreur}</div>
          )}

          <div className="mt-3 px-3.5 py-2.5 bg-vb-jaune-clair border border-vb-jaune rounded-md text-[12px] text-vb-jaune">
            ⚠️ <strong>Rappel :</strong> Document généré à titre indicatif. Validation obligatoire avant utilisation officielle.
          </div>
        </div>
      )}

      {/* Signature */}
      {docxBlob && (
        <SignaturePanel
          docxBlob={docxBlob}
          params={{ ...params, objet: params.objet || typeInfo?.label }}
          profil={profil}
          onSigne={() => {}}
        />
      )}
    </div>
  );
}
