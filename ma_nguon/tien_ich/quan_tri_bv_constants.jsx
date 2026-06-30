/**
 * Hằng số module quản trị đa BV — đồng bộ từ Vercel.
 */
export const BON_HE_THONG = Object.freeze({
  TRUY_CAP: 'TRUY_CAP',
  LUAT_CDSS: 'LUAT_CDSS',
  LUU_TRU: 'LUU_TRU',
  TICH_HOP: 'TICH_HOP',
});

export const DANH_SACH_BON_HE_THONG = Object.freeze([
  {
    id: BON_HE_THONG.TRUY_CAP,
    ten: 'Điều hướng & Truy cập',
    moTa: 'RBAC, tài khoản, phiên đăng nhập, phân quyền màn hình',
    icon: '🔐',
    storagePrefixes: ['RBAC_', 'DANH_SACH_TAI_KHOAN', 'ACL_USER_', 'USER_ACCOUNT', 'USER_ROLE'],
  },
  {
    id: BON_HE_THONG.LUAT_CDSS,
    ten: 'Luật & CDSS Engine',
    moTa: 'Seed luật, quy tắc ON/OFF, chuyên đề giám định',
    icon: '⚙️',
    storagePrefixes: ['CDSS_DATA_LUAT_', 'CDSS_ON_OFF_', 'CDSS_GHI_DE_', 'CDSS_AN_KHOI_', 'CDSS_RULE_SEED_'],
  },
  {
    id: BON_HE_THONG.LUU_TRU,
    ten: 'Lưu trữ & Danh mục',
    moTa: 'Danh mục nội bộ, XML, kho hồ sơ, catalog tenant pack',
    icon: '🗄️',
    storagePrefixes: ['CDSS_DATA_', 'CDSS_COLS_', 'CATALOG_', 'KHO_XML_', 'CDSS_KHO_', 'CDSS_HS_', 'DANH_MUC_'],
  },
  {
    id: BON_HE_THONG.TICH_HOP,
    ten: 'Tích hợp ngoài',
    moTa: 'Firebase, HIS gateway, Python hybrid, đồng bộ BYT',
    icon: '🔌',
    storagePrefixes: ['FIREBASE_', 'BYT_7603_', 'CDSS_TRI_THUC_', 'SESSION_DOC_XML_'],
  },
]);

export const VAI_TRO_TAI_KHOAN_BV = Object.freeze({
  ADMIN_BV: 'ADMIN',
  NHAN_VIEN: 'USER',
});

export const TAB_QUAN_TRI = Object.freeze({
  CO_SO: 'TENANTS',
  TAI_KHOAN: 'ACCOUNTS',
  PHAN_QUYEN: 'PERMISSIONS',
  DU_LIEU: 'DATA',
  AUDIT: 'AUDIT',
});

export default {
  BON_HE_THONG,
  DANH_SACH_BON_HE_THONG,
  VAI_TRO_TAI_KHOAN_BV,
  TAB_QUAN_TRI,
};
