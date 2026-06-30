/**
 * Admin tối cao — đồng bộ từ Vercel.
 */
export const ADMIN_EMAIL_TOI_CAO = 'htthinh28@gmail.com';

export const laTaiKhoanAdminToiCao = (email) => (
  String(email || '').trim().toLowerCase() === ADMIN_EMAIL_TOI_CAO
);

export default {
  ADMIN_EMAIL_TOI_CAO,
  laTaiKhoanAdminToiCao,
};
