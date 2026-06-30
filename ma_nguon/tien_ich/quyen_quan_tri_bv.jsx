/**
 * Kiểm tra quyền module quản trị đa BV.
 */
import { coGateSessionHopLe } from './gate_session';
import { docPhienDangNhap } from './phien_dang_nhap';
import { laTaiKhoanAdminToiCao } from './admin_toi_cao';
import { docTenantSession } from './tenant_session';
import { laLuongAdminHeThong } from './che_do_truy_cap';
import { coPhienDangNhapHopLe } from './phien_dang_nhap';

export const coQuyenCauHinhHeThong = async () => {
  if (!(await coGateSessionHopLe())) {
    return {
      ok: false,
      lyDo: 'Cần mở cổng triển khai (mật khẩu quản trị hệ thống).',
    };
  }

  const phien = await docPhienDangNhap();
  const email = String(phien?.email || '').trim().toLowerCase();
  if (!email || !laTaiKhoanAdminToiCao(email)) {
    return {
      ok: false,
      lyDo: 'Cần đăng nhập admin tối cao (htthinh28@gmail.com) với mật khẩu đã cấp.',
      canDangNhap: true,
    };
  }

  if (!(await coPhienDangNhapHopLe())) {
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
    actor: email,
  };
};

export const coQuyenQuanTriTaiKhoanBv = coQuyenCauHinhHeThong;

export const coQuyenQuanTriDaTenant = async () => {
  await docPhienDangNhap();
  const quyen = await coQuyenCauHinhHeThong();
  if (!quyen.ok) return quyen;
  const session = await docTenantSession();
  if (!session?.org_id) {
    return { ok: false, lyDo: 'Chưa chọn bệnh viện.' };
  }
  return { ...quyen, orgId: session.org_id };
};

export const laAdminHeThongDangNhap = async () => {
  const session = await docTenantSession();
  const phien = await docPhienDangNhap();
  return laLuongAdminHeThong(session?.lock_source)
    && laTaiKhoanAdminToiCao(phien?.email);
};

export default {
  coQuyenCauHinhHeThong,
  coQuyenQuanTriTaiKhoanBv,
  coQuyenQuanTriDaTenant,
  laAdminHeThongDangNhap,
};
