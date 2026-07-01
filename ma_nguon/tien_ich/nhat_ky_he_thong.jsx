import {
  anToanArrayTuChuoi as anToanArray,
  docChuoiHeThong,
  ghiChuoiHeThong as ghiStorageGlobal,
  gopHaiMangTaiKhoan,
  KHOA_NHAT_KY,
  KHOA_TAI_KHOAN,
  voiKhoaGhiHeThong as voiKhoaGhiTaiKhoan,
} from './luu_tru_he_thong';
import { laCheDoBuildDonTenant, prefixStorageKey, resolveOrgId } from './tenant_context';
import { tenantGetItem, tenantRemoveItem } from './tenant_storage';

export { gopHaiMangTaiKhoan };

const SO_BAN_GHI_TOI_DA = 2000;

/** Các key lưu theo org khi đã chọn/khóa tenant. */
const KHOA_THEO_TENANT = new Set([KHOA_TAI_KHOAN, KHOA_NHAT_KY]);

const dungLuuTruTenant = (key) => Boolean(resolveOrgId()) && KHOA_THEO_TENANT.has(key);

/**
 * Đọc chuỗi hệ thống — global (IndexedDB) khi chưa có tenant;
 * IndexedDB key CDSS_ORG_{org}_* khi đã khóa BV (migrate từ localStorage tenant cũ).
 */
export const docChuoiHeThongCoTenant = async (key) => {
  if (!dungLuuTruTenant(key)) {
    return docChuoiHeThong(key);
  }
  const khoaDayDu = prefixStorageKey(key);
  try {
    const tuIdb = await docChuoiHeThong(khoaDayDu);
    if (tuIdb != null && tuIdb !== '') return tuIdb;
  } catch (e) {
    console.warn('[nhat_ky] đọc tenant IDB:', khoaDayDu, e?.message || e);
  }
  try {
    const legacyTenant = await tenantGetItem(key);
    if (legacyTenant != null && legacyTenant !== '') {
      await ghiStorageGlobal(khoaDayDu, legacyTenant);
      await tenantRemoveItem(key).catch(() => {});
      return legacyTenant;
    }
  } catch (e) {
    console.warn('[nhat_ky] migrate tenant localStorage:', key, e?.message || e);
  }
  if (laCheDoBuildDonTenant()) {
    const legacy = await docChuoiHeThong(key);
    if (legacy) {
      await ghiStorageGlobal(khoaDayDu, legacy);
      return legacy;
    }
  }
  return null;
};

/** Ghi chuỗi hệ thống — đồng bộ với docChuoiHeThongCoTenant. */
export const ghiChuoiHeThongCoTenant = async (key, value) => {
  const normalized = String(value ?? '');
  if (dungLuuTruTenant(key)) {
    const khoaDayDu = prefixStorageKey(key);
    await ghiStorageGlobal(khoaDayDu, normalized);
    await tenantRemoveItem(key).catch(() => {});
    return;
  }
  await ghiStorageGlobal(key, normalized);
};

const nowISO = () => new Date().toISOString();

const taoId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const chuanHoaTaiKhoan = (taiKhoan, nguoiCapNhat = 'SYSTEM') => {
  const email = String(taiKhoan?.email || '').trim().toLowerCase();
  const hoTen = String(taiKhoan?.hoTen || taiKhoan?.ten || '').trim();
  const khoa = String(taiKhoan?.khoa || '').trim();
  const phong = String(taiKhoan?.phong || '').trim();
  const chucDanh = String(taiKhoan?.chucDanh || '').trim();
  const soDienThoai = String(taiKhoan?.soDienThoai || taiKhoan?.soDienThoaiLienLac || '').trim();
  return {
    ...taiKhoan,
    email,
    ten: hoTen,
    hoTen,
    khoa,
    phong,
    chucDanh,
    soDienThoai,
    vaiTro: taiKhoan?.vaiTro === 'ADMIN' ? 'ADMIN' : 'USER',
    trangThai: taiKhoan?.trangThai === 'KHOA' ? 'KHOA' : 'HOAT_DONG',
    taoLuc: taiKhoan?.taoLuc || nowISO(),
    taoBoi: taiKhoan?.taoBoi || nguoiCapNhat,
    capNhatLuc: nowISO(),
    capNhatBoi: nguoiCapNhat,
    lanDangNhapCuoi: taiKhoan?.lanDangNhapCuoi || null,
    buocDoiMatKhau: taiKhoan?.buocDoiMatKhau === true,
    matKhau: String(taiKhoan?.matKhau ?? ''),
  };
};

export const chuanHoaDanhSachTaiKhoan = (danhSach, nguoiCapNhat = 'SYSTEM') => {
  const seen = new Set();
  return (Array.isArray(danhSach) ? danhSach : [])
    .map((item) => chuanHoaTaiKhoan(item, nguoiCapNhat))
    .filter((item) => {
      if (!item.email || seen.has(item.email)) return false;
      seen.add(item.email);
      return true;
    });
};

export const docDanhSachTaiKhoan = async () => {
  const raw = await docChuoiHeThongCoTenant(KHOA_TAI_KHOAN);
  return chuanHoaDanhSachTaiKhoan(anToanArray(raw));
};

const xacNhanVaTraDanhSachDaLuu = async (dsChuan) => {
  await ghiChuoiHeThongCoTenant(KHOA_TAI_KHOAN, JSON.stringify(dsChuan));
  const dsDaLuu = await docDanhSachTaiKhoan();
  const thieuTaiKhoan = dsChuan.some((item) => !dsDaLuu.some((saved) => saved.email === item.email));
  if (thieuTaiKhoan) {
    throw new Error('Không thể xác nhận dữ liệu tài khoản sau khi lưu vào storage.');
  }
  return dsDaLuu;
};

export const luuDanhSachTaiKhoan = async (danhSach, nguoiCapNhat = 'SYSTEM') => voiKhoaGhiTaiKhoan(async () => {
  const dsChuan = chuanHoaDanhSachTaiKhoan(danhSach, nguoiCapNhat);
  return xacNhanVaTraDanhSachDaLuu(dsChuan);
});

export const themTaiKhoanMoi = async (banGhiMoi, nguoiCapNhat = 'ADMIN') => voiKhoaGhiTaiKhoan(async () => {
  const hienTai = await docDanhSachTaiKhoan();
  const email = String(banGhiMoi?.email || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Email tài khoản không hợp lệ.');
  }
  if (hienTai.some((u) => u.email === email)) {
    throw new Error(`Email ${email} đã tồn tại.`);
  }
  const dsChuan = chuanHoaDanhSachTaiKhoan([...hienTai, banGhiMoi], nguoiCapNhat);
  return xacNhanVaTraDanhSachDaLuu(dsChuan);
});

export const capNhatTaiKhoanTheoEmail = async (email, patch = {}, nguoiCapNhat = 'SYSTEM') => voiKhoaGhiTaiKhoan(async () => {
  const ds = await docDanhSachTaiKhoan();
  const emailChuan = String(email || '').trim().toLowerCase();
  const idx = ds.findIndex((item) => item.email === emailChuan);
  if (idx < 0) return { ok: false, danhSach: ds };

  ds[idx] = chuanHoaTaiKhoan({ ...ds[idx], ...patch, email: emailChuan }, nguoiCapNhat);
  const dsDaLuu = await xacNhanVaTraDanhSachDaLuu(ds);
  return { ok: true, danhSach: dsDaLuu, taiKhoan: dsDaLuu.find((item) => item.email === emailChuan) || ds[idx] };
});

export const ghiNhatKyHeThong = async ({ hanhDong, doiTuong = '', chiTiet = '', taiKhoan = '', vaiTro = 'USER' }) => {
  try {
    const raw = await docChuoiHeThongCoTenant(KHOA_NHAT_KY);
    const danhSach = anToanArray(raw);
    const banGhi = {
      id: taoId(),
      thoiGian: nowISO(),
      taiKhoan: String(taiKhoan || '').trim().toLowerCase(),
      vaiTro: String(vaiTro || 'USER').toUpperCase(),
      hanhDong: String(hanhDong || 'KHAC').trim(),
      doiTuong: String(doiTuong || '').trim(),
      chiTiet: String(chiTiet || '').trim(),
    };

    const moiNhat = [banGhi, ...danhSach].slice(0, SO_BAN_GHI_TOI_DA);
    await ghiChuoiHeThongCoTenant(KHOA_NHAT_KY, JSON.stringify(moiNhat));
    return banGhi;
  } catch {
    return null;
  }
};

export const layNhatKyHeThong = async ({ taiKhoan = '', tuKhoa = '', gioiHan = 200 } = {}) => {
  const raw = await docChuoiHeThongCoTenant(KHOA_NHAT_KY);
  const danhSach = anToanArray(raw);

  const tk = String(taiKhoan || '').trim().toLowerCase();
  const q = String(tuKhoa || '').trim().toLowerCase();

  const ketQua = danhSach.filter((item) => {
    if (tk && item.taiKhoan !== tk) return false;
    if (!q) return true;
    const chuoi = `${item.hanhDong} ${item.doiTuong} ${item.chiTiet} ${item.taiKhoan}`.toLowerCase();
    return chuoi.includes(q);
  });

  const max = Number.isFinite(gioiHan) ? Math.max(1, Math.floor(gioiHan)) : 200;
  return ketQua.slice(0, max);
};
