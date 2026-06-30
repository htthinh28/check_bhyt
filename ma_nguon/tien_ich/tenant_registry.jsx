/**
 * Registry tenant bundle (config/tenants/registry.json) + cache tùy chỉnh.
 */
import registryBundle from '../../config/tenants/registry.json';

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
    source: row.source === 'custom' ? 'custom' : 'bundle',
  };
};

let _cacheMerged = null;
let _customCache = [];

export const capNhatCacheTenantTuyChinh = (rows = []) => {
  _customCache = Array.isArray(rows) ? rows : [];
  _cacheMerged = null;
};

export const layRegistryRaw = () => registryBundle;

export const layDanhSachTenantBundle = () => (
  (Array.isArray(registryBundle?.tenants) ? registryBundle.tenants : [])
    .map((row) => chuanHoaTenantRow({ ...row, source: 'bundle' }))
    .filter(Boolean)
    .filter((row) => row.active)
);

export const layDanhSachTenant = () => {
  if (_cacheMerged) return _cacheMerged;
  const map = new Map();
  layDanhSachTenantBundle().forEach((row) => map.set(row.orgId, row));
  _customCache.forEach((row) => map.set(row.orgId, row));
  _cacheMerged = Array.from(map.values()).sort((a, b) => {
    if (a.source !== b.source) return a.source === 'custom' ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, 'vi');
  });
  return _cacheMerged;
};

export const timTenantTheoOrgId = (orgId) => {
  const token = String(orgId || '').trim().toLowerCase();
  return (token && layDanhSachTenant().find((row) => row.orgId === token)) || null;
};

export const lamMoiDanhSachTenant = () => {
  _cacheMerged = null;
  return layDanhSachTenant();
};

export const _resetTenantRegistryCache = () => {
  _cacheMerged = null;
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
