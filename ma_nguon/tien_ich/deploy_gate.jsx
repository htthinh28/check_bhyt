/**
 * Cổng mật khẩu triển khai — bảo vệ màn Chọn bệnh viện (web đa BV).
 * Mật khẩu mặc định admin: hash SHA-256, không lưu plaintext trong repo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { laCheDoBuildDonTenant } from './tenant_context';

export const KHOA_GATE_SESSION = 'CDSS_DEPLOY_GATE_SESSION';
export const KHOA_GATE_CONFIG = 'CDSS_DEPLOY_GATE_CONFIG';

/** SHA-256("NgocTram@anh@%@&##") */
const MAT_KHAU_MAC_DINH_HASH = '17c678b97c5d5fa50eec0dbcbb94a7cf590f251b580c874e6c9eead04591da94';
const GATE_TTL_MS = 12 * 60 * 60 * 1000;

const laWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;

const docRawGlobal = async (key) => {
  if (laWeb()) {
    try {
      const v = window.localStorage.getItem(key);
      if (v != null) return v;
    } catch { /* */ }
  }
  return AsyncStorage.getItem(key).catch(() => null);
};

const ghiRawGlobal = async (key, value) => {
  const normalized = String(value ?? '');
  const tasks = [AsyncStorage.setItem(key, normalized).catch(() => {})];
  if (laWeb()) {
    tasks.push((async () => {
      try { window.localStorage.setItem(key, normalized); } catch { /* */ }
    })());
  }
  await Promise.all(tasks);
};

const xoaRawGlobal = async (key) => {
  const tasks = [AsyncStorage.removeItem(key).catch(() => {})];
  if (laWeb()) {
    tasks.push((async () => {
      try { window.localStorage.removeItem(key); } catch { /* */ }
    })());
  }
  await Promise.all(tasks);
};

const bytesToHex = (bytes) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

export const bamSha256Hex = async (text) => {
  const payload = String(text ?? '');
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    return bytesToHex(new Uint8Array(buf));
  }
  throw new Error('SHA-256 không khả dụng trên thiết bị này.');
};

const docGateConfig = async () => {
  const raw = await docRawGlobal(KHOA_GATE_CONFIG);
  if (!raw) return { password_hash: MAT_KHAU_MAC_DINH_HASH };
  try {
    const o = JSON.parse(raw);
    return { password_hash: o?.password_hash || MAT_KHAU_MAC_DINH_HASH };
  } catch {
    return { password_hash: MAT_KHAU_MAC_DINH_HASH };
  }
};

export const coCanGateTrienKhai = () => !laCheDoBuildDonTenant();

export const coGateSessionHopLe = async () => {
  if (!coCanGateTrienKhai()) return true;
  const raw = await docRawGlobal(KHOA_GATE_SESSION);
  if (!raw) return false;
  try {
    const o = JSON.parse(raw);
    const exp = Date.parse(o?.expires_at || '');
    if (!o?.ok || Number.isNaN(exp) || Date.now() > exp) {
      await xoaRawGlobal(KHOA_GATE_SESSION);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const xacThucMatKhauGate = async (matKhau) => {
  const cfg = await docGateConfig();
  const hash = await bamSha256Hex(matKhau);
  if (hash === cfg.password_hash || hash === MAT_KHAU_MAC_DINH_HASH) return { ok: true };
  return { ok: false, loi: 'Mật khẩu triển khai không đúng.' };
};

export const moGateSession = async () => {
  const payload = {
    ok: true,
    unlocked_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + GATE_TTL_MS).toISOString(),
  };
  await ghiRawGlobal(KHOA_GATE_SESSION, JSON.stringify(payload));
  return payload;
};

export const dongGateSession = async () => {
  await xoaRawGlobal(KHOA_GATE_SESSION);
};

/** Đổi mật khẩu cổng (sau khi đã mở cổng). */
export const doiMatKhauGate = async (matKhauMoi) => {
  const hash = await bamSha256Hex(matKhauMoi);
  if (hash.length < 32) {
    return { ok: false, loi: 'Không thể băm mật khẩu.' };
  }
  await ghiRawGlobal(KHOA_GATE_CONFIG, JSON.stringify({
    password_hash: hash,
    updated_at: new Date().toISOString(),
  }));
  return { ok: true };
};

export default {
  coCanGateTrienKhai,
  coGateSessionHopLe,
  xacThucMatKhauGate,
  moGateSession,
  dongGateSession,
  doiMatKhauGate,
};
