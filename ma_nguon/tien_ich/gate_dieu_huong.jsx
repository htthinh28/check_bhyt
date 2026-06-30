/**
 * Điều hướng sau cổng triển khai / module cấu hình.
 */
export const PARAM_CAU_HINH_HE_THONG = 'cauHinhHeThong';

export const taoRouteDangNhapCauHinh = () => ({
  name: 'DangNhap',
  params: { [PARAM_CAU_HINH_HE_THONG]: true },
});

export const laManHinhDangNhapCauHinh = (params) => params?.[PARAM_CAU_HINH_HE_THONG] === true;

export const dieuHuongSauMoGate = (navigation) => {
  const route = taoRouteDangNhapCauHinh();
  if (navigation?.reset) {
    navigation.reset({ index: 0, routes: [route] });
    return;
  }
  if (navigation?.replace) {
    navigation.replace(route.name, route.params);
    return;
  }
  if (typeof window !== 'undefined') {
    window.location.assign('/login?cauHinhHeThong=true');
  }
};

export const dieuHuongVaoModuleCauHinh = (navigation) => {
  if (navigation?.reset) {
    navigation.reset({ index: 0, routes: [{ name: 'QuanTriTaiKhoanBv' }] });
    return;
  }
  if (typeof window !== 'undefined') {
    window.location.assign('/admin/hospital-accounts');
  }
};

export default {
  PARAM_CAU_HINH_HE_THONG,
  taoRouteDangNhapCauHinh,
  laManHinhDangNhapCauHinh,
  dieuHuongSauMoGate,
  dieuHuongVaoModuleCauHinh,
};
