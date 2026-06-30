/**
 * Phiên tenant đã chọn (CDSS_TENANT_SESSION).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyLockedOrgId, clearLockedOrgId } from './tenant_context';
import { timTenantTheoOrgId } from './tenant_registry';
import { xoaCheDoTruyCap } from './che_do_truy_cap';
import { xoaPhienDangNhap } from './phien_dang_nhap';

export const KHOA_TENANT_SESSION = 'CDSS_TENANT_SESSION';

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

export const docTenantSession = async () => {
  const raw = await docRaw(KHOA_TENANT_SESSION);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.org_id) return null;
    if (parsed.expires_at) {
      const expires = Date.parse(parsed.expires_at);
      if (!Number.isNaN(expires) && Date.now() > expires) {
        await xoaRaw(KHOA_TENANT_SESSION);
        clearLockedOrgId();
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
};

export const coTenantSessionHopLe = async () => {
  const session = await docTenantSession();
  return Boolean(session?.org_id);
};

export const khoaTenantSession = async (orgId, lockSource = 'user_select') => {
  const tenant = timTenantTheoOrgId(orgId);
  if (!tenant) throw new Error(`TENANT_NOT_FOUND: ${orgId}`);
  if (!tenant.active) throw new Error(`TENANT_INACTIVE: ${orgId}`);
  const current = await docTenantSession();
  if (current?.org_id && current.org_id !== tenant.orgId) {
    throw new Error(`SESSION_ORG_MISMATCH: đang khóa ${current.org_id}, không thể đổi sang ${tenant.orgId} trong phiên`);
  }
  const payload = {
    org_id: tenant.orgId,
    display_name: tenant.displayName,
    ma_cskcb: tenant.maCskcb,
    catalog_policy: tenant.catalogPolicy,
    locked_at: new Date().toISOString(),
    lock_source: lockSource,
    expires_at: null,
  };
  await ghiRaw(KHOA_TENANT_SESSION, JSON.stringify(payload));
  applyLockedOrgId(tenant.orgId, tenant);
  return payload;
};

export const moKhoaTenantSession = async () => {
  await xoaPhienDangNhap().catch(() => {});
  await xoaCheDoTruyCap().catch(() => {});
  await xoaRaw(KHOA_TENANT_SESSION);
  clearLockedOrgId();
};

export default {
  KHOA_TENANT_SESSION,
  docTenantSession,
  coTenantSessionHopLe,
  khoaTenantSession,
  moKhoaTenantSession,
};
