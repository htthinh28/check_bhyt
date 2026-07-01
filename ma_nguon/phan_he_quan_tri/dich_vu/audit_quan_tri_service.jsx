/**
 * Audit trail cho module quản trị — ghi log cấp platform + per-tenant.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { KHOA_NHAT_KY } from '../../tien_ich/luu_tru_he_thong';
import { ghiNhatKyHeThong, layNhatKyHeThong } from '../../tien_ich/nhat_ky_he_thong';
import { voiNgungCanTenant } from '../../tien_ich/tenant_context';
import { tenantGetItem, tenantSetItem } from '../../tien_ich/tenant_storage';

export const KHOA_AUDIT_QUAN_TRI = 'CDSS_QUAN_TRI_AUDIT_V1';
const SO_BAN_GHI_TOI_DA = 3000;

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

const taoId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const anToanArray = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Ghi audit quản trị (platform + mirror vào nhật ký tenant nếu có orgId).
 */
export const ghiAuditQuanTri = async ({
  hanhDong,
  orgId = '',
  doiTuong = '',
  chiTiet = '',
  taiKhoan = '',
  vaiTro = 'ADMIN',
  heThong = '',
}) => {
  const banGhi = {
    id: taoId(),
    thoiGian: new Date().toISOString(),
    hanhDong: String(hanhDong || 'KHAC').trim(),
    orgId: String(orgId || '').trim(),
    doiTuong: String(doiTuong || '').trim(),
    chiTiet: String(chiTiet || '').trim(),
    taiKhoan: String(taiKhoan || '').trim().toLowerCase(),
    vaiTro: String(vaiTro || 'ADMIN').toUpperCase(),
    heThong: String(heThong || '').trim(),
  };

  try {
    const raw = await docRawGlobal(KHOA_AUDIT_QUAN_TRI);
    const danhSach = anToanArray(raw);
    await ghiRawGlobal(KHOA_AUDIT_QUAN_TRI, JSON.stringify([banGhi, ...danhSach].slice(0, SO_BAN_GHI_TOI_DA)));
  } catch { /* */ }

  const chiTietTenant = [banGhi.chiTiet, orgId ? `org=${orgId}` : '', heThong ? `he_thong=${heThong}` : '']
    .filter(Boolean)
    .join(' · ');

  await ghiNhatKyHeThong({
    hanhDong: banGhi.hanhDong,
    doiTuong: banGhi.doiTuong || 'QUAN_TRI_BV',
    chiTiet: chiTietTenant,
    taiKhoan: banGhi.taiKhoan,
    vaiTro: banGhi.vaiTro,
  }).catch(() => {});

  if (orgId) {
    try {
      await voiNgungCanTenant(orgId, async () => {
        const rawTenant = await tenantGetItem(KHOA_NHAT_KY);
        const ds = anToanArray(rawTenant);
        await tenantSetItem(KHOA_NHAT_KY, JSON.stringify([{
          id: banGhi.id,
          thoiGian: banGhi.thoiGian,
          taiKhoan: banGhi.taiKhoan,
          vaiTro: banGhi.vaiTro,
          hanhDong: banGhi.hanhDong,
          doiTuong: banGhi.doiTuong,
          chiTiet: chiTietTenant,
        }, ...ds].slice(0, SO_BAN_GHI_TOI_DA)));
      });
    } catch { /* */ }
  }

  return banGhi;
};

export const layAuditQuanTri = async ({
  orgId = '',
  taiKhoan = '',
  tuKhoa = '',
  heThong = '',
  gioiHan = 200,
} = {}) => {
  const raw = await docRawGlobal(KHOA_AUDIT_QUAN_TRI);
  const danhSach = anToanArray(raw);
  const org = String(orgId || '').trim();
  const tk = String(taiKhoan || '').trim().toLowerCase();
  const q = String(tuKhoa || '').trim().toLowerCase();
  const ht = String(heThong || '').trim();

  const loc = danhSach.filter((item) => {
    if (org && item.orgId !== org) return false;
    if (tk && item.taiKhoan !== tk) return false;
    if (ht && item.heThong !== ht) return false;
    if (!q) return true;
    const chuoi = `${item.hanhDong} ${item.doiTuong} ${item.chiTiet} ${item.taiKhoan} ${item.orgId}`.toLowerCase();
    return chuoi.includes(q);
  });

  const max = Number.isFinite(gioiHan) ? Math.max(1, Math.floor(gioiHan)) : 200;
  return loc.slice(0, max);
};

/** Audit từ nhật ký tenant (hoạt động nhân viên thành viên). */
export const layAuditThanhVienTheoOrg = async (orgId, { taiKhoan = '', tuKhoa = '', gioiHan = 200 } = {}) => {
  if (!orgId) return [];
  return voiNgungCanTenant(orgId, async () => {
    const raw = await tenantGetItem(KHOA_NHAT_KY);
    const danhSach = anToanArray(raw);
    const tk = String(taiKhoan || '').trim().toLowerCase();
    const q = String(tuKhoa || '').trim().toLowerCase();
    const loc = danhSach.filter((item) => {
      if (tk && item.taiKhoan !== tk) return false;
      if (!q) return true;
      const chuoi = `${item.hanhDong} ${item.doiTuong} ${item.chiTiet} ${item.taiKhoan}`.toLowerCase();
      return chuoi.includes(q);
    });
    const max = Number.isFinite(gioiHan) ? Math.max(1, Math.floor(gioiHan)) : 200;
    return loc.slice(0, max);
  });
};

/** Gộp audit quản trị + nhật ký tenant (legacy global). */
export const layAuditTongHop = async (orgId, opts = {}) => {
  const [qt, tv, legacy] = await Promise.all([
    layAuditQuanTri({ orgId, ...opts }),
    layAuditThanhVienTheoOrg(orgId, opts),
    layNhatKyHeThong({ taiKhoan: opts.taiKhoan, tuKhoa: opts.tuKhoa, gioiHan: opts.gioiHan || 200 }),
  ]);
  const map = new Map();
  const them = (row) => {
    const id = row?.id || `${row?.thoiGian}_${row?.hanhDong}_${row?.taiKhoan}`;
    if (!map.has(id)) map.set(id, row);
  };
  [...qt, ...tv, ...legacy].forEach(them);
  return Array.from(map.values())
    .sort((a, b) => Date.parse(b.thoiGian || '') - Date.parse(a.thoiGian || ''))
    .slice(0, opts.gioiHan || 200);
};

export default {
  ghiAuditQuanTri,
  layAuditQuanTri,
  layAuditThanhVienTheoOrg,
  layAuditTongHop,
};
