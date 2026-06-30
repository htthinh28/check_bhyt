/**
 * Bootstrap ON/OFF policy theo tenant pack.
 */
import { chuanHoaKhoaMaLuatOnOff } from './quy_tac_on_off_noi_bo';
import { layTenantProfile, resolveOrgId } from './tenant_context';
import { ON_OFF_KEYS } from './tenant_module_storage';
import { tenantGetItem, tenantSetItem } from './tenant_storage';

const FLAG_IMPORTED = 'ON_OFF_PACK_IMPORTED_V1';


const chuanHoaTrangThai = (raw, fallback = 'OFF') => {
  const token = String(raw || '').trim().toUpperCase();
  if (token === 'ON' || token === '1' || token === 'TRUE') return 'ON';
  if (token === 'OFF' || token === '0' || token === 'FALSE') return 'OFF';
  return fallback;
};

const mapPolicy = (policy = {}) => {
  const out = {};
  const overrides = policy?.overrides && typeof policy.overrides === 'object' ? policy.overrides : {};
  Object.entries(overrides).forEach(([key, value]) => {
    const ma = chuanHoaKhoaMaLuatOnOff(key);
    if (ma) out[ma] = chuanHoaTrangThai(value, 'OFF');
  });
  if (Array.isArray(policy?.items)) {
    policy.items.forEach((item) => {
      const ma = chuanHoaKhoaMaLuatOnOff(item?.MA_LUAT || item?.ma_luat);
      if (ma) out[ma] = chuanHoaTrangThai(item?.TRANG_THAI || item?.trang_thai, 'OFF');
    });
  }
  return out;
};

/** ON/OFF pack per-tenant — bổ sung khi có gói triển khai. */
const loadPolicy = () => null;

export const damBaoOnOffTenant = async () => {
  const orgId = resolveOrgId();
  if (!orgId) return { ok: false, skipped: 'no_org' };
  const importedFlag = await tenantGetItem(FLAG_IMPORTED);
  const existing = await tenantGetItem(ON_OFF_KEYS.QUY_TAC_NOI_BO);
  if (importedFlag === '1' && existing) {
    return { ok: true, skipped: true, orgId };
  }
  const profile = layTenantProfile();
  const policy = loadPolicy() || profile?.onOffPolicy || null;
  if (!policy) return { ok: true, skipped: 'no_policy', orgId };
  if (!existing) {
    const mapped = mapPolicy(policy);
    const payload = {
      version: policy.version || 1,
      updated_at: policy.updated_at || new Date().toISOISOString(),
      source: 'tenant_pack',
      items: Object.entries(mapped).map(([MA_LUAT, TRANG_THAI]) => ({ MA_LUAT, TRANG_THAI })),
    };
    await tenantSetItem(ON_OFF_KEYS.QUY_TAC_NOI_BO, JSON.stringify(payload));
  }
  await tenantSetItem(FLAG_IMPORTED, '1');
  return { ok: true, orgId, imported: !existing };
};

export default { damBaoOnOffTenant };
