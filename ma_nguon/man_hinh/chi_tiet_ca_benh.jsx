/**
 * PHÂN HỆ: CHI TIẾT HỒ SƠ BỆNH ÁN & CẢNH BÁO CDSS
 * Chức năng:
 * 1. Truy xuất hồ sơ theo MA_LK từ kho lưu trữ hiện hành.
 * 2. Hiển thị chi tiết XML1 đến XML6 và giải thích rõ bảng nào không có trong file gốc.
 * 3. Tổng hợp cảnh báo để đối soát nhanh.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CD } from '../tien_ich/chu_de_giao_dien';
import { chuanHoaDanhSachCanhBaoGiamDinh, chuanHoaHoSoCanhBao } from '../tien_ich/chuan_hoa_van_ban';
import { chayGiamDinhToanDienV15 } from '../tien_ich/dong_co_giam_dinh';
import { quayLaiAnToan } from '../tien_ich/dieu_huong_an_toan';
import { layNhieuHoSoTuKho } from '../tien_ich/kho_du_lieu';

const layThongDiepTrangThaiXml = (meta, tenXml, coDuLieu) => {
  if (coDuLieu) return '';
  const upper = String(tenXml || '').toUpperCase();
  if ((meta?.missingXmlTypes || []).includes(upper)) return `Không có ${upper} trong file gốc.`;
  if ((meta?.emptyXmlTypes || []).includes(upper)) return `${upper} có trong file gốc nhưng không đọc được dữ liệu chi tiết.`;
  return `Không có dữ liệu ${upper}.`;
};

const renderDongInfo = (styles, label, value) => (
  <View style={styles.dong_info}>
    <Text style={styles.txt_label}>{label}:</Text>
    <Text style={styles.txt_value}>{value || '---'}</Text>
  </View>
);

const renderDanhSach = (styles, danhSach, renderItem, emptyMessage) => {
  if (!Array.isArray(danhSach) || danhSach.length === 0) {
    return <Text style={styles.txt_empty}>{emptyMessage}</Text>;
  }
  return danhSach.map(renderItem);
};

const locDongHopLe = (danhSach) =>
  (Array.isArray(danhSach) ? danhSach : []).filter(
    (item) => item && typeof item === 'object' && !item.parsererror && Object.keys(item).length > 0
  );

const ManHinhChiTiet = ({ route, navigation }) => {
  const { maLK, chi_tiet_loi, benh_nhan_duoc_chon } = route.params || {};

  const [hoSo, setHoSo] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [danhSachLoiTam, setDanhSachLoiTam] = useState([]);

  useEffect(() => {
    const taiDuLieu = async () => {
      try {
        if (!maLK) return;
        const [data] = await layNhieuHoSoTuKho([maLK]);
        setHoSo(chuanHoaHoSoCanhBao(data || null));
      } finally {
        setDangTai(false);
      }
    };

    taiDuLieu();
  }, [maLK]);

  const dataGoc = hoSo?.du_lieu_goc || hoSo || {};
  const metaXml = dataGoc?._meta || {};
  const xml1 = dataGoc?.xml1 || dataGoc?.XML1 || {};
  const xml2 = locDongHopLe(dataGoc?.xml2 || dataGoc?.XML2 || []);
  const xml3 = locDongHopLe(dataGoc?.xml3 || dataGoc?.XML3 || []);
  const xml4 = locDongHopLe(dataGoc?.xml4 || dataGoc?.XML4 || []);
  const xml5 = locDongHopLe(dataGoc?.xml5 || dataGoc?.XML5 || []);
  const xml6 = locDongHopLe(dataGoc?.xml6 || dataGoc?.XML6 || []);
  const maLkHienThi = xml1?.MA_LK || dataGoc?.ma_lk || maLK || 'N/A';

  const danhSachLoi = useMemo(() => {
    if (danhSachLoiTam.length > 0) return chuanHoaDanhSachCanhBaoGiamDinh(danhSachLoiTam);
    return chuanHoaDanhSachCanhBaoGiamDinh(
      chi_tiet_loi || benh_nhan_duoc_chon?.chi_tiet_loi || hoSo?.ket_qua_giam_dinh || hoSo?.lich_su_audit || []
    );
  }, [benh_nhan_duoc_chon, chi_tiet_loi, danhSachLoiTam, hoSo]);

  const handleChayGiamDinh = async () => {
    if (!dataGoc || Object.keys(dataGoc).length === 0) {
      Alert.alert('Lỗi', 'Không có dữ liệu gốc để kiểm tra.');
      return;
    }

    const ketQua = await chayGiamDinhToanDienV15(dataGoc);
    const dsLoi = Array.isArray(ketQua) ? ketQua : [];
    setDanhSachLoiTam(chuanHoaDanhSachCanhBaoGiamDinh(dsLoi));

    const message = dsLoi.length > 0
      ? dsLoi.slice(0, 12).map((v) => `- [${v.phan_he || 'Tổng quát'}] ${v.canh_bao}`).join('\n')
      : 'Hồ sơ không có vi phạm theo bộ kiểm tra hiện hành.';

    Alert.alert('Kết quả giám định', message);
  };

  if (dangTai) {
    return (
      <View style={styles.khung_loading}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.txt_loading}>Đang truy lục hồ sơ bệnh án...</Text>
      </View>
    );
  }

  if (!hoSo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.khung_error}>
          <Text style={styles.txt_error}>Không tìm thấy hồ sơ chi tiết cho MA_LK: {maLK}</Text>
          <TouchableOpacity style={styles.btn_back_pink} onPress={() => quayLaiAnToan(navigation, 'TongQuan')}>
            <Text style={styles.txt_btn_back}>QUAY LẠI</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.btn_back_icon} onPress={() => quayLaiAnToan(navigation, 'TongQuan')}>
          <Text style={styles.txt_back_icon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.tieu_de_header}>CHI TIẾT HỒ SƠ: {maLkHienThi}</Text>
        <TouchableOpacity style={styles.btn_header_action} onPress={handleChayGiamDinh}>
          <Text style={styles.txt_btn_header_action}>Chạy GD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.section}>
          <Text style={styles.tieu_de_section}>THÔNG TIN HÀNH CHÍNH (XML1)</Text>
          <View style={styles.card}>
            {Object.keys(xml1 || {}).length > 0 ? (
              <>
                {renderDongInfo(styles, 'Họ và tên', xml1.HO_TEN)}
                {renderDongInfo(styles, 'Mã bệnh nhân', xml1.MA_BN)}
                {renderDongInfo(styles, 'Ngày sinh', xml1.NGAY_SINH)}
                {renderDongInfo(styles, 'Giới tính', xml1.GIOI_TINH === '1' ? 'Nam' : xml1.GIOI_TINH === '2' ? 'Nữ' : xml1.GIOI_TINH)}
                {renderDongInfo(styles, 'Mã thẻ BHYT', xml1.MA_THE_BHYT || xml1.MA_THE)}
                {renderDongInfo(styles, 'Địa chỉ', xml1.DIA_CHI)}
                {renderDongInfo(styles, 'Chẩn đoán vào', xml1.CHAN_DOAN_VAO)}
                {renderDongInfo(styles, 'Chẩn đoán ra', xml1.CHAN_DOAN_RV)}
                {renderDongInfo(styles, 'Mã bệnh chính', xml1.MA_BENH_CHINH)}
                {renderDongInfo(styles, 'Ngày vào', xml1.NGAY_VAO)}
                {renderDongInfo(styles, 'Ngày ra', xml1.NGAY_RA)}
                {renderDongInfo(styles, 'Tổng chi phí', `${Number(xml1.T_TONGCHI_BV || 0).toLocaleString()} VND`)}
              </>
            ) : (
              <Text style={styles.txt_empty}>{layThongDiepTrangThaiXml(metaXml, 'XML1', false)}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.tieu_de_section}>CẢNH BÁO VI PHẠM</Text>
          <View style={styles.card_error_container}>
            {Array.isArray(danhSachLoi) && danhSachLoi.length > 0 ? (
              danhSachLoi.map((loi, index) => {
                const isFixable = loi.truong_loi && loi.truong_loi !== 'UNKNOWN';
                const coSoPhapLy = String(loi.co_so_phap_ly || '').trim();

                return (
                  <View key={`${loi.phan_he || 'LOG'}_${index}`} style={styles.card_error_item}>
                    <View style={styles.loi_header}>
                      <View style={[styles.badge, { backgroundColor: isFixable ? '#43A047' : '#D32F2F' }]}>
                        <Text style={styles.txt_badge}>{isFixable ? 'SỬA ĐƯỢC' : 'HỆ THỐNG'}</Text>
                      </View>
                      <Text style={styles.txt_phan_he}>Phân hệ: {loi.phan_he || 'Tổng quát'}</Text>
                    </View>
                    <Text style={styles.txt_log}>- {loi.canh_bao || loi.noi_dung || `Vi phạm tại trường: ${loi.truong_loi}`}</Text>
                    {!!coSoPhapLy && <Text style={styles.txt_log_phap_ly}>Cơ sở pháp lý: {coSoPhapLy}</Text>}
                    <TouchableOpacity style={styles.btn_truy_van} onPress={() => navigation.navigate('SuaFileXML', { maLK: maLkHienThi, loi })}>
                      <Text style={styles.txt_truy_van}>Truy vấn và đề nghị sửa lỗi</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.card_error_sach}>
                <Text style={styles.txt_no_error}>Hồ sơ chưa ghi nhận vi phạm nghiêm trọng.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.tieu_de_section}>DANH MỤC THUỐC (XML2)</Text>
          {renderDanhSach(
            styles,
            xml2,
            (t, i) => (
              <View key={`xml2_${i}`} style={styles.item_list}>
                <Text style={styles.txt_item_name}>{`${i + 1}. ${t.TEN_THUOC || t.MA_THUOC || 'Thuốc'}`}</Text>
                <Text style={styles.txt_item_sub}>{`SL: ${t.SO_LUONG || '0'} | Đơn giá: ${Number(t.DON_GIA || 0).toLocaleString()}`}</Text>
              </View>
            ),
            layThongDiepTrangThaiXml(metaXml, 'XML2', xml2.length > 0)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.tieu_de_section}>DỊCH VỤ & VẬT TƯ (XML3)</Text>
          {renderDanhSach(
            styles,
            xml3,
            (d, i) => (
              <View key={`xml3_${i}`} style={styles.item_list}>
                <Text style={styles.txt_item_name}>{`${i + 1}. ${d.TEN_DICH_VU || d.TEN_VAT_TU || d.MA_DICH_VU || 'DVKT/VTYT'}`}</Text>
                <Text style={styles.txt_item_sub}>{`SL: ${d.SO_LUONG || '0'} | Thành tiền: ${Number(d.THANH_TIEN_BV || 0).toLocaleString()}`}</Text>
              </View>
            ),
            layThongDiepTrangThaiXml(metaXml, 'XML3', xml3.length > 0)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.tieu_de_section}>CẬN LÂM SÀNG (XML4)</Text>
          {renderDanhSach(
            styles,
            xml4,
            (d, i) => (
              <View key={`xml4_${i}`} style={styles.item_list}>
                <Text style={styles.txt_item_name}>{`${i + 1}. ${d.TEN_CHI_SO || d.MA_CHI_SO || d.MA_DICH_VU || 'CLS'}`}</Text>
                <Text style={styles.txt_item_sub}>{`Giá trị: ${d.GIA_TRI || '---'} | Kết luận: ${d.KET_LUAN || d.MO_TA || '---'}`}</Text>
              </View>
            ),
            layThongDiepTrangThaiXml(metaXml, 'XML4', xml4.length > 0)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.tieu_de_section}>DIỄN BIẾN ĐIỀU TRỊ (XML5)</Text>
          {renderDanhSach(
            styles,
            xml5,
            (d, i) => (
              <View key={`xml5_${i}`} style={styles.item_list}>
                <Text style={styles.txt_item_name}>{`${i + 1}. ${d.DIEN_BIEN || d.DIEN_BIEN_LS || 'Diễn biến'}`}</Text>
                <Text style={styles.txt_item_sub}>{`Thời điểm: ${d.NGAY_YL || d.THOI_DIEM_DBLS || '---'} | Người thực hiện: ${d.MA_BAC_SI || d.NGUOI_THUC_HIEN || '---'}`}</Text>
              </View>
            ),
            layThongDiepTrangThaiXml(metaXml, 'XML5', xml5.length > 0)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.tieu_de_section}>THANH TOÁN TỔNG HỢP (XML6)</Text>
          {renderDanhSach(
            styles,
            xml6,
            (d, i) => (
              <View key={`xml6_${i}`} style={styles.item_list}>
                <Text style={styles.txt_item_name}>{`${i + 1}. ${d.HO_TEN || d.MA_BN || 'Thanh toán'}`}</Text>
                <Text style={styles.txt_item_sub}>{`Ngày vào: ${d.NGAY_VAO || '---'} | Ngày ra: ${d.NGAY_RA || '---'}`}</Text>
              </View>
            ),
            layThongDiepTrangThaiXml(metaXml, 'XML6', xml6.length > 0)
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CD.bg.gradient_mobile,
    ...Platform.select({ web: { backgroundImage: CD.web.gradient_bg } }),
  },
  header: {
    backgroundColor: CD.brand.mauDam,
    borderBottomWidth: 1,
    borderBottomColor: CD.border.header,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        backgroundImage: CD.web.gradient_header,
        backdropFilter: CD.web.blur_header,
        boxShadow: CD.web.shadow_header,
      },
    }),
  },
  btn_back_icon: { padding: 10 },
  txt_back_icon: { color: CD.text.primary, fontSize: 30, fontWeight: 'bold' },
  tieu_de_header: { color: CD.text.primary, fontSize: 24, fontWeight: 'bold', fontFamily: CD.font.family, flex: 1, textAlign: 'center' },
  btn_header_action: {
    backgroundColor: CD.bg.glass_input,
    borderWidth: 1,
    borderColor: CD.border.glass_md,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 14,
  },
  txt_btn_header_action: { color: CD.text.primary, fontSize: 18, fontWeight: 'bold', fontFamily: CD.font.family },
  body: { flex: 1, padding: 15 },
  section: { marginBottom: 25 },
  tieu_de_section: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CD.brand.mauNhat,
    marginBottom: 12,
    fontFamily: CD.font.family,
    borderLeftWidth: 6,
    borderColor: CD.brand.mauChinh2,
    paddingLeft: 10,
  },
  card: {
    backgroundColor: CD.bg.glass_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CD.border.glass,
    padding: 20,
    ...Platform.select({
      web: {
        backdropFilter: CD.web.blur_card,
        WebkitBackdropFilter: CD.web.blur_card,
        boxShadow: CD.web.shadow_card,
      },
    }),
  },
  dong_info: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: CD.border.divider,
    paddingBottom: 8,
  },
  txt_label: { fontSize: 20, color: CD.text.secondary, width: 200, fontFamily: CD.font.family, fontWeight: 'bold' },
  txt_value: { fontSize: 20, color: CD.text.table_cell, flex: 1, fontFamily: CD.font.family },
  card_error_container: { gap: 15 },
  card_error_sach: {
    backgroundColor: CD.bg.glass_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CD.border.glass,
    padding: 20,
    ...Platform.select({
      web: {
        backdropFilter: CD.web.blur_card,
        WebkitBackdropFilter: CD.web.blur_card,
        boxShadow: CD.web.shadow_card,
      },
    }),
  },
  card_error_item: {
    backgroundColor: CD.bg.glass_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CD.border.glass,
    padding: 20,
    ...Platform.select({
      web: {
        backdropFilter: CD.web.blur_card,
        WebkitBackdropFilter: CD.web.blur_card,
        boxShadow: CD.web.shadow_card,
      },
    }),
  },
  loi_header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginRight: 12 },
  txt_badge: { color: CD.text.primary, fontSize: 18, fontWeight: 'bold', fontFamily: CD.font.family },
  txt_phan_he: { fontSize: 20, fontWeight: 'bold', color: CD.brand.mauNhat, fontFamily: CD.font.family },
  txt_log: { fontSize: 20, color: CD.text.table_cell, marginBottom: 10, fontFamily: CD.font.family, lineHeight: 30 },
  txt_log_phap_ly: { fontSize: 17, color: CD.text.muted, marginBottom: 12, fontFamily: CD.font.family, lineHeight: 24, fontStyle: 'italic' },
  txt_no_error: { fontSize: 20, color: CD.text.primary, fontWeight: 'bold', fontFamily: CD.font.family },
  btn_truy_van: { alignSelf: 'flex-start', paddingVertical: 5 },
  txt_truy_van: { fontSize: 20, color: CD.brand.mauNhat, fontWeight: 'bold', fontFamily: CD.font.family, textDecorationLine: 'underline' },
  item_list: {
    backgroundColor: CD.bg.glass_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CD.brand.mauChinh2,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    ...Platform.select({
      web: {
        backdropFilter: CD.web.blur_card,
        WebkitBackdropFilter: CD.web.blur_card,
        boxShadow: CD.web.shadow_card,
      },
    }),
  },
  txt_item_name: { fontSize: 20, fontWeight: 'bold', color: CD.text.primary, fontFamily: CD.font.family, marginBottom: 6 },
  txt_item_sub: { fontSize: 18, color: CD.text.secondary, fontFamily: CD.font.family, lineHeight: 26 },
  txt_empty: { fontSize: 18, color: CD.text.muted, fontStyle: 'italic', marginLeft: 15, fontFamily: CD.font.family, lineHeight: 28 },
  khung_loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CD.bg.gradient_mobile, gap: 12 },
  txt_loading: { fontSize: 20, color: CD.text.primary, fontFamily: CD.font.family },
  khung_error: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 18 },
  txt_error: { fontSize: 22, color: CD.text.primary, textAlign: 'center', fontFamily: CD.font.family, lineHeight: 32 },
  btn_back_pink: {
    backgroundColor: CD.brand.mauChinh,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  txt_btn_back: { color: CD.text.primary, fontSize: 18, fontWeight: 'bold', fontFamily: CD.font.family },
});

export default ManHinhChiTiet;
