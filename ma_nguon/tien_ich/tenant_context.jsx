/**
 * Ngữ cảnh tenant — Mô hình đa BV (runtime chọn org) hoặc single-build (EXPO_PUBLIC_ORG_ID).
 * Đồng bộ từ Vercel checkbhytdev.
 */
import { Platform } from 'react-native';
import { timTenantTheoOrgId } from './tenant_registry';

const ORG_PREFIX = 'CDSS_ORG_';

const LEGACY_ORG_MAP = Object.freeze({
  phuongchau: 'phuongchau_soc_trang',
});

const GLOBAL_STORAGE_KEYS = new Set([
  'CDSS_TENANT_SESSION',
  'CDSS_REGISTRY_CACHE',
  'CDSS_DEPLOY_GATE_SESSION',
  'CDSS_DEPLOY_GATE_CONFIG',
  'CDSS_CUSTOM_TENANT_REGISTRY',
  'CDSS_APP_META',
  'CDSS_TRUY_CAP_CHE_DO',
  'CDSS_CHU_DE_HIEN_TAI',
  'CDSS_CHE_DO_SANG_TOI',
  'CDSS_NAV_STATE_V1',
  'TAB_DANG_MO',
  'TAB_CHUYEN_MON_DANG_MO',
  'BYT_7603_ACTIVE_TAB',
]);

let _lockedOrgId = null;
let _lockedDescriptor = null;
let _cachedProfile = null;

const getEnv = (key) => {
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return String(process.env[key]).trim();
    }
  } catch {
    /* ignore */
  }
  return '';
};

const getExpoExtra = () => {
  try {
    // eslint-disable-next-line global-require
    const Constants = require('expo-constants').default;
    return Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
  } catch {
    return {};
  }
};

const chuanHoaOrgId = (raw) => {
  const token = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!token) return '';
  return LEGACY_ORG_MAP[token] || token;
};

export const laCheDoBuildDonTenant = () => {
  const extra = getExpoExtra();
  const buildMode = String(extra?.buildMode || getEnv('EXPO_PUBLIC_BUILD_MODE') || '')
    .trim()
    .toLowerCase();
  if (chuanHoaOrgId(getEnv('EXPO_PUBLIC_ORG_ID') || getEnv('EXPO_PUBLIC_FIREBASE_ORG_ID'))) {
    return true;
  }
  if (buildMode === 'multi') return false;
  if (buildMode === 'single') return true;
  const fromExtra = chuanHoaOrgId(extra?.orgId || extra?.firebase?.orgId);
  if (fromExtra) return true;
  return false;
};

export const resolveOrgIdFromBuild = () => {
  const fromEnv = chuanHoaOrgId(
    getEnv('EXPO_PUBLIC_ORG_ID') || getEnv('EXPO_PUBLIC_FIREBASE_ORG_ID'),
  );
  if (fromEnv) return fromEnv;
  const extra = getExpoExtra();
  const fromExtra = chuanHoaOrgId(extra?.orgId || extra?.firebase?.orgId);
  return fromExtra || 'phuongchau_soc_trang';
};

export const applyLockedOrgId = (orgId, descriptor = null) => {
  const token = chuanHoaOrgId(orgId);
  if (!token) return;
  _lockedOrgId = token;
  _lockedDescriptor = descriptor || timTenantTheoOrgId(token);
  _cachedProfile = null;
};

export const clearLockedOrgId = () => {
  _lockedOrgId = null;
  _lockedDescriptor = null;
  _cachedProfile = null;
};

export const resolveOrgId = () => {
  if (_lockedOrgId) return _lockedOrgId;
  if (laCheDoBuildDonTenant()) {
    _lockedOrgId = resolveOrgIdFromBuild();
    return _lockedOrgId;
  }
  return null;
};

export const coTenantDaKhoa = () => Boolean(resolveOrgId());

export const currentTenantDescriptor = () => {
  const orgId = resolveOrgId();
  if (!orgId) return null;
  if (_lockedDescriptor?.orgId === orgId) return _lockedDescriptor;
  return timTenantTheoOrgId(orgId);
};

export const layMaCskcbHienHanh = () => {
  const desc = currentTenantDescriptor();
  if (desc?.maCskcb) return desc.maCskcb;
  const profile = layTenantProfile();
  const fromProfile = profile?.maCskcb || profile?.thongTinCoSo?.MA_CSKCB;
  return fromProfile ? String(fromProfile).trim().toUpperCase() : '';
};

export const layCatalogPolicy = () => {
  const desc = currentTenantDescriptor();
  return desc?.catalogPolicy || 'legacy_bundle';
};

export const resolveFirebaseOrgId = () => {
  const profile = layTenantProfile();
  return String(profile?.firebaseOrgId || profile?.orgId || resolveOrgId() || '').trim();
};

export const layTenantProfile = () => {
  if (_cachedProfile) return _cachedProfile;
  const extra = getExpoExtra();
  const orgId = resolveOrgId();
  if (orgId && extra?.tenant && chuanHoaOrgId(extra.tenant?.orgId) === orgId) {
    _cachedProfile = extra.tenant;
    return _cachedProfile;
  }
  if (orgId && extra?.tenants && typeof extra.tenants === 'object') {
    const hit = extra.tenants[orgId];
    if (hit) {
      _cachedProfile = hit;
      return _cachedProfile;
    }
  }
  _cachedProfile = extra?.tenant || null;
  return _cachedProfile;
};

export const layThongTinCoSoTenant = () => {
  const profile = layTenantProfile();
  if (profile?.thongTinCoSo && typeof profile.thongTinCoSo === 'object') {
    return profile.thongTinCoSo;
  }
  const desc = currentTenantDescriptor();
  if (desc?.maCskcb) {
    return { MA_CSKCB: desc.maCskcb, TEN_CSKCB: desc.displayName };
  }
  return null;
};

export const isGlobalStorageKey = (baseKey = '') => {
  const key = String(baseKey || '').trim();
  if (!key || GLOBAL_STORAGE_KEYS.has(key)) return true;
  return key.startsWith(ORG_PREFIX);
};

export const prefixStorageKeyForOrg = (orgId, baseKey = '') => {
  const key = String(baseKey || '').trim();
  if (!key || isGlobalStorageKey(key)) return key;
  const token = chuanHoaOrgId(orgId);
  if (!token) throw new Error('ORG_ID_INVALID');
  const prefix = `${ORG_PREFIX}${token}_`;
  return key.startsWith(prefix) ? key : `${prefix}${key}`;
};

export const prefixStorageKey = (baseKey = '') => {
  const key = String(baseKey || '').trim();
  if (!key || isGlobalStorageKey(key)) return key;
  const orgId = resolveOrgId();
  if (!orgId) {
    throw new Error('TENANT_NOT_LOCKED: không thể truy cập storage khi chưa chọn bệnh viện');
  }
  return prefixStorageKeyForOrg(orgId, key);
};

export const voiNgungCanTenant = async (orgId, fn) => {
  const prevOrg = _lockedOrgId;
  const prevDesc = _lockedDescriptor;
  const prevProfile = _cachedProfile;
  try {
    applyLockedOrgId(orgId);
    return await fn();
  } finally {
    _cachedProfile = prevProfile;
    if (prevOrg) applyLockedOrgId(prevOrg, prevDesc);
    else clearLockedOrgId();
  }
};

export const unprefixStorageKey = (prefixedKey = '') => {
  const key = String(prefixedKey || '').trim();
  const orgId = resolveOrgId();
  if (!orgId) return key;
  const prefix = `${ORG_PREFIX}${orgId}_`;
  return key.startsWith(prefix) ? key.slice(prefix.length) : key;
};

export const resolveIdbName = (baseName = '') => {
  const base = String(baseName || '').trim();
  const orgId = resolveOrgId();
  return orgId ? `${base}__${orgId}` : base;
};

export const tenantMigrationFlagKey = () => `${ORG_PREFIX}${resolveOrgId()}_MIGRATION_V1_DONE`;

export const TENANT_KEY_PREFIXES = Object.freeze([
  'CDSS_DATA_',
  'CDSS_COLS_',
  'COLS_',
  'DANH_MUC_',
  'BYT_7603_',
  'DVKT_',
  'DATA_XML',
  'KHO_XML_',
  'SESSION_DOC_XML_',
  'CDSS_ON_OFF_',
  'CDSS_GHI_DE_',
  'CDSS_AN_KHOI_',
  'CDSS_BACKUP_',
  'CDSS_RULE_SEED_',
  'CDSS_CLEANUP_',
  'CDSS_KHO_',
  'CDSS_HS_',
  'CDSS_LSBN_',
  'CDSS_LSGDMLK_',
  'CDSS_LICH_SU_',
  'CDSS_TRI_THUC_',
  'CDSS_AUDIT_',
  'CDSS_DATA_ICD_',
  'CDSS_THU_VIEN_',
  'CATALOG_',
  'FIREBASE_DVKT_',
  'RBAC_',
  'ACL_USER_',
  'USER_ACCOUNT',
  'USER_ROLE',
  'DANH_SACH_TAI_KHOAN',
  'HE_THONG_NHAT_KY_HOAT_DONG',
  'THONG_TIN_CO_SO',
  '@DM_BYT_',
]);

export const matchesTenantKeyPrefix = (key = '') => {
  const k = String(key || '');
  return TENANT_KEY_PREFIXES.some((p) => k === p || k.startsWith(p));
};

export const laMoiTruongWeb = () => Platform.OS === 'web' || (typeof window !== 'undefined' && !!window?.localStorage);

export const _resetTenantContextCache = () => {
  clearLockedOrgId();
};

export default {
  laCheDoBuildDonTenant,
  resolveOrgIdFromBuild,
  applyLockedOrgId,
  clearLockedOrgId,
  resolveOrgId,
  coTenantDaKhoa,
  currentTenantDescriptor,
  layMaCskcbHienHanh,
  layCatalogPolicy,
  resolveFirebaseOrgId,
  layTenantProfile,
  layThongTinCoSoTenant,
  prefixStorageKey,
  prefixStorageKeyForOrg,
  voiNgungCanTenant,
  unprefixStorageKey,
  resolveIdbName,
  isGlobalStorageKey,
  tenantMigrationFlagKey,
  matchesTenantKeyPrefix,
  TENANT_KEY_PREFIXES,
};
