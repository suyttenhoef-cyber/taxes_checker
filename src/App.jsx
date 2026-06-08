import INDEX from './index_valide.json';
import { useState, useRef, useCallback, useEffect } from 'react';
import { CATEGORIES } from './data/categories.js';
import { NOTES_SOUS_CAT } from './data/notes.js';
import { REFS } from './data/refs.js';
import { chargerProfil, sauverProfil, mergerBiblio, sauvegarderLocale } from './services/storageService.js';
import { getMandataires } from './services/odwbService.js';
import { qualifierTexteIA, genererReglementStream } from './services/openaiService.js';
import { trouverRefs } from './utils/verification.js';
import { buildMessages } from './utils/prompts.js';
import CommuneAutocomplete from './components/CommuneAutocomplete.jsx';
import CarteMandataires    from './components/CarteMandataires.jsx';
import PanelPresences      from './components/PanelPresences.jsx';
import OngletBibliotheque  from './components/OngletBibliotheque.jsx';
import OngletVerifier      from './components/OngletVerifier.jsx';
import PanelProfil         from './components/PanelProfil.jsx';

const SOURCE = (() => {
  try { return Array.isArray(INDEX) && INDEX.length > 0 ? INDEX : REFS; }
  catch { return REFS; }
})();

const SIDEBAR_BG = '#0D1B35';
const TEAL       = '#17B8B5';

const NAV_ITEMS = [
  { key: 'accueil',      icon: '🏠', label: 'Accueil' },
  { key: 'generer',      icon: '✏️', label: 'Nouveau règlement' },
  { key: 'verifier',     icon: '🔍', label: 'Analyser un règlement' },
  { key: 'bibliotheque', icon: '📚', label: 'Bibliothèque' },
];

export default function App() {
  const [onglet,       setOnglet]     = useState('accueil');
  const [biblio,       setBiblio]     = useState(() => mergerBiblio(SOURCE));
  const [params,       setParams]     = useState(() => {
    const pr = chargerProfil();
    return {
      commune: pr.nomCommune || '', ins: pr.ins || '', cp: '', province: pr.province || '',
      arrondissement: pr.arrondissement || '', population: null, nomCourt: '', adresse: '',
      emailGeneral: '', telephone: '', typeReglement: 'taxe', sousTypeRedevance: 'autorisation',
      categorie: '', sousCat: '', objet: '',
      periodeDebut: String(new Date().getFullYear() + 1),
      periodeFin:   String(new Date().getFullYear() + 6),
      redevable: '', tarif: '', exonerations: '', infoCompl: '',
    };
  });
  const [mandataires,  setMandataires]  = useState([]);
  const [mandLoading,  setMandLoading]  = useState(false);
  const [presences,    setPresences]    = useState({});
  const [texteGenere,  setTexteGenere]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [erreur,       setErreur]       = useState('');
  const [etapeGen,     setEtapeGen]     = useState('formulaire');
  const [profil,       setProfil]       = useState(() => chargerProfil());
  const [showProfil,   setShowProfil]   = useState(false);
  const [texteLibre,   setTexteLibre]   = useState('');
  const [qualifBusy,   setQualifBusy]   = useState(false);
  const [qualifMsg,    setQualifMsg]    = useState(null);
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
      const catOk     = CATEGORIES.find(c => c.slug === q.categorie);
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
      const typeLabel    = q.typeReglement === 'taxe' ? 'Règlement-taxe' : 'Règlement-redevance';
      const catLabel     = catOk?.label || q.categorie;
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
      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), {
          href: url,
          download: `reglement-${(params.commune || 'commune').toLowerCase().replace(/\s+/g, '-')}.docx`,
        });
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    } catch (e) { setErreur(`Export Word impossible : ${e.message}`); }
  };

  const SLUG_COMPAT = { 'immondices': 'dechets-environnement' };
  const catNorm = c => SLUG_COMPAT[c] || c;
  const nbRefs  = biblio.filter(r =>
    r.type === params.typeReglement &&
    (!params.categorie || catNorm(r.categorie) === catNorm(params.categorie)) &&
    r.qualite !== 'insuffisante' && r.qualite !== 'brouillon'
  ).length;

  const navigate = key => { setOnglet(key); setErreur(''); };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>

      {showProfil && (
        <PanelProfil profil={profil} onSave={setProfil} onClose={() => setShowProfil(false)} />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{ background: SIDEBAR_BG, width: 240 }}
        className="text-white flex flex-col min-h-screen fixed left-0 top-0 z-40">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-vb-orange rounded-xl w-10 h-10 flex items-center justify-center font-bold text-lg flex-shrink-0 select-none">VB</div>
            <div>
              <div className="font-bold text-[15px] leading-tight text-white">Tax Checker</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Vanden Broele</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ key, icon, label }) => (
            <button key={key} onClick={() => navigate(key)}
              style={onglet === key ? { background: TEAL } : {}}
              className={`w-full flex items-center gap-3 px-4 py-[10px] rounded-xl text-[13px] font-semibold text-left transition-all border-0
                ${onglet === key ? 'text-white shadow-sm' : 'text-white/55 hover:text-white/90 hover:bg-white/[0.07]'}`}>
              <span className="text-[15px] w-5 text-center shrink-0">{icon}</span>
              <span className="leading-tight">{label}</span>
            </button>
          ))}
        </nav>

        {/* Séparateur */}
        <div className="mx-5 my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

        {/* Profil commune */}
        <div className="px-3 pb-5">
          <button onClick={() => setShowProfil(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-white/[0.07] border-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
              style={{ background: 'rgba(232,119,34,0.2)', color: '#E87722' }}>
              {profil.nomCommune ? profil.nomCommune.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {profil.nomCommune || 'Configurer commune'}
              </div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Profil commune · ⚙</div>
            </div>
          </button>
        </div>
      </aside>

      {/* ═══ CONTENU PRINCIPAL ═══ */}
      <main style={{ marginLeft: 240, background: '#EFF2F7' }} className="flex-1 min-h-screen flex flex-col">

        {/* ─── ACCUEIL ─── */}
        {onglet === 'accueil' && (
          <div className="p-8 flex-1">
            <div className="mb-8">
              <h1 className="text-[26px] font-bold text-vb-bleu leading-tight">
                {profil.nomCommune ? `Commune de ${profil.nomCommune}` : 'Bienvenue sur Tax Checker'}
              </h1>
              <p className="text-vb-gris text-[14px] mt-2 max-w-lg leading-relaxed">
                Assistance à la rédaction et à la vérification de règlements-taxes et redevances communaux wallons.
              </p>
            </div>

            {/* 2 actions principales */}
            <div className="grid grid-cols-2 gap-5 mb-8" style={{ maxWidth: 680 }}>
              <button onClick={() => navigate('generer')}
                className="bg-white rounded-2xl p-7 text-left border-2 border-transparent transition-all hover:shadow-md cursor-pointer group"
                style={{ borderColor: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = TEAL}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 transition-colors"
                  style={{ background: 'rgba(23,184,181,0.1)' }}>✏️</div>
                <h3 className="font-bold text-[17px] text-vb-bleu mb-1.5">Nouveau règlement</h3>
                <p className="text-vb-gris text-[13px] leading-relaxed mb-4">
                  Générez un règlement-taxe ou une redevance adapté à votre commune avec l'assistance de l'IA.
                </p>
                <span className="text-[13px] font-semibold" style={{ color: TEAL }}>Commencer →</span>
              </button>

              <button onClick={() => navigate('verifier')}
                className="bg-white rounded-2xl p-7 text-left border-2 border-transparent transition-all hover:shadow-md cursor-pointer"
                onMouseEnter={e => e.currentTarget.style.borderColor = '#E87722'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 bg-vb-orange-light">🔍</div>
                <h3 className="font-bold text-[17px] text-vb-bleu mb-1.5">Analyser un règlement</h3>
                <p className="text-vb-gris text-[13px] leading-relaxed mb-4">
                  Vérifiez la conformité juridique d'un règlement existant grâce à 5 agents IA spécialisés.
                </p>
                <span className="text-vb-orange text-[13px] font-semibold">Analyser →</span>
              </button>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-4" style={{ maxWidth: 680 }}>
              {[
                { val: biblio.filter(b => b._local).length,  label: 'Règlements locaux',    color: TEAL },
                { val: biblio.filter(b => !b._local).length, label: 'Modèles de référence', color: '#1A3A5C' },
                { val: 5,                                     label: 'Agents d\'analyse IA', color: '#E87722' },
              ].map(({ val, label, color }) => (
                <div key={label} className="bg-white rounded-xl p-5 border border-vb-border">
                  <div className="text-[28px] font-bold" style={{ color }}>{val}</div>
                  <div className="text-[12px] text-vb-gris mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── NOUVEAU RÈGLEMENT ─── */}
        {onglet === 'generer' && (
          <div className="p-8" style={{ maxWidth: 900 }}>
            <div className="mb-6">
              <h2 className="text-[20px] font-bold text-vb-bleu">Nouveau règlement</h2>
              <p className="text-vb-gris text-[13px] mt-1">
                Décrivez librement ou remplissez le formulaire — l'IA génère le règlement complet.
              </p>
            </div>

            {/* Assistant qualification */}
            <div className="rounded-2xl p-6 mb-5 text-white" style={{ background: 'linear-gradient(135deg,#1A3A5C 0%,#2A5A8C 100%)' }}>
              <div className="font-bold text-[14px] mb-1">✨ Assistant de qualification</div>
              <div className="text-[12px] mb-3" style={{ opacity: 0.75 }}>
                Décrivez librement ce que vous souhaitez taxer — l'IA remplit le formulaire automatiquement.
              </div>
              <div className="flex gap-2.5 items-start">
                <textarea
                  value={texteLibre} onChange={e => setTexteLibre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) qualifier(); }}
                  placeholder="ex. : occupation du domaine public par une terrasse horeca, taxe sur les secondes résidences…"
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-xl text-white text-[13px] resize-none outline-none"
                  style={{ fontFamily: 'inherit', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                />
                <button onClick={qualifier} disabled={qualifBusy || !texteLibre.trim()}
                  className="vb-btn bg-vb-orange text-white px-4 py-2 whitespace-nowrap min-w-[110px]">
                  {qualifBusy ? '⏳ Analyse…' : 'Qualifier →'}
                </button>
              </div>
              <div className="text-[11px] mt-1.5" style={{ opacity: 0.5 }}>Ctrl+Entrée pour soumettre</div>
              {qualifMsg && (
                <div className={`mt-3 px-3.5 py-2.5 rounded-xl flex gap-2.5 items-start`}
                  style={{ background: qualifMsg.ok ? 'rgba(255,255,255,0.12)' : 'rgba(220,38,38,0.25)', border: `1px solid ${qualifMsg.ok ? 'rgba(255,255,255,0.25)' : 'rgba(220,38,38,0.5)'}` }}>
                  <span className="text-[16px] leading-none">{qualifMsg.ok ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <div className="font-bold text-[13px]">{qualifMsg.texte}</div>
                    {qualifMsg.explication && <div className="text-[12px] mt-0.5" style={{ opacity: 0.8 }}>{qualifMsg.explication}</div>}
                  </div>
                  <button onClick={() => setQualifMsg(null)}
                    className="text-white cursor-pointer bg-transparent border-none text-[18px] leading-none p-0" style={{ opacity: 0.5 }}>×</button>
                </div>
              )}
            </div>

            {/* Formulaire */}
            <div className="vb-card mb-5">
              <h3 className="text-vb-bleu mt-0 text-[15px] font-bold mb-4">Paramètres du règlement</h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <label className="vb-label">Commune <span className="text-vb-rouge">*</span></label>
                  <CommuneAutocomplete value={params.commune} onChange={v => upd('commune', v)} onSelect={pickCommune} />
                  {(params.ins || params.province) && (
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {params.ins            && <span className="vb-badge bg-vb-bleu-light text-vb-bleu font-bold">INS {params.ins}</span>}
                      {params.cp             && <span className="vb-badge bg-vb-gris-clair text-vb-gris">CP {params.cp}</span>}
                      {params.arrondissement && <span className="vb-badge bg-vb-gris-clair text-vb-gris">{params.arrondissement}</span>}
                      {params.province       && <span className="vb-badge bg-vb-gris-clair text-vb-gris">Prov. {params.province}</span>}
                    </div>
                  )}
                  <CarteMandataires data={mandataires} loading={mandLoading} commune={params.commune} />
                  <PanelPresences mandataires={mandataires} presences={presences} onChange={setPresences} />
                </div>

                <div className="col-span-2">
                  <label className="vb-label">Catégorie <span className="text-vb-rouge">*</span></label>
                  <select className="vb-input" value={params.categorie}
                    onChange={e => { upd('categorie', e.target.value); upd('sousCat', ''); }}>
                    <option value="">— Sélectionner une catégorie —</option>
                    {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                </div>

                {params.categorie && (
                  <div className="col-span-2">
                    <label className="vb-label">Sous-catégorie</label>
                    <select className="vb-input" value={params.sousCat} onChange={e => upd('sousCat', e.target.value)}>
                      <option value="">— Préciser (recommandé) —</option>
                      {(CATEGORIES.find(c => c.slug === params.categorie)?.sous || []).map(s => (
                        <option key={s.slug} value={s.slug}>{s.label}</option>
                      ))}
                    </select>
                    <div className="mt-1 text-[11px] text-vb-gris">
                      📚 {nbRefs} règlement(s) de référence disponible(s)
                      {params.sousCat && NOTES_SOUS_CAT[params.sousCat] && (
                        <span className="ml-2 text-vb-orange font-bold">⚡ Exigences juridiques spécifiques</span>
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
                      <option value="autorisation">Autorisation d'occupation</option>
                      <option value="service">Service rendu / usage</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="vb-label">Exercice début</label>
                    <input className="vb-input" value={params.periodeDebut} onChange={e => upd('periodeDebut', e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="vb-label">Exercice fin</label>
                    <input className="vb-input" value={params.periodeFin} onChange={e => upd('periodeFin', e.target.value)} />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="vb-label">Objet du règlement <span className="text-vb-rouge">*</span></label>
                  <input className="vb-input" placeholder="ex. : délivrance de documents administratifs…"
                    value={params.objet} onChange={e => upd('objet', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="vb-label">Redevable (qui paie ?) <span className="text-vb-rouge">*</span></label>
                  <input className="vb-input" placeholder="ex. : toute personne physique ou morale qui sollicite…"
                    value={params.redevable} onChange={e => upd('redevable', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="vb-label">Tarif / montant <span className="text-vb-rouge">*</span></label>
                  <input className="vb-input" placeholder="ex. : 5 € par acte"
                    value={params.tarif} onChange={e => upd('tarif', e.target.value)} />
                </div>
                <div>
                  <label className="vb-label">Exonérations</label>
                  <input className="vb-input" placeholder="ex. : actes délivrés aux services publics…"
                    value={params.exonerations} onChange={e => upd('exonerations', e.target.value)} />
                </div>
                <div>
                  <label className="vb-label">Informations complémentaires</label>
                  <input className="vb-input" placeholder="particularités locales…"
                    value={params.infoCompl} onChange={e => upd('infoCompl', e.target.value)} />
                </div>
              </div>

              {erreur && (
                <div className="mt-3 px-3.5 py-2.5 bg-vb-rouge-clair border border-vb-rouge rounded-xl text-vb-rouge text-[13px]">
                  {erreur}
                </div>
              )}

              <div className="mt-5 flex gap-3 items-center flex-wrap">
                <button onClick={generer} disabled={loading}
                  className="vb-btn text-white px-7 py-3 text-[14px]"
                  style={{ background: loading ? '#9CA3AF' : TEAL }}>
                  {loading ? '⏳ Génération…' : '✏️ Générer le règlement'}
                </button>
                <span className="text-[12px] text-vb-gris">⚠️ Validation juriste obligatoire avant adoption.</span>
              </div>
            </div>

            {/* Résultat généré */}
            {texteGenere && (
              <div className="vb-card">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="text-vb-bleu m-0 text-[15px] font-bold">📄 Règlement généré</h3>
                  <div className="flex gap-2">
                    {etapeGen === 'resultat' && (
                      <button onClick={() => navigate('verifier')}
                        className="border rounded-lg px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer bg-vb-bleu-light text-vb-bleu border-vb-bleu">
                        🔍 Analyser
                      </button>
                    )}
                    {etapeGen === 'resultat' && (
                      <button onClick={handleExportDocx}
                        className="border rounded-lg px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer bg-vb-vert-clair text-vb-vert border-vb-vert">
                        ⬇ Word
                      </button>
                    )}
                    <button onClick={() => navigator.clipboard.writeText(texteGenere)}
                      className="border rounded-lg px-3.5 py-1.5 text-[12px] cursor-pointer bg-vb-gris-clair text-vb-gris border-vb-border">
                      📋 Copier
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-[13px] leading-[1.7] bg-gray-50 p-5 rounded-xl border border-vb-border max-h-[520px] overflow-y-auto"
                  style={{ fontFamily: 'Georgia, serif' }}>
                  {texteGenere}{loading && <span className="text-vb-orange">▌</span>}
                </pre>
                {etapeGen === 'resultat' && (
                  <div className="mt-3 px-3.5 py-2.5 bg-vb-jaune-clair border border-vb-jaune rounded-xl text-[12px] text-vb-jaune">
                    ⚠️ <strong>Rappel :</strong> Aide à la rédaction uniquement. Validation obligatoire par un juriste avant adoption.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── ANALYSER UN RÈGLEMENT ─── */}
        {onglet === 'verifier' && (
          <div className="p-8 flex-1">
            <div className="mb-6">
              <h2 className="text-[20px] font-bold text-vb-bleu">Analyser un règlement existant</h2>
              <p className="text-vb-gris text-[13px] mt-1">
                5 agents IA analysent votre règlement en parallèle et produisent un rapport de conformité détaillé.
              </p>
            </div>
            <OngletVerifier texteInitial={texteGenere} />
          </div>
        )}

        {/* ─── BIBLIOTHÈQUE ─── */}
        {onglet === 'bibliotheque' && (
          <div className="p-8 flex-1">
            <div className="mb-6">
              <h2 className="text-[20px] font-bold text-vb-bleu">Bibliothèque de modèles</h2>
              <p className="text-vb-gris text-[13px] mt-1">
                Règlements de référence Vanden Broele et vos règlements locaux sauvegardés.
              </p>
            </div>
            <OngletBibliotheque biblio={biblio} setBiblio={setBiblio} />
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-4 mt-auto" style={{ borderTop: '1px solid #E5E7EB' }}>
          <div className="text-[11px] text-vb-gris">
            Données mandataires : <a href="https://www.odwb.be" target="_blank" rel="noreferrer" className="text-vb-bleu hover:underline">odwb.be</a>
            {' '}· Licence CC0 · ⚠️ Validation juriste obligatoire avant toute adoption
          </div>
        </div>
      </main>
    </div>
  );
}
