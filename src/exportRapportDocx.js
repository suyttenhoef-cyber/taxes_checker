import {
  Document, Packer, Paragraph, TextRun, BorderStyle, AlignmentType,
} from 'docx';

const FONT = 'Arial';
const SZ   = 22; // 11pt
const SZS  = 20; // 10pt

const COL = {
  critique: 'DC2626',
  majeur:   'EA580C',
  mineur:   'CA8A04',
  info:     '16A34A',
  navy:     '0D1B35',
  gray:     '6B7280',
  blue:     '1D4ED8',
};

const GRAVITE_LABEL = { critique: 'CRITIQUE', majeur: 'MAJEUR', mineur: 'MINEUR', info: 'CONFORME' };
const NIVEAU_LABEL  = { insuffisant: 'Insuffisant', a_ameliorer: 'À améliorer', acceptable: 'Acceptable', bon: 'Bon', excellent: 'Excellent' };

function t(text, opts = {}) {
  return new TextRun({ font: FONT, size: SZ, text: String(text), ...opts });
}

function p(children, spacing = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [t(children)],
    spacing: { after: 100, ...spacing },
  });
}

function h(text, color = COL.navy, size = 26) {
  return new Paragraph({
    children: [new TextRun({ font: FONT, size, bold: true, color, text })],
    spacing: { before: 280, after: 140 },
  });
}

function sep() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: 'D1D5DB' } },
    spacing: { before: 200, after: 200 },
    text: '',
  });
}

function findingBlock(finding) {
  const g     = finding.gravite || 'info';
  const color = COL[g] || COL.info;
  const label = GRAVITE_LABEL[g] || g.toUpperCase();
  const out   = [];

  out.push(new Paragraph({
    children: [
      new TextRun({ font: FONT, size: SZ, bold: true, color, text: `[${label}] ` }),
      new TextRun({ font: FONT, size: SZ, bold: true, text: finding.titre || '' }),
      finding.article ? new TextRun({ font: FONT, size: SZS, color: COL.gray, text: `  —  ${finding.article}` }) : null,
    ].filter(Boolean),
    spacing: { before: 160, after: 40 },
  }));

  if (finding.detail) {
    out.push(new Paragraph({
      indent: { left: 240 },
      children: [t(finding.detail)],
      spacing: { after: 40 },
    }));
  }

  if (finding.extrait) {
    out.push(new Paragraph({
      indent: { left: 480 },
      children: [new TextRun({ font: FONT, size: SZS, italics: true, color: '4B5563', text: `« ${finding.extrait} »` })],
      spacing: { after: 40 },
    }));
  }

  if (finding.correction) {
    out.push(new Paragraph({
      indent: { left: 240 },
      children: [
        new TextRun({ font: FONT, size: SZ, bold: true, color: COL.blue, text: 'Correction : ' }),
        new TextRun({ font: FONT, size: SZ, color: COL.blue, text: finding.correction }),
      ],
      spacing: { after: 80 },
    }));
  }

  return out;
}

export async function exportRapportDocx({ resultat }) {
  const { synthese, agents, meta } = resultat;
  const children = [];

  // ── En-tête ──────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [new TextRun({ font: FONT, size: 34, bold: true, color: COL.navy, text: 'RAPPORT D\'ANALYSE JURIDIQUE' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 80 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ font: FONT, size: SZS, color: COL.gray, text: 'Tax Checker · Vanden Broele' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ font: FONT, size: SZS, color: COL.gray, text: `Analysé le ${new Date(meta.dateAnalyse).toLocaleString('fr-BE')} · ${meta.agentsOk}/5 agents actifs` })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));
  children.push(sep());

  // ── Synthèse globale ──────────────────────────────────────────────────────
  children.push(h('SYNTHÈSE GLOBALE'));

  const scoreColor = synthese.scoreGlobal >= 80 ? '16A34A' : synthese.scoreGlobal >= 70 ? 'CA8A04' : synthese.scoreGlobal >= 60 ? 'EA580C' : 'DC2626';
  children.push(new Paragraph({
    children: [
      new TextRun({ font: FONT, size: 52, bold: true, color: scoreColor, text: String(synthese.scoreGlobal) }),
      new TextRun({ font: FONT, size: 30, color: scoreColor, text: '/100  ' }),
      new TextRun({ font: FONT, size: 26, bold: true, color: COL.gray, text: NIVEAU_LABEL[synthese.niveau] || synthese.niveau }),
    ],
    spacing: { before: 60, after: 180 },
  }));

  if (synthese.resumeExecutif) {
    children.push(p([t('Résumé exécutif : ', { bold: true }), t(synthese.resumeExecutif)], { after: 120 }));
  }
  if (synthese.recommandationPrincipale) {
    children.push(p([
      new TextRun({ font: FONT, size: SZ, bold: true, color: COL.blue, text: 'Action prioritaire : ' }),
      new TextRun({ font: FONT, size: SZ, color: COL.blue, text: synthese.recommandationPrincipale }),
    ], { after: 120 }));
  }
  children.push(sep());

  // ── Findings par gravité ──────────────────────────────────────────────────
  const allMineurs = agents.filter(a => a.ok).flatMap(a => (a.result?.findings || []).filter(f => f.gravite === 'mineur'));

  const sections = [
    { title: 'PROBLÈMES CRITIQUES', color: COL.critique, items: synthese.pointsCritiques || [], gravite: 'critique' },
    { title: 'AVERTISSEMENTS',      color: COL.majeur,   items: synthese.avertissements  || [], gravite: 'majeur'   },
    { title: 'POINTS MINEURS',      color: COL.mineur,   items: allMineurs,                     gravite: 'mineur'   },
    { title: 'POINTS CONFORMES',    color: COL.info,     items: synthese.pointsConformes || [], gravite: 'info'     },
  ];

  for (const s of sections) {
    if (!s.items.length) continue;
    children.push(h(`${s.title} (${s.items.length})`, s.color));
    s.items.forEach(f => children.push(...findingBlock({ ...f, gravite: s.gravite })));
    children.push(sep());
  }

  // ── Détail par agent ──────────────────────────────────────────────────────
  children.push(h('RAPPORT DÉTAILLÉ PAR AGENT'));

  for (const agent of agents) {
    if (!agent.ok) {
      children.push(p([
        t(`${agent.label} — `, { bold: true, color: COL.critique }),
        t(`Erreur : ${agent.error}`, { color: COL.critique }),
      ], { before: 140 }));
      continue;
    }
    const r = agent.result;
    const ac = r.score >= 80 ? '16A34A' : r.score >= 70 ? 'CA8A04' : r.score >= 60 ? 'EA580C' : 'DC2626';
    children.push(new Paragraph({
      children: [
        new TextRun({ font: FONT, size: 24, bold: true, color: COL.navy, text: agent.label }),
        new TextRun({ font: FONT, size: 24, bold: true, color: ac, text: `  ${r.score}/100` }),
      ],
      spacing: { before: 220, after: 60 },
    }));
    if (r.resume) children.push(p(r.resume, { after: 80 }));
    (r.findings || []).forEach(f => children.push(...findingBlock(f)));
  }

  // ── Build & download ──────────────────────────────────────────────────────
  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `rapport-analyse-${new Date(meta.dateAnalyse).toISOString().slice(0, 10)}.docx`,
  });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  return blob;
}
