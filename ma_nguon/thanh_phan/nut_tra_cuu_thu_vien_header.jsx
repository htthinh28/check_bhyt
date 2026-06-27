/**
 * Nút 🏥 DVKT | 💊 Dược thư — dùng trên header dashboard / màn tra cứu.
 * Bấm → mở cửa sổ/tab trình duyệt mới.
 */
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { moThuVienTraCuuTabMoi } from '../dich_vu/thu_vien_tra_cuu_api';
import { CD } from '../tien_ich/chu_de_giao_dien';

export const NutTraCuuThuVienHeader = ({ variant = 'dashboard' }) => {
  const laDashboard = variant === 'dashboard';
  return (
    <View style={styles.hang}>
      <TouchableOpacity
        style={[styles.nut, laDashboard ? styles.nut_dashboard : styles.nut_light]}
        onPress={() => moThuVienTraCuuTabMoi('dvkt')}
        accessibilityLabel="Mở tra cứu DVKT cửa sổ mới"
      >
        <Text style={[styles.chu, laDashboard ? styles.chu_dashboard : styles.chu_light]}>🏥 DVKT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.nut, laDashboard ? styles.nut_dashboard : styles.nut_light]}
        onPress={() => moThuVienTraCuuTabMoi('duocthu')}
        accessibilityLabel="Mở Dược thư cửa sổ mới"
      >
        <Text style={[styles.chu, laDashboard ? styles.chu_dashboard : styles.chu_light]}>💊 Dược thư</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  hang: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  nut: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  nut_dashboard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  nut_light: {
    backgroundColor: CD.nen_the,
    borderColor: CD.vien,
  },
  chu: { fontFamily: 'Arial', fontWeight: '700', fontSize: 12 },
  chu_dashboard: { color: '#FFF' },
  chu_light: { color: CD.mau_chinh },
});

export default NutTraCuuThuVienHeader;
