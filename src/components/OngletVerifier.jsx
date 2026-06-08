import { useState, useCallback, useRef } from 'react';
import { verifierAvecIA, corrigerAvecIA, AGENTS_CONFIG } from '../services/verificationIAService.js';

// ─── Helpers visuels ──────────────────────────────────────────────────────────

const GRAVITE_STYLE = {
  critique:  'bg-red-100 border-red-400 text-red-800',
  ameliorer: 'bg-orange-100 border-orange-400 text-orange-800',
  conforme:  'bg-green-100 border-green-400 text-green-800',
  // fallbacks anciens niveaux
  majeur:    'bg-orange-100 border-orange-400 text-orange-800',
  mineur:    'bg-orange-100 border-orange-400 text-orange-800',
  info:      'bg-green-100 border-green-400 text-green-800',
};
const GRAVITE_LABEL = {
  critique:  'Critique',
  ameliorer: 'À améliorer',
  conforme:  'Conforme',
  majeur:    'À améliorer',
  mineur:    'À améliorer',
  info:      'Conforme',
};

const scoreColor = s =>
  s >= 90 ? 'text-green-700' : s >= 80 ? 'text-emerald-600' :
  s >= 70 ? 'text-yellow-600' : s >= 60 ? 'text-orange-600' : 'text-red-700';

const NIVEAU_LABEL = {
  insuffisant: { label: 'Insuffisant', cls: 'bg-red-100 text-red-800 border-red-300' },
  a_ameliorer: { label: 'À améliorer', cls: 'bg-orange-100 text-orange-800 border-orange-300' },
  acceptable:  { label: 'Acceptable',  cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  bon:         { label: 'Bon',         cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  excellent:   { label: 'Excellent',   cls: 'bg-green-100 text-green-800 border-green-300' },
};

// ─── Composants ───────────────────────────────────────────────────────────────

function GraviteBadge({ gravite }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${GRAVITE_STYLE[gravite] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
      {GRAVITE_LABEL[gravite] || gravite}
    </span>
  );
}

function FindingCard({ finding }) {
  const [open, setOpen] = useState(finding.gravite === 'critique' || finding.gravite === 'majeur');
  return (
    <div className={`border rounded-lg mb-2 ${GRAVITE_STYLE[finding.gravite] || 'bg-gray-50 border-gray-300'}`}>
      <button className="w-full text-left px-4 py-2 flex items-center gap-2" onClick={() => setOpen(o => !o)}>
        <GraviteBadge gravite={finding.gravite} />
        <span className="font-medium flex-1">{finding.titre}</span>
        <span className="text-xs opacity-60">{finding.article}</span>
        <span className="ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 text-sm">
          <p>{finding.detail}</p>
          {finding.extrait && (
            <blockquote className="border-l-4 border-current pl-3 opacity-70 italic text-xs">
              «&nbsp;{finding.extrait}&nbsp;»
            </blockquote>
          )}
          {finding.correction && (
            <div className="bg-white bg-opacity-60 rounded p-2">
              <span className="font-semibold">Correction : </span>{finding.correction}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentPanel({ agent }) {
  const [open, setOpen] = useState(false);
  if (!agent.ok) {
    return (
      <div className="border border-red-200 rounded-lg bg-red-50 p-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-red-500">⚠</span>
          <span className="font-medium text-red-700">{agent.label}</span>
          <span className="text-xs text-red-500 ml-auto">Erreur</span>
        </div>
        <p className="text-xs text-red-500 mt-1">{agent.error}</p>
      </div>
    );
  }
  const r = agent.result;
  const critiques  = r.findings?.filter(f => f.gravite === 'critique').length || 0;
  const ameliorer  = r.findings?.filter(f => f.gravite === 'ameliorer' || f.gravite === 'majeur' || f.gravite === 'mineur').length || 0;
  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <button className="w-full text-left px-4 py-3 flex items-center gap-3 bg-gray-50 hover:bg-gray-100"
        onClick={() => setOpen(o => !o)}>
        <span className={`text-2xl font-bold w-14 ${scoreColor(r.score)}`}>{r.score}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{agent.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{r.resume?.slice(0, 100)}{r.resume?.length > 100 ? '…' : ''}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {critiques > 0 && <span className="text-xs bg-red-100 text-red-700 border border-red-300 rounded px-2 py-0.5">{critiques} critique{critiques > 1 ? 's' : ''}</span>}
          {ameliorer > 0 && <span className="text-xs bg-orange-100 text-orange-700 border border-orange-300 rounded px-2 py-0.5">{ameliorer} à améliorer</span>}
        </div>
        <span className="text-gray-400 ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4">
          <p className="text-sm text-gray-700 mb-3">{r.resume}</p>
          {r.findings?.map((f, i) => <FindingCard key={i} finding={f} />)}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ phase, done, total }) {
  const LABELS = {
    lancement:       'Lancement des 5 agents spécialisés…',
    agents_termines: 'Agents terminés — synthèse en cours…',
    complet:         'Analyse complète',
  };
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{LABELS[phase] || phase}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-500">Chaque agent interroge GPT-4o en parallèle — 30 à 60 secondes en général.</p>
    </div>
  );
}

function SynthesePanel({ synthese, meta }) {
  const niveau = NIVEAU_LABEL[synthese.niveau] || NIVEAU_LABEL.acceptable;
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-6">
        <div className="text-center">
          <div className={`text-5xl font-bold ${scoreColor(synthese.scoreGlobal)}`}>{synthese.scoreGlobal}</div>
          <div className="text-xs text-gray-500 mt-1">/ 100</div>
        </div>
        <div className="flex-1">
          <div className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border mb-2 ${niveau.cls}`}>
            {niveau.label}
          </div>
          <p className="text-sm text-gray-700">{synthese.resumeExecutif}</p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>{meta.agentsOk}/5 agents</div>
          <div>{new Date(meta.dateAnalyse).toLocaleTimeString('fr-BE')}</div>
        </div>
      </div>

      {synthese.recommandationPrincipale && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <span className="text-blue-500 text-xl flex-shrink-0">→</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">Action prioritaire</p>
            <p className="text-sm text-blue-700 mt-0.5">{synthese.recommandationPrincipale}</p>
          </div>
        </div>
      )}

      {(synthese.pointsCritiques || []).length > 0 && (
        <div>
          <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            Problèmes critiques
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {synthese.pointsCritiques.length}
            </span>
          </h3>
          {synthese.pointsCritiques.map((f, i) => <FindingCard key={i} finding={{ ...f, gravite: 'critique' }} />)}
        </div>
      )}

      {(synthese.avertissements || []).length > 0 && (
        <div>
          <h3 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
            Avertissements
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {synthese.avertissements.length}
            </span>
          </h3>
          {synthese.avertissements.map((f, i) => <FindingCard key={i} finding={{ ...f, gravite: 'majeur' }} />)}
        </div>
      )}

      {(synthese.pointsConformes || []).length > 0 && (
        <div>
          <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
            Points conformes
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {synthese.pointsConformes.length}
            </span>
          </h3>
          {synthese.pointsConformes.map((f, i) => <FindingCard key={i} finding={{ ...f, gravite: 'info' }} />)}
        </div>
      )}
    </div>
  );
}

// ─── Onglet principal ─────────────────────────────────────────────────────────

export default function OngletVerifier({ texteInitial = '' }) {
  const [texte,           setTexte]           = useState(texteInitial);
  const [etat,            setEtat]            = useState('attente'); // attente | analyse | complet | erreur
  const [progress,        setProgress]        = useState({ phase: '', done: 0, total: 0 });
  const [resultat,        setResultat]        = useState(null);
  const [erreur,          setErreur]          = useState('');
  const [activeTab,       setActiveTab]       = useState('synthese');

  const [correctionTexte, setCorrectionTexte] = useState('');
  const [correctionEtat,  setCorrectionEtat]  = useState('idle'); // idle | en_cours | pret | erreur
  const [erreurCorr,      setErreurCorr]      = useState('');
  const corrRef = useRef('');

  const nbActionable = resultat
    ? resultat.agents.filter(a => a.ok)
        .flatMap(a => a.result?.findings || [])
        .filter(f => f.gravite === 'critique' || f.gravite === 'ameliorer' || f.gravite === 'majeur' || f.gravite === 'mineur').length
    : 0;

  const lancer = useCallback(async () => {
    if (!texte.trim()) return;
    setEtat('analyse');
    setErreur('');
    setResultat(null);
    setCorrectionEtat('idle');
    setCorrectionTexte('');
    corrRef.current = '';
    try {
      const res = await verifierAvecIA(texte, (phase, done, total) => setProgress({ phase, done, total }));
      setResultat(res);
      setEtat('complet');
      setActiveTab('synthese');
    } catch (e) {
      setErreur(e.message);
      setEtat('erreur');
    }
  }, [texte]);

  const reinitialiser = () => {
    setEtat('attente');
    setResultat(null);
    setErreur('');
    setCorrectionEtat('idle');
    setCorrectionTexte('');
    setErreurCorr('');
    corrRef.current = '';
  };

  const handleExportRapport = async () => {
    if (!resultat) return;
    try {
      const { exportRapportDocx } = await import('../exportRapportDocx.js');
      await exportRapportDocx({ resultat });
    } catch (e) {
      setErreur(`Export rapport impossible : ${e.message}`);
    }
  };

  const lancerCorrection = async () => {
    setCorrectionEtat('en_cours');
    setErreurCorr('');
    setCorrectionTexte('');
    corrRef.current = '';
    try {
      await corrigerAvecIA(texte, resultat.agents, delta => {
        corrRef.current += delta;
        setCorrectionTexte(corrRef.current);
      });
      setCorrectionEtat('pret');
    } catch (e) {
      setErreurCorr(e.message);
      setCorrectionEtat('erreur');
    }
  };

  const reanalyserCorrection = () => {
    setTexte(correctionTexte);
    reinitialiser();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* Zone de saisie */}
      {(etat === 'attente' || etat === 'erreur') && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {AGENTS_CONFIG.map(a => (
              <span key={a.key} className="bg-gray-100 border border-gray-200 rounded px-2 py-1">{a.label}</span>
            ))}
          </div>
          <textarea
            className="w-full h-64 border border-gray-300 rounded-lg p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Collez ici le texte du règlement-taxe ou redevance à analyser…"
            value={texte}
            onChange={e => setTexte(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{texte.length} caractères</span>
            <button onClick={lancer} disabled={!texte.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
              Lancer l'analyse juridique
            </button>
          </div>
          {etat === 'erreur' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <strong>Erreur :</strong> {erreur}
            </div>
          )}
        </div>
      )}

      {/* Progression */}
      {etat === 'analyse' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <ProgressBar {...progress} />
          <div className="mt-4 grid grid-cols-5 gap-2">
            {AGENTS_CONFIG.map(a => (
              <div key={a.key} className="bg-gray-50 border border-gray-200 rounded p-2 text-center animate-pulse">
                <div className="text-xs font-medium text-gray-600 leading-tight">{a.label.split('(')[0].trim()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résultats */}
      {etat === 'complet' && resultat && (
        <div className="space-y-4">

          {/* Barre onglets + actions */}
          <div className="flex items-end gap-1 border-b border-gray-200">
            {[
              { key: 'synthese',   label: 'Synthèse' },
              { key: 'agents',     label: `Détail agents (${resultat.meta.agentsOk}/5)` },
              { key: 'correction', label: nbActionable > 0 ? `Texte corrigé (${nbActionable})` : 'Texte corrigé' },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === t.key
                    ? t.key === 'correction'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}

            <div className="ml-auto flex gap-2 pb-1">
              <button onClick={handleExportRapport}
                className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold">
                ⬇ Rapport Word
              </button>
              <button onClick={reinitialiser}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded">
                Nouvelle analyse
              </button>
            </div>
          </div>

          {/* Tab : synthèse */}
          {activeTab === 'synthese' && (
            <SynthesePanel synthese={resultat.synthese} meta={resultat.meta} />
          )}

          {/* Tab : agents */}
          {activeTab === 'agents' && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Cliquez sur un agent pour voir le détail de ses findings.</p>
              {resultat.agents.map(a => <AgentPanel key={a.key} agent={a} />)}
            </div>
          )}

          {/* Tab : correction */}
          {activeTab === 'correction' && (
            <div className="space-y-3">
              {nbActionable === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-green-800 text-sm">
                  <strong>Aucune correction nécessaire</strong> — aucun problème critique ou majeur n'a été identifié dans ce règlement.
                </div>
              ) : correctionEtat === 'idle' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <p className="text-sm text-blue-800 mb-1">
                    <strong>{nbActionable} problème{nbActionable > 1 ? 's' : ''} critique{nbActionable > 1 ? 's' : ''}/majeur{nbActionable > 1 ? 's' : ''}</strong> identifié{nbActionable > 1 ? 's' : ''}.
                    GPT-4o va générer une version corrigée en appliquant automatiquement toutes les corrections suggérées.
                  </p>
                  <p className="text-xs text-blue-600 mb-4">
                    La structure et le style officiel du règlement seront conservés — seuls les passages problématiques seront modifiés.
                  </p>
                  <button onClick={lancerCorrection}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg">
                    Générer la version corrigée →
                  </button>
                </div>
              ) : correctionEtat === 'erreur' ? (
                <div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-3">
                    <strong>Erreur :</strong> {erreurCorr}
                  </div>
                  <button onClick={() => setCorrectionEtat('idle')}
                    className="px-4 py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:text-gray-800">
                    Réessayer
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      {correctionEtat === 'en_cours' ? '⏳ Génération en cours…' : '✅ Règlement corrigé'}
                    </span>
                    {correctionEtat === 'pret' && (
                      <div className="flex gap-2">
                        <button onClick={() => navigator.clipboard.writeText(correctionTexte)}
                          className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:text-gray-800">
                          📋 Copier
                        </button>
                        <button onClick={reanalyserCorrection}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">
                          🔍 Ré-analyser
                        </button>
                      </div>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-[13px] leading-[1.7] bg-gray-50 p-5 rounded-xl border border-gray-200 max-h-[560px] overflow-y-auto"
                    style={{ fontFamily: 'Georgia, serif' }}>
                    {correctionTexte}
                    {correctionEtat === 'en_cours' && <span className="text-orange-500">▌</span>}
                  </pre>
                  {correctionEtat === 'pret' && (
                    <div className="px-3.5 py-2.5 bg-yellow-50 border border-yellow-300 rounded-xl text-xs text-yellow-800">
                      ⚠️ <strong>Rappel :</strong> Ce texte corrigé est une aide à la rédaction. Validation obligatoire par un juriste avant adoption.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
