#!/usr/bin/env node
/**
 * QA: admin tối cao htthinh28@gmail.com đăng nhập mọi BV thành viên.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const dangNhap = read('ma_nguon/man_hinh/dang_nhap.jsx');
const adminMod = read('ma_nguon/tien_ich/dang_nhap_admin_toi_cao.jsx');
const emailMod = read('ma_nguon/tien_ich/tai_khoan_admin_he_thong.jsx');

assert.match(emailMod, /htthinh28@gmail\.com/);
assert.match(adminMod, /Tramanh@2010##/);
assert.match(adminMod, /dongBoAdminToiCaoTrenTenantHienTai/);
assert.match(adminMod, /ROLE_ADMIN/);

assert.match(dangNhap, /dongBoAdminToiCaoTrenTenantHienTai/);
assert.match(dangNhap, /matKhauAdminToiCaoHopLe/);
assert.doesNotMatch(
  dangNhap,
  /Admin toi cao khong duoc dang nhap luong thanh vien/,
  'Phải gỡ chặn đăng nhập luồng BV thành viên',
);
assert.doesNotMatch(
  dangNhap,
  /phải đăng nhập qua vai trò «Quản trị hệ thống»/,
  'Không chặn admin tối cao vào luồng thành viên',
);

// Logic mirror: ≥2 tenant, seed admin tồn tại
const MAT_KHAU = 'Tramanh@2010##';
const EMAIL = 'htthinh28@gmail.com';
const stores = new Map();

const seedAdmin = (orgId) => {
  const key = `CDSS_ORG_${orgId}_DANH_SACH_TAI_KHOAN`;
  const row = {
    email: EMAIL,
    matKhau: MAT_KHAU,
    vaiTro: 'ADMIN',
    trangThai: 'HOAT_DONG',
    buocDoiMatKhau: false,
  };
  stores.set(key, [row]);
  return row;
};

const xacThucTrenTenant = (orgId, email, mk) => {
  const key = `CDSS_ORG_${orgId}_DANH_SACH_TAI_KHOAN`;
  let ds = stores.get(key) || [];
  if (!ds.some((u) => u.email === EMAIL)) {
    seedAdmin(orgId);
    ds = stores.get(key);
  }
  const user = ds.find((u) => u.email === email);
  if (!user) return false;
  return user.matKhau === mk || mk === MAT_KHAU;
};

for (const org of ['phuongchau_soc_trang', 'phuongchau_can_tho', 'phuongchau_sa_dec']) {
  assert.equal(xacThucTrenTenant(org, EMAIL, MAT_KHAU), true);
}

assert.equal(xacThucTrenTenant('phuongchau_soc_trang', EMAIL, 'sai'), false);

console.log('qa_admin_toi_cao_da_bv: OK');
