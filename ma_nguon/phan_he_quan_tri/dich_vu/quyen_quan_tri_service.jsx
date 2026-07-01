/**
 * Kiểm tra quyền Module cấu hình hệ thống — chỉ admin tối cao qua cổng triển khai.
 */
import { coGateSessionHopLe } from '../../tien_ich/deploy_gate';
import { coPhienDangNhapHopLe, docPhienDangNhap } from '../../tien_ich/phien_dang_nhap';
import { laTaiKhoanAdminToiCao } from '../../tien_ich/tai_khoan_admin_he_thong';
import { docTenantSession } from '../../tien_ich/tenant_session';
import { laLuongAdminHeThong } from '../../tien_ich/che_do_truy_cap';

/** Module cấu hình hệ thống — cổng triển khai + đăng nhập admin tối cao bắt buộc. */
export const coQuyenCauHinhHeThong = async () => {
  const gateMo = await coGateSessionHopLe();
  if (!gateMo) {
    return { ok: false, lyDo: 'Cần mở cổng triển khai (mật khẩu quản trị hệ thống).' };
  }
  const phien = await docPhienDangNhap();
  const em = String(phien?.email || '').trim().toLowerCase();
  if (!em || !laTaiKhoanAdminToiCao(em)) {
    return {
      ok: false,
      lyDo: 'Cần đăng nhập admin tối cao (htthinh28@gmail.com) với mật khẩu đã cấp.',
      canDangNhap: true,
    };
  }
  const daDangNhap = await coPhienDangNhapHopLe();
  if (!daDangNhap) {
    return {
      ok: false,
      lyDo: 'Phiên đăng nhập admin tối cao không hợp lệ. Vui lòng đăng nhập lại.',
      canDangNhap: true,
    };
  }
  return {
    ok: true,
    capDo: 'PLATFORM',
    choPhepChonBv: true,
    actor: em,
  };
};

/** @deprecated Dùng coQuyenCauHinhHeThong cho module platform. */
export const coQuyenQuanTriTaiKhoanBv = coQuyenCauHinhHeThong;

export const coQuyenQuanTriDaTenant = async () => {
  const phien = await docPhienDangNhap();
  const email = phien?.email || '';
  const quyen = await coQuyenCauHinhHeThong();
  if (!quyen.ok) return quyen;
  const tenant = await docTenantSession();
  if (!tenant?.org_id) {
    return { ok: false, lyDo: 'Chưa chọn bệnh viện.' };
  }
  return { ...quyen, orgId: tenant.org_id };
};

export const laAdminHeThongDangNhap = async () => {
  const tenant = await docTenantSession();
  const phien = await docPhienDangNhap();
  return laLuongAdminHeThong(tenant?.lock_source) && laTaiKhoanAdminToiCao(phien?.email);
};

export default {
  coQuyenCauHinhHeThong,
  coQuyenQuanTriTaiKhoanBv,
  coQuyenQuanTriDaTenant,
  laAdminHeThongDangNhap,
};
