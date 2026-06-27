/**
 * Tra cứu Thư viện PC — liên kết nhanh DVKT / Dược thư (mở cửa sổ mới).
 * Nút chính nằm trên header dashboard; màn này giữ trạng thái + hướng dẫn ngắn.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { healthCheckThuVienTraCuu } from '../dich_vu/thu_vien_tra_cuu_api';
import NutTraCuuThuVienHeader from '../thanh_phan/nut_tra_cuu_thu_vien_header';
import { CD } from '../tien_ich/chu_de_giao_dien';
import { quayLaiAnToan } from '../tien_ich/dieu_huong_an_toan';

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
  const [probe, setProbe] = useState({ loading: true, ketQua: null });

  const chayKiemTra = useCallback(async () => {
    setProbe({ loading: true, ketQua: null });
    const ketQua = await healthCheckThuVienTraCuu();
    setProbe({ loading: false, ketQua });
  }, []);

  useEffect(() => {
    chayKiemTra();
  }, [chayKiemTra]);

  const ok = probe.ketQua?.ok === true;

  return (
    <SafeAreaView style={styles.vung_an_toan}>
      <View style={styles.thanh_tieu_de}>
        <TouchableOpacity onPress={() => quayLaiAnToan(navigation, 'TongQuan')} style={styles.nut_quay_lai}>
          <Text style={styles.chu_nut_quay_lai}>⬅</Text>
        </TouchableOpacity>
        <Text style={styles.tieu_de} numberOfLines={1}>📖 TRA CỨU</Text>
        <NutTraCuuThuVienHeader variant="light" />
        <TheTrangThaiHeader
          loading={probe.loading}
          ok={ok}
          tabCount={probe.ketQua?.manifest?.tabCount}
          version={probe.ketQua?.manifest?.version}
          onRecheck={chayKiemTra}
        />
      </View>

      <View style={styles.vung_trong}>
        {probe.loading ? (
          <ActivityIndicator color={CD.mau_chinh} size="large" />
        ) : (
          <>
            <Text style={styles.huong_dan}>
              Bấm 🏥 DVKT hoặc 💊 Dược thư trên header — mở cửa sổ tra cứu mới.
            </Text>
            {!ok ? (
              <Text style={styles.thong_bao_loi}>{probe.ketQua?.message || 'Thư viện chưa sẵn sàng.'}</Text>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  vung_an_toan: { flex: 1, backgroundColor: CD.nen },
  thanh_tieu_de: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    fontFamily: 'Arial',
    fontWeight: '800',
    fontSize: 13,
    color: CD.chu_dam,
  },
  the_trang_thai: {
    maxWidth: 190,
    width: '5cm',
    minWidth: 72,
    marginLeft: 'auto',
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
  vung_trong: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  huong_dan: {
    fontFamily: 'Arial',
    fontSize: 14,
    color: CD.chu_phu,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 420,
  },
  thong_bao_loi: {
    fontFamily: 'Arial',
    fontSize: 12,
    color: '#b91c1c',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default TraCuuThuVienPC;
