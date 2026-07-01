/**
 * Phân luồng truy cập: nhân viên BV thành viên vs quản trị hệ thống.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const CHE_DO_THANH_VIEN = 'member';
export const CHE_DO_ADMIN_HE_THONG = 'admin';

export const LOCK_THANH_VIEN = 'member_select';
export const LOCK_ADMIN_HE_THONG = 'admin_select';

export const KHOA_CHE_DO_TRUY_CAP = 'CDSS_TRUY_CAP_CHE_DO';

const laWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;

const docRaw = async (key) => {
  if (laWeb()) {
    try {
      const v = window.localStorage.getItem(key);
      if (v != null) return v;
    } catch { /* */ }
  }
  return AsyncStorage.getItem(key).catch(() => null);
};

const ghiRaw = async (key, value) => {
  const normalized = String(value ?? '');
  const tasks = [AsyncStorage.setItem(key, normalized).catch(() => {})];
  if (laWeb()) {
    tasks.push((async () => {
      try { window.localStorage.setItem(key, normalized); } catch { /* */ }
    })());
  }
  await Promise.all(tasks);
};

const xoaRaw = async (key) => {
  const tasks = [AsyncStorage.removeItem(key).catch(() => {})];
  if (laWeb()) {
    tasks.push((async () => {
      try { window.localStorage.removeItem(key); } catch { /* */ }
    })());
  }
  await Promise.all(tasks);
};

export const laCheDoHopLe = (cheDo) => (
  cheDo === CHE_DO_THANH_VIEN || cheDo === CHE_DO_ADMIN_HE_THONG
);

export const docCheDoTruyCap = async () => {
  const raw = await docRaw(KHOA_CHE_DO_TRUY_CAP);
  if (!laCheDoHopLe(raw)) return null;
  return raw;
};

export const luuCheDoTruyCap = async (cheDo) => {
  if (!laCheDoHopLe(cheDo)) {
    throw new Error(`CHE_DO_KHONG_HOP_LE: ${cheDo}`);
  }
  await ghiRaw(KHOA_CHE_DO_TRUY_CAP, cheDo);
  return cheDo;
};

export const xoaCheDoTruyCap = async () => {
  await xoaRaw(KHOA_CHE_DO_TRUY_CAP);
};

export const lockSourceTuCheDo = (cheDo) => (
  cheDo === CHE_DO_ADMIN_HE_THONG ? LOCK_ADMIN_HE_THONG : LOCK_THANH_VIEN
);

export const laLuongAdminHeThong = (lockSource) => lockSource === LOCK_ADMIN_HE_THONG;

export const laLuongThanhVien = (lockSource) => lockSource === LOCK_THANH_VIEN;

export default {
  CHE_DO_THANH_VIEN,
  CHE_DO_ADMIN_HE_THONG,
  LOCK_THANH_VIEN,
  LOCK_ADMIN_HE_THONG,
  docCheDoTruyCap,
  luuCheDoTruyCap,
  xoaCheDoTruyCap,
  lockSourceTuCheDo,
  laLuongAdminHeThong,
  laLuongThanhVien,
};
