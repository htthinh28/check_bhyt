#!/usr/bin/env node
/**
 * Smoke test cặp ICD-10 sản khoa TT06 (mirror giam_dinh_icd10_san_khoa_tt06.jsx).
 * Chạy: node scripts/qa_icd10_san_khoa_tt06.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedSrc = readFileSync(
  join(__dirname, '../ma_nguon/thanh_phan/icd10_san_khoa_tt06_cap_khong.jsx'),
  'utf8',
);
const capMatch = seedSrc.match(/export const CAP_ICD10_SAN_KHOA_KHONG_DI_CUNG = (\[[\s\S]*?\]);/);
if (!capMatch) throw new Error('Không parse được CAP_ICD10_SAN_KHOA_KHONG_DI_CUNG');
const capKhong = JSON.parse(
  capMatch[1]
    .replace(/(\w+):/g, '"$1":')
    .replace(/'/g, '"'),
);

const ICD_RG = /[A-TV-Z]\d{2}(?:\.[0-9A-Z]{1,2})?/gi;
const CANH_BAO_PREFIX =
  '⚠️ Cảnh báo: Mã hóa ICD-10 chưa phù hợp với quy định tại Thông tư số 06/2026/TT-BYT của Bộ Y tế:';

const chuanHoaMaIcd = (raw) => String(raw || '')
  .replace(/[\u2020\u2021\u2022†‡*]/g, '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9.]/g, '')
  .replace(/\./g, '');

const trichMaIcdTuChuoiHoSo = (value) => {
  const out = [];
  const seen = new Set();
  const raw = String(value || '');
  const re = new RegExp(ICD_RG.source, 'gi');
  let m;
  while ((m = re.exec(raw)) !== null) {
    const key = chuanHoaMaIcd(m[0]);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push({ raw: m[0], key });
    }
  }
  return out;
};

const gomMaIcdTrenXml1 = (xml1) => {
  const chinh = trichMaIcdTuChuoiHoSo(xml1?.MA_BENH_CHINH || '');
  const kem = trichMaIcdTuChuoiHoSo(xml1?.MA_BENH_KT || '');
  return [...chinh, ...kem];
};

const khopMaIcdQuyTac = (maHoSo, maQuyTac) => {
  const a = chuanHoaMaIcd(maHoSo);
  const b = chuanHoaMaIcd(maQuyTac);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  if (b.length >= 3 && a.startsWith(b.slice(0, 3))) return true;
  if (a.length >= 3 && b.startsWith(a.slice(0, 3)) && b.length === 3) return true;
  return false;
};

const timTokenKhop = (tokens, maQuyTac) =>
  tokens.find((t) => khopMaIcdQuyTac(t.key, maQuyTac)) || null;

const giamDinh = (xml1, rules) => {
  const tokens = gomMaIcdTrenXml1(xml1);
  if (tokens.length < 2) return [];
  const ds = [];
  const seen = new Set();
  rules.forEach((rule) => {
    const tokA = timTokenKhop(tokens, rule.ma_a);
    const tokB = timTokenKhop(tokens, rule.ma_b);
    if (!tokA || !tokB || tokA.key === tokB.key) return;
    const capKey = [tokA.key, tokB.key].sort().join('|');
    if (seen.has(capKey)) return;
    seen.add(capKey);
    ds.push({
      canh_bao: `${CANH_BAO_PREFIX} ${rule.noi_dung_sai}`,
      ma_luat: 'ICD-TT06-SAN-KHOA-CAP',
    });
  });
  return ds;
};

assert.ok(capKhong.length >= 30, 'seed phải có đủ cặp sản khoa');
assert.equal(khopMaIcdQuyTac('O47.1', 'O47'), true);
assert.equal(khopMaIcdQuyTac('O80', 'O81'), false);

const viPham = giamDinh({ MA_BENH_CHINH: 'O80', MA_BENH_KT: 'O47.1' }, capKhong);
assert.ok(viPham.length >= 1);
assert.equal(viPham[0].ma_luat, 'ICD-TT06-SAN-KHOA-CAP');
assert.ok(viPham[0].canh_bao.startsWith(CANH_BAO_PREFIX));
assert.ok(viPham[0].canh_bao.includes('chuyển dạ giả'));

const khongViPham = giamDinh({ MA_BENH_CHINH: 'O80', MA_BENH_KT: 'Z37.0' }, capKhong);
assert.equal(khongViPham.length, 0);

console.log('OK: qa_icd10_san_khoa_tt06.mjs');
