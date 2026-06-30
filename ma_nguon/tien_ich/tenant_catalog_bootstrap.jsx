/**
 * Bootstrap catalog tenant pack (khi catalog_policy = tenant_pack_only).
 */
import { layCatalogPolicy, resolveOrgId } from './tenant_context';
import {
  docPhienBanModule,
  ghiModuleCols,
  ghiModuleRows,
  ghiPhienBanModule,
} from './tenant_module_storage';
import { tenantGetItem, tenantSetItem } from './tenant_storage';

const FLAG_IMPORTED = 'CATALOG_PACK_IMPORTED_V1';

/** Tenant pack JSON — bổ sung khi triển khai tenant_pack_only. */
const loadPack = () => null;

export const damBaoCatalogTenant = async () => {
  const orgId = resolveOrgId();
  if (!orgId) return { ok: false, skipped: 'no_org' };
  if (layCatalogPolicy() !== 'tenant_pack_only') {
    return { ok: true, skipped: 'legacy_bundle', orgId };
  }
  if ((await tenantGetItem(FLAG_IMPORTED)) === '1') {
    return { ok: true, skipped: true, orgId };
  }
  const pack = loadPack();
  const catalogs = pack?.catalogs || {};
  const keys = Object.keys(catalogs);
  if (!keys.length) return { ok: true, skipped: 'empty_pack', orgId };
  let imported = 0;
  for (const entry of Object.values(catalogs)) {
    const moduleCode = entry?.module;
    const rows = entry?.rows;
    if (!moduleCode || !Array.isArray(rows) || !rows.length) continue;
    const version = entry?.version || String(rows.length);
    if ((await docPhienBanModule(moduleCode)) !== version) {
      await ghiModuleRows(moduleCode, rows);
      if (Array.isArray(entry?.cols) && entry.cols.length) {
        await ghiModuleCols(moduleCode, entry.cols);
      }
      await ghiPhienBanModule(moduleCode, version);
      imported += 1;
    }
  }
  if (imported > 0 || keys.length > 0) {
    await tenantSetItem(FLAG_IMPORTED, '1');
  }
  return { ok: true, orgId, imported };
};

export default { damBaoCatalogTenant };
