/**
 * Tra cứu Thư viện PC — DM DVKT (QĐ 7603, TT23, QTKT) và Dược thư Phương Châu.
 * Web: static cùng origin (/thuvien), iframe toàn màn hình.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
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

const TheTrangThaiHeader = ({ loading, ok, tabCount, version, onRecheck }) => (
  <TouchableOpacity
    style={[styles.the_trang_thai, ok ? styles.the_ok : styles.the_loi]}
    onPress={onRecheck}
    disabled={loading}
    accessibilityLabel="Trạng thái thư viện tra cứu"
  >
    {loading ? (
      <ActivityIndicator size="small" color={CD.mau_chinh} />
    ) : (
      <>
        <Text style={styles.chu_trang_thai} numberOfLines={1}>
          {ok ? '● SẴN SÀNG' : '● LỖI'}
        </Text>
        {ok && tabCount != null ? (
          <Text style={styles.chu_phu_trang_thai} numberOfLines={1}>
            {tabCount}
            {version ? ` · v${version}` : ''}
          </Text>
        ) : null}
      </>
    )}
  </TouchableOpacity>
);

const TraCuuThuVienPC = ({ navigation }) => {
  const cfg = thuVienTraCuuConfig();
  const [probe, setProbe] = useState({ loading: true, ketQua: null });
  const [tabHien, setTabHien] = useState('dvkt');

  const chayKiemTra = useCallback(async () => {
    setProbe({ loading: true, ketQua: null });
    const ketQua = await healthCheckThuVienTraCuu();
    setProbe({ loading: false, ketQua });
  }, []);

  useEffect(() => {
    chayKiemTra();
  }, [chayKiemTra]);

  const ok = probe.ketQua?.ok === true;
  const iframeSrc = tabHien === 'duocthu' ? cfg.duocThuUrl : cfg.dvktUrl;

  return (
    <SafeAreaView style={styles.vung_an_toan}>
      <View style={styles.thanh_tieu_de}>
        <TouchableOpacity onPress={() => quayLaiAnToan(navigation, 'TongQuan')} style={styles.nut_quay_lai}>
          <Text style={styles.chu_nut_quay_lai}>⬅</Text>
        </TouchableOpacity>
        <Text style={styles.tieu_de} numberOfLines={1}>📖 TRA CỨU DVKT & DƯỢC THƯ</Text>
        <TheTrangThaiHeader
          loading={probe.loading}
          ok={ok}
          tabCount={probe.ketQua?.manifest?.tabCount}
          version={probe.ketQua?.manifest?.version}
          onRecheck={chayKiemTra}
        />
      </View>

      <View style={styles.thanh_tab}>
        <TouchableOpacity
          style={[styles.tab, tabHien === 'dvkt' && styles.tab_active]}
          onPress={() => setTabHien('dvkt')}
        >
          <Text style={[styles.chu_tab, tabHien === 'dvkt' && styles.chu_tab_active]}>🏥 DVKT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabHien === 'duocthu' && styles.tab_active]}
          onPress={() => setTabHien('duocthu')}
        >
          <Text style={[styles.chu_tab, tabHien === 'duocthu' && styles.chu_tab_active]}>💊 Dược thư</Text>
        </TouchableOpacity>
        {Platform.OS !== 'web' ? (
          <TouchableOpacity style={styles.tab_mo} onPress={() => moUrl(iframeSrc, tabHien === 'dvkt' ? 'DM DVKT' : 'Dược thư')}>
            <Text style={styles.chu_tab_mo}>Mở ↗</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {Platform.OS === 'web' && ok ? (
        <View style={styles.vung_iframe}>
          <iframe
            title={tabHien === 'dvkt' ? 'Tra cứu DVKT' : 'Dược thư Phương Châu'}
            src={iframeSrc}
            style={styles.iframe}
          />
        </View>
      ) : (
        <View style={styles.vung_trong}>
          {probe.loading ? (
            <ActivityIndicator color={CD.mau_chinh} size="large" />
          ) : (
            <>
              <Text style={styles.thong_bao_loi}>{probe.ketQua?.message || 'Thư viện chưa sẵn sàng.'}</Text>
              <TouchableOpacity style={styles.nut_thu} onPress={chayKiemTra}>
                <Text style={styles.chu_nut_thu}>🔄 Thử lại</Text>
              </TouchableOpacity>
              {!ok ? (
                <TouchableOpacity style={styles.nut_thu} onPress={() => moUrl(cfg.dvktUrl, 'DM DVKT')}>
                  <Text style={styles.chu_nut_thu}>Mở DVKT ↗</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  vung_an_toan: { flex: 1, backgroundColor: CD.nen },
  thanh_tieu_de: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: CD.vien,
    backgroundColor: CD.nen_the,
    gap: 8,
  },
  nut_quay_lai: { padding: 4 },
  chu_nut_quay_lai: { color: CD.mau_chinh, fontFamily: 'Arial', fontWeight: '700', fontSize: 16 },
  tieu_de: {
    flex: 1,
    fontFamily: 'Arial',
    fontWeight: '800',
    fontSize: 14,
    color: CD.chu_dam,
    minWidth: 0,
  },
  the_trang_thai: {
    maxWidth: 190,
    width: '5cm',
    minWidth: 72,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  the_ok: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  the_loi: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  chu_trang_thai: { fontFamily: 'Arial', fontWeight: '800', fontSize: 10, color: CD.chu_dam },
  chu_phu_trang_thai: { fontFamily: 'Arial', fontSize: 9, color: CD.chu_phu, marginTop: 1 },
  thanh_tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: CD.vien,
    backgroundColor: CD.nen_the,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: CD.vien,
    backgroundColor: CD.nen,
  },
  tab_active: { backgroundColor: CD.mau_chinh, borderColor: CD.mau_chinh },
  chu_tab: { fontFamily: 'Arial', fontWeight: '600', fontSize: 12, color: CD.chu_dam },
  chu_tab_active: { color: '#fff', fontWeight: '700' },
  tab_mo: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 6 },
  chu_tab_mo: { fontFamily: 'Arial', fontWeight: '700', fontSize: 12, color: CD.mau_chinh },
  vung_iframe: { flex: 1, minHeight: 0 },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    flex: 1,
  },
  vung_trong: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  thong_bao_loi: {
    fontFamily: 'Arial',
    fontSize: 13,
    color: CD.chu_phu,
    textAlign: 'center',
    lineHeight: 20,
  },
  nut_thu: {
    borderWidth: 1,
    borderColor: CD.vien,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: CD.nen_the,
  },
  chu_nut_thu: { fontFamily: 'Arial', fontWeight: '600', fontSize: 13, color: CD.mau_chinh },
});

export default TraCuuThuVienPC;
