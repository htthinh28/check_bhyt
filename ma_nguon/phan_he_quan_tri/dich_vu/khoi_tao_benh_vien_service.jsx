/**
 * Khởi tạo bệnh viện thành viên — tenant + RBAC + Admin BV (wizard).
 */
import { taoMatKhauNgauNhien } from '../../tien_ich/dich_vu_tai_khoan_cdss';
import { layDanhSachTenant, timTenantTheoOrgId } from '../../tien_ich/tenant_registry';
import { themTenantTuyChinh } from '../../tien_ich/tenant_registry_custom';
import { ghiAuditQuanTri } from './audit_quan_tri_service';
import {
  damBaoRbacTenant,
  docTaiKhoanTheoOrg,
  taoTaiKhoanBv,
} from './tai_khoan_bv_service';

const taoBindingMacDinh = () => ({
  roleIds: ['ROLE_ADMIN'],
  groupIds: [],
  overrides: { allow: [], deny: [] },
  dataScope: 'ALL',
});

/**
 * Khởi tạo đầy đủ một cơ sở KCB mới.
 * @param {object} payload
 * @param {string} actor — email admin tối cao
 */
export const khoiTaoBenhVien = async (payload, actor = 'ADMIN') => {
  const {
    orgId,
    displayName,
    maCskcb,
    catalogPolicy = 'legacy_bundle',
    taoAdminBv = true,
    adminEmail,
    adminHoTen,
    adminMatKhau,
    adminKhoa = 'Phòng Công nghệ thông tin',
    adminChucDanh = 'Quản trị viên BV',
  } = payload || {};

  let tenant = timTenantTheoOrgId(orgId);
  if (!tenant) {
    tenant = await themTenantTuyChinh({
      orgId,
      displayName,
      maCskcb,
      catalogPolicy,
    });
  }

  await damBaoRbacTenant(tenant.orgId);

  let adminResult = null;
  if (taoAdminBv) {
    const email = String(adminEmail || '').trim().toLowerCase();
    if (!email) {
      throw new Error('Cần email Admin BV khi bật tạo tài khoản quản trị.');
    }
    const ds = await docTaiKhoanTheoOrg(tenant.orgId);
    const daCo = ds.some((u) => u.email === email);
    if (!daCo) {
      const mk = String(adminMatKhau || '').trim() || taoMatKhauNgauNhien(12);
      adminResult = await taoTaiKhoanBv(tenant.orgId, {
        email,
        hoTen: adminHoTen || `Admin ${tenant.displayName}`,
        khoa: adminKhoa,
        chucDanh: adminChucDanh,
        vaiTro: 'ADMIN',
        matKhau: mk,
        buocDoiMatKhau: true,
        binding: taoBindingMacDinh(),
      }, actor);
      const xacNhan = await docTaiKhoanTheoOrg(tenant.orgId);
      if (!xacNhan.some((u) => u.email === email)) {
        throw new Error('Không xác nhận được tài khoản Admin BV sau khi lưu.');
      }
    } else {
      adminResult = { taiKhoan: ds.find((u) => u.email === email), matKhauTam: null, daTonTai: true };
    }
  }

  await ghiAuditQuanTri({
    hanhDong: 'KHOI_TAO_BENH_VIEN',
    orgId: tenant.orgId,
    doiTuong: tenant.displayName,
    chiTiet: `ma_cskcb=${tenant.maCskcb || '—'} · admin=${taoAdminBv ? (adminEmail || '—') : 'không'}`,
    taiKhoan: actor,
    heThong: 'TRUY_CAP',
  });

  return {
    tenant,
    admin: adminResult,
    buocHoanThanh: ['tenant', 'rbac', taoAdminBv ? 'admin_bv' : null].filter(Boolean),
  };
};

/** Thống kê nhanh toàn platform cho dashboard. */
export const layThongKePlatform = async () => {
  const tenants = layDanhSachTenant();
  let tongTaiKhoan = 0;
  let coAdminBv = 0;
  for (const t of tenants) {
    try {
      const ds = await docTaiKhoanTheoOrg(t.orgId);
      tongTaiKhoan += ds.length;
      if (ds.some((u) => u.vaiTro === 'ADMIN' && u.trangThai !== 'KHOA')) coAdminBv += 1;
    } catch { /* tenant chưa init storage */ }
  }
  return {
    soCoSo: tenants.length,
    soCoSoBundle: tenants.filter((t) => t.source === 'bundle').length,
    soCoSoTuyChinh: tenants.filter((t) => t.source === 'custom').length,
    tongTaiKhoan,
    soCoSoCoAdmin: coAdminBv,
    soCoSoChuaAdmin: tenants.length - coAdminBv,
    capNhatLuc: new Date().toISOString(),
  };
};

export default {
  khoiTaoBenhVien,
  layThongKePlatform,
};
