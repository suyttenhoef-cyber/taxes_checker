import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ImageRun,
} from 'docx';

const FONT = 'Arial';
const SZ   = 24;

function run(opts) {
  return new TextRun({ font: FONT, size: SZ, ...opts });
}

function b64ToUint8(b64) {
  const raw = atob(b64.includes(',') ? b64.split(',')[1] : b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf;
}

function parseRuns(line) {
  const runs = [];
  const rx = /\*\*(.*?)\*\*/g;
  let pos = 0, m;
  while ((m = rx.exec(line)) !== null) {
    if (m.index > pos) runs.push(run({ text: line.slice(pos, m.index) }));
    runs.push(run({ text: m[1], bold: true }));
    pos = m.index + m[0].length;
  }
  if (pos < line.length) runs.push(run({ text: line.slice(pos) }));
  return runs.length ? runs : [run({ text: line })];
}

const IS_MAIN_TITLE = /^(DÉLIBÉRATION|RAPPORT AU|PROCÈS-VERBAL|ORDRE DU JOUR)/i;
const IS_SECTION    = /^\d\.\s+(CONTEXTE|ANALYSE|PROPOSITION|PRÉSENTS|ABSENT)/i;
const IS_ARTICLE    = /^Art\.\s*\d|^Article\s+\d/i;
const IS_SEPARATOR  = /^[-—]{3,}$/;
const IS_OBJET      = /^(OBJET|SERVICE)\s*:/i;

function lineToParagraph(line) {
  const t = line.trim();
  if (!t) return new Paragraph({ spacing: { after: 80 } });

  if (IS_SEPARATOR.test(t)) {
    return new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'AAAAAA' } },
      spacing: { before: 100, after: 100 },
      text: '',
    });
  }
  if (IS_MAIN_TITLE.test(t)) {
    return new Paragraph({
      children: [run({ text: t, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 160 },
    });
  }
  if (IS_SECTION.test(t)) {
    return new Paragraph({
      children: [run({ text: t, bold: true, underline: {} })],
      spacing: { before: 180, after: 80 },
    });
  }
  if (IS_OBJET.test(t)) {
    return new Paragraph({
      children: parseRuns(t),
      spacing: { before: 120, after: 80 },
    });
  }
  if (IS_ARTICLE.test(t)) {
    return new Paragraph({
      children: parseRuns(t),
      spacing: { before: 140, after: 60 },
    });
  }
  return new Paragraph({
    children: parseRuns(t),
    spacing: { after: 80 },
  });
}

const NO_BORDER    = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const CELL_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };

export async function exportDocument({ type, texte, params, profil }) {
  const {
    typeCommune    = 'Commune',
    nomCommune     = '',
    province       = '',
    arrondissement = '',
    logo           = null,
  } = profil || {};

  const commune  = nomCommune || '[COMMUNE]';
  const prov     = (province       || '').toUpperCase() || '[PROVINCE]';
  const arr      = (arrondissement || '').toUpperCase() || '[ARRONDISSEMENT]';
  const instText = params?.instance === 'college' ? 'Collège communal' : 'Conseil communal';

  const dateLabel = params?.dateSeance
    ? new Date(params.dateSeance + 'T12:00:00')
        .toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    : '[date]';

  const children = [];

  if (logo) {
    try {
      children.push(new Paragraph({
        children: [new ImageRun({ data: b64ToUint8(logo), transformation: { width: 110, height: 65 }, type: 'png' })],
        spacing: { after: 100 },
      }));
    } catch {}
  }

  // En-tête 2 colonnes identique à exportDocx.js
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER,
      right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER,
    },
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS,
          children: [
            new Paragraph({ children: [run({ text: 'Province de', size: 20 })] }),
            new Paragraph({ children: [run({ text: prov, bold: true, size: 22 })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [run({ text: 'Arrondissement de', size: 20 })] }),
            new Paragraph({ children: [run({ text: arr, bold: true, size: 22 })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [run({ text: `${typeCommune} de`, size: 20 })] }),
            new Paragraph({ children: [run({ text: commune.toUpperCase(), bold: true, size: 26 })] }),
          ],
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS,
          children: [
            new Paragraph({ children: [run({ text: instText.toUpperCase(), bold: true, size: 22 })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [run({ text: `Séance du ${dateLabel}`, size: 20 })] }),
          ],
        }),
      ],
    })],
  }));

  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
    spacing: { before: 180, after: 180 },
    text: '',
  }));

  for (const line of texte.split('\n')) {
    children.push(lineToParagraph(line));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const slug = [type, nomCommune || 'commune', params?.dateSeance || '']
    .join('_').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_]+/g, '_').replace(/_+/g, '_').slice(0, 60);
  const a = Object.assign(document.createElement('a'), { href: url, download: `${slug}.docx` });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return blob;
}
