#!/usr/bin/env node
/** QA CCHN-CHUOI-DU-CUOI — chuỗi ≥2 BS không được kết thúc bằng ";". */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const srcEngine = readFileSync(join(root, 'ma_nguon/tien_ich/giam_dinh_cchn_chuoi_nhieu_bs.jsx'), 'utf8');
const srcDongCo = readFileSync(join(root, 'ma_nguon/tien_ich/dong_co_giam_dinh.jsx'), 'utf8');

assert.match(srcEngine, /CCHN-CHUOI-DU-CUOI/);
assert.match(srcEngine, /Chuỗi mã CCHN dư ký tự cuối/);
assert.match(srcDongCo, /giamDinhCchnChuoiNhieuBsDuKyTuCuoi/);

const tachSegmentNhanVienYTe = (value) => {
  const raw = String(value ?? '');
  if (!raw.trim()) return [];
  return raw.split(';').map((s) => s.trim()).filter(Boolean);
};

const coChuoiCchnNhieuNguoiDuKyTuCuoi = (value) => {
  const raw = String(value ?? '');
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const segments = tachSegmentNhanVienYTe(raw);
  if (segments.length < 2) return false;
  return /;\s*$/.test(raw);
};

const dung =
  'Lê Hoàng Thái (006084/ST-CCHN); Châu Thị Lam Thuyên (08105/AG-CCHN)';
const sai =
  'Lê Hoàng Thái (006084/ST-CCHN); Châu Thị Lam Thuyên (08105/AG-CCHN);';

assert.equal(coChuoiCchnNhieuNguoiDuKyTuCuoi(dung), false);
assert.equal(coChuoiCchnNhieuNguoiDuKyTuCuoi(sai), true);
assert.equal(coChuoiCchnNhieuNguoiDuKyTuCuoi('006084/ST-CCHN; 08105/AG-CCHN;'), true);
assert.equal(coChuoiCchnNhieuNguoiDuKyTuCuoi('006084/ST-CCHN;'), false);
assert.equal(coChuoiCchnNhieuNguoiDuKyTuCuoi('006084/ST-CCHN'), false);
assert.equal(coChuoiCchnNhieuNguoiDuKyTuCuoi(''), false);
assert.equal(tachSegmentNhanVienYTe(dung).length, 2);

const giamDinhMirror = (hoSo) => {
  const ds = [];
  const configs = [
    { phan_he: 'XML3', truong: 'NGUOI_THUC_HIEN' },
    { phan_he: 'XML3', truong: 'MA_BAC_SI' },
  ];
  for (const { phan_he, truong } of configs) {
    const mang = hoSo?.[phan_he] || [];
    mang.forEach((row, index) => {
      if (coChuoiCchnNhieuNguoiDuKyTuCuoi(row?.[truong])) {
        ds.push({ phan_he, index, truong_loi: truong });
      }
    });
  }
  return ds;
};

const loi = giamDinhMirror({
  XML3: [{ NGUOI_THUC_HIEN: sai }],
});
assert.equal(loi.length, 1);
assert.equal(loi[0].truong_loi, 'NGUOI_THUC_HIEN');

const khongLoi = giamDinhMirror({
  XML3: [{ NGUOI_THUC_HIEN: dung }],
});
assert.equal(khongLoi.length, 0);

console.log('qa_cchn_chuoi_du_cuoi: OK');
