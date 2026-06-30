/**
 * Chế độ truy cập: thành viên BV vs admin hệ thống.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHE_DO_THANH_VIEN = 'member';
export const CHE_DO_ADMIN_HE_THONG = 'admin';
export const LOCK_THANH_VIEN = 'member_select';
export const LOCK_ADMIN_HE_THONG = 'admin_select';
export const KHOA_CHE_DO_TRUY_CAP = 'CDSS_TRUY_CAP_CHE_DO';

const laWebCoLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const docRaw = async (key) => {
  if (laWebCoLocalStorage()) {
    try {
      const v = window.localStorage.getItem(key);
      if (v != null) return v;
    } catch {
      /* ignore */
    }
  }
  return AsyncStorage.getItem(key).catch(() => null);
};

const ghiRaw = async (key, value) => {
  const normalized = String(value ?? '');
  const tasks = [AsyncStorage.setItem(key, normalized).catch(() => {})];
  if (laWebCoLocalStorage()) {
    tasks.push((async () => {
      try {
        window.localStorage.setItem(key, normalized);
      } catch {
        /* ignore */
      }
    })());
  }
  await Promise.all(tasks);
};

const xoaRaw = async (key) => {
  const tasks = [AsyncStorage.removeItem(key).catch(() => {})];
  if (laWebCoLocalStorage()) {
    tasks.push((async () => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    })());
  }
  await Promise.all(tasks);
};

export const laCheDoHopLe = (mode) => mode === CHE_DO_THANH_VIEN || mode === CHE_DO_ADMIN_HE_THONG;

export const docCheDoTruyCap = async () => {
  const raw = await docRaw(KHOA_CHE_DO_TRUY_CAP);
  return laCheDoHopLe(raw) ? raw : null;
};

export const luuCheDoTruyCap = async (mode) => {
  if (!laCheDoHopLe(mode)) throw new Error(`CHE_DO_KHONG_HOP_LE: ${mode}`);
  await ghiRaw(KHOA_CHE_DO_TRUY_CAP, mode);
  return mode;
};

export const xoaCheDoTruyCap = async () => {
  await xoaRaw(KHOA_CHE_DO_TRUY_CAP);
};

export const lockSourceTuCheDo = (mode) => (
  mode === CHE_DO_ADMIN_HE_THONG ? LOCK_ADMIN_HE_THONG : LOCK_THANH_VIEN
);

export const laLuongAdminHeThong = (lockSource) => lockSource === LOCK_ADMIN_HE_THONG;
export const laLuongThanhVien = (lockSource) => lockSource === LOCK_THANH_VIEN;

export default {
  CHE_DO_THANH_VIEN,
  CHE_DO_ADMIN_HE_THONG,
  docCheDoTruyCap,
  luuCheDoTruyCap,
  xoaCheDoTruyCap,
  lockSourceTuCheDo,
};
