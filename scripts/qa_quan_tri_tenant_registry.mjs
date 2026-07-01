/**
 * QA nhanh: slug tenant + tìm/sửa/xóa registry tùy chỉnh.
 */
const chuanHoaOrgIdSlug = (raw) => String(raw || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9_]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

const timChiSoTenant = (danhSach, orgId) => {
  const token = chuanHoaOrgIdSlug(orgId);
  return danhSach.findIndex((t) => t.orgId === token || chuanHoaOrgIdSlug(t.orgId) === token);
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

assert(chuanHoaOrgIdSlug('001') === '001', 'slug 001');
assert(chuanHoaOrgIdSlug('BV ABC') === 'bv_abc', 'slug tên BV');

const ds = [{ orgId: '001', displayName: 'Test' }, { orgId: 'phuongchau_can_tho' }];
assert(timChiSoTenant(ds, '001') === 0, 'tìm 001');
assert(timChiSoTenant(ds, 'PHUONGCHAU_CAN_THO') === 1, 'tìm bundle id');

const sauXoa = ds.filter((_, i) => i !== timChiSoTenant(ds, '001'));
assert(sauXoa.length === 1 && sauXoa[0].orgId === 'phuongchau_can_tho', 'xóa 001');

console.log('[qa_quan_tri_tenant_registry] PASS');
