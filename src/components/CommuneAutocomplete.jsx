import { useState, useRef, useEffect } from 'react';
import { searchCommunes } from '../services/odwbService.js';

export default function CommuneAutocomplete({ value, onChange, onSelect }) {
  const [sugg, setSugg]     = useState([]);
  const [busy, setBusy]     = useState(false);
  const [open, setOpen]     = useState(false);
  const [apiErr, setApiErr] = useState(false);
  const timer = useRef(null);
  const wrap  = useRef(null);

  const handleChange = e => {
    const v = e.target.value;
    onChange(v);
    setApiErr(false);
    clearTimeout(timer.current);
    if (v.length < 2) { setSugg([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try { const res = await searchCommunes(v); setSugg(res); setOpen(res.length > 0); }
      catch { setApiErr(true); setOpen(false); }
      finally { setBusy(false); }
    }, 350);
  };

  useEffect(() => {
    const h = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={wrap} className="relative">
      <div className="relative">
        <input
          className="vb-input pr-8"
          placeholder="Commencez à taper le nom de la commune…"
          value={value}
          onChange={handleChange}
          onFocus={() => sugg.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {busy && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-vb-gris text-[13px]">⏳</span>
        )}
      </div>

      {apiErr && (
        <div className="mt-1 text-[11px] text-vb-jaune">
          ⚠️ API ODWB inaccessible — saisissez manuellement.
        </div>
      )}

      {open && sugg.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-vb-border rounded-lg shadow-lg overflow-hidden">
          {sugg.map((c, i) => (
            <div
              key={c.ins}
              onMouseDown={() => { onSelect(c); setOpen(false); setSugg([]); }}
              className={`px-3.5 py-2.5 cursor-pointer hover:bg-vb-orange-light ${i < sugg.length - 1 ? 'border-b border-vb-border' : ''}`}
            >
              <div className="font-semibold text-vb-bleu text-[14px]">{c.nom}</div>
              <div className="text-[11px] text-vb-gris mt-0.5">
                {c.cp && `CP ${c.cp}`}
                <span className="ml-2 bg-vb-bleu-light text-vb-bleu px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  INS {c.ins}
                </span>
              </div>
            </div>
          ))}
          <div className="px-3.5 py-1.5 text-[10px] text-vb-gris bg-vb-gris-clair border-t border-vb-border">
            Source UVCW · ODWB · Licence CC0
          </div>
        </div>
      )}
    </div>
  );
}
