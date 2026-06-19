#!/usr/bin/env node
/**
 * QA quy tắc CRP / Procalcitonin — seed PTTT + built-in CLN-DVKT-CRP-01.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SEED_PTTT = path.join(ROOT, 'ma_nguon', 'tien_ich', 'du_lieu_luat_pttt_muc11.jsx');
const ENGINE = path.join(ROOT, 'ma_nguon', 'tien_ich', 'dong_co_giam_dinh.jsx');

const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  process.exitCode = 1;
};
const ok = (msg) => console.log(`OK ${msg}`);

const read = (p) => fs.readFileSync(p, 'utf8');

/** Mirror giamDinhCrpProcalcitoninTrungMocXml3 (tối giản). */
const giamDinhCrpPctMirror = (hoSo) => {
  const MA_CRP = new Set(['23.0228.1483', '23.0050.1484']);
  const MA_PCT = '23.0125.1483';
  const norm = (v) => String(v || '').replace(/\s/g, '').toUpperCase();
  const moc = (row) => {
    const raw = String(row?.NGAY_TH_YL || row?.NGAY_YL || '').replace(/\D/g, '');
    if (raw.length >= 12) return raw.slice(0, 12);
    if (raw.length >= 8) return raw.slice(0, 8);
    return '';
  };
  const xml3 = hoSo?.XML3 || [];
  const ds = [];
  for (let i = 0; i < xml3.length; i += 1) {
    for (let j = i + 1; j < xml3.length; j += 1) {
      const mi = norm(xml3[i]?.MA_DICH_VU);
      const mj = norm(xml3[j]?.MA_DICH_VU);
      const crpI = MA_CRP.has(mi);
      const pctI = mi === MA_PCT;
      const crpJ = MA_CRP.has(mj);
      const pctJ = mj === MA_PCT;
      if (!((crpI && pctJ) || (pctI && crpJ))) continue;
      const ki = moc(xml3[i]);
      const kj = moc(xml3[j]);
      if (ki && ki === kj) ds.push({ ma_luat: 'CLN-DVKT-CRP-01', i, j, moc: ki });
    }
  }
  return ds;
};

const seedRaw = read(SEED_PTTT);
const engineRaw = read(ENGINE);

if (!/2026-06-16_muc11_crp_pct_vbhn17_sync/.test(seedRaw)) {
  fail('PHIEN_BAN_SEED chưa bump 2026-06-16');
} else ok('PHIEN_BAN seed CRP/PCT');

const requiredSnippets = [
  ['DVKT_2745', '23.0050.1484'],
  ['DVKT_0444', "XML1.MA_BENH STARTS_WITH 'R50'"],
  ['DVKT_0444', "XML1.MA_BENHKEM CONTAINS 'A41'"],
  ['DVKT_0027', 'SUBSTR(item.NGAY_YL,1,8)'],
  ['DVKT_0447', 'SUBSTR(item.NGAY_YL,1,8)'],
  ['DVKT_0026', 'COUNT_IF(DS_XML5'],
  ['DVKT_0446', 'COUNT_IF(DS_XML5'],
  ['"MUC_DO": "Error"', ''],
];
requiredSnippets.forEach(([a, b]) => {
  if (!seedRaw.includes(a) || (b && !seedRaw.includes(b))) fail(`Seed thiếu: ${a} ${b}`.trim());
  else ok(`Seed có ${a}`);
});

if (!engineRaw.includes('giamDinhCrpProcalcitoninTrungMocXml3')) {
  fail('Engine thiếu giamDinhCrpProcalcitoninTrungMocXml3');
} else ok('Engine có CLN-DVKT-CRP-01');

if (!engineRaw.includes('suyRaMucDoTuCanhBao')) fail('Engine thiếu suyRaMucDoTuCanhBao');
else ok('Engine suy ra muc_do từ emoji');

const chuyenDe = read(path.join(ROOT, 'ma_nguon', 'tien_ich', 'luat_giam_dinh_chuyen_de_hardcoded.jsx'));
if (!chuyenDe.includes('CHUYEN_DE_ICD_GOI_Y_PROCALCITONIN_VBHN17')) {
  fail('Chuyên đề thiếu hằng ICD Procalcitonin');
} else ok('Chuyên đề ICD Procalcitonin thống nhất');

const dm = read(path.join(ROOT, 'ma_nguon', 'thanh_phan', 'dich_vu_ky_thuat.jsx'));
if (!dm.includes('"MA_DICH_VU": "23.0125.1483"')) fail('DM thiếu Procalcitonin 23.0125.1483');
else ok('DM có mã Procalcitonin');

// Mirror: cùng phút → cảnh báo
const coCanhBao = giamDinhCrpPctMirror({
  XML3: [
    { MA_DICH_VU: '23.0228.1483', NGAY_YL: '202606161030', THANH_TIEN_BH: 1000 },
    { MA_DICH_VU: '23.0125.1483', NGAY_YL: '202606161030', THANH_TIEN_BH: 1000 },
  ],
});
if (coCanhBao.length === 0) fail('Mirror: expected CLN-DVKT-CRP-01 same minute');
else ok('Mirror CLN-DVKT-CRP-01 same minute');

// Mirror: khác ngày → không cảnh báo
const khongCanhBao = giamDinhCrpPctMirror({
  XML3: [
    { MA_DICH_VU: '23.0228.1483', NGAY_YL: '202606161030', THANH_TIEN_BH: 1000 },
    { MA_DICH_VU: '23.0125.1483', NGAY_YL: '202606171030', THANH_TIEN_BH: 1000 },
  ],
});
if (khongCanhBao.length > 0) fail('Mirror: unexpected CLN-DVKT-CRP-01 different day');
else ok('Mirror không báo khi khác ngày');

if (process.exitCode) process.exit(process.exitCode);
console.log('\nQA CRP/Procalcitonin: pass');
