/**
 * Tài khoản quản trị tối cao — chỉ email này được luồng Admin (cổng triển khai + quản lý đa BV).
 */
export const ADMIN_EMAIL_TOI_CAO = 'htthinh28@gmail.com';

export const laTaiKhoanAdminToiCao = (email) => (
  String(email || '').trim().toLowerCase() === ADMIN_EMAIL_TOI_CAO
);

export default {
  ADMIN_EMAIL_TOI_CAO,
  laTaiKhoanAdminToiCao,
};
