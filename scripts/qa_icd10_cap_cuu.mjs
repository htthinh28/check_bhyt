#!/usr/bin/env node
/**
 * Smoke test logic HC_249 / ICD-10 cấp cứu (mirror giam_dinh_icd10_cap_cuu.jsx).
 * Chạy: node scripts/qa_icd10_cap_cuu.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedSrc = readFileSync(join(__dirname, '../ma_nguon/thanh_phan/icd10_nhap_vien_cap_cuu.jsx'), 'utf8');
const rowMatch = seedSrc.match(/"ID": "NH01"[\s\S]*?"Tu_Khoa": ""\s*}/);
if (!rowMatch) throw new Error('Không tìm thấy dòng NH01 trong seed');
const rowNh01 = JSON.parse(`{${rowMatch[0].replace(/^\{/, '')}`);

const normalizeTextNoAccent = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const laNoiTruCapCuuTheoXml1 = (xml1) => {
  const maLoai = String(xml1?.MA_LOAI_KCB ?? '').trim().replace(/^0+/, '');
  const n = maLoai === '03' ? '3' : maLoai === '09' ? '9' : maLoai;
  const laNoiTru = n === '3' || n === '9' || Boolean(String(xml1?.NGAY_VAO_NOI_TRU ?? '').trim());
  const dt = String(xml1?.MA_DOITUONG_KCB ?? '').trim();
  const laCapCuu = dt === '2' || Number(dt.replace(',', '.')) === 2;
  return laNoiTru && laCapCuu;
};

const trichTuKhoa = (row) => {
  const out = [];
  const seen = new Set();
  const push = (token) => {
    const t = normalizeTextNoAccent(token).trim();
    if (t.length >= 4 && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  };
  String(row?.Tu_Khoa || '')
    .split(/[,;|/]+/)
    .forEach(push);
  normalizeTextNoAccent(`${row?.Ly_Do_Nhap_Vien || ''} ${row?.Tinh_Trang_Benh || ''}`)
    .split(/[\s,.;:()[\]"/]+/)
    .forEach(push);
  return out;
};

const lyDoVntPhuHopDanhMuc = (xml1, row) => {
  const lyDoVntNorm = normalizeTextNoAccent(xml1?.LY_DO_VNT || '');
  if (!lyDoVntNorm) return false;
  return trichTuKhoa(row).some((kw) => lyDoVntNorm.includes(kw));
};

const chanDoanPhuHopTenIcdChinh = (hoSoNorm, row) => {
  const segments = String(row?.Ten_ICD_Chinh || '')
    .split(/[;]/)
    .map((s) => normalizeTextNoAccent(s.trim()))
    .filter((s) => s.length >= 4);
  return segments.some((seg) => hoSoNorm.includes(seg));
};

const xmlHopLe = {
  MA_LOAI_KCB: '3',
  MA_DOITUONG_KCB: '2',
  MA_BENH_CHINH: 'J40',
  TUOI_NAM: 5,
  CHAN_DOAN_VAO: 'Viêm phế quản không xác định, khó thở cấp',
  LY_DO_VNT: 'Mã hóa trực tiếp tình trạng ngừng hô hấp cấp tính cần hồi sức',
};

const xmlNgoaiTru = { MA_LOAI_KCB: '1', MA_DOITUONG_KCB: '2', MA_BENH_CHINH: 'J40' };

assert.equal(laNoiTruCapCuuTheoXml1(xmlHopLe), true);
assert.equal(laNoiTruCapCuuTheoXml1(xmlNgoaiTru), false);
assert.equal(lyDoVntPhuHopDanhMuc(xmlHopLe, rowNh01), true);
assert.equal(
  chanDoanPhuHopTenIcdChinh(normalizeTextNoAccent(xmlHopLe.CHAN_DOAN_VAO), rowNh01),
  true,
);

console.log('OK: qa_icd10_cap_cuu.mjs');
