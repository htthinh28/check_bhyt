#!/usr/bin/env node
/**
 * QA: giám định ICD-10 mã kép (†/*) — mirror logic Node thuần (không import .jsx).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bangPath = join(root, 'ma_nguon/thanh_phan/icd10_ma_kep_bang.jsx');
const bangSrc = readFileSync(bangPath, 'utf8');

const loadExport = (name) => {
  const m = bangSrc.match(new RegExp(`export const ${name} = ([\\s\\S]*?);\\n`));
  assert.ok(m, `parse ${name}`);
  return Function(`"use strict"; return (${m[1]});`)();
};

const CAP_GAM_SANG_SAO_ICD10 = loadExport('CAP_GAM_SANG_SAO_ICD10');
const CAP_SAO_SANG_GAM_ICD10 = loadExport('CAP_SAO_SANG_GAM_ICD10');
const TAP_MA_GAM_ICD10 = loadExport('TAP_MA_GAM_ICD10');
const TAP_MA_SAO_DON_ICD10 = loadExport('TAP_MA_SAO_DON_ICD10');

const ICD_RAW_TOKEN = /[A-TV-Z]\d{2}(?:\.[0-9A-Z]{1,2})?(?:[†*])?/gi;

const normKey = (value) => String(value || '')
  .replace(/[\u2020\u2021\u2022†‡*]/g, '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9.]/g, '')
  .replace(/\./g, '');

const phanLoaiToken = (raw) => {
  const text = String(raw || '').trim();
  const key = normKey(text);
  if (!key) return null;
  const laSao = text.includes('*') || TAP_MA_SAO_DON_ICD10.has(key);
  const laGam = (text.includes('†') || TAP_MA_GAM_ICD10.has(key)) && !laSao;
  return { raw: text, key, laGam, laSao };
};

const tachTokenIcdCoThuTu = (value) => {
  const raw = String(value || '');
  const out = [];
  let rx;
  const re = new RegExp(ICD_RAW_TOKEN.source, 'gi');
  while ((rx = re.exec(raw)) !== null) {
    const token = phanLoaiToken(rx[0]);
    if (token) out.push(token);
  }
  if (out.length > 0) return out;
  return raw.split(/[;|,]+/).map((part) => phanLoaiToken(part.trim())).filter(Boolean);
};

const coCapKhop = (gamKey, saoKey) => {
  const stars = CAP_GAM_SANG_SAO_ICD10[gamKey];
  if (Array.isArray(stars) && stars.length > 0) return stars.includes(saoKey);
  const daggers = CAP_SAO_SANG_GAM_ICD10[saoKey];
  if (Array.isArray(daggers) && daggers.length > 0) return daggers.includes(gamKey);
  return true;
};

/** Mirror giamDinhIcd10MaKep */
const giamDinhIcd10MaKep = (hoSo) => {
  const xml1 = hoSo?.xml1 || hoSo?.XML1 || hoSo;
  if (!xml1 || typeof xml1 !== 'object') return [];

  const ds = [];
  const chinh = tachTokenIcdCoThuTu(xml1?.MA_BENH_CHINH || xml1?.MA_BENH || '');
  const kem = tachTokenIcdCoThuTu(xml1?.MA_BENH_KT || xml1?.MA_BENHKEM || xml1?.MA_BENHKT || '');
  const yhct = tachTokenIcdCoThuTu(xml1?.MA_BENH_YHCT || '');

  const gamChinh = chinh.filter((t) => t.laGam);
  const saoChinh = chinh.filter((t) => t.laSao);
  const saoKem = kem.filter((t) => t.laSao);
  const gamKem = kem.filter((t) => t.laGam);
  const saoYhct = yhct.filter((t) => t.laSao);
  const gamYhct = yhct.filter((t) => t.laGam);

  saoChinh.forEach(() => ds.push({ ma_luat: 'ICD-KEP-SAO-CHINH' }));

  const coGamHoSo = [...gamChinh, ...gamKem, ...gamYhct];
  const coSaoHoSo = [...saoChinh, ...saoKem, ...saoYhct];
  if (coSaoHoSo.length > 0 && coGamHoSo.length === 0) ds.push({ ma_luat: 'ICD-KEP-SAO-DON' });

  gamChinh.forEach((gam) => {
    if (saoKem.length === 0 && saoYhct.length === 0) {
      ds.push({ ma_luat: 'ICD-KEP-GAM-THIEU-SAO' });
      return;
    }
    const stars = CAP_GAM_SANG_SAO_ICD10[gam.key];
    if (!Array.isArray(stars) || stars.length === 0) return;
    const coSaoPhuHop = saoKem.some((s) => stars.includes(s.key)) || saoYhct.some((s) => stars.includes(s.key));
    if (!coSaoPhuHop) ds.push({ ma_luat: 'ICD-KEP-GAM-SAO-LECH' });
  });

  saoKem.forEach((sao) => {
    if (gamChinh.length === 0) return;
    const daggers = CAP_SAO_SANG_GAM_ICD10[sao.key];
    if (!Array.isArray(daggers) || daggers.length === 0) return;
    const coGamPhuHop = gamChinh.some((g) => daggers.includes(g.key) && coCapKhop(g.key, sao.key));
    if (!coGamPhuHop) ds.push({ ma_luat: 'ICD-KEP-SAO-GAM-LECH' });
  });

  if (saoKem.length > 0 && kem.length > 0 && !kem[0].laSao) ds.push({ ma_luat: 'ICD-KEP-SAO-VI-TRI' });

  if (gamYhct.length > 0 && saoYhct.length > 0 && yhct.length >= 2) {
    const viTriGam = yhct.findIndex((t) => t.laGam);
    const viTriSao = yhct.findIndex((t) => t.laSao);
    if (viTriGam >= 0 && viTriSao >= 0 && (viTriGam > viTriSao || viTriGam > 0 || viTriSao !== viTriGam + 1)) {
      ds.push({ ma_luat: 'ICD-KEP-YHCT-THU-TU' });
    }
  }

  return ds;
};

const maLuat = (hoSo) => giamDinhIcd10MaKep(hoSo).map((x) => x.ma_luat);

// --- Catalog stats ---
const gamKhongCoCap = [...TAP_MA_GAM_ICD10].filter((k) => !CAP_GAM_SANG_SAO_ICD10[k]);
assert.equal(TAP_MA_GAM_ICD10.size, 82);
assert.equal(Object.keys(CAP_GAM_SANG_SAO_ICD10).length, 45);
assert.equal(gamKhongCoCap.length, 37);

// --- Case tests ---
assert.deepEqual(maLuat({ MA_BENH_CHINH: 'A06.5†', MA_BENH_KT: 'J99.8*' }), []);
assert.deepEqual(maLuat({ MA_BENH_CHINH: 'J99.8*', MA_BENH_KT: 'A06.5†' }), ['ICD-KEP-SAO-CHINH']);
assert.deepEqual(maLuat({ MA_BENH_KT: 'G05.1' }), ['ICD-KEP-SAO-DON']); // G051 ∈ TAP_MA_SAO_DON
assert.deepEqual(maLuat({ MA_BENH_CHINH: 'A06.5†' }), ['ICD-KEP-GAM-THIEU-SAO']);
assert.deepEqual(maLuat({ MA_BENH_CHINH: 'A06.5†', MA_BENH_KT: 'G05.1' }), ['ICD-KEP-GAM-SAO-LECH', 'ICD-KEP-SAO-GAM-LECH']);
assert.deepEqual(maLuat({ MA_BENH_CHINH: 'A06.5†', MA_BENH_KT: 'I10;J99.8*' }), ['ICD-KEP-SAO-VI-TRI']);
assert.deepEqual(maLuat({ MA_BENH_CHINH: 'E10.2†' }), ['ICD-KEP-GAM-THIEU-SAO']); // † không có cặp trong danh mục
assert.deepEqual(maLuat({ MA_BENH_CHINH: 'E10.2†', MA_BENH_KT: 'H36.0*' }), []); // † không có cặp: chấp nhận bất kỳ mã * kèm
assert.deepEqual(maLuat({ MA_BENH_YHCT: 'G05.1;B26.0†' }), ['ICD-KEP-YHCT-THU-TU']);
assert.deepEqual(maLuat({ MA_BENH_CHINH: 'A17.0†', MA_BENH_KT: 'G01*' }), []); // cặp A170→G01

console.log('qa_icd10_ma_kep: OK', {
  maGam: TAP_MA_GAM_ICD10.size,
  capGamSao: Object.keys(CAP_GAM_SANG_SAO_ICD10).length,
  gamKhongCoCapTrongTen: gamKhongCoCap.length,
  maSaoDon: TAP_MA_SAO_DON_ICD10.size,
  viDuGamKhongCap: gamKhongCoCap.slice(0, 5),
});
