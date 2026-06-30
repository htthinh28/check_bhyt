import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './quan_tri_theme';

const MAU_TRANG_THAI = {
  CO_DU_LIEU: '#059669',
  TRONG: '#94a3b8',
};

const TabDuLieu = ({ tomTat, onTaiLai, dangTai }) => {
  if (!tomTat) {
    return <Text style={styles.rong}>Chọn cơ sở KCB để xem thống kê dữ liệu.</Text>;
  }

  const maxKey = Math.max(1, ...tomTat.heThong.map((h) => h.soKey));

  return (
    <>
      <View style={styles.hangTieuDe}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tieuDeTab}>4 hệ thống dữ liệu</Text>
          <Text style={styles.moTaTab}>
            Tổng {tomTat.tongKeyLuuTru} khóa lưu trữ · {tomTat.soTaiKhoan} tài khoản · Cập nhật {tomTat.capNhatLuc?.slice(11, 19)}
          </Text>
        </View>
        <TouchableOpacity style={styles.nutPhu} onPress={onTaiLai} disabled={dangTai}>
          <Text style={styles.chuNutPhu}>{dangTai ? '⏳' : '🔄 Làm mới'}</Text>
        </TouchableOpacity>
      </View>

      {tomTat.heThong.map((he) => {
        const pct = Math.round((he.soKey / maxKey) * 100);
        const color = MAU_TRANG_THAI[he.trangThai] || MAU_TRANG_THAI.TRONG;
        return (
          <View key={he.id} style={styles.card}>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Text style={{ fontSize: 32 }}>{he.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tenCard}>{he.ten}</Text>
                <Text style={styles.meta}>{he.moTa}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
                  <Text style={[styles.meta, { fontWeight: '700', color }]}>
                    {he.trangThai === 'CO_DU_LIEU' ? '● Có dữ liệu' : '○ Trống'}
                  </Text>
                  <Text style={styles.meta}>{he.soKey} keys · {he.kichThuocHienThi}</Text>
                </View>
                <View style={styles.thanhTienDo}>
                  <View style={[styles.thanhTienDoFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
              </View>
            </View>
          </View>
        );
      })}

      <View style={[styles.card, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
        <Text style={styles.nhan}>💡 Gợi ý quản trị</Text>
        <Text style={styles.meta}>
          {'• TRUY_CAP: tài khoản & RBAC — quản lý tại tab Tài khoản / Phân quyền\n'}
          {'• LUẬT & CDSS: seed luật tự động khi BV đăng nhập lần đầu\n'}
          {'• LƯU TRỮ: danh mục, XML, kho hồ sơ — theo từng BV\n'}
          {'• TÍCH HỢP: Firebase, HIS — cấu hình sau khi triển khai'}
        </Text>
      </View>
    </>
  );
};

export default TabDuLieu;
