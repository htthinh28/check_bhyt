/**
 * Bootstrap chuyên đề thực chiến theo tenant.
 */
import { resolveOrgId } from './tenant_context';
import { tenantGetItem, tenantSetItem } from './tenant_storage';

const MANIFEST_KEY = 'CDSS_CHUYEN_DE_THUC_CHIEN_MANIFEST_V1';
const FLAG_IMPORTED = 'CHUYEN_DE_PACK_IMPORTED_V1';

/** Manifest chuyên đề per-tenant — bổ sung khi có gói triển khai. */
const loadManifest = () => null;

export const damBaoChuyenDeTenant = async () => {
  const orgId = resolveOrgId();
  if (!orgId) return { ok: false, skipped: 'no_org' };
  const importedFlag = await tenantGetItem(FLAG_IMPORTED);
  const existing = await tenantGetItem(MANIFEST_KEY);
  if (importedFlag === '1' && existing) {
    return { ok: true, skipped: true, orgId };
  }
  const manifest = loadManifest();
  if (!manifest) return { ok: true, skipped: 'no_manifest', orgId };
  if (!existing) {
    await tenantSetItem(MANIFEST_KEY, JSON.stringify(manifest));
  }
  await tenantSetItem(FLAG_IMPORTED, '1');
  return { ok: true, orgId, imported: !existing };
};

export const docChuyenDeManifestTenant = async () => {
  const raw = await tenantGetItem(MANIFEST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default { damBaoChuyenDeTenant, docChuyenDeManifestTenant };
