/**
 * Thống kê 4 hệ thống dữ liệu theo tenant (localStorage prefix).
 */
import { DANH_SACH_BON_HE_THONG } from './quan_tri_bv_constants';
import { prefixStorageKeyForOrg, laMoiTruongWeb } from './tenant_context';

const demKeyTheoPrefix = (keys, prefixes) => {
  let count = 0;
  const matched = [];
  for (const key of keys) {
    if (prefixes.some((p) => key.includes(p) || key.endsWith(p.replace(/_$/, '')))) {
      count += 1;
      matched.push(key);
    }
  }
  return { count, matched };
};

const docKeysLocalStorage = () => {
  if (!laMoiTruongWeb()) return [];
  try {
    return Object.keys(window.localStorage || {});
  } catch {
    return [];
  }
};

const uocLuongKichThuoc = (keys) => {
  if (!laMoiTruongWeb()) return 0;
  let total = 0;
  for (const key of keys) {
    try {
      const val = window.localStorage.getItem(key);
      if (val) total += key.length + val.length;
    } catch {
      /* ignore */
    }
  }
  return total;
};

const formatBytes = (bytes) => {
  if (bytes > 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

export const thongKeBonHeThong = async (orgId) => {
  const prefix = prefixStorageKeyForOrg(orgId, 'X').replace(/X$/, '');
  const keys = docKeysLocalStorage().filter((k) => k.startsWith(prefix));

  return DANH_SACH_BON_HE_THONG.map((he) => {
    const { count, matched } = demKeyTheoPrefix(keys, he.storagePrefixes);
    const size = uocLuongKichThuoc(matched);
    return {
      id: he.id,
      ten: he.ten,
      moTa: he.moTa,
      icon: he.icon,
      soKey: count,
      kichThuocUocLuong: size,
      kichThuocHienThi: formatBytes(size),
      trangThai: count > 0 ? 'CO_DU_LIEU' : 'TRONG',
    };
  });
};

export const tomTatQuanTriOrg = async (orgId, soTaiKhoan = 0) => {
  const heThong = await thongKeBonHeThong(orgId);
  return {
    orgId,
    soTaiKhoan,
    tongKeyLuuTru: heThong.reduce((sum, h) => sum + h.soKey, 0),
    heThong,
    capNhatLuc: new Date().toISOString(),
  };
};

export default {
  thongKeBonHeThong,
  tomTatQuanTriOrg,
};
