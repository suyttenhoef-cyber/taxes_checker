import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ImageRun,
} from 'docx'

const FONT = 'Arial'
const SZ   = 24 // 12pt en demi-points

function b64ToUint8(b64) {
  const raw = atob(b64.includes(',') ? b64.split(',')[1] : b64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf
}

function run(opts) {
  return new TextRun({ font: FONT, size: SZ, ...opts })
}

function parseRuns(line) {
  const runs = []
  const rx = /\*\*(.*?)\*\*/g
  let pos = 0, m
  while ((m = rx.exec(line)) !== null) {
    if (m.index > pos) runs.push(run({ text: line.slice(pos, m.index) }))
    runs.push(run({ text: m[1], bold: true }))
    pos = m.index + m[0].length
  }
  if (pos < line.length) runs.push(run({ text: line.slice(pos) }))
  return runs.length ? runs : [run({ text: line })]
}

function lineToParagraph(line) {
  const t = line.trim()
  if (!t) return new Paragraph({ spacing: { after: 80 } })

  const isTitle   = /^(RÈGLEMENT[-\s]|EXTRAIT\s+DU\s+REGISTRE)/i.test(t)
  const isArticle = /^Art\.\s*\d|^Article\s+\d/i.test(t)

  if (isTitle) {
    return new Paragraph({
      children: [run({ text: t, bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 160 },
    })
  }
  if (isArticle) {
    return new Paragraph({
      children: parseRuns(t),
      spacing: { before: 140, after: 60 },
    })
  }
  return new Paragraph({
    children: parseRuns(t),
    spacing: { after: 80 },
  })
}

const NO_BORDER   = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const CELL_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }

export async function exportDocx({ texteGenere, params, profil }) {
  const {
    typeCommune  = 'Commune',
    nomCommune   = '',
    province     = '',
    arrondissement = '',
    logo         = null,
  } = profil || {}

  const commune = nomCommune || params.commune || '[COMMUNE]'
  const prov    = (province        || params.province        || '').toUpperCase() || '[PROVINCE]'
  const arr     = (arrondissement  || params.arrondissement  || '').toUpperCase() || '[ARRONDISSEMENT]'

  const dateSeance = params.dateSeance
    ? new Date(params.dateSeance + 'T12:00:00')
        .toLocaleDateString('fr-BE', { day: '2-digit', month: 'long', year: 'numeric' })
        .toUpperCase()
    : '[DATE DE SÉANCE]'

  const children = []

  // Logo
  if (logo) {
    try {
      children.push(new Paragraph({
        children: [new ImageRun({ data: b64ToUint8(logo), transformation: { width: 110, height: 65 }, type: 'png' })],
        spacing: { after: 100 },
      }))
    } catch (e) { console.warn('Logo ignoré:', e) }
  }

  // En-tête 2 colonnes
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
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
            new Paragraph({ text: '' }),
            new Paragraph({ children: [run({ text: `${typeCommune} de`, size: 20 })] }),
            new Paragraph({ children: [run({ text: commune.toUpperCase(), bold: true, size: 26 })] }),
          ],
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS,
          children: [
            new Paragraph({ children: [run({ text: 'Du registre aux délibérations du Conseil Communal', size: 20 })] }),
            new Paragraph({ children: [run({ text: 'DE CETTE COMMUNE, A ETE EXTRAIT CE QUI SUIT :', bold: true, size: 20 })] }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [run({ text: `SÉANCE DU ${dateSeance}`, bold: true, size: 22 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      ],
    })],
  }))

  // Séparateur
  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
    spacing: { before: 180, after: 180 },
    text: '',
  }))

  // Corps du règlement
  for (const line of texteGenere.split('\n')) {
    children.push(lineToParagraph(line))
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: SZ } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  const slug = (params.objet || 'reglement')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  a.download = `${slug}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return blob
}
