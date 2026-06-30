/**
 * Registry tenant tùy chỉnh (thêm/xóa BV trên thiết bị) — đồng bộ từ Vercel.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  capNhatCacheTenantTuyChinh,
  chuanHoaTenantRow,
} from './tenant_registry';

export const KHOA_CUSTOM_REGISTRY = 'CDSS_CUSTOM_TENANT_REGISTRY';

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

const chuanHoaOrgToken = (raw) => String(raw || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\u0111/g, 'd')
  .replace(/[^a-z0-9_]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

export const docDanhSachTenantTuyChinh = async () => {
  const raw = await docRaw(KHOA_CUSTOM_REGISTRY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.tenants) ? parsed.tenants : (Array.isArray(parsed) ? parsed : []);
    return list
      .map((row) => chuanHoaTenantRow({ ...row, source: 'custom' }))
      .filter(Boolean);
  } catch {
    return [];
  }
};

export const luuDanhSachTenantTuyChinh = async (rows = []) => {
  const normalized = (Array.isArray(rows) ? rows : [])
    .map((row) => chuanHoaTenantRow({ ...row, source: 'custom' }))
    .filter(Boolean);
  const payload = {
    version: '1.0.0',
    updated_at: new Date().toISOString(),
    tenants: normalized.map((row) => ({
      org_id: row.orgId,
      display_name: row.displayName,
      ma_cskcb: row.maCskcb,
      catalog_policy: row.catalogPolicy,
      active: row.active !== false,
      branding: row.branding || {},
    })),
  };
  await ghiRaw(KHOA_CUSTOM_REGISTRY, JSON.stringify(payload));
  capNhatCacheTenantTuyChinh(normalized);
  return normalized;
};

export const themTenantTuyChinh = async ({
  orgId,
  displayName,
  maCskcb,
  catalogPolicy = 'legacy_bundle',
}) => {
  const token = chuanHoaOrgToken(orgId || displayName);
  if (!token || token.length < 2) {
    throw new Error('Mã org_id không hợp lệ (tối thiểu 2 ký tự a-z, 0-9, _).');
  }
  const ten = String(displayName || token).trim();
  if (!ten) throw new Error('Tên bệnh viện không được trống.');
  const hienTai = await docDanhSachTenantTuyChinh();
  if (hienTai.some((row) => row.orgId === token)) {
    throw new Error(`Bệnh viện "${token}" đã tồn tại.`);
  }
  const row = chuanHoaTenantRow({
    org_id: token,
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
  await luuDanhSachTenantTuyChinh([...hienTai, row]);
  return row;
};

const timIndexCustom = (list, orgId) => {
  const token = chuanHoaOrgToken(orgId);
  return list.findIndex((row) => row.orgId === token || chuanHoaOrgToken(row.orgId) === token);
};

export const capNhatTenantTuyChinh = async (orgId, patch = {}) => {
  const token = chuanHoaOrgToken(orgId);
  const list = await docDanhSachTenantTuyChinh();
  const idx = timIndexCustom(list, token);
  if (idx < 0) throw new Error('Chỉ sửa được bệnh viện tùy chỉnh (do admin thêm).');
  const cur = list[idx];
  const ten = String(patch.displayName ?? patch.ten ?? cur.displayName).trim();
  if (!ten) throw new Error('Tên bệnh viện không được trống.');
  const next = chuanHoaTenantRow({
    ...cur,
    org_id: token,
    display_name: ten,
    ma_cskcb: String(patch.maCskcb ?? patch.ma_cskcb ?? cur.maCskcb ?? '').trim().toUpperCase(),
    catalog_policy: patch.catalogPolicy ?? patch.catalog_policy ?? cur.catalogPolicy,
    active: patch.active !== undefined ? patch.active !== false : cur.active !== false,
    branding: patch.branding ? { ...cur.branding, ...patch.branding } : cur.branding,
    source: 'custom',
  });
  const updated = [...list];
  updated[idx] = next;
  await luuDanhSachTenantTuyChinh(updated);
  return next;
};

export const xoaTenantTuyChinh = async (orgId) => {
  const token = chuanHoaOrgToken(orgId);
  const list = await docDanhSachTenantTuyChinh();
  const idx = timIndexCustom(list, token);
  if (idx < 0) throw new Error('Chỉ xóa được bệnh viện do bạn thêm (tùy chỉnh).');
  await luuDanhSachTenantTuyChinh(list.filter((_, i) => i !== idx));
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
