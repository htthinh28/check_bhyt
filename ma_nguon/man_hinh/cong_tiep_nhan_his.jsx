/**
 * CỔNG TIẾP NHẬN DỮ LIỆU HIS - CDSS API GATEWAY
 * Chuẩn tích hợp: RESTful API (JSON/XML Base64) - Quyết định 130/QĐ-BYT
 * Tiền kiểm realtime để chặn lỗi từ khâu phát sinh dữ liệu HIS.
 */

import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HisAPI } from '../dich_vu/his_api.jsx';
import { CD } from '../tien_ich/chu_de_giao_dien';
import { quayLaiAnToan } from '../tien_ich/dieu_huong_an_toan';

const dinhDangThoiGian = (value) => {
  if (!value) return '--:--:--';
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return String(value);
  return time.toLocaleTimeString('vi-VN');
};

const dinhDangThoiDiem = (value) => {
  if (!value) return 'Chưa có';
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return String(value);
  return `${time.toLocaleDateString('vi-VN')} ${time.toLocaleTimeString('vi-VN')}`;
};

const mauTrangThai = (trangThai) => {
  if (trangThai === 'HỢP LỆ') return styles.tag_xanh;
  if (trangThai === 'THIẾU DỮ LIỆU') return styles.tag_cam;
  if (trangThai === 'LỖI KẾT NỐI') return styles.tag_do;
  return styles.tag_do;
};

const hienChiTietCanhBao = (log) => {
  const danhSachLoi = Array.isArray(log?.validation?.danh_sach_loi) ? log.validation.danh_sach_loi : [];
  const noiDung = [
    `Mã lượt khám: ${log?.ma_lk || 'Không xác định'}`,
    `Trạng thái: ${log?.trang_thai || 'Không xác định'}`,
    `Nguồn phân tích: ${log?.nguon_phan_tich || 'Không xác định'}`,
    `Thông điệp: ${log?.thong_diep || 'Không có'}`,
    '',
    danhSachLoi.length > 0 ? `Danh sách lỗi:\n- ${danhSachLoi.join('\n- ')}` : 'Không có danh sách lỗi chi tiết.',
  ].join('\n');

  if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
    globalThis.alert(noiDung);
    return;
  }

  Alert.alert('Chi tiết tiền kiểm HIS', noiDung);
};

const CongTiepNhanHIS = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false);
  const [logs, setLogs] = useState([]);
  const [hisConfig, setHisConfig] = useState(() => HisAPI.getConfig());
  const [realtimeStatus, setRealtimeStatus] = useState(() => HisAPI.getRealtimeStatus());
  const [restProbe, setRestProbe] = useState({ loading: false, ok: null, message: 'Chưa kiểm tra REST health.' });

  const capNhatTrangThai = () => {
    setHisConfig(HisAPI.getConfig());
    setRealtimeStatus(HisAPI.getRealtimeStatus());
  };

  useEffect(() => {
    capNhatTrangThai();
  }, []);

  useEffect(() => {
    if (!isListening) {
      HisAPI.disconnectWebSocket();
      capNhatTrangThai();
      return undefined;
    }

    let conHieuLuc = true;

    const daMo = HisAPI.connectWebSocket({
      autoReconnect: true,
      onStatus: (status) => {
        if (!conHieuLuc) return;
        setRealtimeStatus(status);
        setHisConfig(HisAPI.getConfig());
      },
      onMessage: (duLieu) => {
        if (!conHieuLuc) return;
        setLogs((prev) => [duLieu, ...prev].slice(0, 50));
      },
      onError: (error) => {
        if (!conHieuLuc) return;
        const thongDiep = error?.message || 'Kênh realtime HIS gặp lỗi kết nối.';
        setLogs((prev) => [
          {
            id: `ERR_${Date.now()}`,
            received_at: new Date().toISOString(),
            ma_lk: '-',
            khoa_phong: 'Không xác định',
            trang_thai: 'LỖI KẾT NỐI',
            thong_diep: thongDiep,
            so_loi: 1,
            dung_luong_kb: 0,
            nguon_phan_tich: 'websocket.error',
            validation: { hop_le: false, danh_sach_loi: [thongDiep] },
          },
          ...prev,
        ].slice(0, 50));
      },
    });

    if (!daMo) {
      capNhatTrangThai();
      setIsListening(false);
    }

    return () => {
      conHieuLuc = false;
      HisAPI.disconnectWebSocket();
    };
  }, [isListening]);

  const kiemTraRestHealth = async () => {
    setRestProbe({ loading: true, ok: null, message: 'Đang kiểm tra REST health từ HIS...' });
    try {
      await HisAPI.fetchREST('/health', 'GET');
      setRestProbe({ loading: false, ok: true, message: 'REST health HIS phản hồi thành công.' });
    } catch (error) {
      setRestProbe({ loading: false, ok: false, message: error?.message || 'Không kiểm tra được REST health HIS.' });
    }
    capNhatTrangThai();
  };

  return (
    <SafeAreaView style={styles.vung_an_toan}>
      <View style={styles.thanh_tieu_de}>
        <TouchableOpacity onPress={() => quayLaiAnToan(navigation, 'TongQuan')} style={styles.nut_quay_lai}>
          <Text style={styles.chu_nut}>⬅ QUAY LẠI TỔNG QUAN</Text>
        </TouchableOpacity>
        <Text style={styles.chu_tieu_de}>🔌 HIS API GATEWAY (REALTIME)</Text>
        <View style={styles.khoang_trong_tieu_de} />
      </View>

      <View style={styles.khung_chuc_nang}>
        <View style={styles.panel_trai}>
          <Text style={styles.tieu_de_panel}>⚙️ THÔNG SỐ TÍCH HỢP HIS THỰC TẾ</Text>
          <Text style={styles.mo_ta_panel}>
            Gateway này dùng cấu hình runtime thật của ứng dụng để nhận dữ liệu từ HIS qua REST và WebSocket. Mỗi hồ sơ realtime được
            tiền kiểm ngay lúc phát sinh để chặn lỗi thiếu MA_LK, HO_TEN, thẻ BHYT hoặc payload XML không đủ trước khi sang bước giám định.
          </Text>

          <View style={styles.the_cau_hinh}>
            <Text style={styles.nhan_cau_hinh}>REST Base URL</Text>
            <View style={styles.o_code}>
              <Text style={styles.chu_code}>{hisConfig.restBaseUrl || 'Chưa cấu hình'}</Text>
            </View>
          </View>

          <View style={styles.the_cau_hinh}>
            <Text style={styles.nhan_cau_hinh}>WebSocket URL</Text>
            <View style={styles.o_code}>
              <Text style={styles.chu_code}>{hisConfig.websocketUrl || 'Chưa cấu hình'}</Text>
            </View>
          </View>

          <View style={styles.the_cau_hinh}>
            <Text style={styles.nhan_cau_hinh}>Chính sách xác thực</Text>
            <View style={styles.o_code}>
              <Text style={styles.chu_code}>Tổ chức: {hisConfig.orgCode || 'Chưa khai báo'}</Text>
              <Text style={styles.chu_code}>Token: {hisConfig.token ? 'Đã có token runtime' : 'Chưa có token runtime'}</Text>
              <Text style={styles.chu_code}>Timeout: {hisConfig.timeoutMs} ms</Text>
            </View>
          </View>

          <View style={styles.the_cau_hinh}>
            <Text style={styles.nhan_cau_hinh}>Payload realtime được hỗ trợ</Text>
            <View style={styles.o_code_block}>
              <Text style={styles.chu_code}>{'{'}</Text>
              <Text style={styles.chu_code}>  "ma_lk": "2305010001",</Text>
              <Text style={styles.chu_code}>  "xml1_base64": "PD94bWwgdmVyc2...",</Text>
              <Text style={styles.chu_code}>  "xml2_base64": "PD94bWwgdmVyc2...",</Text>
              <Text style={styles.chu_code}>  "xml3_base64": "PD94bWwgdmVyc2..."</Text>
              <Text style={styles.chu_code}>{'}'}</Text>
            </View>
          </View>

          <View style={styles.khung_trang_thai}>
            <View style={styles.khoi_trang_thai_trai}>
              <Text style={styles.chu_trang_thai_to}>KÊNH REALTIME HIS</Text>
              <Text style={styles.mo_ta_trang_thai}>{realtimeStatus.message}</Text>
              <Text style={styles.chu_phu}>Cập nhật: {dinhDangThoiDiem(realtimeStatus.updatedAt)}</Text>
            </View>

            <View style={styles.khoi_trang_thai_phai}>
              <Switch
                trackColor={{ false: '#767577', true: '#B9E3FF' }}
                thumbColor={isListening ? '#1976D2' : '#f4f3f4'}
                onValueChange={() => setIsListening((prev) => !prev)}
                value={isListening}
                style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
              />
              <Text style={[styles.chu_trang_thai_to, realtimeStatus.connected ? styles.trang_thai_xanh : styles.trang_thai_do]}>
                {realtimeStatus.connected ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.nut_phu} onPress={kiemTraRestHealth}>
            <Text style={styles.chu_nut_phu}>{restProbe.loading ? 'ĐANG KIỂM TRA REST...' : 'KIỂM TRA REST HEALTH'}</Text>
          </TouchableOpacity>

          <View style={[styles.ket_qua_probe, restProbe.ok === true ? styles.ket_qua_probe_ok : restProbe.ok === false ? styles.ket_qua_probe_fail : null]}>
            <Text style={styles.chu_probe}>{restProbe.message}</Text>
          </View>
        </View>

        <View style={styles.panel_phai}>
          <Text style={styles.tieu_de_panel}>📡 LOG TIỀN KIỂM HỒ SƠ REALTIME</Text>
          <Text style={styles.mo_ta_panel}>
            Hồ sơ hợp lệ có thể đi tiếp xuống luồng giám định. Hồ sơ cảnh báo hoặc thiếu dữ liệu cần được sửa ngay tại HIS để tránh phát sinh lỗi dây chuyền.
          </Text>

          <View style={styles.dong_tieu_de_bang}>
            <Text style={[styles.cot_bang, { width: 110 }]}>THỜI GIAN</Text>
            <Text style={[styles.cot_bang, { width: 150 }]}>MÃ LƯỢT KHÁM</Text>
            <Text style={[styles.cot_bang, { width: 170 }]}>KHOA PHÒNG</Text>
            <Text style={[styles.cot_bang, { width: 110 }]}>DUNG LƯỢNG</Text>
            <Text style={[styles.cot_bang, { flex: 1 }]}>KẾT QUẢ</Text>
          </View>

          <ScrollView style={styles.khung_danh_sach_log}>
            {logs.length === 0 ? (
              <Text style={styles.chu_trong}>Cổng đang chờ dữ liệu thực từ HIS...</Text>
            ) : (
              logs.map((log) => (
                <View key={log.id} style={styles.dong_du_lieu_bang}>
                  <Text style={[styles.chu_du_lieu, { width: 110, color: '#5F6B7A' }]}>{dinhDangThoiGian(log.received_at)}</Text>
                  <Text style={[styles.chu_du_lieu, { width: 150, fontWeight: 'bold' }]}>{log.ma_lk}</Text>
                  <Text style={[styles.chu_du_lieu, { width: 170 }]}>{log.khoa_phong}</Text>
                  <Text style={[styles.chu_du_lieu, { width: 110, color: '#607085' }]}>{log.dung_luong_kb} KB</Text>
                  <View style={styles.khoi_ket_qua_log}>
                    <View>
                      <Text style={[styles.tag_trang_thai, mauTrangThai(log.trang_thai)]}>{log.trang_thai}</Text>
                      <Text style={styles.chu_du_lieu_phu}>{log.thong_diep}</Text>
                    </View>
                    {log.trang_thai !== 'HỢP LỆ' ? (
                      <TouchableOpacity style={styles.btn_xem_loi} onPress={() => hienChiTietCanhBao(log)}>
                        <Text style={styles.txt_xem_loi}>Chi tiết</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))
            )}
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CD.border.glass_md,
    ...Platform.select({ web: { cursor: CD.web.cursor_pointer } }),
  },
  chu_nut: { color: CD.text.primary, fontWeight: 'bold', fontSize: 20, fontFamily: CD.font.family },
  chu_tieu_de: { fontSize: 26, color: CD.text.primary, fontWeight: 'bold', fontFamily: CD.font.family },
  khoang_trong_tieu_de: { width: 220 },
  khung_chuc_nang: { flex: 1, flexDirection: 'row', padding: 20, gap: 20 },
  panel_trai: {
    flex: 4,
    backgroundColor: CD.bg.glass_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CD.border.glass,
    padding: 25,
    ...Platform.select({ web: { backdropFilter: CD.web.blur_card, WebkitBackdropFilter: CD.web.blur_card, boxShadow: CD.web.shadow_card } }),
  },
  panel_phai: {
    flex: 6,
    backgroundColor: CD.bg.glass_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CD.border.glass,
    padding: 25,
    ...Platform.select({ web: { backdropFilter: CD.web.blur_card, WebkitBackdropFilter: CD.web.blur_card, boxShadow: CD.web.shadow_card } }),
  },
  tieu_de_panel: { fontSize: 24, fontWeight: 'bold', color: CD.brand.mauNhat, fontFamily: CD.font.family, marginBottom: 10 },
  mo_ta_panel: { fontSize: 19, color: CD.text.secondary, fontFamily: CD.font.family, lineHeight: 28, marginBottom: 22 },
  the_cau_hinh: { marginBottom: 18 },
  nhan_cau_hinh: { fontSize: 21, fontWeight: 'bold', color: CD.text.primary, fontFamily: CD.font.family, marginBottom: 10 },
  o_code: {
    backgroundColor: CD.bg.glass_input,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CD.border.input,
  },
  o_code_block: {
    backgroundColor: 'rgba(14, 25, 44, 0.78)',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CD.border.divider,
  },
  chu_code: { fontSize: 18, fontFamily: CD.font.family, color: CD.text.table_cell, lineHeight: 27 },
  khung_trang_thai: {
    marginTop: 16,
    padding: 22,
    backgroundColor: CD.bg.glass_card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CD.border.glass,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    ...Platform.select({ web: { backdropFilter: CD.web.blur_card, boxShadow: CD.web.shadow_card } }),
  },
  khoi_trang_thai_trai: { flex: 1 },
  khoi_trang_thai_phai: { alignItems: 'center', gap: 12 },
  chu_trang_thai_to: { fontSize: 22, fontWeight: 'bold', fontFamily: CD.font.family, color: CD.brand.mauNhat },
  mo_ta_trang_thai: { fontSize: 17, color: CD.text.secondary, fontFamily: CD.font.family, lineHeight: 26, marginTop: 6 },
  chu_phu: { fontSize: 15, color: CD.text.muted, fontFamily: CD.font.family, marginTop: 8 },
  trang_thai_xanh: { color: '#1B8F5A' },
  trang_thai_do: { color: '#C62828' },
  nut_phu: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(25,118,210,0.16)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(25,118,210,0.35)',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: CD.web.cursor_pointer } }),
  },
  chu_nut_phu: { fontSize: 18, fontWeight: 'bold', color: '#114A8D', fontFamily: CD.font.family },
  ket_qua_probe: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  ket_qua_probe_ok: { backgroundColor: 'rgba(76,175,80,0.14)', borderColor: 'rgba(76,175,80,0.32)' },
  ket_qua_probe_fail: { backgroundColor: 'rgba(244,67,54,0.14)', borderColor: 'rgba(244,67,54,0.32)' },
  chu_probe: { fontSize: 17, color: CD.text.primary, fontFamily: CD.font.family, lineHeight: 24 },
  dong_tieu_de_bang: {
    flexDirection: 'row',
    backgroundColor: CD.bg.table_header,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  cot_bang: { fontSize: 18, fontWeight: '700', color: CD.text.table_header, fontFamily: CD.font.family },
  khung_danh_sach_log: { flex: 1 },
  dong_du_lieu_bang: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: CD.border.divider,
  },
  chu_du_lieu: { fontSize: 18, color: CD.text.table_cell, fontFamily: CD.font.family },
  chu_du_lieu_phu: { fontSize: 15, color: CD.text.secondary, fontFamily: CD.font.family, lineHeight: 22, marginTop: 6, maxWidth: 350 },
  chu_trong: { fontSize: 20, color: CD.text.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 50, fontFamily: CD.font.family },
  khoi_ket_qua_log: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tag_trang_thai: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: CD.font.family,
    color: CD.text.primary,
    alignSelf: 'flex-start',
  },
  tag_xanh: { backgroundColor: 'rgba(76,175,80,0.82)' },
  tag_cam: { backgroundColor: 'rgba(251,140,0,0.82)' },
  tag_do: { backgroundColor: 'rgba(244,67,54,0.82)' },
  btn_xem_loi: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: CD.bg.glass_input,
    borderWidth: 1,
    borderColor: CD.border.error,
    borderRadius: 8,
    ...Platform.select({ web: { cursor: CD.web.cursor_pointer } }),
  },
  txt_xem_loi: { color: CD.brand.mauNhat, fontWeight: 'bold', fontSize: 16, fontFamily: CD.font.family },
});

export default CongTiepNhanHIS;