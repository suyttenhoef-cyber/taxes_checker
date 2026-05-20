export default function CarteMandataires({ data, loading, commune }) {
  if (loading) return (
    <div className="mt-3 px-3.5 py-3 bg-vb-bleu-light border border-vb-bleu/20 rounded-lg text-[13px] text-vb-gris">
      ⏳ Chargement des mandataires de {commune}…
    </div>
  );
  if (!data || data.length === 0) return null;

  const bourg = data.filter(m => /bourgmestre/i.test(m.detail_fonction));
  const echev = data.filter(m => /[eé]chevin/i.test(m.detail_fonction));
  const pop   = data[0]?.population;
  const coal  = data[0]?.coalition;
  const ligne = m => `${m.detail_civilite || ''} ${m.detail_prenom || ''} ${m.detail_nom || ''}`.trim()
    + (m.detail_parti ? ` (${m.detail_parti})` : '');

  return (
    <div className="mt-3 bg-vb-bleu-light border border-vb-bleu/20 rounded-lg px-4 py-3">
      <div className="font-bold text-vb-bleu text-[13px] mb-2 flex items-center flex-wrap gap-2">
        📋 Mandataires · {commune}
        {pop && <span className="font-normal text-vb-gris text-[12px]">{pop.toLocaleString('fr-BE')} hab.</span>}
        {coal && <span className="bg-white text-vb-bleu px-2 py-0.5 rounded-full text-[11px] font-semibold">{coal}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {bourg.length > 0 && (
          <div className="bg-white rounded-md px-3 py-2 border border-vb-border">
            <div className="text-[11px] text-vb-orange font-bold mb-1">🏛️ BOURGMESTRE</div>
            {bourg.map((m, i) => <div key={i} className="text-[13px] text-vb-bleu font-semibold">{ligne(m)}</div>)}
          </div>
        )}
        {echev.length > 0 && (
          <div className="bg-white rounded-md px-3 py-2 border border-vb-border">
            <div className="text-[11px] text-vb-gris font-bold mb-1">ÉCHEVINS ({echev.length})</div>
            {echev.slice(0, 3).map((m, i) => (
              <div key={i} className="text-[12px] text-vb-bleu">
                {ligne(m)}
                {m.attribution?.length > 0 && (
                  <span className="text-[10px] text-vb-gris ml-1">
                    — {m.attribution.slice(0, 2).join(', ')}{m.attribution.length > 2 ? '…' : ''}
                  </span>
                )}
              </div>
            ))}
            {echev.length > 3 && <div className="text-[11px] text-vb-gris">+{echev.length - 3} autres</div>}
          </div>
        )}
      </div>
    </div>
  );
}
