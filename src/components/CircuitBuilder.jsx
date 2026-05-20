import { useState } from 'react';
import { nouveauCircuit, nouveauSignataire } from '../data/circuits.js';

function FormCircuit({ initial, onSave, onCancel }) {
  const [c, setC] = useState(() => initial ?? nouveauCircuit());

  const updLabel = v => setC(p => ({ ...p, label: v }));

  const updSig = (idx, key, val) => setC(p => ({
    ...p,
    signataires: p.signataires.map((s, i) => i === idx ? { ...s, [key]: val } : s),
  }));

  const addSig = () => setC(p => ({
    ...p,
    signataires: [...p.signataires, nouveauSignataire(p.signataires.length + 1)],
  }));

  const removeSig = idx => setC(p => ({
    ...p,
    signataires: p.signataires
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, ordre: i + 1 })),
  }));

  const moveSig = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= c.signataires.length) return;
    setC(p => {
      const arr = [...p.signataires];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...p, signataires: arr.map((s, i) => ({ ...s, ordre: i + 1 })) };
    });
  };

  const canSave = c.label.trim() && c.signataires.length > 0 &&
    c.signataires.every(s => s.nom.trim() && s.email.includes('@'));

  return (
    <div className="border border-vb-bleu/20 rounded-lg p-4 bg-vb-bleu-light/50 mt-2">
      <div className="mb-3">
        <label className="vb-label">Nom du circuit *</label>
        <input className="vb-input" value={c.label}
          onChange={e => updLabel(e.target.value)}
          placeholder="ex. : DG → Bourgmestre" />
      </div>

      <div className="vb-label mb-2">Signataires (dans l'ordre de signature)</div>

      {c.signataires.map((s, idx) => (
        <div key={idx} className="flex gap-1.5 mb-2 items-center">
          <span className="text-[11px] text-vb-gris font-bold w-5 text-center shrink-0">{idx + 1}</span>
          <input className="vb-input flex-[2] min-w-0" placeholder="Nom" value={s.nom}
            onChange={e => updSig(idx, 'nom', e.target.value)} />
          <input className="vb-input flex-[3] min-w-0" placeholder="email@vandenbroele.be" value={s.email}
            onChange={e => updSig(idx, 'email', e.target.value)} />
          <input className="vb-input flex-[2] min-w-0" placeholder="Rôle" value={s.role}
            onChange={e => updSig(idx, 'role', e.target.value)} />
          <div className="flex flex-col gap-0.5 shrink-0">
            <button onClick={() => moveSig(idx, -1)} disabled={idx === 0}
              className="text-[10px] px-1.5 py-0.5 bg-vb-gris-clair text-vb-gris rounded border border-vb-border cursor-pointer disabled:opacity-30">↑</button>
            <button onClick={() => moveSig(idx, 1)} disabled={idx === c.signataires.length - 1}
              className="text-[10px] px-1.5 py-0.5 bg-vb-gris-clair text-vb-gris rounded border border-vb-border cursor-pointer disabled:opacity-30">↓</button>
          </div>
          <button onClick={() => removeSig(idx)}
            className="shrink-0 text-[12px] px-2 py-1 bg-vb-rouge-clair text-vb-rouge rounded border border-vb-rouge/30 cursor-pointer">✕</button>
        </div>
      ))}

      <button onClick={addSig}
        className="vb-btn bg-white text-vb-bleu border border-vb-bleu/30 px-3 py-1.5 text-[12px] mb-4">
        + Ajouter un signataire
      </button>

      <div className="flex gap-2">
        <button onClick={() => canSave && onSave(c)} disabled={!canSave}
          className="vb-btn bg-vb-vert text-white px-4 py-2 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
          💾 Enregistrer
        </button>
        <button onClick={onCancel}
          className="vb-btn bg-white text-vb-gris border border-vb-border px-4 py-2 text-[13px]">
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function CircuitBuilder({ circuits, onChange }) {
  const [editing, setEditing] = useState(null);

  const save = circuit => {
    const idx = circuits.findIndex(c => c.id === circuit.id);
    onChange(idx >= 0
      ? circuits.map(c => c.id === circuit.id ? circuit : c)
      : [...circuits, circuit]
    );
    setEditing(null);
  };

  const del = id => {
    if (!confirm('Supprimer ce circuit de signature ?')) return;
    onChange(circuits.filter(c => c.id !== id));
  };

  return (
    <div>
      {circuits.length === 0 && !editing && (
        <p className="text-vb-gris text-[12px] mb-2">Aucun circuit configuré.</p>
      )}

      {circuits.map(c => (
        editing === c.id
          ? <FormCircuit key={c.id} initial={c} onSave={save} onCancel={() => setEditing(null)} />
          : (
            <div key={c.id} className="flex items-center gap-2 py-2.5 border-b border-vb-border last:border-0">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-vb-bleu">{c.label}</div>
                <div className="text-[11px] text-vb-gris truncate">
                  {c.signataires.map(s => s.nom || s.email).join(' → ')}
                </div>
              </div>
              <button onClick={() => setEditing(c.id)}
                className="shrink-0 bg-vb-bleu-light text-vb-bleu border-none rounded-md px-2.5 py-1 text-[12px] cursor-pointer">✏️</button>
              <button onClick={() => del(c.id)}
                className="shrink-0 bg-vb-rouge-clair text-vb-rouge border-none rounded-md px-2.5 py-1 text-[12px] cursor-pointer">🗑️</button>
            </div>
          )
      ))}

      {editing === 'new'
        ? <FormCircuit initial={null} onSave={save} onCancel={() => setEditing(null)} />
        : (
          <button onClick={() => setEditing('new')}
            className="vb-btn bg-vb-orange text-white px-4 py-2 text-[13px] mt-2">
            + Nouveau circuit
          </button>
        )
      }
    </div>
  );
}
