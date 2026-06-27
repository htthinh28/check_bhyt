/**
 * Tra cứu Thư viện PC — DM DVKT (QĐ 7603, TT23, QTKT) và Dược thư Phương Châu.
 * Web/Vercel: static cùng origin (/thuvien). Native dev: Flask tùy chọn.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  healthCheckThuVienTraCuu,
  thuVienTraCuuConfig,
} from '../dich_vu/thu_vien_tra_cuu_api';
import { CD } from '../tien_ich/chu_de_giao_dien';
import { quayLaiAnToan } from '../tien_ich/dieu_huong_an_toan';

const moUrl = async (url, label) => {
  const trimmed = String(url || '').trim();
  if (!trimmed) {
    Alert.alert('Thiếu URL', `Chưa cấu hình ${label || 'liên kết'}.`);
    return;
  }
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }
    const supported = await Linking.canOpenURL(trimmed);
    if (supported) await Linking.openURL(trimmed);
    else Alert.alert('Không mở được', trimmed);
  } catch (e) {
    Alert.alert('Lỗi mở liên kết', String(e?.message || e));
  }
};

const TraCuuThuVienPC = ({ navigation }) => {
  const { width: beRong } = useWindowDimensions();
  const cfg = thuVienTraCuuConfig();
  const [probe, setProbe] = useState({ loading: true, ketQua: null });
  const [nhungWeb, setNhungWeb] = useState(Platform.OS === 'web');

  const chayKiemTra = useCallback(async () => {
    setProbe({ loading: true, ketQua: null });
    const ketQua = await healthCheckThuVienTraCuu();
    setProbe({ loading: false, ketQua });
  }, []);

  useEffect(() => {
    chayKiemTra();
  }, [chayKiemTra]);

  const ok = probe.ketQua?.ok === true;
  const laStatic = cfg.mode === 'static';

  return (
    <SafeAreaView style={styles.vung_an_toan}>
      <View style={styles.thanh_tieu_de}>
        <TouchableOpacity onPress={() => quayLaiAnToan(navigation, 'TongQuan')} style={styles.nut_quay_lai}>
          <Text style={styles.chu_nut_quay_lai}>⬅ TỔNG QUAN</Text>
        </TouchableOpacity>
        <Text style={styles.tieu_de}>📖 TRA CỨU DVKT & DƯỢC THƯ PC</Text>
      </View>

      <ScrollView contentContainerStyle={styles.noi_dung}>
        <View style={styles.the}>
          <Text style={styles.tieu_de_the}>Thư viện tra cứu</Text>
          <Text style={styles.dong_mo_ta}>
            {laStatic ? 'Chạy trực tiếp trên web — không cần Flask.' : 'Chế độ Flask (dev / native).'}
          </Text>
          {probe.loading ? (
            <ActivityIndicator color={CD.mau_chinh} style={{ marginTop: 12 }} />
          ) : (
            <>
              <View style={[styles.badge, ok ? styles.badge_ok : styles.badge_loi]}>
                <Text style={styles.badge_text}>{ok ? 'SẴN SÀNG' : 'CHƯA SẴN SÀNG'}</Text>
              </View>
              <Text style={styles.dong_mo_ta}>{probe.ketQua?.message || ''}</Text>
              {probe.ketQua?.manifest?.tabCount != null ? (
                <Text style={styles.dong_mo_ta}>
                  Tab DVKT:
                  {' '}
                  {probe.ketQua.manifest.tabCount}
                  {probe.ketQua.manifest.version ? ` · v${probe.ketQua.manifest.version}` : ''}
                </Text>
              ) : null}
            </>
          )}
          <TouchableOpacity style={styles.nut_phu} onPress={chayKiemTra} disabled={probe.loading}>
            <Text style={styles.chu_nut_phu}>🔄 KIỂM TRA LẠI</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.the}>
          <Text style={styles.tieu_de_the}>Mở tra cứu</Text>
          <TouchableOpacity style={styles.nut_chinh} onPress={() => moUrl(cfg.dvktUrl, 'DM DVKT')}>
            <Text style={styles.chu_nut_chinh}>🏥 DANH MỤC DVKT (QĐ 7603 / TT23 / QTKT)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nut_chinh} onPress={() => moUrl(cfg.duocThuUrl, 'Dược thư')}>
            <Text style={styles.chu_nut_chinh}>💊 DƯỢC THƯ PHƯƠNG CHÂU</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' ? (
            <TouchableOpacity style={styles.nut_phu} onPress={() => setNhungWeb((v) => !v)}>
              <Text style={styles.chu_nut_phu}>{nhungWeb ? 'Ẩn xem trước' : 'Xem trước DM DVKT (iframe)'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {Platform.OS === 'web' && nhungWeb && ok ? (
          <View style={styles.the}>
            <iframe
              title="Tra cứu DVKT"
              src={cfg.dvktUrl}
              style={{
                width: '100%',
                height: Math.min(720, Math.max(400, beRong * 0.55)),
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
            />
          </View>
        ) : null}

        {!laStatic ? (
          <View style={styles.the}>
            <Text style={styles.tieu_de_the}>Flask dev (tùy chọn)</Text>
            <Text style={styles.huong_dan}>
              {'1. Cài: npm run thuvien:install\n'}
              {'2. Chạy: npm run thuvien:start\n'}
              {'3. Điện thoại: app.json → extra.thuvienTraCuu.baseUrl = http://<IP-LAN>:5050'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  vung_an_toan: { flex: 1, backgroundColor: CD.nen },
  thanh_tieu_de: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CD.vien,
    backgroundColor: CD.nen_the,
  },
  nut_quay_lai: { marginRight: 12 },
  chu_nut_quay_lai: { color: CD.mau_chinh, fontFamily: 'Arial', fontWeight: '700', fontSize: 13 },
  tieu_de: { flex: 1, fontFamily: 'Arial', fontWeight: '800', fontSize: 15, color: CD.chu_dam },
  noi_dung: { padding: 14, gap: 12 },
  the: {
    backgroundColor: CD.nen_the,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: CD.vien,
  },
  tieu_de_the: { fontFamily: 'Arial', fontWeight: '800', fontSize: 14, color: CD.chu_dam, marginBottom: 8 },
  dong_mo_ta: { fontFamily: 'Arial', fontSize: 13, color: CD.chu_phu, marginTop: 4, lineHeight: 20 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  badge_ok: { backgroundColor: '#dcfce7' },
  badge_loi: { backgroundColor: '#fee2e2' },
  badge_text: { fontFamily: 'Arial', fontWeight: '800', fontSize: 12, color: CD.chu_dam },
  nut_chinh: {
    backgroundColor: CD.mau_chinh,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  chu_nut_chinh: { fontFamily: 'Arial', fontWeight: '700', fontSize: 13, color: '#fff', textAlign: 'center' },
  nut_phu: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: CD.vien,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: CD.nen,
  },
  chu_nut_phu: { fontFamily: 'Arial', fontWeight: '600', fontSize: 13, color: CD.mau_chinh, textAlign: 'center' },
  huong_dan: { fontFamily: 'Arial', fontSize: 12, color: CD.chu_phu, lineHeight: 20 },
});

export default TraCuuThuVienPC;
