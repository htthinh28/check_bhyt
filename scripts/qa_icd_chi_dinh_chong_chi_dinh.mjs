#!/usr/bin/env node
/**
 * QA mirror: ICD-10 chỉ định / chống chỉ định (DVKT-OP + thuốc mapping).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seed = JSON.parse(readFileSync(join(root, 'ma_nguon/tien_ich/seed_icd_drug_contra_bhyt.json'), 'utf8'));

// --- DVKT collectIcdCodes mirror ---
const collectIcdCodes = (xml1) => {
  const rawFields = [
    xml1?.MA_BENH || xml1?.MA_BENH_CHINH,
    xml1?.MA_BENH_KT || xml1?.MA_BENHKHAC,
    xml1?.MA_BENH_PHU,
  ];
  const codes = new Set();
  rawFields.forEach((raw) => {
    String(raw || '').split(/[,;|\s]+/).filter(Boolean).forEach((p) => {
      const icd = String(p).trim().toUpperCase();
      if (/^[A-Z]\d{2}[A-Z0-9.]{0,4}$/.test(icd)) codes.add(icd.replace('.', ''));
    });
  });
  return codes;
};

const hasIntersectionSet = (setA, setB) => {
  for (const v of setB) if (setA.has(v)) return true;
  return false;
};

const checkIcdIndication = (prefix, claimIcds, indicationRulesByPrefix) => {
  const mappings = indicationRulesByPrefix.get(prefix) || [];
  if (mappings.length === 0) return 'PASS';
  for (const item of mappings) {
    if (item.hasAll) return 'PASS';
    if (hasIntersectionSet(claimIcds, item.codes)) return 'PASS';
  }
  return 'FAIL';
};

const checkIcdContraindication = (line, claimIcds, contraCompiled) => {
  const tenDvktNorm = String(line.tenDvkt || line.maTuongDuong || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const row of contraCompiled) {
    if (row.prefix && row.prefix !== line.prefix) continue;
    if (row.dvktTypeNorm && !tenDvktNorm.includes(row.dvktTypeNorm)) continue;
    if (row.icdCodes.size === 0) continue;
    if (hasIntersectionSet(claimIcds, row.icdCodes)) return 'FAIL';
  }
  return 'PASS';
};

// DVKT: không có mapping → luôn pass
const emptyMap = new Map();
assert.equal(checkIcdIndication('XN', collectIcdCodes({ MA_BENH_CHINH: 'K25.1' }), emptyMap), 'PASS');

const xnRules = new Map([['XN', [{ hasAll: false, codes: new Set(['K25', 'K251']) }]]]);
assert.equal(checkIcdIndication('XN', collectIcdCodes({ MA_BENH_CHINH: 'K25.1' }), xnRules), 'PASS');
assert.equal(checkIcdIndication('XN', collectIcdCodes({ MA_BENH_CHINH: 'K25' }), xnRules), 'PASS');
assert.equal(checkIcdIndication('XN', collectIcdCodes({ MA_BENH_CHINH: 'J06.9' }), xnRules), 'FAIL');
// Không khớp prefix cha K25 khi chỉ có K251 trong danh mục
const xnRules2 = new Map([['XN', [{ hasAll: false, codes: new Set(['K251']) }]]]);
assert.equal(checkIcdIndication('XN', collectIcdCodes({ MA_BENH_CHINH: 'K25' }), xnRules2), 'FAIL');

const contra = [{
  prefix: 'SA',
  dvktTypeNorm: 'sieu am',
  icdCodes: new Set(['O80']),
  severity: 'REJECT',
}];
assert.equal(checkIcdContraindication({ prefix: 'SA', tenDvkt: 'Siêu âm thai' }, collectIcdCodes({ MA_BENH_CHINH: 'O80' }), contra), 'FAIL');
assert.equal(checkIcdContraindication({ prefix: 'SA', tenDvkt: 'Siêu âm thai' }, collectIcdCodes({ MA_BENH_CHINH: 'J06' }), contra), 'PASS');

// --- Thuốc CO_ICD_VI_PHAM_CHONG_CHI_DINH mirror ---
const normKey = (v) => String(v || '').replace(/\./g, '').trim().toUpperCase();
const parseIcdTokens = (tokRaw) => {
  const t = String(tokRaw || '').trim().toUpperCase().replace(/\s+/g, '');
  if (/^O00-O9A$/i.test(t) || /^O00-O99$/i.test(t)) return ['__O_CHAPTER__'];
  const k = normKey(tokRaw);
  return k ? [k] : [];
};
const layMaIcd = (xml1) => {
  const seen = new Set();
  const out = [];
  [xml1?.MA_BENH_CHINH, xml1?.MA_BENH_KT, xml1?.MA_BENHKEM].forEach((value) => {
    (String(value || '').toUpperCase().match(/[A-TV-Z]\d{2}(?:\.[0-9A-Z]{1,2})?/g) || []).forEach((code) => {
      const k = normKey(code);
      if (k && !seen.has(k)) { seen.add(k); out.push(k); }
    });
  });
  return out;
};
const bnCoIcdTrung = (icdCam, hs) => hs.some((icdBn) => {
  if (icdCam.has('__O_CHAPTER__') && icdBn.startsWith('O')) return true;
  if (icdCam.has(icdBn)) return true;
  for (const cam of icdCam) {
    if (cam === '__O_CHAPTER__') continue;
    if (cam.length >= 3 && icdBn.length >= cam.length && icdBn.startsWith(cam)) return true;
  }
  return false;
});
const viPhamContraThuoc = (maThuoc, xml1) => {
  const icdCam = new Set();
  seed.forEach((row) => {
    if (row.is_active === false) return;
    const tgts = row.metadata?.target_codes || String(row.target_code || '').split(/[;,|]/);
    if (!tgts.map((t) => String(t).trim()).includes(maThuoc)) return;
    const srcs = row.metadata?.source_icd_codes || String(row.source_code || '').split(/[;,|]/);
    srcs.forEach((s) => parseIcdTokens(s).forEach((k) => icdCam.add(k)));
  });
  if (icdCam.size === 0) return false;
  return bnCoIcdTrung(icdCam, layMaIcd(xml1));
};

assert.equal(viPhamContraThuoc('40.28', { MA_BENH_CHINH: 'K25.0' }), true);
assert.equal(viPhamContraThuoc('40.28', { MA_BENH_CHINH: 'J06.9' }), false);
assert.equal(viPhamContraThuoc('40.558', { MA_BENH_CHINH: 'K70.2' }), true);
assert.equal(viPhamContraThuoc('40.558', { MA_BENH_CHINH: 'O21.0' }), true); // O-chapter
assert.equal(viPhamContraThuoc('40.558', { MA_BENH_CHINH: 'E11.9' }), false);

// CO_ICD_KHOP mirror: không có mapping → pass
const coIcdKhop = (maThuoc, xml1, rows) => {
  if (!rows.length) return true;
  const icdChoPhep = new Set();
  rows.forEach((row) => {
    const tgts = row.metadata?.target_codes || [row.target_code];
    if (!tgts.map((t) => String(t).trim()).includes(maThuoc)) return;
    const srcs = row.metadata?.source_icd_codes || String(row.source_code || '').split(/[;,|]/);
    srcs.forEach((s) => { const k = normKey(s); if (k) icdChoPhep.add(k); });
  });
  if (icdChoPhep.size === 0) return true;
  return layMaIcd(xml1).some((icd) => icdChoPhep.has(icd));
};
assert.equal(coIcdKhop('40.999', { MA_BENH_CHINH: 'J06' }, []), true);
assert.equal(coIcdKhop('40.28', { MA_BENH_CHINH: 'K25' }, [{
  target_code: '40.28',
  metadata: { target_codes: ['40.28'], source_icd_codes: ['J06', 'J20'] },
}]), false);
assert.equal(coIcdKhop('40.28', { MA_BENH_CHINH: 'J06.9' }, [{
  target_code: '40.28',
  metadata: { target_codes: ['40.28'], source_icd_codes: ['J06', 'J20'] },
}]), false); // exact key J069 ≠ J06

console.log('qa_icd_chi_dinh_chong_chi_dinh: OK', {
  seedContra: seed.length,
  uniqueDrugs: new Set(seed.flatMap((r) => r.metadata?.target_codes || String(r.target_code || '').split(/[;,|]/)).map((x) => String(x).trim())).size,
});
