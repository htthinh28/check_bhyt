#!/usr/bin/env node
/**
 * QA Phụ lục 02 CV266 — mọi mã chuyên đề PL2 phải có rule/engine tương ứng.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  process.exitCode = 1;
};
const ok = (msg) => console.log(`OK ${msg}`);

const index = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tai_lieu/_extract_cv266/cv266_pl_index.json'), 'utf8'),
);
const pl2Codes = [...new Set(index.items.filter((i) => i.nguon === 'PL2').map((i) => i.maChuyenDe))].sort();

const chuyenRaw = fs.readFileSync(
  path.join(ROOT, 'ma_nguon/tien_ich/luat_giam_dinh_chuyen_de_hardcoded.jsx'),
  'utf8',
);
const engineRaw = fs.readFileSync(path.join(ROOT, 'ma_nguon/tien_ich/dong_co_giam_dinh.jsx'), 'utf8');

/** Mã PL02 → pattern tìm trong chuyen_de / engine (heuristic). */
const PL02_COVERAGE = {
  TH01: ['CV266 TH01', 'CHUYEN_DE-625'],
  TH04: ['CV266 TH04', 'CHUYEN_DE-632'],
  TH06: ['CV266 TH06', 'CHUYEN_DE-626'],
  TH08: ['CV266 TH08', 'CHUYEN_DE-627'],
  TH14: ['CV266 TH14', 'CHUYEN_DE-639'],
  TH15: ['CV266 TH15', 'CHUYEN_DE-628'],
  TH19: ['CV266 TH19', 'CHUYEN_DE-639'],
  TH20: ['CV266 TH20', 'CHUYEN_DE-522'],
  TH21: ['CV266 TH21', 'CHUYEN_DE-633', 'CLN-THUOC-PL02-21'],
  TH28: ['CV266 TH28', 'CHUYEN_DE-634'],
  TH32: ['CV266 TH32', 'CHUYEN_DE-495'],
  TH34: ['CV266 TH34', 'CHUYEN_DE-635'],
  TH42: ['CV266 TH42', 'CHUYEN_DE-643'],
  TH45: ['CV266 TH45', 'Chuyen_de_251'],
  TH48: ['CV266 TH48', 'CHUYEN_DE-629'],
  TH51: ['CV266 TH51', 'CHUYEN_DE-636'],
  TH52: ['CV266 TH52', 'CHUYEN_DE-637'],
  TH60: ['CV266 TH60', 'CHUYEN_DE-645', 'CHUYEN_DE-652'],
  TH62: ['CV266 TH62', 'CHUYEN_DE-646'],
  TH65: ['CV266 TH65', 'CHUYEN_DE-647'],
  TH72: ['CV266 TH72', 'CHUYEN_DE-630', 'CLN-THUOC-PL02-72'],
  TH73: ['CV266 TH73', 'CHUYEN_DE-648'],
  TH75: ['CV266 TH75', 'CHUYEN_DE-649'],
  TH77: ['CV266 TH77', 'CHUYEN_DE-650'],
  TH81: ['CV266 TH81', 'CHUYEN_DE-641'],
  TH84: ['CV266 TH84', 'CHUYEN_DE-651'],
  TH85: ['CV266 TH85', 'CHUYEN_DE-640'],
  TH88: ['CV266 TH88', 'CHUYEN_DE-642'],
  TH90: ['CV266 TH90', 'CHUYEN_DE-638'],
  TH91: ['CV266 TH91', 'CHUYEN_DE-638'],
  TH97: ['CV266 TH97', 'CHUYEN_DE-631'],
  TH98: ['CV266 TH98', 'CHUYEN_DE-624'],
  TH107: ['CV266 TH107', 'CHUYEN_DE-623'],
  KT63: ['CV266 KT63', 'CHUYEN_DE-620'],
  KT102: ['CV266 KT102', 'CHUYEN_DE-621'],
  KT219: ['CV266 KT219', 'CHUYEN_DE-622'],
};

const logicFixSnippets = [
  'VI_PHAM_TAF_KHONG_THUOC_DANH_MUC_BHYT',
  'CHONG_CHI_DINH_IVABRADIN_PROCORALAN',
  'VI_PHAM_NEUTRIVIT_SAVI3B_CHONG_CHI_DINH',
  'VI_PHAM_TIOGA_CHONG_CHI_DINH',
  'VI_PHAM_PHALINTOP_CHONG_CHI_DINH',
  'VI_PHAM_TADIMAX_CHONG_CHI_DINH',
  'VI_PHAM_MELANOV_CHONG_CHI_DINH',
  'VI_PHAM_LYSIN_KHOANG_CHAT',
  '2026-06-16-pl02-logic-audit',
];

pl2Codes.forEach((code) => {
  const patterns = PL02_COVERAGE[code];
  if (!patterns) {
    fail(`Thiếu mapping QA cho mã PL02: ${code}`);
    return;
  }
  const hit = patterns.some((p) => chuyenRaw.includes(p) || engineRaw.includes(p));
  if (!hit) fail(`Không tìm thấy rule cho ${code} (patterns: ${patterns.join(', ')})`);
  else ok(`${code}: có rule`);
});

if (pl2Codes.length !== Object.keys(PL02_COVERAGE).length) {
  const missing = pl2Codes.filter((c) => !PL02_COVERAGE[c]);
  const extra = Object.keys(PL02_COVERAGE).filter((c) => !pl2Codes.includes(c));
  if (missing.length) fail(`PL02 index thiếu trong map: ${missing.join(', ')}`);
  if (extra.length) fail(`Map thừa so với index: ${extra.join(', ')}`);
}

logicFixSnippets.forEach((s) => {
  if (!chuyenRaw.includes(s)) fail(`Thiếu snippet sửa logic PL02: ${s}`);
  else ok(`logic: ${s}`);
});

if (!process.exitCode) console.log(`\nqa_pl02_full_coverage: ALL OK (${pl2Codes.length} mã PL02)`);
