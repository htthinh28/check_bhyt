import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KHOA_NHAT_KY = 'HE_THONG_NHAT_KY_HOAT_DONG';
const KHOA_TAI_KHOAN = 'DANH_SACH_TAI_KHOAN';
const SO_BAN_GHI_TOI_DA = 2000;

const laMoiTruongWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;
const docStorage = async (key) => {
  if (laMoiTruongWeb()) {
    try {
      const localValue = window.localStorage.getItem(key);
      if (localValue !== null && localValue !== undefined) return localValue;
    } catch {
      // fallback AsyncStorage
    }
  }
  return AsyncStorage.getItem(key);
};
const ghiStorage = async (key, value) => {
  const normalizedValue = String(value || '');
  const tasks = [AsyncStorage.setItem(key, normalizedValue).catch(() => {})];

  if (laMoiTruongWeb()) {
    tasks.push((async () => {
      try {
        window.localStorage.setItem(key, normalizedValue);
      } catch {
        // ignore localStorage write error
      }
    })());
  }

  await Promise.all(tasks);
};

const nowISO = () => new Date().toISOString();

const taoId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const anToanArray = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

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
  const raw = await docStorage(KHOA_TAI_KHOAN);
  return chuanHoaDanhSachTaiKhoan(anToanArray(raw));
};

export const luuDanhSachTaiKhoan = async (danhSach, nguoiCapNhat = 'SYSTEM') => {
  const dsChuan = chuanHoaDanhSachTaiKhoan(danhSach, nguoiCapNhat);
  await ghiStorage(KHOA_TAI_KHOAN, JSON.stringify(dsChuan));
  const dsDaLuu = chuanHoaDanhSachTaiKhoan(anToanArray(await docStorage(KHOA_TAI_KHOAN)), nguoiCapNhat);
  const thieuTaiKhoan = dsChuan.some((item) => !dsDaLuu.some((saved) => saved.email === item.email));
  if (thieuTaiKhoan) {
    throw new Error('Không thể xác nhận dữ liệu tài khoản sau khi lưu vào storage.');
  }
  return dsDaLuu;
};

export const capNhatTaiKhoanTheoEmail = async (email, patch = {}, nguoiCapNhat = 'SYSTEM') => {
  const ds = await docDanhSachTaiKhoan();
  const emailChuan = String(email || '').trim().toLowerCase();
  const idx = ds.findIndex((item) => item.email === emailChuan);
  if (idx < 0) return { ok: false, danhSach: ds };

  ds[idx] = chuanHoaTaiKhoan({ ...ds[idx], ...patch, email: emailChuan }, nguoiCapNhat);
  await ghiStorage(KHOA_TAI_KHOAN, JSON.stringify(ds));
  return { ok: true, danhSach: ds, taiKhoan: ds[idx] };
};

export const ghiNhatKyHeThong = async ({ hanhDong, doiTuong = '', chiTiet = '', taiKhoan = '', vaiTro = 'USER' }) => {
  try {
    const raw = await docStorage(KHOA_NHAT_KY);
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
    await ghiStorage(KHOA_NHAT_KY, JSON.stringify(moiNhat));
    return banGhi;
  } catch (e) {
    return null;
  }
};

export const layNhatKyHeThong = async ({ taiKhoan = '', tuKhoa = '', gioiHan = 200 } = {}) => {
  const raw = await docStorage(KHOA_NHAT_KY);
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
