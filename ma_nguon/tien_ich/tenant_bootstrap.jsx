/**
 * Khởi động tenant: single-build hoặc multi-tenant (chọn BV).
 */
import { damBaoCatalogTenant } from './tenant_catalog_bootstrap';
import { damBaoChuyenDeTenant } from './tenant_chuyen_de_bootstrap';
import { damBaoOnOffTenant } from './tenant_on_off_bootstrap';
import { damBaoMigrationTenant } from './tenant_migration';
import {
  applyLockedOrgId,
  laCheDoBuildDonTenant,
  resolveOrgIdFromBuild,
} from './tenant_context';
import { coTenantSessionHopLe, docTenantSession, khoaTenantSession } from './tenant_session';

let _bootstrapPromise = null;

export const damBaoKhoiDongTenant = async () => {
  if (_bootstrapPromise) return _bootstrapPromise;
  _bootstrapPromise = (async () => {
    if (laCheDoBuildDonTenant()) {
      const orgId = resolveOrgIdFromBuild();
      await khoaTenantSession(orgId, 'env_var');
      const migration = await damBaoMigrationTenant();
      const [onOff, chuyenDe, catalog] = await Promise.all([
        damBaoOnOffTenant(),
        damBaoChuyenDeTenant(),
        damBaoCatalogTenant(),
      ]);
      return {
        ok: true,
        mode: 'single',
        orgId,
        needSelectTenant: false,
        migration,
        onOff,
        chuyenDe,
        catalog,
      };
    }
    const session = await docTenantSession();
    if (session?.org_id) {
      applyLockedOrgId(session.org_id);
      const migration = await damBaoMigrationTenant();
      const [onOff, chuyenDe, catalog] = await Promise.all([
        damBaoOnOffTenant(),
        damBaoChuyenDeTenant(),
        damBaoCatalogTenant(),
      ]);
      return {
        ok: true,
        mode: 'multi',
        orgId: session.org_id,
        needSelectTenant: false,
        migration,
        onOff,
        chuyenDe,
        catalog,
      };
    }
    return {
      ok: true,
      mode: 'multi',
      orgId: null,
      needSelectTenant: true,
      migration: null,
    };
  })().catch((err) => {
    _bootstrapPromise = null;
    return {
      ok: false,
      error: String(err?.message || err),
      needSelectTenant: !laCheDoBuildDonTenant(),
    };
  });
  return _bootstrapPromise;
};

export const coCanChonBenhVien = async () => (
  !laCheDoBuildDonTenant() && !(await coTenantSessionHopLe())
);

export const _resetTenantBootstrap = () => {
  _bootstrapPromise = null;
};

export default { damBaoKhoiDongTenant, coCanChonBenhVien };
