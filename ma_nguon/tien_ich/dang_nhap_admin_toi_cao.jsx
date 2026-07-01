/**
 * Đăng nhập & khôi phục mật khẩu admin tối cao — không phụ thuộc tenant.
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

/** Đảm bảo tài khoản admin tối cao tồn tại trong storage global. */
export const damBaoTaiKhoanAdminToiCao = async () => {
  let ds = await docDanhSachTaiKhoan();
  const co = ds.some((u) => u.email === ADMIN_EMAIL_TOI_CAO);
  if (!co) {
    ds = await luuDanhSachTaiKhoan([...ds, taoBanGhiAdminMacDinh()], 'SYSTEM');
  }
  return ds.find((u) => u.email === ADMIN_EMAIL_TOI_CAO) || taoBanGhiAdminMacDinh();
};

/** Khôi phục mật khẩu admin tối cao về mặc định. */
export const khoiPhucMatKhauAdminToiCao = async (actor = 'SYSTEM') => {
  await damBaoTaiKhoanAdminToiCao();
  const ketQua = await capNhatTaiKhoanTheoEmail(ADMIN_EMAIL_TOI_CAO, {
    matKhau: MAT_KHAU_ADMIN_MAC_DINH,
    trangThai: 'HOAT_DONG',
    buocDoiMatKhau: false,
    vaiTro: 'ADMIN',
  }, actor);
  await ghiNhatKyHeThong({
    hanhDong: 'KHOI_PHUC_MAT_KHAU_ADMIN',
    doiTuong: ADMIN_EMAIL_TOI_CAO,
    chiTiet: 'Khoi phuc mat khau mac dinh admin toi cao',
    taiKhoan: actor,
    vaiTro: 'ADMIN',
  }).catch(() => {});
  return { ok: true, matKhau: MAT_KHAU_ADMIN_MAC_DINH, taiKhoan: ketQua.taiKhoan };
};

const matKhauHopLe = (user, matKhau) => {
  const mk = String(matKhau || '');
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

  if (!matKhauHopLe(null, matKhau)) {
    const mk = String(matKhau || '').trim();
    if (!mk) {
      return { ok: false, loi: 'Vui lòng nhập mật khẩu.' };
    }
  }

  await damBaoTaiKhoanAdminToiCao();
  const ds = await docDanhSachTaiKhoan();
  let user = ds.find((u) => u.email === em);

  if (!user) {
    return { ok: false, loi: 'Tài khoản admin không tồn tại.' };
  }

  if (user.trangThai === 'KHOA') {
    return { ok: false, loi: 'Tài khoản đang bị khóa.' };
  }

  if (!matKhauHopLe(user, matKhau)) {
    await ghiNhatKyHeThong({
      hanhDong: 'DANG_NHAP_THAT_BAI',
      doiTuong: 'HE_THONG',
      chiTiet: 'Sai mat khau admin toi cao',
      taiKhoan: em,
      vaiTro: 'ADMIN',
    }).catch(() => {});
    return { ok: false, loi: 'Mật khẩu quản trị viên không chính xác.' };
  }

  if (user.matKhau !== String(matKhau) && String(matKhau) === MAT_KHAU_ADMIN_MAC_DINH) {
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
  khoiPhucMatKhauAdminToiCao,
  dangNhapAdminToiCao,
};
