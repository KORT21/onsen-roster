import { unzipSync } from 'fflate'
import { XMLParser } from 'fast-xml-parser'

export const SHEET_ID = '1qbsN_5qDP_wB8reup_Hce2VbwwwQ-k7lffSKQDK2cko'
const MAX_WORKBOOK_BYTES = 10 * 1024 * 1024
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  trimValues: false,
})

const asArray = (value) => value == null ? [] : Array.isArray(value) ? value : [value]

export function cleanCell(value) {
  const cleaned = String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return /^`+$/.test(cleaned) ? '' : cleaned
}

function richText(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value.t != null) return richText(value.t)
  if (value.r != null) return asArray(value.r).map((run) => richText(run.t)).join('')
  return ''
}

function xmlFile(files, path) {
  const bytes = files[path]
  if (!bytes) throw new Error(`Workbook is missing ${path}`)
  return parser.parse(new TextDecoder().decode(bytes))
}

function sharedStrings(files) {
  if (!files['xl/sharedStrings.xml']) return []
  const document = xmlFile(files, 'xl/sharedStrings.xml')
  return asArray(document.sst?.si).map(richText)
}

function columnIndex(reference = '') {
  const letters = String(reference).match(/^[A-Z]+/i)?.[0]?.toUpperCase() ?? ''
  let result = 0
  for (const letter of letters) result = result * 26 + letter.charCodeAt(0) - 64
  return result - 1
}

function cellValue(cell, strings) {
  const type = cell?.['@_t']
  if (type === 's') return strings[Number(cell.v)] ?? ''
  if (type === 'inlineStr') return richText(cell.is)
  if (type === 'b') return cell.v === '1' ? 'TRUE' : 'FALSE'
  return cell?.v ?? richText(cell?.is)
}

function worksheetRows(document, strings) {
  return asArray(document.worksheet?.sheetData?.row).map((row, rowPosition) => {
    const values = []
    for (const cell of asArray(row.c)) {
      const index = columnIndex(cell['@_r'])
      if (index >= 0 && index < 8) values[index] = cleanCell(cellValue(cell, strings))
    }
    return {
      excelRow: Number(row['@_r']) || rowPosition + 1,
      values: Array.from({ length: 8 }, (_, index) => values[index] ?? ''),
    }
  })
}

function resolveSheetPath(target) {
  const normalized = String(target).replace(/\\/g, '/')
  if (normalized.startsWith('/')) return normalized.slice(1)
  if (normalized.startsWith('xl/')) return normalized
  return `xl/${normalized.replace(/^\.\//, '')}`
}

export function readWorkbook(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const files = unzipSync(bytes)
  const workbook = xmlFile(files, 'xl/workbook.xml')
  const relationships = xmlFile(files, 'xl/_rels/workbook.xml.rels')
  const strings = sharedStrings(files)
  const relationshipMap = new Map(
    asArray(relationships.Relationships?.Relationship)
      .map((relationship) => [relationship['@_Id'], resolveSheetPath(relationship['@_Target'])]),
  )

  return asArray(workbook.workbook?.sheets?.sheet)
    .filter((sheet) => sheet['@_state'] !== 'hidden' && sheet['@_state'] !== 'veryHidden')
    .map((sheet) => {
      const path = relationshipMap.get(sheet['@_r:id'])
      if (!path || !files[path]) return null
      return {
        id: String(sheet['@_sheetId'] ?? sheet['@_r:id']),
        name: cleanCell(sheet['@_name']),
        rows: worksheetRows(xmlFile(files, path), strings),
      }
    })
    .filter(Boolean)
}

function findHeaderRow(rows) {
  return rows.slice(0, 20).findIndex((row) => {
    const labels = row.values.slice(1, 8)
    return labels.filter((value) => /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(value)).length >= 5
  })
}

function monthsFromHeader(value) {
  const lower = value.toLocaleLowerCase()
  const matches = []
  for (const [name, month] of Object.entries(MONTHS)) {
    const index = lower.indexOf(name)
    if (index >= 0) matches.push({ month, index })
  }
  return matches.sort((a, b) => a.index - b.index).map((match) => match.month)
}

function monthFromTab(name, headerDay) {
  const slash = name.match(/(\d{1,2})\s*[\/-]\s*(\d{1,2})/)
  if (slash && Number(slash[1]) === headerDay) return Number(slash[2])

  const digits = name.replace(/^\s*WC\s*/i, '').replace(/\D/g, '')
  const candidates = []
  for (let split = 1; split <= Math.min(2, digits.length - 1); split += 1) {
    const day = Number(digits.slice(0, split))
    const month = Number(digits.slice(split))
    if (day === headerDay && month >= 1 && month <= 12) candidates.push(month)
  }
  return candidates[0] ?? null
}

function closestYear(month, day, now) {
  const years = [now.getUTCFullYear() - 1, now.getUTCFullYear(), now.getUTCFullYear() + 1]
  return years
    .map((year) => ({ year, distance: Math.abs(Date.UTC(year, month - 1, day) - now.getTime()) }))
    .sort((a, b) => a.distance - b.distance)[0].year
}

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function startDateFromHeader(header, sheetName, now) {
  const headerDay = Number(header.values[1].match(/(\d{1,2})/)?.[1])
  if (!headerDay) return null

  const headerMonths = monthsFromHeader(header.values[0])
  const tabMonth = monthFromTab(sheetName, headerDay)
  const month = tabMonth && headerMonths.includes(tabMonth) ? tabMonth : headerMonths[0] ?? tabMonth
  if (!month) return null
  const year = closestYear(month, headerDay, now)
  return new Date(Date.UTC(year, month - 1, headerDay, 12))
}

function looksLikeRole(label) {
  return /supervisor|front desk|spa host|spa attendant|timer|comms|runner|ressies|driver|maintenance/i.test(label)
}

export function normalizeSheet(sheet, now = new Date()) {
  const headerPosition = findHeaderRow(sheet.rows)
  if (headerPosition < 0) return null
  const header = sheet.rows[headerPosition]
  const startDate = startDateFromHeader(header, sheet.name, now)
  if (!startDate) return null

  const candidateRows = sheet.rows.slice(headerPosition + 1)
    .map((row) => ({
      excelRow: row.excelRow,
      label: cleanCell(row.values[0]),
      cells: row.values.slice(1, 8).map(cleanCell),
    }))
    .filter((row) => row.cells.some(Boolean))

  const roleCount = candidateRows.filter((row) => row.label && looksLikeRole(row.label)).length
  if (roleCount < 5) return null

  const rows = candidateRows.map((row) => ({
    id: `${sheet.id}-r${row.excelRow}`,
    kind: row.label ? 'role' : 'note',
    label: row.label,
    cells: row.cells,
  }))

  const days = WEEKDAYS.map((shortLabel, index) => {
    const date = new Date(startDate.getTime())
    date.setUTCDate(startDate.getUTCDate() + index)
    return { date: isoDate(date), shortLabel }
  })

  return {
    id: String(sheet.id),
    label: sheet.name,
    start: isoDate(startDate),
    days,
    rows,
    diagnostics: {
      headerRow: header.excelRow,
      roleRows: rows.filter((row) => row.kind === 'role').length,
      noteRows: rows.filter((row) => row.kind === 'note').length,
    },
  }
}

export function parseWorkbook(buffer, { now = new Date() } = {}) {
  return readWorkbook(buffer)
    .map((sheet) => normalizeSheet(sheet, now))
    .filter(Boolean)
    .sort((a, b) => a.start.localeCompare(b.start))
}

export async function fetchRosterPayload({ sheetId = SHEET_ID, fetchImpl = fetch, now = new Date() } = {}) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=xlsx`
  const response = await fetchImpl(url, {
    headers: { 'User-Agent': 'Onsen-Roster/1.0' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) throw new Error(`Google Sheets export returned ${response.status}`)

  const contentLength = Number(response.headers.get('content-length') || 0)
  if (contentLength > MAX_WORKBOOK_BYTES) throw new Error('Roster workbook is unexpectedly large')
  const buffer = new Uint8Array(await response.arrayBuffer())
  if (buffer.byteLength > MAX_WORKBOOK_BYTES) throw new Error('Roster workbook is unexpectedly large')

  const weeks = parseWorkbook(buffer, { now })
  if (!weeks.length) throw new Error('No weekly roster tabs were recognized in the workbook')

  return {
    version: 1,
    fetchedAt: now.toISOString(),
    source: {
      name: 'Onsen public Google Sheet',
      spreadsheetId: sheetId,
    },
    weeks,
  }
}
