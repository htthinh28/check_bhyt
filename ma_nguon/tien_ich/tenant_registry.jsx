/**
 * Sổ đăng ký tenant — SPEC v2.0 Phần C.
 * Nguồn bundle: tenant_registry_data.json (đồng bộ từ config/tenants/registry.json).
 */
import REGISTRY_RAW from './tenant_registry_data.json';

export const chuanHoaTenantRow = (row = {}) => {
  const orgId = String(row.org_id || row.orgId || '').trim().toLowerCase();
  if (!orgId) return null;
  return {
    orgId,
    displayName: String(row.display_name || row.tenHienThi || row.tenDayDu || orgId).trim(),
    maCskcb: String(row.ma_cskcb || row.maCskcb || '').trim().toUpperCase(),
    catalogPolicy: row.catalog_policy === 'tenant_pack_only' ? 'tenant_pack_only' : 'legacy_bundle',
    firebaseProjectId: row.firebase_project_id || row.firebaseProjectId || '',
    hisProfileRef: row.his_profile_ref || row.hisProfileRef || '',
    branding: row.branding && typeof row.branding === 'object' ? row.branding : {},
    active: row.active !== false,
    source: row.source === 'custom' ? 'custom' : (row.source === 'bundle' ? 'bundle' : 'bundle'),
  };
};

const chuanHoaTenant = chuanHoaTenantRow;

let _cache = null;
let _customTenants = [];

export const capNhatCacheTenantTuyChinh = (list = []) => {
  _customTenants = Array.isArray(list) ? list : [];
  _cache = null;
};

export const layRegistryRaw = () => REGISTRY_RAW;

export const layDanhSachTenantBundle = () => {
  const list = Array.isArray(REGISTRY_RAW?.tenants) ? REGISTRY_RAW.tenants : [];
  return list.map((row) => chuanHoaTenantRow({ ...row, source: 'bundle' })).filter(Boolean).filter((t) => t.active);
};

export const layDanhSachTenant = () => {
  if (_cache) return _cache;
  const byId = new Map();
  layDanhSachTenantBundle().forEach((t) => byId.set(t.orgId, t));
  _customTenants.forEach((t) => byId.set(t.orgId, t));
  _cache = Array.from(byId.values()).sort((a, b) => {
    if (a.source !== b.source) return a.source === 'custom' ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, 'vi');
  });
  return _cache;
};

export const timTenantTheoOrgId = (orgId) => {
  const token = String(orgId || '').trim().toLowerCase();
  if (!token) return null;
  return layDanhSachTenant().find((t) => t.orgId === token) || null;
};

/** Buộc đọc lại registry (sau sửa/xóa BV tùy chỉnh). */
export const lamMoiDanhSachTenant = () => {
  _cache = null;
  return layDanhSachTenant();
};

export const _resetTenantRegistryCache = () => {
  _cache = null;
};

export default {
  layRegistryRaw,
  layDanhSachTenantBundle,
  layDanhSachTenant,
  lamMoiDanhSachTenant,
  timTenantTheoOrgId,
  chuanHoaTenantRow,
  capNhatCacheTenantTuyChinh,
};
