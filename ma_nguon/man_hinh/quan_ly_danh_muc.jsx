/**
 * MODULE: QUẢN LÝ DANH MỤC TỔNG THỂ (MASTER DATA TABS)
 * Nâng cấp (Bản 2.0 - Fullscreen & Chunking Storage):
 * 1. FIX LỖI MẤT DỮ LIỆU: Vượt rào giới hạn 5MB của Web Browser bằng thuật toán Chunking (Băm nhỏ mảng).
 * 2. FIX AUTO-SAVE: Bổ sung cờ isReadyToSave để tránh ghi đè mảng rỗng khi F5.
 * 3. UI FULLSCREEN: Xóa bỏ giới hạn chiều cao, dãn cột (450px) và dãn dòng (padding 18px).
 * Giao diện: Pink Theme Phương Châu, Arial > 20px
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as XLSX from 'xlsx';
import { CD } from '../tien_ich/chu_de_giao_dien';
import { quayLaiAnToan } from '../tien_ich/dieu_huong_an_toan';
import { xoaCacheBoMayGiamDinh } from '../tien_ich/dong_co_giam_dinh';
import {
    doiSoatBoDuLieuDanhMucVoiFirebase,
    flushFirebaseDanhMucQueue,
    luuBoDuLieuDanhMuc,
    taiBoDuLieuDanhMuc,
} from '../tien_ich/luu_tru_danh_muc';
import { phucHoiBanSaoGanNhat, taoBanSaoDuLieuHeThong } from '../tien_ich/sao_luu_du_lieu_he_thong';

// ============================================================================
// HỆ THỐNG LƯU TRỮ CHỐNG TRÀN BỘ NHỚ WEB (CHUNKING STORAGE)
// ============================================================================
// ============================================================================
// DANH SÁCH TAB & TEMPLATES
// ============================================================================
const DANH_SACH_TAB = [
  { id: 'DANH_MUC_ICD10', ten: 'Danh mục ICD-10' }, 
  { id: 'DANH_MUC_ICD10_CAP_CUU', ten: 'ICD10 cấp cứu' },
  { id: 'DANH_MUC_ICD10_KE_DON_TREN_30_NGAY', ten: 'ICD10 kê >30 ngày' },
  { id: 'THONG_TIN_CO_SO', ten: 'Thông tin Cơ sở' },
  { id: 'DANH_MUC_KHOA_LS_M01', ten: 'Mẫu 01 (Khoa/Giường)' },
  { id: 'DANH_MUC_NHAN_SU', ten: 'Mẫu 02 (Nhân sự)' },
  { id: 'DANH_MUC_MAPPING_NGUOI_HANH_NGHE', ten: 'Mapping người hành nghề' },
  { id: 'DANH_MUC_THUOC_MAU_M03', ten: 'Mẫu 03 (Thuốc/Máu)' },
  { id: 'DANH_MUC_VAT_TU_M04', ten: 'Mẫu 04 (Vật tư)' },
  { id: 'DANH_MUC_DVKT_M05', ten: 'Mẫu 05 (DVKT)' },
  { id: 'DANH_MUC_TRANG_THIET_BI_M06', ten: 'Mẫu 06 (Thiết bị)' },
  { id: 'DANH_MUC_HA_TANG', ten: 'Hạ tầng (JCI)' },
];

const MAU_EXCEL_CHUAN = {
  DANH_MUC_ICD10: ['MÃ BỆNH', 'MÃ BỆNH KHÔNG DẤU', 'DISEASE NAME', 'TÊN BỆNH'],
  DANH_MUC_ICD10_CAP_CUU: ['ID', 'Nhom_Benh', 'Tinh_Trang_Benh', 'ICD_Chinh', 'Ly_Do_Nhap_Vien', 'ICD_Kem_Theo', 'Ngoai_Le', 'Tu_Khoa'],
  DANH_MUC_ICD10_KE_DON_TREN_30_NGAY: ['TT', 'Mã TT', 'Danh mục bệnh theo các chuyên khoa', 'Mã bệnh theo ICD 10'],
  THONG_TIN_CO_SO: ['MA_CSKCB', 'TEN_CSKCB', 'DIA_CHI', 'TUYEN', 'HANG'],
  DANH_MUC_KHOA_LS_M01: ['STT', 'MA_KHOA', 'TEN_KHOA', 'BAN_KHAM', 'GIUONG_PD', 'GIUONG_TK', 'GIUONG_HSTC', 'GIUONG_HSCC', 'TU_NGAY', 'DEN_NGAY', 'MA_CSKCB', 'ID', 'MA_LOAI_KCB', 'LDLK', 'LIEN_KHOA', 'GIUONG_2015'],
  DANH_MUC_NHAN_SU: ['DEN_NGAY', 'STT', 'MA_LOAI_KCB', 'MA_KHOA', 'TEN_KHOA', 'MA_BHXH', 'HO_TEN', 'GIOI_TINH', 'NGAY_SINH', 'SO_CCCD', 'CHUCDANH_NN', 'VI_TRI', 'MACCHN', 'NGAYCAP_CCHN', 'NOICAP_CCHN', 'PHAMVI_CM', 'PHAMVI_CMBS', 'DVKT_KHAC', 'VB_PHANCONG', 'THOIGIAN_DK', 'THOIGIAN_NGAY', 'THOIGIAN_TUAN', 'CSKCB_KHAC', 'CSKCB_CGKT', 'QD_CGKT', 'TU_NGAY', 'MA_DANTOC', 'ID'],
  DANH_MUC_MAPPING_NGUOI_HANH_NGHE: ['STT', 'MA_TUONG_DUONG', 'TEN_DVKT', 'MA_CHUYEN_KHOA', 'PHAMVI_CM_CAN', 'SO_NV_DU_DIEU_KIEN', 'DANH_SACH_NGUOI_THUC_HIEN', 'DANH_SACH_MACCHN', 'DANH_SACH_MA_BHXH', 'TRANG_THAI'],
  DANH_MUC_THUOC_MAU_M03: ['STT', 'MA_THUOC', 'TEN_HOAT_CHAT', 'TEN_THUOC', 'DON_VI_TINH', 'HAM_LUONG', 'DUONG_DUNG', 'MA_DUONG_DUNG', 'DANG_BAO_CHE', 'SO_DANG_KY', 'QUY_CACH', 'DON_GIA', 'DON_GIA_TT', 'GIA_BH_TT', 'TT_THAU', 'TYLE_TT_BH', 'LOAI_THUOC', 'LOAI_THAU', 'NHA_SX', 'NUOC_SX', 'NHA_THAU', 'KIEU_THAU', 'GIA_KHOA_KHO', 'GIA_BB_CD', 'PP_CHEBIEN', 'VITRI_YHCT', 'MA_CSKCB_THUOC', 'TU_NGAY', 'DEN_NGAY', 'MA_CSKCB', 'SO_LUONG', 'ID'],
  DANH_MUC_VAT_TU_M04: ['STT', 'MA_VAT_TU', 'NHOM_VAT_TU', 'TEN_VAT_TU', 'MA_HIEU', 'SO_LUU_HANH', 'TINHNANG_KT', 'QUY_CACH', 'DON_VI_TINH', 'DON_GIA', 'GIA_BH_TT', 'TT_THAU', 'TYLE_TT_BH', 'LOAI_THAU', 'NHA_SX', 'NUOC_SX', 'NHA_THAU', 'NHA_PP', 'TU_NGAY', 'DEN_NGAY', 'MA_CSKCB'],
  DANH_MUC_DVKT_M05: ['STT', 'MA_DICH_VU', 'TEN_DICH_VU', 'TEN_DVKT_GIA', 'DON_GIA', 'QUY_TRINH', 'CS_THUCHIEN', 'TINHTRANG_DV', 'MA_GIA', 'TEN_GIA', 'GIA_TT_BHYT', 'MA_PTTT', 'TU_NGAY', 'DEN_NGAY', 'MA_CSKCB', 'PHAN_LOAI_PTTT', 'GHICHU', 'QUYET_DINH'],
  DANH_MUC_TRANG_THIET_BI_M06: ['STT', 'TEN_TB', 'KY_HIEU', 'CONGTY_SX', 'NUOC_SX', 'NAM_SX', 'NAM_SD', 'MA_MAY', 'SO_LUU_HANH', 'HD_TU', 'HD_DEN', 'TU_NGAY', 'DEN_NGAY', 'MA_CSKCB', 'ID'],
  DANH_MUC_HA_TANG: ['MA_TIEU_CHI', 'TEN_TIEU_CHI', 'TRANG_THAI', 'GHI_CHU']
};

const SO_DONG_MOI_TRANG_DANH_MUC = 160;
const DANH_SACH_TAB_DONG_BO = DANH_SACH_TAB.map((tab) => ({
  id: tab.id,
  ten: tab.ten,
  dataKey: tab.id,
  columnsKey: `COLS_${tab.id}`,
}));

const ManHinhQuanLyDanhMuc = ({ navigation }) => {
  const [danhMucHienTai, setDanhMucHienTai] = useState(DANH_SACH_TAB[0].id); 
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [trangHienTai, setTrangHienTai] = useState(1);

  const layDoRongCot = (tenCot) => {
    const cot = String(tenCot || '').toUpperCase();
    if (/(TEN|NAME|GHI_CHU|DIA_CHI|MO_TA|NOI_DUNG|QUY_TRINH|PHAMVI)/.test(cot)) return 560;
    if (/^MA_/.test(cot)) return 280;
    if (/(NGAY|SO_|DON_GIA|TYLE|SLUONG|THANH_TIEN|MUC_HUONG)/.test(cot)) return 260;
    return 320;
  };

  // KHÓA AN TOÀN AUTO-SAVE: Chỉ bật khi dữ liệu từ DB đã được đẩy lên UI hoàn tất
  const isReadyToSave = useRef(false);
  const dirtyRef = useRef(false);
  const dataRef = useRef([]);
  const columnsRef = useRef([]);
  const danhMucRef = useRef(DANH_SACH_TAB[0].id);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { columnsRef.current = columns; }, [columns]);
  useEffect(() => { danhMucRef.current = danhMucHienTai; }, [danhMucHienTai]);
  useEffect(() => {
    const tongTrang = Math.max(1, Math.ceil(data.length / SO_DONG_MOI_TRANG_DANH_MUC));
    if (trangHienTai > tongTrang) {
      setTrangHienTai(tongTrang);
    }
  }, [data.length, trangHienTai]);
  useEffect(() => { setTrangHienTai(1); }, [danhMucHienTai]);

  const layKhoaCotDanhMuc = (key) => `COLS_${key}`;
  const dinhDangThoiGianMeta = (value) => {
    const ts = Number(value || 0);
    if (!ts) return 'chưa rõ';
    try {
      return new Date(ts).toLocaleString('vi-VN');
    } catch {
      return 'chưa rõ';
    }
  };
  const dinhDangKhoiMeta = (label, block) => {
    const local = block?.local || {};
    const remote = block?.remote || {};
    const status = block?.status || {};
    const trangThai = !remote.ok
      ? `Firebase chưa sẵn sàng (${remote.reason || 'không đọc được metadata'})`
      : !remote.exists
        ? 'Firebase chưa có dữ liệu'
        : block?.differs
          ? 'Khác dữ liệu với local'
          : 'Đang khớp với local';
    const lines = [
      `${label}: ${trangThai}`,
      `- Local: ${Number(local.row_count || 0)} dòng | cập nhật ${dinhDangThoiGianMeta(local.updated_at_ms)}`,
      `- Firebase: ${remote.exists ? `${Number(remote.row_count || 0)} dòng | cập nhật ${dinhDangThoiGianMeta(remote.updated_at_ms)}` : 'chưa có dataset'}`,
    ];
    if (status.has_unsynced_local_changes) {
      lines.push('- Lưu ý: local đang có thay đổi chưa đồng bộ, không nên ghi đè tự động.');
    } else if (status.can_auto_hydrate) {
      lines.push('- Gợi ý: có thể tải an toàn từ Firebase vì remote mới hơn và local đang sạch.');
    }
    return lines.join('\n');
  };
  const tomTatDongBo = (items) => {
    const tong = items.length;
    const lech = items.filter((item) => item.data.differs || item.columns.differs).length;
    const coTheTai = items.filter((item) => item.data.status?.can_auto_hydrate || item.columns.status?.can_auto_hydrate).length;
    const coLocalChuaDongBo = items.filter((item) => item.data.status?.has_unsynced_local_changes || item.columns.status?.has_unsynced_local_changes).length;
    return { tong, lech, coTheTai, coLocalChuaDongBo };
  };
  const danhDauDaSua = () => { dirtyRef.current = true; };
  const luuNgayDanhMuc = async ({ localOnly = false, source = 'catalog_manual_save' } = {}) => {
    if (!isReadyToSave.current || !dirtyRef.current) return false;
    const currentKey = danhMucRef.current;
    await luuBoDuLieuDanhMuc({
      dataKey: currentKey,
      columnsKey: layKhoaCotDanhMuc(currentKey),
      data: dataRef.current,
      columns: columnsRef.current,
      source,
      syncRemote: !localOnly,
    });
    try { xoaCacheBoMayGiamDinh(); } catch {}
    dirtyRef.current = false;
    return true;
  };

  // 1. PHỤC HỒI TAB ĐANG LÀM VIỆC KHI REFRESH
  useEffect(() => {
    const khoiTao = async () => {
      try {
        const tabLuuTru = await AsyncStorage.getItem('TAB_DANG_MO');
        if (tabLuuTru) setDanhMucHienTai(tabLuuTru);
      } catch (error) { console.error(error); }
    };
    khoiTao();
  }, []);

  // 2. N?P D? LI?U T? KHO V?T L?
  useEffect(() => {
    const napDuLieu = async () => {
      isReadyToSave.current = false;
      dirtyRef.current = false;
      try {
        const { data: finalData, columns: finalColumns, seededFromCode, hydratedFromFirebase } = await taiBoDuLieuDanhMuc({
          dataKey: danhMucHienTai,
          columnsKey: layKhoaCotDanhMuc(danhMucHienTai),
          fallbackColumns: MAU_EXCEL_CHUAN[danhMucHienTai] || [],
        });

        dataRef.current = finalData;
        columnsRef.current = finalColumns;
        setData(finalData);
        setColumns(finalColumns);
        if (seededFromCode || hydratedFromFirebase) {
          try { xoaCacheBoMayGiamDinh(); } catch {}
        }
      } catch (e) {
        console.warn('Lỗi đọc Kho dữ liệu: ', e);
      } finally {
        setTimeout(() => { isReadyToSave.current = true; }, 300);
      }
    };

    napDuLieu();
  }, [danhMucHienTai]);

  // 3. AUTO-SAVE
  useEffect(() => {
    if (!isReadyToSave.current || !dirtyRef.current) return;

    const saveTimer = setTimeout(() => {
      luuNgayDanhMuc({ source: 'catalog_autosave' }).catch((e) => {
        console.error('Lỗi Auto-Save danh mục:', e);
      });
    }, 700);

    return () => clearTimeout(saveTimer);
  }, [data, columns, danhMucHienTai]);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    const flushLocal = () => {
      luuNgayDanhMuc({ localOnly: true, source: 'catalog_pagehide' }).catch(() => {});
    };
    const handleVisibility = () => {
      if (globalThis.document?.visibilityState === 'hidden') flushLocal();
    };

    globalThis.addEventListener?.('pagehide', flushLocal);
    globalThis.addEventListener?.('beforeunload', flushLocal);
    globalThis.document?.addEventListener?.('visibilitychange', handleVisibility);

    return () => {
      flushLocal();
      globalThis.removeEventListener?.('pagehide', flushLocal);
      globalThis.removeEventListener?.('beforeunload', flushLocal);
      globalThis.document?.removeEventListener?.('visibilitychange', handleVisibility);
    };
  }, []);

  const chuyenTab = async (id) => {
    await luuNgayDanhMuc({ source: 'catalog_switch_tab' }).catch(() => {});
    setDanhMucHienTai(id);
    await AsyncStorage.setItem('TAB_DANG_MO', id);
  };

  const handleAddColumn = () => {
    if (!newColumnName) return alert("Vui lòng nhập tên trường thông tin mới!");
    const columnName = newColumnName.trim().toUpperCase().replace(/ /g, '_');
    if (columns.includes(columnName)) return alert("Trường thông tin này đã tồn tại!");
    const nextColumns = [...columns, columnName];
    danhDauDaSua();
    columnsRef.current = nextColumns;
    setColumns(nextColumns);
    setNewColumnName('');
  };

  const handleAddRow = () => {
    if (columns.length === 0) return alert("Vui lòng thêm ít nhất một cột trước!");
    const newRow = {};
    columns.forEach(col => newRow[col] = "");
    const nextData = [newRow, ...data];
    danhDauDaSua();
    dataRef.current = nextData;
    setData(nextData);
    setTrangHienTai(1);
  };

  const handleDeleteRow = (index) => {
    if (Platform.OS === 'web' && !window.confirm("Bác sĩ có chắc chắn muốn xóa dòng này?")) return;
    const newData = [...data];
    newData.splice(index, 1);
    danhDauDaSua();
    dataRef.current = newData;
    setData(newData);
  };

  const handleCellChange = (text, rowIndex, colName) => {
    const newData = [...data];
    newData[rowIndex][colName] = text;
    danhDauDaSua();
    dataRef.current = newData;
    setData(newData);
  };

  const handleExportXLSX = () => {
    if (data.length === 0) return alert("Không có dữ liệu để xuất!");
    if (Platform.OS === 'web') {
      try {
        const worksheet = XLSX.utils.json_to_sheet(data, { header: columns });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, danhMucHienTai.substring(0, 31)); 
        XLSX.writeFile(workbook, `Du_Lieu_${danhMucHienTai}.xlsx`);
      } catch (error) {
        alert("Có lỗi xảy ra: " + error.message);
      }
    }
  };

  const handleTaiFileMau = () => {
    if (Platform.OS !== 'web') {
      alert("Tính năng tải file mẫu chỉ hỗ trợ trên nền tảng Web.");
      return;
    }
    const cotMau = MAU_EXCEL_CHUAN[danhMucHienTai] || ['MA_DU_LIEU', 'TEN_DU_LIEU', 'GHI_CHU'];
    const dataMau = cotMau.reduce((acc, curr) => ({ ...acc, [curr]: "" }), {});

    try {
      const worksheet = XLSX.utils.json_to_sheet([dataMau], { header: cotMau });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, `FileMau_${danhMucHienTai}.xlsx`);
    } catch (error) {
      alert("Lỗi tạo file mẫu: " + error.message);
    }
  };

  const taiLaiDuLieuHienTai = async () => {
    try {
      const { data: finalData, columns: finalColumns } = await taiBoDuLieuDanhMuc({
        dataKey: danhMucHienTai,
        columnsKey: layKhoaCotDanhMuc(danhMucHienTai),
        fallbackColumns: MAU_EXCEL_CHUAN[danhMucHienTai] || [],
      });
      dirtyRef.current = false;
      dataRef.current = finalData;
      columnsRef.current = finalColumns;
      setData(finalData);
      setColumns(finalColumns);
    } catch (e) {
      alert(`❌ Lỗi tải lại dữ liệu: ${e.message || e}`);
    }
  };

  const handleDoiSoatFirebase = async () => {
    try {
      const kq = await doiSoatBoDuLieuDanhMucVoiFirebase({
        dataKey: danhMucHienTai,
        columnsKey: layKhoaCotDanhMuc(danhMucHienTai),
      });
      alert([
        `ĐỐI SOÁT FIREBASE - ${danhMucHienTai}`,
        '',
        dinhDangKhoiMeta('Dữ liệu chính', kq.data),
        '',
        dinhDangKhoiMeta('Cấu trúc cột', kq.columns),
      ].join('\n'));
    } catch (e) {
      alert(`❌ Không thể đối soát Firebase: ${e.message || e}`);
    }
  };

  const handleDoiSoatTatCaFirebase = async () => {
    try {
      const ketQua = [];
      for (const tab of DANH_SACH_TAB_DONG_BO) {
        const item = await doiSoatBoDuLieuDanhMucVoiFirebase({
          dataKey: tab.dataKey,
          columnsKey: tab.columnsKey,
        });
        ketQua.push({ ...tab, ...item });
      }

      const tongHop = tomTatDongBo(ketQua);
      const chiTiet = ketQua
        .filter((item) => item.data.differs || item.columns.differs || item.data.status?.has_unsynced_local_changes || item.columns.status?.has_unsynced_local_changes)
        .map((item) => {
          const nhan = [];
          if (item.data.differs || item.columns.differs) nhan.push('lệch Firebase');
          if (item.data.status?.has_unsynced_local_changes || item.columns.status?.has_unsynced_local_changes) nhan.push('local chưa đồng bộ');
          if (item.data.status?.can_auto_hydrate || item.columns.status?.can_auto_hydrate) nhan.push('có thể tải an toàn');
          return `- ${item.ten}: ${nhan.join(', ') || 'đang khớp'}`;
        });

      alert([
        'ĐỐI SOÁT TOÀN BỘ DANH MỤC VỚI FIREBASE',
        '',
        `Tổng tab: ${tongHop.tong}`,
        `Số tab lệch dữ liệu: ${tongHop.lech}`,
        `Số tab có thể tải an toàn: ${tongHop.coTheTai}`,
        `Số tab có thay đổi local chưa đồng bộ: ${tongHop.coLocalChuaDongBo}`,
        '',
        chiTiet.length > 0 ? chiTiet.join('\n') : 'Tất cả tab đang khớp hoặc Firebase chưa có dữ liệu.',
      ].join('\n'));
    } catch (e) {
      alert(`❌ Không thể đối soát toàn bộ danh mục: ${e.message || e}`);
    }
  };

  const handleTaiTuFirebase = async () => {
    if (Platform.OS === 'web' && !window.confirm(`Tải lại ${danhMucHienTai} từ Firebase sẽ ghi đè dữ liệu local hiện tại của tab này. Tiếp tục?`)) {
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        await taoBanSaoDuLieuHeThong({
          reason: `AUTO_BEFORE_FIREBASE_PULL_${danhMucHienTai}`,
          includeKeys: ['TAB_DANG_MO'],
        });
      } catch (backupError) {
        console.warn('Không tạo được auto-backup trước khi tải từ Firebase:', backupError);
      }
    }

    try {
      isReadyToSave.current = false;
      const { data: finalData, columns: finalColumns, hydratedFromFirebase } = await taiBoDuLieuDanhMuc({
        dataKey: danhMucHienTai,
        columnsKey: layKhoaCotDanhMuc(danhMucHienTai),
        fallbackColumns: MAU_EXCEL_CHUAN[danhMucHienTai] || [],
        forceDownloadFromFirebase: true,
      });

      dirtyRef.current = false;
      dataRef.current = finalData;
      columnsRef.current = finalColumns;
      setData(finalData);
      setColumns(finalColumns);
      try { xoaCacheBoMayGiamDinh(); } catch {}

      if (hydratedFromFirebase) {
        alert(`✅ Đã tải ${finalData.length} dòng và ${finalColumns.length} cột từ Firebase cho ${danhMucHienTai}.`);
      } else {
        alert(`⚠️ Firebase chưa có dữ liệu phù hợp để tải cho ${danhMucHienTai} hoặc kết nối chưa sẵn sàng.`);
      }
    } catch (e) {
      alert(`❌ Không thể tải dữ liệu từ Firebase: ${e.message || e}`);
    } finally {
      setTimeout(() => { isReadyToSave.current = true; }, 300);
    }
  };

  const handleTaiTatCaTuFirebase = async () => {
    if (
      Platform.OS === 'web'
      && !window.confirm('Tải toàn bộ danh mục từ Firebase sẽ ghi đè dữ liệu local của các tab có dữ liệu trên Firebase. Tiếp tục?')
    ) {
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        await taoBanSaoDuLieuHeThong({
          reason: 'AUTO_BEFORE_FIREBASE_PULL_ALL_CATALOGS',
          includeKeys: ['TAB_DANG_MO'],
        });
      } catch (backupError) {
        console.warn('Không tạo được auto-backup trước khi tải toàn bộ từ Firebase:', backupError);
      }
    }

    try {
      isReadyToSave.current = false;
      const ketQua = [];
      for (const tab of DANH_SACH_TAB_DONG_BO) {
        const result = await taiBoDuLieuDanhMuc({
          dataKey: tab.dataKey,
          columnsKey: tab.columnsKey,
          fallbackColumns: MAU_EXCEL_CHUAN[tab.id] || [],
          forceDownloadFromFirebase: true,
        });
        ketQua.push({
          ...tab,
          hydratedFromFirebase: !!result.hydratedFromFirebase,
          rowCount: Array.isArray(result.data) ? result.data.length : 0,
          columnCount: Array.isArray(result.columns) ? result.columns.length : 0,
        });
      }

      const { data: finalData, columns: finalColumns } = await taiBoDuLieuDanhMuc({
        dataKey: danhMucHienTai,
        columnsKey: layKhoaCotDanhMuc(danhMucHienTai),
        fallbackColumns: MAU_EXCEL_CHUAN[danhMucHienTai] || [],
      });
      dirtyRef.current = false;
      dataRef.current = finalData;
      columnsRef.current = finalColumns;
      setData(finalData);
      setColumns(finalColumns);
      try { xoaCacheBoMayGiamDinh(); } catch {}

      const daTai = ketQua.filter((item) => item.hydratedFromFirebase);
      const chuaCo = ketQua.filter((item) => !item.hydratedFromFirebase);
      alert([
        '✅ ĐÃ TẢI TOÀN BỘ DANH MỤC TỪ FIREBASE',
        '',
        `Tab tải thành công: ${daTai.length}/${ketQua.length}`,
        daTai.length > 0 ? daTai.map((item) => `- ${item.ten}: ${item.rowCount} dòng, ${item.columnCount} cột`).join('\n') : '- Không có tab nào tải được từ Firebase.',
        '',
        chuaCo.length > 0 ? `Tab chưa có dữ liệu Firebase hoặc không tải được: ${chuaCo.map((item) => item.ten).join(', ')}` : 'Tất cả tab đều đã nạp từ Firebase.',
      ].join('\n'));
    } catch (e) {
      alert(`❌ Không thể tải toàn bộ danh mục từ Firebase: ${e.message || e}`);
    } finally {
      setTimeout(() => { isReadyToSave.current = true; }, 300);
    }
  };

  const handleTaoSaoLuuThuCong = async () => {
    try {
      const kq = await taoBanSaoDuLieuHeThong({
        reason: `MANUAL_BACKUP_${danhMucHienTai}`,
        includeKeys: ['TAB_DANG_MO'],
      });
      alert(`✅ Đã tạo bản sao lưu: ${kq.snapshot_id}\nSố khóa lưu: ${kq.entry_count}`);
    } catch (e) {
      alert(`❌ Không thể sao lưu dữ liệu: ${e.message || e}`);
    }
  };

  const handlePhucHoiBanGanNhat = async () => {
    try {
      const kq = await phucHoiBanSaoGanNhat();
      if (!kq.ok) {
        alert(`⚠️ ${kq.message || 'Chưa có bản sao lưu để phục hồi.'}`);
        return;
      }
      await taiLaiDuLieuHienTai();
      alert(`✅ Đã phục hồi từ bản sao gần nhất (${kq.snapshot_id}).`);
    } catch (e) {
      alert(`❌ Không thể phục hồi bản sao lưu: ${e.message || e}`);
    }
  };

  // 4. XỬ LÝ IMPORT EXCEL (KÈM LƯU VẬT LÝ BẰNG CHUNKING)
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const importedData = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (Platform.OS !== 'web') {
        try {
          await taoBanSaoDuLieuHeThong({
            reason: `AUTO_BEFORE_IMPORT_${danhMucHienTai}`,
            includeKeys: ['TAB_DANG_MO'],
          });
        } catch (errBackup) {
          console.warn("Không tạo được auto-backup trước import:", errBackup);
        }
      }
      
      if (importedData.length > 0) {
        const mergedCols = [...new Set([...columns, ...Object.keys(importedData[0])])];
        const newData = [...importedData, ...data];
        
        setColumns(mergedCols);
        setData(newData);
        dataRef.current = newData;
        columnsRef.current = mergedCols;
        dirtyRef.current = false;
        setTrangHienTai(1);

        try {
          await luuBoDuLieuDanhMuc({
            dataKey: danhMucHienTai,
            columnsKey: layKhoaCotDanhMuc(danhMucHienTai),
            data: newData,
            columns: mergedCols,
            source: 'catalog_import_excel',
            syncRemote: true,
          });
          try { xoaCacheBoMayGiamDinh(); } catch {}
          flushFirebaseDanhMucQueue().catch(() => {});
          alert(`✅ Đã Import thành công ${importedData.length} dòng dữ liệu. Hệ thống đã lưu bền vững và xếp hàng đồng bộ Firebase.`);
        } catch (err) {
          alert("❌ Lỗi lưu khi import: " + err.message);
        }
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  const tongSoTrang = Math.max(1, Math.ceil(data.length / SO_DONG_MOI_TRANG_DANH_MUC));
  const trangDangXem = Math.min(trangHienTai, tongSoTrang);
  const chiSoBatDau = (trangDangXem - 1) * SO_DONG_MOI_TRANG_DANH_MUC;
  const chiSoKetThuc = Math.min(data.length, chiSoBatDau + SO_DONG_MOI_TRANG_DANH_MUC);
  const duLieuTrang = data.slice(chiSoBatDau, chiSoKetThuc);

  return (
    <SafeAreaView style={styles.vung_an_toan}>
      <View style={styles.thanh_tieu_de}>
        <TouchableOpacity onPress={() => quayLaiAnToan(navigation, 'TongQuan')} style={styles.nut_quay_lai}>
          <Text style={styles.chu_nut_header}>⬅ TRỞ VỀ TỔNG QUAN</Text>
        </TouchableOpacity>
        <Text style={styles.chu_tieu_de}>🗄️ QUẢN LÝ DANH MỤC (MASTER DATA)</Text>
        <View style={{ width: 180 }} />
      </View>

      <View style={styles.khung_chuc_nang}>
        
        {/* THANH TAB ĐIỀU HƯỚNG */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.khung_tab}>
          {DANH_SACH_TAB.map(tab => (
            <TouchableOpacity 
              key={tab.id} 
              onPress={() => chuyenTab(tab.id)} 
              style={[
                styles.nut_tab, 
                danhMucHienTai === tab.id && styles.nut_tab_active,
                ['DANH_MUC_ICD10', 'DANH_MUC_ICD10_CAP_CUU', 'DANH_MUC_ICD10_KE_DON_TREN_30_NGAY'].includes(tab.id) && styles.nut_tab_dac_biet
              ]}
            >
              <Text style={[
                styles.chu_tab, 
                danhMucHienTai === tab.id && styles.chu_tab_active,
                ['DANH_MUC_ICD10', 'DANH_MUC_ICD10_CAP_CUU', 'DANH_MUC_ICD10_KE_DON_TREN_30_NGAY'].includes(tab.id) && styles.chu_tab_dac_biet
              ]}>
                {tab.ten}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.thanh_cong_cu}>
          <View style={styles.khoi_them_cot}>
            <TextInput style={styles.o_nhap_cot} placeholder="Tên cột (VD: MA_KHOA)" value={newColumnName} onChangeText={setNewColumnName} outlineStyle="none" />
            <TouchableOpacity style={styles.nut_xanh} onPress={handleAddColumn}>
              <Text style={styles.chu_nut}>+ THÊM CỘT</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.khoi_hanh_dong}>
            <TouchableOpacity style={styles.nut_xanh_la} onPress={handleTaiFileMau}>
              <Text style={styles.chu_nut}>⬇ TẢI FILE MẪU</Text>
            </TouchableOpacity>
            
            {Platform.OS === 'web' && (
              <React.Fragment>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} style={{ display: 'none' }} id="import-excel-danhmuc" />
                <TouchableOpacity style={styles.nut_cam} onPress={() => document.getElementById('import-excel-danhmuc').click()}>
                  <Text style={styles.chu_nut}>📤 IMPORT EXCEL</Text>
                </TouchableOpacity>
              </React.Fragment>
            )}

            <TouchableOpacity style={styles.nut_xanh_duong} onPress={handleExportXLSX}>
              <Text style={styles.chu_nut}>📥 EXPORT BẢNG</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nut_xanh_duong} onPress={handleDoiSoatFirebase}>
              <Text style={styles.chu_nut}>☁ ĐỐI SOÁT FIREBASE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nut_xanh_duong} onPress={handleDoiSoatTatCaFirebase}>
              <Text style={styles.chu_nut}>☁ ĐỐI SOÁT TẤT CẢ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nut_cam} onPress={handleTaiTuFirebase}>
              <Text style={styles.chu_nut}>☁ TẢI TỪ FIREBASE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nut_cam} onPress={handleTaiTatCaTuFirebase}>
              <Text style={styles.chu_nut}>☁ TẢI TẤT CẢ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nut_xanh_duong} onPress={handleTaoSaoLuuThuCong}>
              <Text style={styles.chu_nut}>💾 SAO LƯU</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nut_phuc_hoi} onPress={handlePhucHoiBanGanNhat}>
              <Text style={styles.chu_nut}>↩ PHỤC HỒI GẦN NHẤT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.nut_hong} onPress={handleAddRow}>
              <Text style={styles.chu_nut}>+ THÊM DÒNG</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nut_do} onPress={() => alert(`Đang hiển thị ${data.length} dòng. Hệ thống tự động ghi nhớ mọi thay đổi!`)}>
              <Text style={styles.chu_nut}>💾 ĐÃ TỰ LƯU</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BẢNG DỮ LIỆU ĐỘNG FULLSCREEN */}
        <View style={styles.khung_bang_master}>
          <View style={styles.khung_phan_trang}>
            <Text style={styles.chu_phan_trang}>
              {data.length > 0
                ? `Hiển thị ${chiSoBatDau + 1}-${chiSoKetThuc}/${data.length} dòng | Trang ${trangDangXem}/${tongSoTrang}`
                : 'Danh mục đang trống'}
            </Text>
            {tongSoTrang > 1 && (
              <View style={styles.nhom_phan_trang}>
                <TouchableOpacity
                  style={[styles.nut_phan_trang, trangDangXem <= 1 && styles.nut_phan_trang_tat]}
                  onPress={() => setTrangHienTai((prev) => Math.max(1, prev - 1))}
                  disabled={trangDangXem <= 1}
                >
                  <Text style={styles.chu_nut_phan_trang}>TRUOC</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nut_phan_trang, trangDangXem >= tongSoTrang && styles.nut_phan_trang_tat]}
                  onPress={() => setTrangHienTai((prev) => Math.min(tongSoTrang, prev + 1))}
                  disabled={trangDangXem >= tongSoTrang}
                >
                  <Text style={styles.chu_nut_phan_trang}>SAU</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <ScrollView horizontal style={styles.scroll_ngang}>
            <View style={styles.bang_chinh}>
              <View style={styles.dong_tieu_de}>
                <View style={[styles.o_tieu_de, { width: 90 }]}><Text style={styles.chu_o_tieu_de}>STT</Text></View>
                {columns.map((col, index) => {
                  const rongCot = layDoRongCot(col);
                  return (
                    <View key={index} style={[styles.o_tieu_de, { width: rongCot }]}>
                      <Text style={styles.chu_o_tieu_de}>{col}</Text>
                    </View>
                  );
                })}
                <View style={[styles.o_tieu_de, { width: 160 }]}><Text style={styles.chu_o_tieu_de}>THAO TÁC</Text></View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} style={styles.scroll_doc}>
                {duLieuTrang.map((row, rowIndex) => {
                  const globalIndex = chiSoBatDau + rowIndex;
                  return (
                  <View key={globalIndex} style={[styles.dong_du_lieu, { backgroundColor: globalIndex % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)' }]}>
                    <View style={[styles.o_du_lieu_stt, { width: 90 }]}>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F48FB1' }}>{globalIndex + 1}</Text>
                    </View>
                    {columns.map((col, colIndex) => {
                      const rongCot = layDoRongCot(col);
                      return (
                        <TextInput
                          key={colIndex}
                          style={[styles.o_du_lieu, { width: rongCot }]}
                          value={String(row[col] || '')}
                          onChangeText={(text) => handleCellChange(text, globalIndex, col)}
                          multiline
                          textAlignVertical="top"
                          outlineStyle="none"
                        />
                      );
                    })}
                    <View style={[styles.o_thao_tac, { width: 160 }]}>
                      <TouchableOpacity onPress={() => handleDeleteRow(globalIndex)} style={styles.nut_xoa}>
                        <Text style={styles.chu_nut_xoa}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )})}
                {data.length === 0 && (
                  <Text style={styles.txt_trong}>
                    Danh mục đang trống. Bác sĩ có thể bấm nút TẢI FILE MẪU rồi IMPORT EXCEL để nạp dữ liệu.
                  </Text>
                )}
                <View style={{ height: 100 }} />
              </ScrollView>
            </View>
          </ScrollView>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  vung_an_toan: {
    flex: 1,
    backgroundColor: CD.bg.gradient_mobile,
    ...Platform.select({ web: { backgroundImage: CD.web.gradient_bg } }),
  },
  thanh_tieu_de: {
    backgroundColor: CD.brand.mauDam,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: CD.border.header,
    ...Platform.select({ web: { backgroundImage: CD.web.gradient_header, backdropFilter: CD.web.blur_header, boxShadow: CD.web.shadow_header } }),
  },
  nut_quay_lai: {
    padding: 12,
    backgroundColor: CD.bg.glass_input,
    borderWidth: 1,
    borderColor: CD.border.glass_md,
    borderRadius: 14,
  },
  chu_nut_header: { color: CD.text.primary, fontWeight: 'bold', fontSize: 20, fontFamily: CD.font.family },
  chu_tieu_de: { fontSize: 26, color: CD.text.primary, fontWeight: 'bold', fontFamily: CD.font.family },

  khung_chuc_nang: { padding: 25, flex: 1 },

  // TABS STYLE
  khung_tab: { flexDirection: 'row', marginBottom: 25, maxHeight: 65 },
  nut_tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: CD.bg.glass_card,
    marginRight: 15,
    borderRadius: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CD.border.glass,
  },
  nut_tab_active: {
    backgroundColor: CD.brand.mauChinh,
    borderWidth: 0,
    ...Platform.select({ web: { backgroundImage: CD.web.gradient_primary, boxShadow: CD.web.shadow_btn } }),
  },
  // Tab ICD-10 đặc biệt: dùng glass border accent xanh lam
  nut_tab_dac_biet: {
    borderWidth: 2,
    borderColor: 'rgba(100,181,246,0.5)',
    backgroundColor: 'rgba(25,118,210,0.15)',
  },
  chu_tab: { fontSize: 20, color: CD.text.secondary, fontWeight: 'bold', fontFamily: CD.font.family },
  chu_tab_active: { color: CD.text.primary },
  chu_tab_dac_biet: { color: CD.text.link },

  thanh_cong_cu: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, flexWrap: 'wrap', alignItems: 'center' },
  khoi_them_cot: { flexDirection: 'row', alignItems: 'center' },
  o_nhap_cot: {
    backgroundColor: CD.bg.glass_input,
    borderWidth: 1,
    borderColor: CD.border.input,
    borderRadius: 12,
    color: CD.text.primary,
    fontSize: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: 280,
    marginRight: 15,
    fontFamily: CD.font.family,
    ...Platform.select({ web: { backdropFilter: CD.web.blur_input, outlineStyle: 'none' } }),
  },
  khoi_hanh_dong: { flexDirection: 'row', gap: 15 },

  // "+ THÊM CỘT" → primary button
  nut_xanh: {
    backgroundColor: CD.brand.mauChinh,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { backgroundImage: CD.web.gradient_primary, boxShadow: CD.web.shadow_btn, cursor: CD.web.cursor_pointer } }),
  },
  // TẢI FILE MẪU → green button
  nut_xanh_la: {
    backgroundColor: '#388E3C',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    ...Platform.select({ web: { backgroundImage: CD.web.gradient_green, boxShadow: CD.web.shadow_btn_green, cursor: CD.web.cursor_pointer } }),
  },
  // EXPORT BẢNG → secondary glass
  nut_xanh_duong: {
    backgroundColor: CD.bg.glass_input,
    borderWidth: 1,
    borderColor: CD.border.glass_md,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  // IMPORT EXCEL → green button
  nut_cam: {
    backgroundColor: '#388E3C',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    ...Platform.select({ web: { backgroundImage: CD.web.gradient_green, boxShadow: CD.web.shadow_btn_green, cursor: CD.web.cursor_pointer } }),
  },
  // + THÊM DÒNG → primary button
  nut_hong: {
    backgroundColor: CD.brand.mauChinh,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { backgroundImage: CD.web.gradient_primary, boxShadow: CD.web.shadow_btn, cursor: CD.web.cursor_pointer } }),
  },
  // ĐÃ TỰ LƯU → secondary glass
  nut_do: {
    backgroundColor: CD.bg.glass_input,
    borderWidth: 1,
    borderColor: CD.border.glass_md,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  chu_nut: { color: CD.text.primary, fontWeight: 'bold', fontSize: 18, fontFamily: CD.font.family },

  // KHU VỰC BẢNG FULLSCREEN FLEX 1
  khung_bang_master: {
    flex: 1,
    backgroundColor: CD.bg.glass_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CD.border.glass,
    overflow: 'hidden',
    ...Platform.select({ web: { backdropFilter: CD.web.blur_card, WebkitBackdropFilter: CD.web.blur_card, boxShadow: CD.web.shadow_card } }),
  },
  khung_phan_trang: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  chu_phan_trang: {
    color: CD.text.secondary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: CD.font.family,
  },
  nhom_phan_trang: {
    flexDirection: 'row',
    gap: 8,
  },
  nut_phan_trang: {
    backgroundColor: CD.brand.mauPhu,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: CD.border.glass_md,
  },
  nut_phan_trang_tat: {
    opacity: 0.45,
  },
  chu_nut_phan_trang: {
    color: CD.text.primary,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: CD.font.family,
  },
  scroll_ngang: { flex: 1 },
  bang_chinh: { flex: 1, minWidth: '100%' },

  dong_tieu_de: { flexDirection: 'row', backgroundColor: '#BBDEFB', borderBottomWidth: 2, borderColor: '#1976D2' },
  o_tieu_de: { padding: 18, borderRightWidth: 1, borderColor: CD.border.divider, justifyContent: 'center' },
  chu_o_tieu_de: { fontWeight: '700', fontSize: 19, color: '#000000', fontFamily: CD.font.family, textAlign: 'center', lineHeight: 24 },

  scroll_doc: { flex: 1 },
  dong_du_lieu: { flexDirection: 'row', borderBottomWidth: 1, borderColor: CD.border.divider, minHeight: 65 },
  o_du_lieu_stt: {
    padding: 18,
    borderRightWidth: 1,
    borderColor: CD.border.divider,
    backgroundColor: CD.bg.table_header,
    alignItems: 'center',
    justifyContent: 'center',
  },
  o_du_lieu: {
    padding: 18,
    borderRightWidth: 1,
    borderColor: CD.border.divider,
    minHeight: 78,
    fontSize: 18,
    color: CD.text.table_cell,
    fontFamily: CD.font.family,
    lineHeight: 26,
    backgroundColor: CD.bg.glass_input,
  },
  // PHUC HOI BAN SAO → amber button
  nut_phuc_hoi: {
    backgroundColor: '#F9A825',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    ...Platform.select({ web: { boxShadow: CD.web.shadow_btn, cursor: CD.web.cursor_pointer } }),
  },
  o_thao_tac: { padding: 10, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: CD.border.divider },
  nut_xoa: {
    backgroundColor: CD.bg.glass_input,
    borderWidth: 1,
    borderColor: CD.border.glass_md,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  chu_nut_xoa: { color: CD.text.primary, fontWeight: 'bold', fontSize: 18, fontFamily: CD.font.family },
  txt_trong: { padding: 40, fontSize: 22, fontStyle: 'italic', color: CD.text.muted, textAlign: 'center', fontFamily: CD.font.family }
});

export default ManHinhQuanLyDanhMuc;
