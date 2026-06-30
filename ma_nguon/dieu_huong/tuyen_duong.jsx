/**
 * ============================================================
 * FILE: dieu_huong/tuyen_duong.jsx (PHIÊN BẢN 4.0 - CHUẨN JCI)
 * CHỨC NĂNG: Quản lý toàn bộ lộ trình di chuyển trong ứng dụng CDSS.
 * CẬP NHẬT: Tích hợp Hệ thống Danh mục dùng chung Bộ Y tế (QĐ 7603 & QĐ 3276)
 * ============================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import {
  dangKyTuDongKetNoiLaiPythonKhiMangHoacPhien,
  kichHoatKetNoiPythonSauKhoiDongUngDung,
} from '../tien_ich/hybrid_python_helper';
import { docDanhSachTaiKhoan } from '../tien_ich/nhat_ky_he_thong';
import { coPhienDangNhapHopLe, docPhienDangNhap } from '../tien_ich/phien_dang_nhap';
import { coQuyenManHinh, taiRBAC } from '../tien_ich/rbac_engine';
import { laTaiKhoanAdminToiCao } from '../tien_ich/admin_toi_cao';
import { coGateSessionHopLe } from '../tien_ich/gate_session';
import {
  laManHinhDangNhapCauHinh,
  taoRouteDangNhapCauHinh,
} from '../tien_ich/gate_dieu_huong';
import { damBaoKhoiDongTenant } from '../tien_ich/tenant_bootstrap';
import { laCheDoBuildDonTenant } from '../tien_ich/tenant_context';
import { coTenantSessionHopLe } from '../tien_ich/tenant_session';

// 0. CỔNG ĐA BỆNH VIỆN
import ManHinhChonBenhVien from '../man_hinh/chon_benh_vien';
import QuanTriTaiKhoanBv from '../man_hinh/quan_tri_tai_khoan_bv';

// 1. NHÓM MÀN HÌNH HỆ THỐNG & TỔNG QUAN
import ManHinhDangNhap from '../man_hinh/dang_nhap';
import ManHinhDoiMatKhau from '../man_hinh/doi_mat_khau';
import ManHinhHelperHeThong from '../man_hinh/helper_he_thong';
import ManHinhKhoLuuTru from '../man_hinh/man_hinh_kho_luu_tru';
import ManHinhPhanQuyen from '../man_hinh/phan_quyen_truy_cap';
import ManHinhTongQuan from '../man_hinh/tong_quan';

// 2. NHÓM MÀN HÌNH KIỂM TRA & CHI TIẾT HỒ SƠ
import ManHinhChiTiet from '../man_hinh/chi_tiet_ca_benh';
import ManHinhDocXML from '../man_hinh/doc_file_xml';
import SuaFileXML from '../man_hinh/sua_file_xml';

// 3. NHÓM MÀN HÌNH QUẢN TRỊ DANH MỤC & QUY TẮC
import DanhMucBYTMain from '../danh_muc_byt/danh_muc_7603_main'; // KẾT NỐI MODULE 12 PHỤ LỤC BYT
import ManHinhQuanLyDanhMuc from '../man_hinh/quan_ly_danh_muc';
import MappingNghiepVu from '../man_hinh/mapping_nghiep_vu';
import ManHinhQuanLyLuat from '../man_hinh/quan_ly_luat';
import ManHinhQuanLyQuyTacOnOff from '../man_hinh/quan_ly_quy_tac_on_off';

// 4. NHÓM MÀN HÌNH XML CHI TIẾT (QĐ 130)
import ManHinhXML1 from '../man_hinh/quan_ly_xml1_130';
import ManHinhXML2 from '../man_hinh/quan_ly_xml2_thuoc';
import ManHinhXML3 from '../man_hinh/quan_ly_xml3';
import ManHinhXML4 from '../man_hinh/quan_ly_xml4';
import ManHinhXML5 from '../man_hinh/quan_ly_xml5';
import ManHinhXML6 from '../man_hinh/quan_ly_xml6';

// 5. NHÓM CHUYÊN MÔN (PHÁC ĐỒ - QUY TRÌNH)
import QuanLyChuyenMon from '../man_hinh/quan_ly_chuyen_mon';

// 6. NHÓM BÁO CÁO VÀ THỐNG KÊ
import BaoCaoVaThongKe from '../man_hinh/baocao_va_thongke';
import ManHinhThuVien from '../man_hinh/thu_vien';
import ManHinhTriThucTuGiamDinh from '../man_hinh/tri_thuc_tu_giam_dinh';
import ManHinhTroLyTriThucChat from '../man_hinh/tro_ly_tri_thuc_chat';
import CongTiepNhanHIS from '../man_hinh/cong_tiep_nhan_his';
import TraCuuThuVienPC from '../man_hinh/tra_cuu_thu_vien_pc';

import { CAU_HINH_LIEN_KET } from './cau_hinh_lien_ket';

const Stack = createNativeStackNavigator();
const KHOA_DIEU_HUONG = 'CDSS_NAV_STATE_V1';

const layManHinhDangMo = (state) => {
  if (!state || !Array.isArray(state.routes) || typeof state.index !== 'number') return '';
  const route = state.routes[state.index];
  if (!route) return '';
  if (route.state) return layManHinhDangMo(route.state);
  return route.name || '';
};

const layParamsManHinhDangMo = (state) => {
  if (!state || !Array.isArray(state.routes) || typeof state.index !== 'number') return {};
  const route = state.routes[state.index];
  if (!route) return {};
  if (route.state) return layParamsManHinhDangMo(route.state);
  return route.params || {};
};

const MAN_HINH_KHONG_CAN_TENANT = new Set(['ChonBenhVien', 'QuanTriTaiKhoanBv']);
const MAN_HINH_KHONG_CAN_DANG_NHAP = new Set(['ChonBenhVien', 'DangNhap']);

const DieuHuongChinh = () => {
  const [daKhoiPhucXong, setDaKhoiPhucXong] = useState(false);
  const [trangThaiKhoiPhuc, setTrangThaiKhoiPhuc] = useState(undefined);
  const [manHinhKhoiDau, setManHinhKhoiDau] = useState('DangNhap');
  const navRef = useRef(null);
  const daKiemTraKhoiDongRef = useRef(false);

  const baoVeDieuHuong = async (state) => {
    const tenManHinh = layManHinhDangMo(state);
    const params = layParamsManHinhDangMo(state);
    if (!tenManHinh || !navRef.current) return;

    const laDangNhapCauHinh = tenManHinh === 'DangNhap' && laManHinhDangNhapCauHinh(params);
    const coTenant = await coTenantSessionHopLe();

    if (!(coTenant || MAN_HINH_KHONG_CAN_TENANT.has(tenManHinh) || laCheDoBuildDonTenant() || laDangNhapCauHinh)) {
      await AsyncStorage.removeItem(KHOA_DIEU_HUONG).catch(() => {});
      navRef.current.resetRoot({ index: 0, routes: [{ name: 'ChonBenhVien' }] });
      return;
    }

    if (tenManHinh === 'QuanTriTaiKhoanBv') {
      if (!(await coGateSessionHopLe())) {
        await AsyncStorage.removeItem(KHOA_DIEU_HUONG).catch(() => {});
        navRef.current.resetRoot({ index: 0, routes: [{ name: 'ChonBenhVien' }] });
        return;
      }
      if (!(await coPhienDangNhapHopLe())) {
        await AsyncStorage.removeItem(KHOA_DIEU_HUONG).catch(() => {});
        navRef.current.resetRoot({ index: 0, routes: [taoRouteDangNhapCauHinh()] });
        return;
      }
      const session = await docPhienDangNhap();
      if (!laTaiKhoanAdminToiCao(session?.email)) {
        await AsyncStorage.removeItem(KHOA_DIEU_HUONG).catch(() => {});
        navRef.current.resetRoot({ index: 0, routes: [taoRouteDangNhapCauHinh()] });
      }
      return;
    }

    if (laDangNhapCauHinh && !(await coGateSessionHopLe())) {
      await AsyncStorage.removeItem(KHOA_DIEU_HUONG).catch(() => {});
      navRef.current.resetRoot({ index: 0, routes: [{ name: 'ChonBenhVien' }] });
      return;
    }

    const daDangNhap = await coPhienDangNhapHopLe();
    if (!daDangNhap && !MAN_HINH_KHONG_CAN_DANG_NHAP.has(tenManHinh)) {
      await AsyncStorage.removeItem(KHOA_DIEU_HUONG).catch(() => {});
      navRef.current.resetRoot({
        index: 0,
        routes: [{ name: coTenant ? 'DangNhap' : 'ChonBenhVien' }],
      });
      return;
    }

    if (daDangNhap && tenManHinh === 'DangNhap') {
      if (laDangNhapCauHinh) {
        const session = await docPhienDangNhap();
        if (laTaiKhoanAdminToiCao(session?.email) && (await coGateSessionHopLe())) {
          navRef.current.resetRoot({ index: 0, routes: [{ name: 'QuanTriTaiKhoanBv' }] });
        }
        return;
      }
      navRef.current.resetRoot({ index: 0, routes: [{ name: 'TongQuan' }] });
      return;
    }

    if (daDangNhap && tenManHinh !== 'DoiMatKhau' && tenManHinh !== 'DangNhap') {
      try {
        const session = await docPhienDangNhap();
        const email = String(session.email || '').trim().toLowerCase();
        if (email) {
          const ds = await docDanhSachTaiKhoan();
          const u = ds.find((x) => x.email === email);
          if (u?.buocDoiMatKhau) {
            navRef.current.resetRoot({ index: 0, routes: [{ name: 'DoiMatKhau', params: { batBuoc: true } }] });
            return;
          }
        }
      } catch {
        /* không chặn điều hướng */
      }
    }

    if (daDangNhap && tenManHinh !== 'TongQuan' && tenManHinh !== 'DangNhap' && tenManHinh !== 'DoiMatKhau') {
      const [session, cfg] = await Promise.all([docPhienDangNhap(), taiRBAC()]);
      const choPhep = coQuyenManHinh({
        cfg,
        email: String(session.email || '').toLowerCase(),
        fallbackRole: String(session.role || 'USER').toUpperCase(),
        routeName: tenManHinh,
      });
      if (!choPhep) {
        navRef.current.resetRoot({ index: 0, routes: [{ name: 'TongQuan' }] });
      }
    }
  };

  useEffect(() => {
    let conHieuLuc = true;

    const khoiPhucDieuHuong = async () => {
      try {
        const bootstrap = await damBaoKhoiDongTenant();
        const coTenant = await coTenantSessionHopLe();
        let routeKhoiDau = 'DangNhap';
        if (laCheDoBuildDonTenant() || (!bootstrap?.needSelectTenant && coTenant)) {
          if (await coPhienDangNhapHopLe()) routeKhoiDau = 'TongQuan';
        } else {
          routeKhoiDau = 'ChonBenhVien';
        }
        if (conHieuLuc) setManHinhKhoiDau(routeKhoiDau);

        const daDangNhap = await coPhienDangNhapHopLe();
        const duongDanKhoiTao = await Linking.getInitialURL();
        const coDeepLink = typeof duongDanKhoiTao === 'string'
          && duongDanKhoiTao.trim() !== ''
          && !duongDanKhoiTao.endsWith('/');
        if (!coDeepLink && daDangNhap && coTenant) {
          const trangThaiLuu = await AsyncStorage.getItem(KHOA_DIEU_HUONG);
          if (trangThaiLuu && conHieuLuc) {
            setTrangThaiKhoiPhuc(JSON.parse(trangThaiLuu));
          }
        }
      } catch (e) {
        console.warn('[DieuHuong] Không thể khoi phuc trang thai dieu huong:', e?.message || e);
      } finally {
        if (conHieuLuc) setDaKhoiPhucXong(true);
      }
    };

    khoiPhucDieuHuong();
    return () => { conHieuLuc = false; };
  }, []);

  /** Warm-up Python (localhost/LAN) ngay khi shell app sẵn sàng — không phụ thuộc màn Tổng quan; online/offline mạng ngoài đều thử. */
  useEffect(() => {
    if (!daKhoiPhucXong) return undefined;
    kichHoatKetNoiPythonSauKhoiDongUngDung().catch(() => {});
    return dangKyTuDongKetNoiLaiPythonKhiMangHoacPhien();
  }, [daKhoiPhucXong]);

  if (!daKhoiPhucXong) {
    return (
      <View style={styles.khung_dang_tai}>
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navRef}
      linking={CAU_HINH_LIEN_KET}
      initialState={trangThaiKhoiPhuc}
      onReady={() => {
        if (!daKiemTraKhoiDongRef.current) {
          daKiemTraKhoiDongRef.current = true;
        }

        baoVeDieuHuong(navRef.current?.getRootState()).catch(() => {});
      }}
      onStateChange={(state) => {
        AsyncStorage.setItem(KHOA_DIEU_HUONG, JSON.stringify(state)).catch(() => {});
        baoVeDieuHuong(state).catch(() => {});
      }}
    >
      <Stack.Navigator
        initialRouteName={manHinhKhoiDau}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="ChonBenhVien" component={ManHinhChonBenhVien} />
        <Stack.Screen name="DangNhap" component={ManHinhDangNhap} />
        <Stack.Screen name="DoiMatKhau" component={ManHinhDoiMatKhau} />
        <Stack.Screen name="QuanTriTaiKhoanBv" component={QuanTriTaiKhoanBv} />
        <Stack.Screen name="TongQuan" component={ManHinhTongQuan} />
        <Stack.Screen name="Helper" component={ManHinhHelperHeThong} />
        <Stack.Screen name="PhanQuyenTruyCap" component={ManHinhPhanQuyen} />
        
        {/* --- PHÂN HỆ KIỂM TRA LÂM SÀNG --- */}
        <Stack.Screen name="DocXML" component={ManHinhDocXML} />
        <Stack.Screen name="ChiTiet" component={ManHinhChiTiet} />
        <Stack.Screen name="SuaFileXML" component={SuaFileXML} />
        <Stack.Screen name="KhoLuuTru" component={ManHinhKhoLuuTru} />
        
        {/* --- PHÂN HỆ QUẢN TRỊ DỮ LIỆU & DANH MỤC --- */}
        <Stack.Screen name="QuanLyLuat" component={ManHinhQuanLyLuat} />
        <Stack.Screen name="QuanLyQuyTacOnOff" component={ManHinhQuanLyQuyTacOnOff} />
        <Stack.Screen name="QuanLyDanhMuc" component={ManHinhQuanLyDanhMuc} />
        <Stack.Screen name="MappingNghiepVu" component={MappingNghiepVu} />
        <Stack.Screen name="DanhMucBYTMain" component={DanhMucBYTMain} />
        <Stack.Screen name="TraCuuThuVienPC" component={TraCuuThuVienPC} />
        <Stack.Screen name="QuanLyChuyenMon" component={QuanLyChuyenMon} />
        <Stack.Screen name="ThuVien" component={ManHinhThuVien} />
        <Stack.Screen name="TriThucTuGiamDinh" component={ManHinhTriThucTuGiamDinh} />
        <Stack.Screen name="TroLyTriThuc" component={ManHinhTroLyTriThucChat} />
        <Stack.Screen name="CongHIS" component={CongTiepNhanHIS} />
        
        {/* --- PHÂN HỆ BÁO CÁO VÀ THỐNG KÊ --- */}
        <Stack.Screen name="BaoCaoVaThongKe" component={BaoCaoVaThongKe} />

        {/* --- PHÂN HỆ XML CHI TIẾT (CHUẨN QĐ 130/BYT) --- */}
        <Stack.Screen name="XML1" component={ManHinhXML1} />
        <Stack.Screen name="XML2" component={ManHinhXML2} />
        <Stack.Screen name="XML3" component={ManHinhXML3} />
        <Stack.Screen name="XML4" component={ManHinhXML4} />
        <Stack.Screen name="XML5" component={ManHinhXML5} />
        <Stack.Screen name="XML6" component={ManHinhXML6} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default DieuHuongChinh;

const styles = StyleSheet.create({
  khung_dang_tai: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? '#10141f' : '#0a0f1a',
  },
});
