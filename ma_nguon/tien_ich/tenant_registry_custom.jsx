/**
 * Sổ đăng ký tenant tùy chỉnh — thêm BV tại màn Chọn bệnh viện (không giới hạn 3 BV).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { capNhatCacheTenantTuyChinh, chuanHoaTenantRow } from './tenant_registry';

export const KHOA_CUSTOM_REGISTRY = 'CDSS_CUSTOM_TENANT_REGISTRY';

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

const chuanHoaOrgIdSlug = (raw) => String(raw || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9_]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

export const docDanhSachTenantTuyChinh = async () => {
  const raw = await docRawGlobal(KHOA_CUSTOM_REGISTRY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.tenants) ? parsed.tenants : (Array.isArray(parsed) ? parsed : []);
    return list.map((row) => chuanHoaTenantRow({ ...row, source: 'custom' })).filter(Boolean);
  } catch {
    return [];
  }
};

export const luuDanhSachTenantTuyChinh = async (tenants = []) => {
  const normalized = (Array.isArray(tenants) ? tenants : [])
    .map((row) => chuanHoaTenantRow({ ...row, source: 'custom' }))
    .filter(Boolean);
  const payload = {
    version: '1.0.0',
    updated_at: new Date().toISOString(),
    tenants: normalized.map((t) => ({
      org_id: t.orgId,
      display_name: t.displayName,
      ma_cskcb: t.maCskcb,
      catalog_policy: t.catalogPolicy,
      active: t.active !== false,
      branding: t.branding || {},
    })),
  };
  await ghiRawGlobal(KHOA_CUSTOM_REGISTRY, JSON.stringify(payload));
  capNhatCacheTenantTuyChinh(normalized);
  return normalized;
};

export const themTenantTuyChinh = async ({
  orgId,
  displayName,
  maCskcb,
  catalogPolicy = 'legacy_bundle',
}) => {
  const slug = chuanHoaOrgIdSlug(orgId || displayName);
  if (!slug || slug.length < 2) {
    throw new Error('Mã org_id không hợp lệ (tối thiểu 2 ký tự a-z, 0-9, _).');
  }
  const ten = String(displayName || slug).trim();
  if (!ten) throw new Error('Tên bệnh viện không được trống.');

  const hienTai = await docDanhSachTenantTuyChinh();
  if (hienTai.some((t) => t.orgId === slug)) {
    throw new Error(`Bệnh viện "${slug}" đã tồn tại.`);
  }

  const moi = chuanHoaTenantRow({
    org_id: slug,
    display_name: ten,
    ma_cskcb: String(maCskcb || '').trim().toUpperCase(),
    catalog_policy: catalogPolicy,
    source: 'custom',
    active: true,
    branding: {
      app_name: `CDSS BHYT — ${ten}`,
      primary_color: '#C2185B',
    },
  });
  const next = [...hienTai, moi];
  await luuDanhSachTenantTuyChinh(next);
  return moi;
};

const timChiSoTenant = (danhSach, orgId) => {
  const token = chuanHoaOrgIdSlug(orgId);
  return danhSach.findIndex((t) => t.orgId === token || chuanHoaOrgIdSlug(t.orgId) === token);
};

export const capNhatTenantTuyChinh = async (orgId, patch = {}) => {
  const token = chuanHoaOrgIdSlug(orgId);
  const hienTai = await docDanhSachTenantTuyChinh();
  const idx = timChiSoTenant(hienTai, token);
  if (idx < 0) {
    throw new Error('Chỉ sửa được bệnh viện tùy chỉnh (do admin thêm).');
  }
  const cu = hienTai[idx];
  const displayName = String(patch.displayName ?? patch.ten ?? cu.displayName).trim();
  if (!displayName) throw new Error('Tên bệnh viện không được trống.');
  const moi = chuanHoaTenantRow({
    ...cu,
    org_id: token,
    display_name: displayName,
    ma_cskcb: String(patch.maCskcb ?? patch.ma_cskcb ?? cu.maCskcb ?? '').trim().toUpperCase(),
    catalog_policy: patch.catalogPolicy ?? patch.catalog_policy ?? cu.catalogPolicy,
    active: patch.active !== undefined ? patch.active !== false : cu.active !== false,
    branding: patch.branding ? { ...cu.branding, ...patch.branding } : cu.branding,
    source: 'custom',
  });
  const next = [...hienTai];
  next[idx] = moi;
  await luuDanhSachTenantTuyChinh(next);
  return moi;
};

export const xoaTenantTuyChinh = async (orgId) => {
  const token = chuanHoaOrgIdSlug(orgId);
  const hienTai = await docDanhSachTenantTuyChinh();
  const idx = timChiSoTenant(hienTai, token);
  if (idx < 0) {
    throw new Error('Chỉ xóa được bệnh viện do bạn thêm (tùy chỉnh).');
  }
  const next = hienTai.filter((_, i) => i !== idx);
  await luuDanhSachTenantTuyChinh(next);
  return true;
};

export const damBaoTaiRegistryTuyChinh = async () => {
  const list = await docDanhSachTenantTuyChinh();
  capNhatCacheTenantTuyChinh(list);
  return list;
};

export default {
  docDanhSachTenantTuyChinh,
  luuDanhSachTenantTuyChinh,
  themTenantTuyChinh,
  capNhatTenantTuyChinh,
  xoaTenantTuyChinh,
  damBaoTaiRegistryTuyChinh,
};
