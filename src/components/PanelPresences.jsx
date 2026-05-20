export default function PanelPresences({ mandataires, presences, onChange }) {
  if (!mandataires || mandataires.length === 0) return null;

  const conseil = mandataires.filter(m => !/directeur|directrice/i.test(m.detail_fonction));
  if (conseil.length === 0) return null;

  const nomM   = m => `${m.detail_civilite || ''} ${m.detail_prenom || ''} ${m.detail_nom || ''}`.trim();
  const toggle = i => onChange(prev => {
    const next = { ...prev };
    if (next[i] === false) delete next[i]; else next[i] = false;
    return next;
  });

  const nbPresents = conseil.filter((_, i) => presences[i] !== false).length;
  const nbAbsents  = conseil.length - nbPresents;

  const groupes = [
    { label: 'Bourgmestre',           filtre: m => /bourgmestre/i.test(m.detail_fonction) },
    { label: 'Échevins',              filtre: m => /[eé]chevin/i.test(m.detail_fonction)  },
    { label: 'Conseillers communaux', filtre: m => !/bourgmestre|[eé]chevin/i.test(m.detail_fonction) },
  ];

  return (
    <div className="mt-3 border border-vb-border rounded-lg overflow-hidden">
      <div className="bg-vb-gris-clair px-3.5 py-2 flex justify-between items-center">
        <span className="text-[13px] font-bold text-vb-bleu flex items-center gap-2">
          Présents au conseil — {nbPresents}/{conseil.length}
          {nbAbsents > 0 && (
            <span className="bg-vb-jaune-clair text-vb-jaune px-2 py-0.5 rounded-full text-[11px]">
              {nbAbsents} absent{nbAbsents > 1 ? 's' : ''} excusé{nbAbsents > 1 ? 's' : ''}
            </span>
          )}
        </span>
        {nbAbsents > 0 && (
          <button
            onClick={() => onChange({})}
            className="text-[11px] text-vb-gris underline cursor-pointer bg-transparent border-none"
          >
            Tous présents
          </button>
        )}
      </div>

      <div className="px-3.5 py-2.5 flex flex-col gap-2.5">
        {groupes.map(({ label, filtre }) => {
          const membres = conseil.map((m, i) => ({ m, i })).filter(({ m }) => filtre(m));
          if (membres.length === 0) return null;
          return (
            <div key={label}>
              <div className="text-[10px] font-bold text-vb-gris uppercase tracking-wide mb-1">{label}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {membres.map(({ m, i }) => {
                  const present = presences[i] !== false;
                  return (
                    <label
                      key={i}
                      className={`flex items-center gap-1.5 cursor-pointer text-[12px] ${present ? 'text-vb-bleu' : 'text-vb-gris opacity-55'}`}
                    >
                      <input
                        type="checkbox"
                        checked={present}
                        onChange={() => toggle(i)}
                        className="accent-vb-bleu w-[13px] h-[13px] cursor-pointer"
                      />
                      {nomM(m)}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
