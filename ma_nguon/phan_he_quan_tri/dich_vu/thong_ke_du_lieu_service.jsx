/**
 * Thống kê dữ liệu 4 hệ thống theo tenant — phục vụ dashboard quản trị.
 */
import { DANH_SACH_BON_HE_THONG } from '../constants/bon_he_thong';
import { prefixStorageKeyForOrg } from '../../tien_ich/tenant_context';
import { laMoiTruongWeb } from '../../tien_ich/luu_tru_he_thong';

const demKeyTheoPrefix = (keys, prefixes) => {
  let count = 0;
  const matched = [];
  for (const key of keys) {
    const hit = prefixes.some((p) => key.includes(p) || key.endsWith(p.replace(/_$/, '')));
    if (hit) {
      count += 1;
      matched.push(key);
    }
  }
  return { count, matched };
};

const layTatCaKeyStorage = () => {
  if (!laMoiTruongWeb()) return [];
  try {
    return Object.keys(window.localStorage || {});
  } catch {
    return [];
  }
};

const uocLuongKichThuoc = (keys) => {
  if (!laMoiTruongWeb()) return 0;
  let bytes = 0;
  for (const key of keys) {
    try {
      const v = window.localStorage.getItem(key);
      if (v) bytes += key.length + v.length;
    } catch { /* */ }
  }
  return bytes;
};

export const thongKeBonHeThong = async (orgId) => {
  const orgPrefix = prefixStorageKeyForOrg(orgId, 'X').replace(/X$/, '');
  const allKeys = layTatCaKeyStorage().filter((k) => k.startsWith(orgPrefix));

  return DANH_SACH_BON_HE_THONG.map((ht) => {
    const { count, matched } = demKeyTheoPrefix(allKeys, ht.storagePrefixes);
    const bytes = uocLuongKichThuoc(matched);
    return {
      id: ht.id,
      ten: ht.ten,
      moTa: ht.moTa,
      icon: ht.icon,
      soKey: count,
      kichThuocUocLuong: bytes,
      kichThuocHienThi: bytes > 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : bytes > 1024
          ? `${(bytes / 1024).toFixed(1)} KB`
          : `${bytes} B`,
      trangThai: count > 0 ? 'CO_DU_LIEU' : 'TRONG',
    };
  });
};

export const tomTatQuanTriOrg = async (orgId, soTaiKhoan = 0) => {
  const heThong = await thongKeBonHeThong(orgId);
  const tongKey = heThong.reduce((s, h) => s + h.soKey, 0);
  return {
    orgId,
    soTaiKhoan,
    tongKeyLuuTru: tongKey,
    heThong,
    capNhatLuc: new Date().toISOString(),
  };
};

export default {
  thongKeBonHeThong,
  tomTatQuanTriOrg,
};
