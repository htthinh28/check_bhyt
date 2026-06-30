/**
 * Audit log quản trị đa BV — global + theo tenant.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KHOA_NHAT_KY } from './luu_tru_he_thong';
import { ghiNhatKyHeThong, layNhatKyHeThong } from './nhat_ky_he_thong';
import { tenantGetItem, tenantSetItem } from './tenant_storage';
import { voiNgungCanTenant } from './tenant_context';

export const KHOA_AUDIT_QUAN_TRI = 'CDSS_QUAN_TRI_AUDIT_V1';

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

const parseMang = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

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
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
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
    const raw = await docRaw(KHOA_AUDIT_QUAN_TRI);
    const list = parseMang(raw);
    await ghiRaw(KHOA_AUDIT_QUAN_TRI, JSON.stringify([banGhi, ...list].slice(0, 3000)));
  } catch {
    /* ignore */
  }

  const chiTietHeThong = [
    banGhi.chiTiet,
    orgId ? `org=${orgId}` : '',
    heThong ? `he_thong=${heThong}` : '',
  ].filter(Boolean).join(' · ');

  await ghiNhatKyHeThong({
    hanhDong: banGhi.hanhDong,
    doiTuong: banGhi.doiTuong || 'QUAN_TRI_BV',
    chiTiet: chiTietHeThong,
    taiKhoan: banGhi.taiKhoan,
    vaiTro: banGhi.vaiTro,
  }).catch(() => {});

  if (orgId) {
    try {
      await voiNgungCanTenant(orgId, async () => {
        const rawTenant = await tenantGetItem(KHOA_NHAT_KY);
        const listTenant = parseMang(rawTenant);
        await tenantSetItem(
          KHOA_NHAT_KY,
          JSON.stringify([
            {
              id: banGhi.id,
              thoiGian: banGhi.thoiGian,
              taiKhoan: banGhi.taiKhoan,
              vaiTro: banGhi.vaiTro,
              hanhDong: banGhi.hanhDong,
              doiTuong: banGhi.doiTuong,
              chiTiet: chiTietHeThong,
            },
            ...listTenant,
          ].slice(0, 3000)),
        );
      });
    } catch {
      /* ignore */
    }
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
  const raw = await docRaw(KHOA_AUDIT_QUAN_TRI);
  const list = parseMang(raw);
  const org = String(orgId || '').trim();
  const email = String(taiKhoan || '').trim().toLowerCase();
  const kw = String(tuKhoa || '').trim().toLowerCase();
  const he = String(heThong || '').trim();

  const filtered = list.filter((row) => {
    if (org && row.orgId !== org) return false;
    if (email && row.taiKhoan !== email) return false;
    if (he && row.heThong !== he) return false;
    if (!kw) return true;
    return `${row.hanhDong} ${row.doiTuong} ${row.chiTiet} ${row.taiKhoan} ${row.orgId}`
      .toLowerCase()
      .includes(kw);
  });

  const limit = Number.isFinite(gioiHan) ? Math.max(1, Math.floor(gioiHan)) : 200;
  return filtered.slice(0, limit);
};

export const layAuditThanhVienTheoOrg = async (orgId, {
  taiKhoan = '',
  tuKhoa = '',
  gioiHan = 200,
} = {}) => {
  if (!orgId) return [];
  return voiNgungCanTenant(orgId, async () => {
    const raw = await tenantGetItem(KHOA_NHAT_KY);
    const list = parseMang(raw);
    const email = String(taiKhoan || '').trim().toLowerCase();
    const kw = String(tuKhoa || '').trim().toLowerCase();
    const filtered = list.filter((row) => {
      if (email && row.taiKhoan !== email) return false;
      if (!kw) return true;
      return `${row.hanhDong} ${row.doiTuong} ${row.chiTiet} ${row.taiKhoan}`
        .toLowerCase()
        .includes(kw);
    });
    const limit = Number.isFinite(gioiHan) ? Math.max(1, Math.floor(gioiHan)) : 200;
    return filtered.slice(0, limit);
  });
};

export const layAuditTongHop = async (orgId, opts = {}) => {
  const [globalRows, tenantRows, heThongRows] = await Promise.all([
    layAuditQuanTri({ orgId, ...opts }),
    layAuditThanhVienTheoOrg(orgId, opts),
    layNhatKyHeThong({
      taiKhoan: opts.taiKhoan,
      tuKhoa: opts.tuKhoa,
      gioiHan: opts.gioiHan || 200,
    }),
  ]);

  const map = new Map();
  [...globalRows, ...tenantRows, ...heThongRows].forEach((row) => {
    const key = row?.id || `${row?.thoiGian}_${row?.hanhDong}_${row?.taiKhoan}`;
    if (!map.has(key)) map.set(key, row);
  });

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
