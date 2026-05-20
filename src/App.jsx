import INDEX from './index_valide.json';
import { useState, useRef, useCallback, useEffect } from 'react';
import { CATEGORIES } from './data/categories.js';
import { NOTES_SOUS_CAT } from './data/notes.js';
import { REFS } from './data/refs.js';
import { chargerProfil, sauverProfil, mergerBiblio, sauvegarderLocale } from './services/storageService.js';
import { getMandataires } from './services/odwbService.js';
import { qualifierTexteIA, genererReglementStream } from './services/openaiService.js';
import { trouverRefs, verifier } from './utils/verification.js';
import { buildMessages } from './utils/prompts.js';
import CommuneAutocomplete from './components/CommuneAutocomplete.jsx';
import CarteMandataires    from './components/CarteMandataires.jsx';
import PanelPresences      from './components/PanelPresences.jsx';
import RegleResultat       from './components/RegleResultat.jsx';
import FormulaireEntree    from './components/FormulaireEntree.jsx';
import OngletBibliotheque  from './components/OngletBibliotheque.jsx';
import OngletDocuments     from './components/OngletDocuments.jsx';
import PanelProfil         from './components/PanelProfil.jsx';
import SignaturePanel      from './components/SignaturePanel.jsx';

const SOURCE = (() => {
  try { return Array.isArray(INDEX) && INDEX.length > 0 ? INDEX : REFS; }
  catch { return REFS; }
})();

const COUL_GRAV  = { erreur: '#DC2626', avertissement: '#D97706', info: '#1A3A5C' };
const LABEL_GRAV = { erreur: '❌ Erreurs bloquantes', avertissement: '⚠️ Avertissements', info: 'ℹ️ Bonnes pratiques' };

export default function App() {
  const [onglet,          setOnglet]   = useState('generer');
  const [biblio,          setBiblio]   = useState(() => mergerBiblio(SOURCE));
  const [params,          setParams]   = useState(() => {
    const pr = chargerProfil();
    return {
      commune: pr.nomCommune || '', ins: pr.ins || '', cp: '', province: pr.province || '',
      arrondissement: pr.arrondissement || '', population: null, nomCourt: '', adresse: '',
      emailGeneral: '', telephone: '', typeReglement: 'taxe', sousTypeRedevance: 'autorisation',
      categorie: '', sousCat: '', objet: '', dateSeance: '',
      periodeDebut: String(new Date().getFullYear() + 1),
      periodeFin:   String(new Date().getFullYear() + 6),
      redevable: '', tarif: '', exonerations: '', infoCompl: '',
    };
  });
  const [mandataires,   setMandataires]   = useState([]);
  const [mandLoading,   setMandLoading]   = useState(false);
  const [presences,     setPresences]     = useState({});
  const [texteGenere,   setTexteGenere]   = useState('');
  const [texteVerif,    setTexteVerif]    = useState('');
  const [resultatsVerif,setResultatsVerif]= useState(null);
  const [loading,       setLoading]       = useState(false);
  const [erreur,        setErreur]        = useState('');
  const [etapeGen,      setEtapeGen]      = useState('formulaire');
  const [profil,        setProfil]        = useState(() => chargerProfil());
  const [showProfil,    setShowProfil]    = useState(false);
  const [texteLibre,    setTexteLibre]    = useState('');
  const [qualifBusy,    setQualifBusy]    = useState(false);
  const [qualifMsg,     setQualifMsg]     = useState(null);
  const [docxBlob,      setDocxBlob]      = useState(null);
  const streamRef = useRef('');

  const upd = (k, v) => setParams(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const pr = chargerProfil();
    if (pr.ins) {
      setMandLoading(true);
      getMandataires(pr.ins)
        .then(m => { setMandataires(m); setPresences({}); })
        .catch(() => {})
        .finally(() => setMandLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pickCommune = async c => {
    setParams(p => ({ ...p, commune: c.nom, ins: c.ins || '', cp: c.cp || '',
      province: '', arrondissement: '', nomCourt: c.nom_court || '',
      adresse: c.adresse || '', emailGeneral: c.email_general || '',
      telephone: c.telephone || '', population: null }));
    setMandataires([]); setPresences({});
    if (c.ins) { const updProfil = { ...profil, ins: c.ins }; setProfil(updProfil); sauverProfil(updProfil); }
    if (!c.ins) return;
    setMandLoading(true);
    try {
      const m = await getMandataires(c.ins);
      setMandataires(m); setPresences({});
      const first = m[0];
      if (first) setParams(p => ({ ...p, population: first.population || null, province: first.province || '', arrondissement: first.arrondissement || '' }));
    } catch {}
    finally { setMandLoading(false); }
  };

  const generer = useCallback(async () => {
    if (!params.objet || !params.redevable || !params.tarif) { setErreur('Champs requis : objet, redevable et tarif.'); return; }
    setErreur(''); setLoading(true); setTexteGenere(''); streamRef.current = ''; setEtapeGen('generation');
    const refs = trouverRefs(params.objet, params.typeReglement, params.categorie, biblio, params.sousCat);
    try {
      await genererReglementStream(buildMessages(params, refs, mandataires, presences, profil), delta => {
        streamRef.current += delta;
        setTexteGenere(streamRef.current);
      });
      setEtapeGen('resultat');
    } catch (e) { setErreur(`Erreur : ${e.message}`); setEtapeGen('formulaire'); }
    finally { setLoading(false); }
  }, [params, mandataires, presences, profil, biblio]);

  const qualifier = async () => {
    if (!texteLibre.trim()) return;
    setQualifBusy(true); setQualifMsg(null);
    const catList = CATEGORIES.map(c =>
      `${c.slug} (${c.label}):\n${(c.sous || []).map(s => `  ${s.slug} (${s.label})`).join('\n')}`
    ).join('\n');
    try {
      const q = await qualifierTexteIA(texteLibre, catList);
      const catOk    = CATEGORIES.find(c => c.slug === q.categorie);
      const sousCatOk = catOk?.sous?.find(s => s.slug === q.sousCat);
      setParams(p => ({
        ...p,
        typeReglement:     ['taxe','redevance'].includes(q.typeReglement) ? q.typeReglement : p.typeReglement,
        sousTypeRedevance: ['autorisation','service'].includes(q.sousTypeRedevance) ? q.sousTypeRedevance : p.sousTypeRedevance,
        categorie:  catOk    ? q.categorie : p.categorie,
        sousCat:    sousCatOk ? q.sousCat  : '',
        objet:      q.objet       || p.objet,
        redevable:  q.redevable   || p.redevable,
        tarif:      q.tarif       || p.tarif,
        exonerations: q.exonerations || p.exonerations,
      }));
      const typeLabel   = q.typeReglement === 'taxe' ? 'Règlement-taxe' : 'Règlement-redevance';
      const catLabel    = catOk?.label || q.categorie;
      const sousCatLabel = sousCatOk?.label || '';
      setQualifMsg({ ok: true, texte: `${typeLabel} · ${catLabel}${sousCatLabel ? ' — ' + sousCatLabel : ''}`, explication: q.explication || '' });
    } catch (e) {
      setQualifMsg({ ok: false, texte: `Qualification impossible : ${e.message}`, explication: '' });
    } finally { setQualifBusy(false); }
  };

  const handleExportDocx = async () => {
    try {
      const { exportDocx } = await import('./exportDocx.js');
      const blob = await exportDocx({ texteGenere, params, profil });
      setDocxBlob(blob);
    } catch (e) { setErreur(`Export Word impossible : ${e.message}`); }
  };

  const handleSigne = ({ blob, dossierId }) => {
    const entry = {
      id: `local-${Date.now()}`, commune: params.commune || '', type: params.typeReglement,
      categorie: params.categorie, sousCat: params.sousCat || '',
      annee: Number(params.periodeDebut) || new Date().getFullYear(),
      periode: `${params.periodeDebut}–${params.periodeFin}`, objet: params.objet,
      mots_cles: [], visas: [], tarifs: params.tarif,
      exonerations: params.exonerations ? [params.exonerations] : [],
      points_forts: [], extrait: texteGenere.slice(0, 500),
      source: { numero_deliberation: '', date_seance: params.dateSeance || '' },
      qualite: 'reference', points_forts_valides: true, _local: true,
      signature: { statut: 'signe', esignflow_dossier_id: dossierId, date_signature: new Date().toISOString() },
    };
    setBiblio(prev => { const next = [entry, ...prev]; sauvegarderLocale(next.filter(x => x._local)); return next; });
  };

  const lancerVerif = () => {
    if (!texteVerif.trim()) { setErreur('Collez un texte à analyser.'); return; }
    setErreur(''); setResultatsVerif(verifier(texteVerif));
  };

  const stats = resultatsVerif ? {
    ok:   resultatsVerif.filter(r => r.statut === 'ok').length,
    err:  resultatsVerif.filter(r => r.statut === 'echec' && r.gravite === 'erreur').length,
    warn: resultatsVerif.filter(r => r.statut === 'echec' && r.gravite === 'avertissement').length,
    man:  resultatsVerif.filter(r => r.statut === 'manuel').length,
  } : null;

  const SLUG_COMPAT = { 'immondices': 'dechets-environnement' };
  const catNorm = c => SLUG_COMPAT[c] || c;
  const nbRefs  = biblio.filter(r =>
    r.type === params.typeReglement &&
    (!params.categorie || catNorm(r.categorie) === catNorm(params.categorie)) &&
    r.qualite !== 'insuffisante' && r.qualite !== 'brouillon'
  ).length;

  const ONGLETS = [
    ['generer',     '✏️ Règlements',  false],
    ['documents',   '📋 Séance',      false],
    ['verifier',    '✅ Vérifier',    false],
    ['signer',      '✍️ Signer',      !texteGenere],
    ['bibliotheque','📚 Bibliothèque',false],
  ];

  return (
    <div className="font-[Segoe_UI,Arial,sans-serif] bg-vb-gris-clair min-h-screen">
      {showProfil && <PanelProfil profil={profil} onSave={setProfil} onClose={() => setShowProfil(false)} />}

      {/* Header */}
      <div className="bg-vb-bleu text-white px-6 py-3.5 flex items-center gap-3">
        <div className="bg-vb-orange rounded-lg w-9 h-9 flex items-center justify-center font-bold text-[18px]">VB</div>
        <div className="flex-1">
          <div className="font-bold text-[16px]">Assistant règlements — Taxes & redevances</div>
          <div className="text-[12px] opacity-75">Outil de génération IAConnect</div>
        </div>
        <button
          onClick={() => setShowProfil(true)}
          className="bg-white/15 text-white border border-white/30 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer whitespace-nowrap"
        >
          ⚙️ {profil.nomCommune || 'Profil commune'}
        </button>
      </div>

      {/* Onglets */}
      <div className="bg-white border-b-2 border-vb-border flex px-6">
        {ONGLETS.map(([k, l, disabled]) => (
          <button key={k}
            onClick={() => { if (!disabled) { setOnglet(k); setErreur(''); } }}
            className={`px-5 py-3 border-none bg-transparent font-semibold text-[14px] -mb-0.5 transition-colors
              ${disabled ? 'text-vb-border cursor-not-allowed opacity-40' : 'cursor-pointer'}
              ${!disabled && onglet === k ? 'text-vb-orange border-b-[3px] border-vb-orange' : ''}
              ${!disabled && onglet !== k ? 'text-vb-gris hover:text-vb-bleu' : ''}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 max-w-[900px] mx-auto">

        {/* ═══ RÉDIGER ═══ */}
        {onglet === 'generer' && (
          <>
            {/* Assistant qualification */}
            <div className="rounded-xl p-5 mb-5 text-white" style={{ background: 'linear-gradient(135deg,#1A3A5C 0%,#2A5A8C 100%)' }}>
              <div className="font-bold text-[15px] mb-1">✨ Assistant de qualification</div>
              <div className="text-[12px] opacity-80 mb-3.5">Décrivez librement ce que vous souhaitez taxer — l'IA remplit le formulaire automatiquement.</div>
              <div className="flex gap-2.5 items-start">
                <textarea
                  value={texteLibre} onChange={e => setTexteLibre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) qualifier(); }}
                  placeholder="ex. : occupation du domaine public par une terrasse horeca, taxe sur les secondes résidences…"
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/30 bg-white/12 text-white text-[13px] resize-none outline-none placeholder:text-white/50"
                  style={{ fontFamily: 'inherit', backgroundColor: 'rgba(255,255,255,0.12)' }}
                />
                <button onClick={qualifier} disabled={qualifBusy || !texteLibre.trim()}
                  className="vb-btn bg-vb-orange text-white px-4 py-2 whitespace-nowrap min-w-[110px] disabled:bg-vb-gris">
                  {qualifBusy ? '⏳ Analyse…' : 'Qualifier →'}
                </button>
              </div>
              <div className="text-[11px] opacity-55 mt-1.5">Ctrl+Entrée pour soumettre</div>
              {qualifMsg && (
                <div className={`mt-3 px-3.5 py-2.5 rounded-lg flex gap-2.5 items-start border ${qualifMsg.ok ? 'bg-white/15 border-white/30' : 'bg-vb-rouge/30 border-vb-rouge/50'}`}>
                  <span className="text-[16px] leading-none">{qualifMsg.ok ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <div className="font-bold text-[13px]">{qualifMsg.texte}</div>
                    {qualifMsg.explication && <div className="text-[12px] opacity-85 mt-0.5">{qualifMsg.explication}</div>}
                  </div>
                  <button onClick={() => setQualifMsg(null)} className="text-white opacity-60 cursor-pointer bg-transparent border-none text-[16px] leading-none p-0">×</button>
                </div>
              )}
            </div>

            {/* Formulaire paramètres */}
            <div className="vb-card mb-5">
              <h3 className="text-vb-bleu mt-0 text-[16px] font-bold mb-4">Paramètres du règlement</h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <label className="vb-label">Commune <span className="text-vb-rouge">*</span></label>
                  <CommuneAutocomplete value={params.commune} onChange={v => upd('commune', v)} onSelect={pickCommune} />
                  {(params.ins || params.province) && (
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {params.ins          && <span className="vb-badge bg-vb-bleu-light text-vb-bleu font-bold">INS {params.ins}</span>}
                      {params.cp           && <span className="vb-badge bg-vb-gris-clair text-vb-gris">CP {params.cp}</span>}
                      {params.arrondissement && <span className="vb-badge bg-vb-gris-clair text-vb-gris">{params.arrondissement}</span>}
                      {params.province     && <span className="vb-badge bg-vb-gris-clair text-vb-gris">Prov. {params.province}</span>}
                    </div>
                  )}
                  <CarteMandataires data={mandataires} loading={mandLoading} commune={params.commune} />
                  <PanelPresences mandataires={mandataires} presences={presences} onChange={setPresences} />
                </div>

                <div className="col-span-2">
                  <label className="vb-label">Catégorie <span className="text-vb-rouge">*</span></label>
                  <select className="vb-input" value={params.categorie} onChange={e => { upd('categorie', e.target.value); upd('sousCat', ''); }}>
                    <option value="">— Sélectionner une catégorie —</option>
                    {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                </div>

                {params.categorie && (
                  <div className="col-span-2">
                    <label className="vb-label">Sous-catégorie</label>
                    <select className="vb-input" value={params.sousCat} onChange={e => upd('sousCat', e.target.value)}>
                      <option value="">— Préciser la sous-catégorie (recommandé) —</option>
                      {(CATEGORIES.find(c => c.slug === params.categorie)?.sous || []).map(s => (
                        <option key={s.slug} value={s.slug}>{s.label}</option>
                      ))}
                    </select>
                    <div className="mt-1 text-[11px] text-vb-gris">
                      📚 {nbRefs} règlement(s) de référence disponible(s)
                      {params.sousCat && NOTES_SOUS_CAT[params.sousCat] && (
                        <span className="ml-2 text-vb-orange font-bold">⚡ Exigences juridiques spécifiques disponibles</span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="vb-label">Type d'acte</label>
                  <select className="vb-input" value={params.typeReglement} onChange={e => upd('typeReglement', e.target.value)}>
                    <option value="taxe">Règlement-taxe (prélèvement unilatéral)</option>
                    <option value="redevance">Règlement-redevance (contrepartie directe)</option>
                  </select>
                </div>

                {params.typeReglement === 'redevance' && (
                  <div>
                    <label className="vb-label">Sous-type de redevance</label>
                    <select className="vb-input" value={params.sousTypeRedevance} onChange={e => upd('sousTypeRedevance', e.target.value)}>
                      <option value="autorisation">Autorisation d'occupation (terrasse, enseigne…)</option>
                      <option value="service">Service rendu / usage (déchets, documents admin…)</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="vb-label">Date de séance</label>
                    <input type="date" className="vb-input" value={params.dateSeance} onChange={e => upd('dateSeance', e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1"><label className="vb-label">Exercice début</label><input className="vb-input" value={params.periodeDebut} onChange={e => upd('periodeDebut', e.target.value)} /></div>
                  <div className="flex-1"><label className="vb-label">Exercice fin</label><input className="vb-input" value={params.periodeFin} onChange={e => upd('periodeFin', e.target.value)} /></div>
                </div>

                <div className="col-span-2">
                  <label className="vb-label">Objet du règlement <span className="text-vb-rouge">*</span></label>
                  <input className="vb-input" placeholder="ex. : délivrance de documents administratifs…" value={params.objet} onChange={e => upd('objet', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="vb-label">Redevable (qui paie ?) <span className="text-vb-rouge">*</span></label>
                  <input className="vb-input" placeholder="ex. : toute personne physique ou morale qui sollicite…" value={params.redevable} onChange={e => upd('redevable', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="vb-label">Tarif / montant <span className="text-vb-rouge">*</span></label>
                  <input className="vb-input" placeholder="ex. : 5 € par acte" value={params.tarif} onChange={e => upd('tarif', e.target.value)} />
                </div>
                <div>
                  <label className="vb-label">Exonérations</label>
                  <input className="vb-input" placeholder="ex. : actes délivrés aux services publics…" value={params.exonerations} onChange={e => upd('exonerations', e.target.value)} />
                </div>
                <div>
                  <label className="vb-label">Informations complémentaires</label>
                  <input className="vb-input" placeholder="particularités locales…" value={params.infoCompl} onChange={e => upd('infoCompl', e.target.value)} />
                </div>
              </div>

              {erreur && <div className="mt-3 px-3.5 py-2.5 bg-vb-rouge-clair border border-vb-rouge rounded-md text-vb-rouge text-[13px]">{erreur}</div>}

              <div className="mt-5 flex gap-3 items-center flex-wrap">
                <button onClick={generer} disabled={loading}
                  className="vb-btn bg-vb-orange text-white px-7 py-3 text-[14px] disabled:bg-vb-gris">
                  {loading ? '⏳ Génération…' : '✏️ Générer le règlement'}
                </button>
                <span className="text-[12px] text-vb-gris">⚠️ Validation juriste obligatoire avant adoption.</span>
              </div>
            </div>

            {/* Résultat généré */}
            {texteGenere && (
              <div className="vb-card">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="text-vb-bleu m-0 text-[16px] font-bold">📄 Règlement généré</h3>
                  <div className="flex gap-2">
                    {etapeGen === 'resultat' && (
                      <button onClick={() => { setTexteVerif(texteGenere); setOnglet('verifier'); setResultatsVerif(null); }}
                        className="bg-vb-bleu-light text-vb-bleu border border-vb-bleu rounded-md px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer">
                        ✅ Vérifier
                      </button>
                    )}
                    {etapeGen === 'resultat' && (
                      <button onClick={handleExportDocx}
                        className="bg-vb-vert-clair text-vb-vert border border-vb-vert rounded-md px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer">
                        ⬇ Word
                      </button>
                    )}
                    <button onClick={() => navigator.clipboard.writeText(texteGenere)}
                      className="bg-vb-gris-clair text-vb-gris border border-vb-border rounded-md px-3.5 py-1.5 text-[12px] cursor-pointer">
                      📋 Copier
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-[13px] leading-[1.7] bg-gray-50 p-5 rounded-md border border-vb-border max-h-[520px] overflow-y-auto"
                  style={{ fontFamily: 'Georgia, serif' }}>
                  {texteGenere}{loading && <span className="text-vb-orange">▌</span>}
                </pre>
                {etapeGen === 'resultat' && (
                  <div className="mt-3 px-3.5 py-2.5 bg-vb-jaune-clair border border-vb-jaune rounded-md text-[12px] text-vb-jaune">
                    ⚠️ <strong>Rappel :</strong> Aide à la rédaction uniquement. Validation obligatoire par un juriste avant adoption.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══ SÉANCE ═══ */}
        {onglet === 'documents' && (
          <OngletDocuments profil={profil} />
        )}

        {/* ═══ VÉRIFIER ═══ */}
        {onglet === 'verifier' && (
          <>
            <div className="vb-card mb-5">
              <h3 className="text-vb-bleu mt-0 text-[16px] font-bold">Vérification de conformité ({resultatsVerif?.length || 0} règles)</h3>
              <p className="text-vb-gris text-[13px] mt-0">Collez le texte complet d'un règlement-taxe ou redevance wallon.</p>
              <textarea className="vb-input h-[220px] resize-y" style={{ fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.6 }}
                placeholder="Collez ici le texte complet du règlement à analyser…"
                value={texteVerif} onChange={e => setTexteVerif(e.target.value)} />
              {erreur && <div className="mt-2 px-3.5 py-2.5 bg-vb-rouge-clair border border-vb-rouge rounded-md text-vb-rouge text-[13px]">{erreur}</div>}
              <button onClick={lancerVerif} className="mt-3.5 vb-btn bg-vb-bleu text-white px-6 py-2.5 text-[14px]">✅ Analyser</button>
            </div>

            {resultatsVerif && stats && (
              <>
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { l: 'Conformes',          v: stats.ok,   cls: 'bg-vb-vert-clair text-vb-vert',   ic: '✅' },
                    { l: 'Erreurs bloquantes', v: stats.err,  cls: 'bg-vb-rouge-clair text-vb-rouge',  ic: '❌' },
                    { l: 'Avertissements',     v: stats.warn, cls: 'bg-vb-jaune-clair text-vb-jaune',  ic: '⚠️' },
                    { l: 'Vérif. manuelle',    v: stats.man,  cls: 'bg-vb-bleu-light text-vb-bleu',    ic: '👁️' },
                  ].map(({ l, v, cls, ic }) => (
                    <div key={l} className={`${cls} border border-current/20 rounded-xl px-4 py-3.5 text-center`}>
                      <div className="text-[28px] font-extrabold">{v}</div>
                      <div className="text-[12px] font-semibold">{ic} {l}</div>
                    </div>
                  ))}
                </div>

                <div className="vb-card p-0 overflow-hidden">
                  {['erreur', 'avertissement', 'info'].map(grav => {
                    const grp = resultatsVerif.filter(r => r.gravite === grav);
                    if (!grp.length) return null;
                    const nbEchecs = grp.filter(r => r.statut === 'echec').length;
                    return (
                      <div key={grav}>
                        <div className="px-4 py-2.5 font-bold text-[13px] border-b border-vb-border"
                          style={{ color: COUL_GRAV[grav], background: COUL_GRAV[grav] + '18' }}>
                          {LABEL_GRAV[grav]} ({nbEchecs} sur {grp.length})
                        </div>
                        {grp.map((r, i) => <RegleResultat key={r.id} r={r} i={i} />)}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3.5 px-3.5 py-2.5 bg-vb-jaune-clair border border-vb-jaune rounded-md text-[12px] text-vb-jaune">
                  ⚠️ Vérification automatique — ne remplace pas l'examen d'un juriste.
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ SIGNER ═══ */}
        {onglet === 'signer' && (
          <SignaturePanel docxBlob={docxBlob} params={params} profil={profil} onSigne={handleSigne} />
        )}

        {/* ═══ BIBLIOTHÈQUE ═══ */}
        {onglet === 'bibliotheque' && (
          <OngletBibliotheque biblio={biblio} setBiblio={setBiblio} />
        )}

        <div className="mt-6 bg-vb-bleu-light rounded-xl border border-vb-bleu/20 px-4 py-3.5">
          <div className="text-[11px] text-vb-gris">
            Données : <a href="https://www.odwb.be" target="_blank" rel="noreferrer" className="text-vb-bleu">odwb.be</a> · Licence CC0
          </div>
        </div>
      </div>
    </div>
  );
}
