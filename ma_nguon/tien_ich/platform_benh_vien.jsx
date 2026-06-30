/**
 * Khởi tạo bệnh viện mới + thống kê platform.
 */
import { taoMatKhauNgauNhien } from './dich_vu_tai_khoan_cdss';
import { timTenantTheoOrgId, layDanhSachTenant } from './tenant_registry';
import { themTenantTuyChinh } from './tenant_registry_custom';
import { ghiAuditQuanTri } from './audit_quan_tri';
import {
  damBaoRbacTenant,
  docTaiKhoanTheoOrg,
  taoTaiKhoanBv,
} from './tai_khoan_bv_service';

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

  let admin = null;
  if (taoAdminBv) {
    const email = String(adminEmail || '').trim().toLowerCase();
    if (!email) throw new Error('Cần email Admin BV khi bật tạo tài khoản quản trị.');

    const ds = await docTaiKhoanTheoOrg(tenant.orgId);
    if (ds.some((tk) => tk.email === email)) {
      admin = { taiKhoan: ds.find((tk) => tk.email === email), matKhauTam: null, daTonTai: true };
    } else {
      const mk = String(adminMatKhau || '').trim() || taoMatKhauNgauNhien(12);
      admin = await taoTaiKhoanBv(
        tenant.orgId,
        {
          email,
          hoTen: adminHoTen || `Admin ${tenant.displayName}`,
          khoa: adminKhoa,
          chucDanh: adminChucDanh,
          vaiTro: 'ADMIN',
          matKhau: mk,
          buocDoiMatKhau: true,
          binding: {
            roleIds: ['ROLE_ADMIN'],
            groupIds: [],
            overrides: { allow: [], deny: [] },
            dataScope: 'ALL',
          },
        },
        actor,
      );
      const verify = await docTaiKhoanTheoOrg(tenant.orgId);
      if (!verify.some((tk) => tk.email === email)) {
        throw new Error('Không xác nhận được tài khoản Admin BV sau khi lưu.');
      }
    }
  }

  await ghiAuditQuanTri({
    hanhDong: 'KHOI_TAO_BENH_VIEN',
    orgId: tenant.orgId,
    doiTuong: tenant.displayName,
    chiTiet: `ma_cskcb=${tenant.maCskcb || '—'} · admin=${taoAdminBv ? adminEmail || '—' : 'không'}`,
    taiKhoan: actor,
    heThong: 'TRUY_CAP',
  });

  return {
    tenant,
    admin,
    buocHoanThanh: ['tenant', 'rbac', taoAdminBv ? 'admin_bv' : null].filter(Boolean),
  };
};

export const layThongKePlatform = async () => {
  const list = layDanhSachTenant();
  let tongTaiKhoan = 0;
  let soCoSoCoAdmin = 0;

  for (const row of list) {
    try {
      const ds = await docTaiKhoanTheoOrg(row.orgId);
      tongTaiKhoan += ds.length;
      if (ds.some((tk) => tk.vaiTro === 'ADMIN' && tk.trangThai !== 'KHOA')) {
        soCoSoCoAdmin += 1;
      }
    } catch {
      /* ignore */
    }
  }

  return {
    soCoSo: list.length,
    soCoSoBundle: list.filter((r) => r.source === 'bundle').length,
    soCoSoTuyChinh: list.filter((r) => r.source === 'custom').length,
    tongTaiKhoan,
    soCoSoCoAdmin,
    soCoSoChuaAdmin: list.length - soCoSoCoAdmin,
    capNhatLuc: new Date().toISOString(),
  };
};

export default {
  khoiTaoBenhVien,
  layThongKePlatform,
};
