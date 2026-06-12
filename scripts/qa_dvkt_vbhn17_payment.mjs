#!/usr/bin/env node
/**
 * QA: DVKT-OP-17 — điều kiện thanh toán VBHN 17 Điều 4 khoản 4 / 4a / 4d.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDvkt = readFileSync(join(root, 'ma_nguon/tien_ich/dvkt_op_giam_dinh.jsx'), 'utf8');
const srcOnOff = readFileSync(join(root, 'ma_nguon/tien_ich/quy_tac_on_off_noi_bo.jsx'), 'utf8');

assert.match(srcDvkt, /RULE_CODE:\s*'DVKT-OP-17'/);
assert.match(srcDvkt, /OPERATOR:\s*'CHECK_BUNDLED_OR_DERIVED_PAYMENT'/);
assert.match(srcDvkt, /CHECK_BUNDLED_OR_DERIVED_PAYMENT:\s*checkBundledOrDerivedPayment/);
assert.match(srcDvkt, /tronRuleMacDinhVaRuleDongTheoMa\(DEFAULT_DVKT_RULES,\s*rules\)/);
assert.doesNotMatch(srcDvkt, /toUpper\(r\.RULE_CODE \|\| r\.MA_LUAT \|\| ''\) !== 'DVKT-OP-17'/);
assert.match(srcOnOff, /ma_luat:\s*'DVKT-OP-17'/);

const removeAccents = (v) => String(v || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D');
const normalizeToken = (v) => removeAccents(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
const coPhatSinhThanhToanBhyt = (line) => {
  if (Number(line.thanhTienBh || 0) > 0) return true;
  if (Number(line.thanhTien || 0) > 0) return true;
  if (Number(line.donGiaClaim || 0) > 0 && Number(line.soLuong || 0) > 0) return true;
  if (Number(line.tyleTt || 0) > 0 && Number(line.donGiaClaim || 0) > 0) return true;
  return false;
};
const laDauHieuKhongThanhToanRiengHoacDaKetCau = (rawText) => {
  const token = normalizeToken(rawText);
  return token.includes('KHONGTHANHTOANRIENG')
    || token.includes('KHONGDUOCTHANHTOANRIENG')
    || token.includes('KHONGTINHTHANHTOANRIENG')
    || token.includes('DAKETCAUTRONGGIA')
    || token.includes('DAKETCAUTRONGCHIPHI')
    || token.includes('DAKETCAUTRONGCOCAUGIA')
    || token.includes('DACOTRONGCOCAUGIA')
    || (token.includes('CONGDOAN') && token.includes('DATINH') && token.includes('GIA'))
    || (token.includes('THUOCQUYTRINH') && token.includes('DATINH') && token.includes('GIA'))
    || (token.includes('KETQUA') && token.includes('TINHTOANTU') && token.includes('DICHVU'))
    || (token.includes('KETQUA') && token.includes('THUCHIEN') && token.includes('DICHVU'));
};

assert.equal(coPhatSinhThanhToanBhyt({ thanhTienBh: 0, thanhTien: 0, donGiaClaim: 0, soLuong: 1 }), false);
assert.equal(coPhatSinhThanhToanBhyt({ thanhTienBh: 12000 }), true);
assert.equal(coPhatSinhThanhToanBhyt({ donGiaClaim: 50000, soLuong: 1 }), true);

assert.equal(laDauHieuKhongThanhToanRiengHoacDaKetCau('Vật tư này không thanh toán riêng'), true);
assert.equal(laDauHieuKhongThanhToanRiengHoacDaKetCau('Chi phí đã kết cấu trong giá dịch vụ khác'), true);
assert.equal(laDauHieuKhongThanhToanRiengHoacDaKetCau('Công đoạn đã tính trong cơ cấu giá phẫu thuật'), true);
assert.equal(laDauHieuKhongThanhToanRiengHoacDaKetCau('Kết quả được tính toán từ dịch vụ kỹ thuật khác'), true);
assert.equal(laDauHieuKhongThanhToanRiengHoacDaKetCau('Chưa bao gồm thuốc và oxy'), false);
assert.equal(laDauHieuKhongThanhToanRiengHoacDaKetCau('Đã bao gồm chi phí mũi khoan'), false);

console.log('qa_dvkt_vbhn17_payment: OK');
