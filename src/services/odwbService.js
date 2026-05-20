import { WORKER_URL } from '../config.js';

const ODWB = `${WORKER_URL}/odwb/api/explore/v2.1/catalog/datasets`;

export async function searchCommunes(q) {
  if (!q || q.length < 2) return [];
  const qClean = q.replace(/"/g, '');
  const p = new URLSearchParams({
    where: `nom like "${qClean}%"`,
    select: 'nom,nom_court,adresse,cp,localite,ins,email_general,site_web,telephone',
    order_by: 'nom', limit: '8',
  });
  const r = await fetch(`${ODWB}/communes_s3/records?${p}`);
  if (!r.ok) throw new Error(`ODWB communes ${r.status}`);
  return (await r.json()).results || [];
}

export async function getMandataires(ins) {
  const p = new URLSearchParams({
    where: `ins=${ins}`,
    select: 'detail_civilite,detail_prenom,detail_nom,detail_fonction,detail_parti,attribution,coalition,population,province,arrondissement',
    limit: '50',
  });
  const r = await fetch(`${ODWB}/mandataires-locaux-des-villes-et-communes-de-wallonie/records?${p}`);
  if (!r.ok) throw new Error(`ODWB mandataires ${r.status}`);
  return (await r.json()).results || [];
}
