import { WORKER_URL, GITHUB_REPO, GITHUB_PATH, GITHUB_BRANCH } from '../config.js';

export async function publierBiblio(entries) {
  const base = `${WORKER_URL}/github/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
  const getRes = await fetch(`${base}?ref=${GITHUB_BRANCH}`);
  if (!getRes.ok) throw new Error(`Lecture fichier GitHub impossible (${getRes.status})`);
  const { sha } = await getRes.json();

  const clean   = entries.map(({ _local, _score, ...e }) => e);
  const json    = JSON.stringify(clean, null, 2);
  const content = btoa(unescape(encodeURIComponent(json)));
  const today   = new Date().toISOString().slice(0, 10);

  const putRes = await fetch(base, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `chore: mise à jour bibliothèque règlements (${today})`,
      content,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });
  if (!putRes.ok) {
    const e = await putRes.text();
    throw new Error(`Commit GitHub impossible (${putRes.status}) : ${e}`);
  }
  return await putRes.json();
}
