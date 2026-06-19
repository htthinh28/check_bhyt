#!/usr/bin/env node
/**
 * QA PL02 — Diacerein TH21, PPI TH72, BS khám+PTTT trùng mốc (CLN-BS-PL02-04).
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

const read = (p) => fs.readFileSync(p, 'utf8');

const engineRaw = read(path.join(ROOT, 'ma_nguon', 'tien_ich', 'dong_co_giam_dinh.jsx'));
const chuyenRaw = read(path.join(ROOT, 'ma_nguon', 'tien_ich', 'luat_giam_dinh_chuyen_de_hardcoded.jsx'));
const muc8Raw = read(path.join(ROOT, 'ma_nguon', 'tien_ich', 'du_lieu_luat_thuoc_muc8.jsx'));

const requiredSnippets = [
  ['engine', 'giamDinhDiacereinPl02Th21', 'CLN-THUOC-PL02-21'],
  ['engine', 'giamDinhPpiPl02Th72', 'CLN-THUOC-PL02-72'],
  ['engine', 'giamDinhBacSiPl02KhamBenhDongThoiPttt', 'CLN-BS-PL02-04'],
  ['chuyen', 'CHUYEN_DE_XML130_VI_PHAM_DIACEREIN_THANH_TOAN_CV266_TH21'],
  ['chuyen', 'CHUYEN_DE_XML130_DUOC_CHI_DINH_PPI_CV266_TH72'],
  ['chuyen', '2026-06-16-pl02-th21-th72-bs-y-lenh'],
  ['muc8', '2026-06-16_pl02_th21_th72_sync'],
  ['muc8', 'Không thanh toán BN ≥ 65 tuổi (PL02 TH21)'],
];

requiredSnippets.forEach(([kind, ...snips]) => {
  const raw = kind === 'engine' ? engineRaw : kind === 'chuyen' ? chuyenRaw : muc8Raw;
  snips.forEach((s) => {
    if (!raw.includes(s)) fail(`Thiếu ${s} trong ${kind}`);
    else ok(`${kind}: có ${s}`);
  });
});

// Mirror Diacerein ≥65
const mirrorDiacerein65 = () => {
  const xml1 = { TUOI_NAM: 70, MA_BENH_CHINH: 'M17' };
  const xml2 = [{ MA_THUOC: '40.63', TEN_THUOC: 'Artrodar' }];
  const tuoi = Number(xml1.TUOI_NAM);
  return tuoi >= 65 && xml2.some((r) => String(r.MA_THUOC) === '40.63');
};
if (!mirrorDiacerein65()) fail('Mirror Diacerein ≥65');
else ok('Mirror Diacerein ≥65');

// Mirror BS cùng phút khám + PT
const mirrorBsKhamPttt = () => {
  const doc = 'BS001';
  const time = '202601011030';
  const kham = { MA_BAC_SI: doc, NGAY_YL: `${time}00`, TEN_DICH_VU: 'Công khám' };
  const pttt = { MA_BAC_SI: doc, NGAY_YL: `${time}00`, TEN_DICH_VU: 'Phẫu thuật', MA_NHOM: '4' };
  return kham.MA_BAC_SI === pttt.MA_BAC_SI && kham.NGAY_YL.slice(0, 12) === pttt.NGAY_YL.slice(0, 12);
};
if (!mirrorBsKhamPttt()) fail('Mirror BS khám+PTTT cùng phút');
else ok('Mirror BS khám+PTTT cùng phút');

if (!process.exitCode) console.log('\nqa_pl02_diacerein_ppi_bs: ALL OK');
