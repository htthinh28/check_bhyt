/**
 * Đăng nhập & khôi phục mật khẩu admin tối cao.
 * Tài khoản htthinh28@gmail.com / Tramanh@2010## được phép vào mọi bệnh viện thành viên.
 */
import {
  capNhatTaiKhoanTheoEmail,
  docDanhSachTaiKhoan,
  ghiNhatKyHeThong,
  luuDanhSachTaiKhoan,
} from './nhat_ky_he_thong';
import { luuPhienDangNhap } from './phien_dang_nhap';
import { ADMIN_EMAIL_TOI_CAO, laTaiKhoanAdminToiCao } from './tai_khoan_admin_he_thong';
import { coGateSessionHopLe } from './deploy_gate';
import { luuRBAC, taiRBAC } from './rbac_engine';

export const MAT_KHAU_ADMIN_MAC_DINH = 'Tramanh@2010##';

const taoBanGhiAdminMacDinh = () => ({
  email: ADMIN_EMAIL_TOI_CAO,
  ten: 'ADMIN HTTHINH',
  hoTen: 'ADMIN HTTHINH',
  khoa: 'Phòng Công nghệ thông tin',
  phong: 'Khối điều hành',
  chucDanh: 'Quản trị hệ thống',
  soDienThoai: '',
  matKhau: MAT_KHAU_ADMIN_MAC_DINH,
  vaiTro: 'ADMIN',
  trangThai: 'HOAT_DONG',
  buocDoiMatKhau: false,
});

const BINDING_ADMIN_TOAN_QUYEN = Object.freeze({
  roleIds: ['ROLE_ADMIN'],
  groupIds: [],
  overrides: { allow: [], deny: [] },
  dataScope: 'ALL',
});

/** Đồng bộ binding ROLE_ADMIN cho admin tối cao trên tenant hiện tại. */
const damBaoBindingAdminToiCao = async () => {
  try {
    const cfg = await taiRBAC();
    const email = ADMIN_EMAIL_TOI_CAO;
    const hienTai = cfg.userBindings?.[email];
    const daCoAdmin = Array.isArray(hienTai?.roleIds) && hienTai.roleIds.includes('ROLE_ADMIN');
    if (daCoAdmin && hienTai?.dataScope === 'ALL') return;
    await luuRBAC({
      ...cfg,
      userBindings: {
        ...(cfg.userBindings || {}),
        [email]: { ...BINDING_ADMIN_TOAN_QUYEN },
      },
    });
  } catch {
    /* không chặn đăng nhập nếu RBAC lỗi */
  }
};

/**
 * Đảm bảo tài khoản admin tối cao tồn tại trên storage tenant/global hiện tại:
 * mật khẩu mặc định, HOAT_DONG, ROLE_ADMIN — dùng khi đăng nhập mọi BV thành viên.
 */
export const dongBoAdminToiCaoTrenTenantHienTai = async () => {
  let ds = await docDanhSachTaiKhoan();
  const idx = ds.findIndex((u) => u.email === ADMIN_EMAIL_TOI_CAO);
  if (idx < 0) {
    ds = await luuDanhSachTaiKhoan([...ds, taoBanGhiAdminMacDinh()], 'SYSTEM');
  } else {
    const hienTai = ds[idx];
    const canCapNhat = (
      hienTai.trangThai === 'KHOA'
      || hienTai.vaiTro !== 'ADMIN'
      || hienTai.buocDoiMatKhau
      || hienTai.matKhau !== MAT_KHAU_ADMIN_MAC_DINH
    );
    if (canCapNhat) {
      await capNhatTaiKhoanTheoEmail(ADMIN_EMAIL_TOI_CAO, {
        matKhau: MAT_KHAU_ADMIN_MAC_DINH,
        trangThai: 'HOAT_DONG',
        buocDoiMatKhau: false,
        vaiTro: 'ADMIN',
      }, 'SYSTEM');
    }
  }
  await damBaoBindingAdminToiCao();
  ds = await docDanhSachTaiKhoan();
  return ds.find((u) => u.email === ADMIN_EMAIL_TOI_CAO) || taoBanGhiAdminMacDinh();
};

/** Đảm bảo tài khoản admin tối cao tồn tại trong storage hiện tại. */
export const damBaoTaiKhoanAdminToiCao = async () => dongBoAdminToiCaoTrenTenantHienTai();

/** Khôi phục mật khẩu admin tối cao về mặc định. */
export const khoiPhucMatKhauAdminToiCao = async (actor = 'SYSTEM') => {
  await damBaoTaiKhoanAdminToiCao();
  const ketQua = await capNhatTaiKhoanTheoEmail(ADMIN_EMAIL_TOI_CAO, {
    matKhau: MAT_KHAU_ADMIN_MAC_DINH,
    trangThai: 'HOAT_DONG',
    buocDoiMatKhau: false,
    vaiTro: 'ADMIN',
  }, actor);
  await damBaoBindingAdminToiCao();
  await ghiNhatKyHeThong({
    hanhDong: 'KHOI_PHUC_MAT_KHAU_ADMIN',
    doiTuong: ADMIN_EMAIL_TOI_CAO,
    chiTiet: 'Khoi phuc mat khau mac dinh admin toi cao',
    taiKhoan: actor,
    vaiTro: 'ADMIN',
  }).catch(() => {});
  return { ok: true, matKhau: MAT_KHAU_ADMIN_MAC_DINH, taiKhoan: ketQua.taiKhoan };
};

export const matKhauAdminToiCaoHopLe = (user, matKhau) => {
  const mk = String(matKhau || '');
  if (!mk) return false;
  if (user?.matKhau === mk) return true;
  if (mk === MAT_KHAU_ADMIN_MAC_DINH) return true;
  return false;
};

/**
 * Xác thực và tạo phiên admin tối cao (module cấu hình).
 * Yêu cầu cổng triển khai đang mở.
 */
export const dangNhapAdminToiCao = async (email, matKhau) => {
  const gateMo = await coGateSessionHopLe();
  if (!gateMo) {
    return { ok: false, loi: 'Cổng triển khai chưa mở hoặc đã hết hạn.' };
  }

  const em = String(email || '').trim().toLowerCase();
  if (!laTaiKhoanAdminToiCao(em)) {
    return { ok: false, loi: 'Chỉ admin tối cao htthinh28@gmail.com được phép.' };
  }

  const mk = String(matKhau || '').trim();
  if (!mk) {
    return { ok: false, loi: 'Vui lòng nhập mật khẩu.' };
  }

  let user = await dongBoAdminToiCaoTrenTenantHienTai();

  if (!user) {
    return { ok: false, loi: 'Tài khoản admin không tồn tại.' };
  }

  if (user.trangThai === 'KHOA') {
    return { ok: false, loi: 'Tài khoản đang bị khóa.' };
  }

  if (!matKhauAdminToiCaoHopLe(user, mk)) {
    await ghiNhatKyHeThong({
      hanhDong: 'DANG_NHAP_THAT_BAI',
      doiTuong: 'HE_THONG',
      chiTiet: 'Sai mat khau admin toi cao',
      taiKhoan: em,
      vaiTro: 'ADMIN',
    }).catch(() => {});
    return { ok: false, loi: 'Mật khẩu quản trị viên không chính xác.' };
  }

  if (user.matKhau !== mk && mk === MAT_KHAU_ADMIN_MAC_DINH) {
    await capNhatTaiKhoanTheoEmail(em, {
      matKhau: MAT_KHAU_ADMIN_MAC_DINH,
      buocDoiMatKhau: false,
      trangThai: 'HOAT_DONG',
    }, 'SYSTEM');
    user = { ...user, matKhau: MAT_KHAU_ADMIN_MAC_DINH };
  }

  await luuPhienDangNhap(em, 'ADMIN');
  await ghiNhatKyHeThong({
    hanhDong: 'DANG_NHAP_THANH_CONG',
    doiTuong: 'HE_THONG',
    chiTiet: 'Dang nhap module cau hinh he thong',
    taiKhoan: em,
    vaiTro: 'ADMIN',
  }).catch(() => {});

  return { ok: true, email: em, vaiTro: 'ADMIN' };
};

export default {
  MAT_KHAU_ADMIN_MAC_DINH,
  damBaoTaiKhoanAdminToiCao,
  dongBoAdminToiCaoTrenTenantHienTai,
  khoiPhucMatKhauAdminToiCao,
  matKhauAdminToiCaoHopLe,
  dangNhapAdminToiCao,
};
