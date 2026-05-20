import { useState } from 'react';
import { sauverProfil } from '../services/storageService.js';

export default function PanelProfil({ profil, onSave, onClose }) {
  const [p, setP] = useState({
    typeCommune: 'Commune', nomCommune: '', province: '', arrondissement: '',
    nomDG: '', titreDG: 'Directeur général', logo: null,
    ...profil,
  });
  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));

  const handleLogo = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300_000) { alert('Image trop lourde (max 300 ko).'); return; }
    const reader = new FileReader();
    reader.onload = ev => upd('logo', ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center">
      <div className="bg-white rounded-xl p-7 w-[min(520px,92vw)] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-vb-bleu text-[16px] font-bold">⚙️ Profil de la commune</h3>
          <button onClick={onClose} className="text-vb-gris text-[22px] bg-transparent border-none cursor-pointer leading-none">×</button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div>
              <label className="vb-label">Type</label>
              <select className="vb-input" value={p.typeCommune} onChange={e => upd('typeCommune', e.target.value)}>
                <option>Commune</option><option>Ville</option><option>CPAS</option>
              </select>
            </div>
            <div>
              <label className="vb-label">Nom</label>
              <input className="vb-input" value={p.nomCommune} onChange={e => upd('nomCommune', e.target.value)} placeholder="ex. : La Bruyère" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="vb-label">Province</label>
              <input className="vb-input" value={p.province} onChange={e => upd('province', e.target.value)} placeholder="ex. : Namur" />
            </div>
            <div>
              <label className="vb-label">Arrondissement</label>
              <input className="vb-input" value={p.arrondissement} onChange={e => upd('arrondissement', e.target.value)} placeholder="ex. : Namur" />
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <div>
              <label className="vb-label">Nom du Directeur général</label>
              <input className="vb-input" value={p.nomDG} onChange={e => upd('nomDG', e.target.value)} placeholder="ex. : Fernand Flabat" />
            </div>
            <div>
              <label className="vb-label">Titre</label>
              <input className="vb-input" value={p.titreDG} onChange={e => upd('titreDG', e.target.value)} placeholder="Directeur général" />
            </div>
          </div>

          <div>
            <label className="vb-label">Logo (PNG/JPG, max 300 ko)</label>
            {p.logo && <img src={p.logo} alt="logo" className="h-[50px] mb-1.5 block rounded border border-vb-border" />}
            <div className="flex items-center gap-2.5">
              <input type="file" accept="image/png,image/jpeg,image/gif" onChange={handleLogo} className="text-[12px]" />
              {p.logo && (
                <button onClick={() => upd('logo', null)} className="text-vb-rouge text-[12px] underline cursor-pointer bg-transparent border-none">Supprimer</button>
              )}
            </div>
          </div>

          <div className="mt-1 px-3.5 py-2.5 bg-vb-bleu-light rounded-md text-[12px] text-vb-bleu">
            Ces informations sont sauvegardées dans votre navigateur et pré-remplissent automatiquement l'en-tête de chaque export Word.
          </div>
        </div>

        <div className="flex gap-2.5 mt-5 justify-end">
          <button onClick={onClose} className="vb-btn bg-vb-gris-clair text-vb-gris border border-vb-border">Annuler</button>
          <button
            onClick={() => { sauverProfil(p); onSave(p); onClose(); }}
            className="vb-btn bg-vb-bleu text-white"
          >
            💾 Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
