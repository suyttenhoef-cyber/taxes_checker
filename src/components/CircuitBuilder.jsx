import { useState, useEffect } from 'react';
import { nouveauCircuit, nouveauApprobateur, nouveauSignataire } from '../data/circuits.js';
import { chargerDossiersoorts } from '../services/signatureService.js';

// ─── Shared person-row component ──────────────────────────────────────────────

function PersonneListe({ items, onChange, placeholder, addLabel }) {
  const upd = (idx, key, val) => onChange(
    items.map((s, i) => i === idx ? { ...s, [key]: val } : s)
  );
  const add = () => onChange([...items, placeholder === 'Approbateur' ? nouveauApprobateur(items.length + 1) : nouveauSignataire(items.length + 1)]);
  const del = idx => onChange(items.filter((_, i) => i !== idx).map((s, i) => ({ ...s, ordre: i + 1 })));
  const move = (idx, dir) => {
    const t = idx + dir;
    if (t < 0 || t >= items.length) return;
    const arr = [...items];
    [arr[idx], arr[t]] = [arr[t], arr[idx]];
    onChange(arr.map((s, i) => ({ ...s, ordre: i + 1 })));
  };

  return (
    <div>
      {items.map((s, idx) => (
        <div key={idx} className="flex gap-1.5 mb-2 items-center">
          <span className="text-[11px] text-vb-gris font-bold w-5 text-center shrink-0">{idx + 1}</span>
          <input className="vb-input flex-[2] min-w-0" placeholder="Nom" value={s.nom}
            onChange={e => upd(idx, 'nom', e.target.value)} />
          <input className="vb-input flex-[3] min-w-0" placeholder="email@vandenbroele.be" value={s.email}
            onChange={e => upd(idx, 'email', e.target.value)} />
          <input className="vb-input flex-[2] min-w-0" placeholder="Rôle" value={s.role}
            onChange={e => upd(idx, 'role', e.target.value)} />
          <div className="flex flex-col gap-0.5 shrink-0">
            <button onClick={() => move(idx, -1)} disabled={idx === 0}
              className="text-[10px] px-1.5 py-0.5 bg-vb-gris-clair text-vb-gris rounded border border-vb-border cursor-pointer disabled:opacity-30">↑</button>
            <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
              className="text-[10px] px-1.5 py-0.5 bg-vb-gris-clair text-vb-gris rounded border border-vb-border cursor-pointer disabled:opacity-30">↓</button>
          </div>
          <button onClick={() => del(idx)}
            className="shrink-0 text-[12px] px-2 py-1 bg-vb-rouge-clair text-vb-rouge rounded border border-vb-rouge/30 cursor-pointer">✕</button>
        </div>
      ))}
      <button onClick={add}
        className="vb-btn bg-white text-vb-bleu border border-vb-bleu/30 px-3 py-1.5 text-[12px] mb-2">
        {addLabel}
      </button>
    </div>
  );
}

// ─── Form circuit ─────────────────────────────────────────────────────────────

function FormCircuit({ initial, onSave, onCancel }) {
  const [c, setC]               = useState(() => initial ?? nouveauCircuit());
  const [dossiersoorts, setDs]  = useState([]);
  const [dsLoading, setDsLoad]  = useState(true);

  useEffect(() => {
    chargerDossiersoorts()
      .then(d => setDs(d))
      .finally(() => setDsLoad(false));
  }, []);

  const updApp = list => setC(p => ({ ...p, approbateurs: list }));
  const updSig = list => setC(p => ({ ...p, signataires:  list }));

  const canSave = c.label.trim() && c.signataires.length > 0 &&
    [...c.approbateurs, ...c.signataires].every(s => s.nom.trim() && s.email.includes('@'));

  return (
    <div className="border border-vb-bleu/20 rounded-lg p-4 bg-vb-bleu-light/50 mt-2">
      {/* Label */}
      <div className="mb-3">
        <label className="vb-label">Nom du circuit *</label>
        <input className="vb-input" value={c.label}
          onChange={e => setC(p => ({ ...p, label: e.target.value }))}
          placeholder="ex. : Finances — DG → Bourgmestre" />
      </div>

      {/* Groupe dossier eSignFlow */}
      <div className="mb-4">
        <label className="vb-label">Groupe dossier eSignFlow (DossiersoortId)</label>
        {!dsLoading && dossiersoorts.length > 0 ? (
          <select className="vb-input"
            value={c.dossiersoortId}
            onChange={e => setC(p => ({ ...p, dossiersoortId: e.target.value }))}>
            <option value="">— Sélectionner un groupe —</option>
            {dossiersoorts.map(d => (
              <option key={d.Id ?? d.id} value={d.Id ?? d.id}>
                {d.Name ?? d.name ?? d.Label ?? `ID ${d.Id ?? d.id}`}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex gap-2 items-center">
            <input className="vb-input flex-1" type="number" placeholder="ex. : 3324"
              value={c.dossiersoortId}
              onChange={e => setC(p => ({ ...p, dossiersoortId: e.target.value }))} />
            {dsLoading && <span className="text-[11px] text-vb-gris">chargement…</span>}
            {!dsLoading && dossiersoorts.length === 0 && (
              <span className="text-[11px] text-vb-gris">saisie manuelle (API indisponible)</span>
            )}
          </div>
        )}
        <p className="text-[11px] text-vb-gris mt-1">
          Détermine le groupe de classement dans eSignFlow. Laissez vide pour utiliser le groupe par défaut (3324).
        </p>
      </div>

      {/* Approbateurs */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-vb-jaune shrink-0"></div>
          <span className="vb-label mb-0">Approbateurs — validation avant signature (sans eID)</span>
        </div>
        {c.approbateurs.length === 0 && (
          <p className="text-[11px] text-vb-gris mb-2">Aucun approbateur — le document ira directement aux signataires.</p>
        )}
        <PersonneListe
          items={c.approbateurs}
          onChange={updApp}
          placeholder="Approbateur"
          addLabel="+ Ajouter un approbateur"
        />
      </div>

      {/* Signataires */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-vb-vert shrink-0"></div>
          <span className="vb-label mb-0">Signataires — signature électronique eID *</span>
        </div>
        <PersonneListe
          items={c.signataires}
          onChange={updSig}
          placeholder="Signataire"
          addLabel="+ Ajouter un signataire"
        />
        {c.signataires.length === 0 && (
          <p className="text-[11px] text-vb-rouge mt-1">Au moins un signataire est requis.</p>
        )}
      </div>

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

// ─── Main component ───────────────────────────────────────────────────────────

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

  const circuitSummary = c => {
    const app = c.approbateurs?.length > 0
      ? c.approbateurs.map(a => a.nom || a.email).join(' → ') + ' ⟶ '
      : '';
    const sig = (c.signataires || []).map(s => s.nom || s.email).join(' → ');
    return app + sig;
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
                <div className="text-[11px] text-vb-gris truncate">{circuitSummary(c)}</div>
                {c.dossiersoortId && (
                  <div className="text-[10px] text-vb-gris/70">Groupe eSignFlow : {c.dossiersoortId}</div>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {c.approbateurs?.length > 0 && (
                  <span className="text-[10px] bg-vb-jaune-clair text-vb-jaune border border-vb-jaune/30 rounded px-1.5 py-0.5">
                    {c.approbateurs.length} appr.
                  </span>
                )}
                <span className="text-[10px] bg-vb-vert-clair text-vb-vert border border-vb-vert/30 rounded px-1.5 py-0.5">
                  {(c.signataires || []).length} sign.
                </span>
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
