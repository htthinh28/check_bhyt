/**
 * Cổng triển khai (deploy gate) — bảo vệ module cấu hình đa BV.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { laCheDoBuildDonTenant } from './tenant_context';

export const KHOA_GATE_SESSION = 'CDSS_DEPLOY_GATE_SESSION';
export const KHOA_GATE_CONFIG = 'CDSS_DEPLOY_GATE_CONFIG';

/** SHA-256 của mật khẩu triển khai mặc định (đồng bộ Vercel). */
const DEFAULT_PASSWORD_HASH = '17c678b97c5d5fa50eec0dbcbb94a7cf590f251b580c874e6c9eead04591da94';

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

export const bamSha256Hex = async (text) => {
  const input = String(text ?? '');
  if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  throw new Error('SHA-256 không khả dụng trên thiết bị này.');
};

const docGateConfig = async () => {
  const raw = await docRaw(KHOA_GATE_CONFIG);
  if (!raw) return { password_hash: DEFAULT_PASSWORD_HASH };
  try {
    const parsed = JSON.parse(raw);
    return { password_hash: parsed?.password_hash || DEFAULT_PASSWORD_HASH };
  } catch {
    return { password_hash: DEFAULT_PASSWORD_HASH };
  }
};

export const coCanGateTrienKhai = () => !laCheDoBuildDonTenant();

export const coGateSessionHopLe = async () => {
  if (!coCanGateTrienKhai()) return true;
  const raw = await docRaw(KHOA_GATE_SESSION);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    const expires = Date.parse(parsed?.expires_at || '');
    if (!parsed?.ok || Number.isNaN(expires) || Date.now() > expires) {
      await xoaRaw(KHOA_GATE_SESSION);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const xacThucMatKhauGate = async (password) => {
  const cfg = await docGateConfig();
  const hash = await bamSha256Hex(password);
  if (hash === cfg.password_hash || hash === DEFAULT_PASSWORD_HASH) {
    return { ok: true };
  }
  return { ok: false, loi: 'Mật khẩu triển khai không đúng.' };
};

export const moGateSession = async () => {
  const payload = {
    ok: true,
    unlocked_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  };
  await ghiRaw(KHOA_GATE_SESSION, JSON.stringify(payload));
  return payload;
};

export const dongGateSession = async () => {
  await xoaRaw(KHOA_GATE_SESSION);
};

export const doiMatKhauGate = async (password) => {
  const hash = await bamSha256Hex(password);
  if (hash.length < 32) return { ok: false, loi: 'Không thể băm mật khẩu.' };
  await ghiRaw(KHOA_GATE_CONFIG, JSON.stringify({
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
