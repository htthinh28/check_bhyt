/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = process.cwd();
const BASE_DM = 'C:/Users/admin/Documents/Google Drive/BHYT/danh muc benh vien/DM';
const DEFAULT_FILE_CONG_KHAM = path.join(BASE_DM, 'danh muc cong kham.xlsx');
const OUT_FILE = path.join(ROOT, 'ma_nguon', 'thanh_phan', 'dich_vu_ky_thuat.jsx');

const OUTPUT_COLUMNS = [
  'STT',
  'MA_DICH_VU',
  'TEN_DICH_VU',
  'TEN_DVKT_GIA',
  'DON_GIA',
  'QUY_TRINH',
  'CS_THUCHIEN',
  'TINHTRANG_DV',
  'MA_GIA',
  'TEN_GIA',
  'GIA_TT_BHYT',
  'MA_PTTT',
  'TU_NGAY',
  'DEN_NGAY',
  'MA_CSKCB',
  'PHAN_LOAI_PTTT',
  'GHICHU',
  'QUYET_DINH',
];

const REQUIRED_EXTENDED_COLUMNS = ['PHAN_LOAI_PTTT', 'GHICHU', 'QUYET_DINH'];

const parseCliArgs = () => {
  const out = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--m05=')) out.m05 = arg.slice('--m05='.length);
    if (arg.startsWith('--cong-kham=')) out.congKham = arg.slice('--cong-kham='.length);
  });
  return out;
};

const normalizeDvktCode = (value) => {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim().replace(/\s+/g, '');
  if (!raw) return '';
  const normalizedSeparators = /^[0-9.,]+$/.test(raw) ? raw.replace(/,/g, '.') : raw;
  if (/^\d+(\.\d+)+$/.test(normalizedSeparators)) {
    const parts = normalizedSeparators.split('.');
    parts[0] = parts[0].padStart(2, '0');
    return parts.join('.');
  }
  return normalizedSeparators;
};

const toNumOrText = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? v : '';
  const raw = String(v).trim();
  if (!raw) return '';
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
};

const normalizeRow = (row) => {
  const out = {};
  OUTPUT_COLUMNS.forEach((col) => {
    if (col === 'MA_DICH_VU') {
      out[col] = normalizeDvktCode(row[col]);
      return;
    }
    out[col] = toNumOrText(row[col]);
  });
  return out;
};

const mapCongKhamToDvkt = (row) => {
  const donGia = toNumOrText(row.DON_GIA);
  return normalizeRow({
    STT: toNumOrText(row.STT),
    MA_DICH_VU: normalizeDvktCode(row.MA_TUONG_DUONG),
    TEN_DICH_VU: toNumOrText(row.TEN_DVKT_PHEDUYET),
    TEN_DVKT_GIA: toNumOrText(row.TEN_DVKT_GIA),
    DON_GIA: donGia,
    QUY_TRINH: '',
    CS_THUCHIEN: '',
    TINHTRANG_DV: '',
    MA_GIA: toNumOrText(row.ID),
    TEN_GIA: '',
    GIA_TT_BHYT: donGia,
    MA_PTTT: '',
    TU_NGAY: toNumOrText(row.TUNGAY),
    DEN_NGAY: toNumOrText(row.DENNGAY),
    MA_CSKCB: '',
    PHAN_LOAI_PTTT: toNumOrText(row.PHAN_LOAI_PTTT),
    GHICHU: toNumOrText(row.GHICHU),
    QUYET_DINH: toNumOrText(row.QUYET_DINH),
  });
};

const escapeVal = (v) => {
  if (v === null || v === undefined || v === '') return '""';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return String(v);
  return JSON.stringify(String(v));
};

const rowToJsObject = (row, indent = '  ') => {
  const lines = OUTPUT_COLUMNS.map((k) => `${indent}  ${JSON.stringify(k)}: ${escapeVal(row[k])}`);
  return `\n${indent}{\n${lines.join(',\n')}\n${indent}}`;
};

const readRows = (excelPath) => {
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
};

const inspectWorkbook = (excelPath) => {
  const rows = readRows(excelPath);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const hasExtendedColumns = REQUIRED_EXTENDED_COLUMNS.every((col) => headers.includes(col));
  return {
    excelPath,
    rows,
    headers,
    rowCount: rows.length,
    hasExtendedColumns,
  };
};

const resolveM05Source = (explicitPath = '') => {
  if (explicitPath) {
    const normalizedPath = path.resolve(explicitPath);
    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`Missing M05 file: ${normalizedPath}`);
    }
    return inspectWorkbook(normalizedPath);
  }

  const candidates = fs.readdirSync(BASE_DM)
    .filter((name) => /^FileMau_DANH_MUC_DVKT_M05.*\.xlsx$/i.test(name))
    .map((name) => inspectWorkbook(path.join(BASE_DM, name)))
    .sort((a, b) => {
      if (a.hasExtendedColumns !== b.hasExtendedColumns) return Number(b.hasExtendedColumns) - Number(a.hasExtendedColumns);
      return b.rowCount - a.rowCount;
    });

  const selected = candidates.find((item) => item.rowCount > 1 && item.hasExtendedColumns)
    || candidates.find((item) => item.rowCount > 1)
    || candidates[0];

  if (!selected) {
    throw new Error(`No M05 source found in ${BASE_DM}`);
  }

  return selected;
};

const today = () => new Date().toISOString().slice(0, 10);

const main = () => {
  const args = parseCliArgs();
  const m05Source = resolveM05Source(args.m05);
  const fileM05 = m05Source.excelPath;
  const fileCongKham = args.congKham ? path.resolve(args.congKham) : DEFAULT_FILE_CONG_KHAM;

  if (m05Source.rowCount <= 1) {
    throw new Error(
      `Selected M05 source is incomplete: ${fileM05} only has ${m05Source.rowCount} data row(s). `
      + 'Use the full workbook instead of the template file.'
    );
  }
  if (!m05Source.hasExtendedColumns) {
    console.warn(`Warning: ${fileM05} is missing extended columns ${REQUIRED_EXTENDED_COLUMNS.join(', ')}.`);
  }
  if (!fs.existsSync(fileCongKham)) throw new Error(`Missing file: ${fileCongKham}`);

  const m05Rows = m05Source.rows.map(normalizeRow);
  const congKhamRows = readRows(fileCongKham).map(mapCongKhamToDvkt);

  const byCode = new Map();
  m05Rows.forEach((row) => {
    const code = normalizeDvktCode(row.MA_DICH_VU);
    if (!code) return;
    row.MA_DICH_VU = code;
    byCode.set(code, row);
  });

  let updated = 0;
  let inserted = 0;
  congKhamRows.forEach((row) => {
    const code = normalizeDvktCode(row.MA_DICH_VU);
    if (!code) return;
    row.MA_DICH_VU = code;
    if (byCode.has(code)) {
      byCode.set(code, { ...byCode.get(code), ...row });
      updated += 1;
    } else {
      byCode.set(code, row);
      inserted += 1;
    }
  });

  const merged = Array.from(byCode.values());
  merged.sort((a, b) => String(a.MA_DICH_VU || '').localeCompare(String(b.MA_DICH_VU || '')));
  merged.forEach((row, idx) => {
    row.STT = idx + 1;
  });

  const dateStr = today();
  const version = `${dateStr}-m05-seed-${merged.length}`;

  const colsLiteral = OUTPUT_COLUMNS.map((c) => `  ${JSON.stringify(c)}`).join(',\n');
  const rowsLiteral = merged
    .map((row, idx) => `${rowToJsObject(row, '  ')}${idx < merged.length - 1 ? ',' : ''}`)
    .join('');

  const fileContent = [
    '/**',
    ' * Seed danh muc dich vu ky thuat noi bo tu file Excel nguon.',
    ` * Nguon chinh: ${fileM05.replace(/\\/g, '\\\\')}`,
    ` * Merge bo sung cong kham: ${fileCongKham.replace(/\\/g, '\\\\')} (${congKhamRows.length} dong)`,
    ` * Cap nhat: ${dateStr}`,
    ' */',
    '',
    `export const PHIEN_BAN_DANH_MUC_DVKT_M05 = '${version}';`,
    '',
    'export const COT_DANH_MUC_DVKT_M05 = [',
    colsLiteral,
    '];',
    '',
    'export const DANH_MUC_DVKT_M05 = [',
    rowsLiteral,
    '];',
    '',
  ].join('\n');

  fs.writeFileSync(OUT_FILE, fileContent, 'utf8');
  console.log(`Source M05: ${fileM05}`);
  console.log(`Updated file: ${OUT_FILE}`);
  console.log(`Rows total: ${merged.length}`);
  console.log(`Rows updated from cong kham: ${updated}`);
  console.log(`Rows inserted from cong kham: ${inserted}`);
};

main();
