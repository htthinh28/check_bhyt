/**
 * Tạo seed ICD-10 cấp cứu từ file Excel nội bộ.
 * Chạy: node scripts/build_icd10_cap_cuu_seed.js
 */

'use strict';

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = path.join(
  __dirname,
  '../tai_nguyen/danh_muc/DanhMuc_ICD10_CapCuu_PhuongChau_BoSung_TrungBinh.xlsx',
);
const OUT_FILE = path.join(__dirname, '../ma_nguon/thanh_phan/icd10_nhap_vien_cap_cuu.jsx');

const COT_CHUAN = [
  'ID',
  'Nhom_Benh',
  'Tinh_Trang_Benh',
  'Ma_ICD_Chinh',
  'Ten_ICD_Chinh',
  'Ly_Do_Nhap_Vien',
  'Ma_ICD_Kem_Theo',
  'Ten_ICD_Kem_Theo',
  'Ngoai_Le',
  'Tu_Khoa',
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeVal(v) {
  if (v === null || v === undefined) return '""';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return String(v);
  return JSON.stringify(String(v));
}

function rowToJsObject(row, indent) {
  const keys = COT_CHUAN.filter((k) => Object.prototype.hasOwnProperty.call(row, k));
  if (keys.length === 0) return '{}';
  const lines = keys.map((k) => `${indent}  ${JSON.stringify(k)}: ${escapeVal(row[k])}`);
  return `{\n${lines.join(',\n')}\n${indent}}`;
}

function normalizeRow(raw) {
  const row = {};
  for (const col of COT_CHUAN) {
    const val = raw[col];
    if (val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) {
      row[col] = '';
    } else {
      row[col] = val;
    }
  }
  return row;
}

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Không tìm thấy file Excel: ${EXCEL_PATH}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' }).map(normalizeRow);

  if (rawRows.length === 0) {
    console.error('File Excel không có dòng dữ liệu.');
    process.exit(1);
  }

  const excelCols = Object.keys(XLSX.utils.sheet_to_json(ws, { defval: '' })[0] || {});
  const missing = COT_CHUAN.filter((c) => !excelCols.includes(c));
  if (missing.length > 0) {
    console.error(`Thiếu cột trong Excel: ${missing.join(', ')}`);
    process.exit(1);
  }

  const dateStr = today();
  const rowCount = rawRows.length;
  const version = `${dateStr}-icd10-cap-cuu-seed-${rowCount}`;
  const colsLiteral = COT_CHUAN.map((c) => `  ${JSON.stringify(c)}`).join(',\n');
  const rowsLiteral = rawRows
    .map((row, i) => {
      const obj = rowToJsObject(row, '  ');
      return `  ${obj}${i < rawRows.length - 1 ? ',' : ''}`;
    })
    .join('\n');

  const fileContent = [
    '/**',
    ' * Seed danh muc ICD10 nhap vien cap cuu tu file Excel nguon.',
    ` * Nguon: tai_nguyen/danh_muc/DanhMuc_ICD10_CapCuu_PhuongChau_BoSung_TrungBinh.xlsx`,
    ` * Cap nhat: ${dateStr}`,
    ' */',
    '',
    `export const PHIEN_BAN_DANH_MUC_ICD10_CAP_CUU = '${version}';`,
    '',
    'export const COT_DANH_MUC_ICD10_CAP_CUU = [',
    colsLiteral,
    '];',
    '',
    'export const DANH_MUC_ICD10_CAP_CUU = [',
    rowsLiteral,
    '];',
    '',
  ].join('\n');

  fs.writeFileSync(OUT_FILE, fileContent, 'utf8');
  console.log(`OK: icd10_nhap_vien_cap_cuu.jsx (${rowCount} dòng, ${COT_CHUAN.length} cột)`);
}

main();
