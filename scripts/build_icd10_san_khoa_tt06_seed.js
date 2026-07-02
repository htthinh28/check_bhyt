/**
 * Sinh seed cặp ICD-10 sản khoa TT06 không được đi cùng.
 * Nguồn ưu tiên: tai_nguyen/danh_muc/Luu_y_ma_hoa_san_khoa_TT06_2026_ban_gop_ICD10.docx
 * Dự phòng: tai_nguyen/danh_muc/icd10_san_khoa_tt06_cap_khong.json
 *
 * Chạy: node scripts/build_icd10_san_khoa_tt06_seed.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const DOCX_PATH = path.join(
  __dirname,
  '../tai_nguyen/danh_muc/Luu_y_ma_hoa_san_khoa_TT06_2026_ban_gop_ICD10.docx',
);
const JSON_PATH = path.join(
  __dirname,
  '../tai_nguyen/danh_muc/icd10_san_khoa_tt06_cap_khong.json',
);
const OUT_FILE = path.join(
  __dirname,
  '../ma_nguon/thanh_phan/icd10_san_khoa_tt06_cap_khong.jsx',
);

const ICD_TOKEN = /[OZ]\d{2}(?:\.\d{1,2})?/gi;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function decodeXmlEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function extractPlainLinesFromDocxXml(xml) {
  const parts = String(xml || '').split(/<\/w:p>/);
  const lines = [];
  const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  for (const chunk of parts) {
    const texts = [];
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(chunk)) !== null) texts.push(decodeXmlEntities(m[1]));
    const line = texts.join('').replace(/\s+/g, ' ').trim();
    if (line) lines.push(line);
  }
  return lines;
}

function chuanHoaMaIcd(raw) {
  return String(raw || '')
    .replace(/[\u2020\u2021†‡*]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.]/g, '');
}

function pairKey(a, b) {
  const x = chuanHoaMaIcd(a);
  const y = chuanHoaMaIcd(b);
  return x <= y ? `${x}|${y}` : `${y}|${x}`;
}

function parsePairsFromDocxLines(lines) {
  const out = [];
  const seen = new Set();
  let seq = 0;

  const pushPair = (maA, maB, noiDung) => {
    const a = chuanHoaMaIcd(maA);
    const b = chuanHoaMaIcd(maB);
    if (!a || !b || a === b) return;
    const key = pairKey(a, b);
    if (seen.has(key)) return;
    seen.add(key);
    seq += 1;
    out.push({
      id: `SK-DOCX-${String(seq).padStart(3, '0')}`,
      ma_a: a.replace(/(\d{2})(\d)/, '$1.$2').replace(/\.$/, '') || a,
      ma_b: b.replace(/(\d{2})(\d)/, '$1.$2').replace(/\.$/, '') || b,
      noi_dung_sai: noiDung || `cặp [${a}] và [${b}] không được ghi cùng nhau`,
    });
  };

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!/(khong|không).*(cung|cùng|di cung|đi cùng|ghi cung|ghi cùng)/.test(lower)) continue;

    const tokens = (line.match(ICD_TOKEN) || []).map(chuanHoaMaIcd).filter(Boolean);
    const uniq = [...new Set(tokens)];
    if (uniq.length < 2) continue;

    const noiDungMatch = line.match(/cặp\s*\[[^\]]+\].*$/i)
      || line.match(/không được.*$/i)
      || line.match(/khong duoc.*$/i);
    const noiDung = noiDungMatch
      ? noiDungMatch[0].trim()
      : `cặp [${uniq[0]}] và [${uniq[1]}] không được ghi cùng nhau`;

    for (let i = 0; i < uniq.length; i += 1) {
      for (let j = i + 1; j < uniq.length; j += 1) {
        pushPair(uniq[i], uniq[j], noiDung);
      }
    }
  }

  return out;
}

async function loadPairsFromDocx() {
  if (!fs.existsSync(DOCX_PATH)) return null;
  const buf = fs.readFileSync(DOCX_PATH);
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) return null;
  const lines = extractPlainLinesFromDocxXml(docXml);
  const pairs = parsePairsFromDocxLines(lines);
  if (pairs.length === 0) return null;
  return {
    phien_ban: `${today()}-san-khoa-docx-${pairs.length}`,
    nguon: path.basename(DOCX_PATH),
    cap_khong: pairs,
  };
}

function loadPairsFromJson() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Không tìm thấy JSON dự phòng: ${JSON_PATH}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const pairs = Array.isArray(raw.cap_khong) ? raw.cap_khong : [];
  if (pairs.length === 0) {
    console.error('JSON dự phòng không có cặp cap_khong.');
    process.exit(1);
  }
  return {
    phien_ban: raw.phien_ban || `${today()}-san-khoa-json-${pairs.length}`,
    nguon: raw.nguon || path.basename(JSON_PATH),
    cap_khong: pairs,
  };
}

function rowToJs(row, indent) {
  const keys = ['id', 'ma_a', 'ma_b', 'noi_dung_sai'];
  const lines = keys.map((k) => `${indent}  ${JSON.stringify(k)}: ${JSON.stringify(String(row[k] || ''))}`);
  return `{\n${lines.join(',\n')}\n${indent}}`;
}

function writeSeed(bundle) {
  const { phien_ban: phienBan, nguon, cap_khong: capKhong } = bundle;
  const dateStr = today();
  const version = `${dateStr}-${phienBan}`;

  const body = [
    '/**',
    ' * Seed cặp ICD-10 sản khoa TT06 không được ghi cùng nhau.',
    ` * Nguồn: ${nguon}`,
    ` * Sinh bởi: scripts/build_icd10_san_khoa_tt06_seed.js — không sửa tay.`,
    ' */',
    '',
    `export const PHIEN_BAN_ICD10_SAN_KHOA_TT06 = '${version}';`,
    '',
    `export const NGUON_ICD10_SAN_KHOA_TT06 = ${JSON.stringify(nguon)};`,
    '',
    'export const CAP_ICD10_SAN_KHOA_KHONG_DI_CUNG = [',
    ...capKhong.map((row, idx) => `  ${rowToJs(row, '  ')}${idx < capKhong.length - 1 ? ',' : ''}`),
    '];',
    '',
  ].join('\n');

  fs.writeFileSync(OUT_FILE, body, 'utf8');
  console.log(`OK: ${path.relative(process.cwd(), OUT_FILE)} (${capKhong.length} cặp, ${version})`);
}

async function main() {
  let bundle = await loadPairsFromDocx();
  if (bundle) {
    console.log(`Đọc từ DOCX: ${DOCX_PATH}`);
  } else {
    console.log(`DOCX chưa có — dùng JSON: ${JSON_PATH}`);
    bundle = loadPairsFromJson();
  }
  writeSeed(bundle);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
