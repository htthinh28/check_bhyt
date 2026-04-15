import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CD } from '../tien_ich/chu_de_giao_dien';

// IMPORT TRỰC TIẾP CẢ 3 PHÂN HỆ TỪ THƯ MỤC CHUYÊN MÔN
import HuongDanBoYTe from '../chuyen_mon/huong_dan_byt/huong_dan_byt';
import PhacDoBenhVien from '../chuyen_mon/phac_do_benh_vien/phac_do_benhvien';
import QuyTrinhMauBYT from '../chuyen_mon/quytrinhkt_byt/quytrinh_mau_byt';
import TuongTacThuocChuyenMon from '../chuyen_mon/tuong_tac_thuoc/tuong_tac_thuoc';

// Định nghĩa phân hệ chuyên môn
const PHAN_HE_CHUYEN_MON = [
  { id: 'PHAC_DO_BV', ten: '🏥 PHÁC ĐỒ PHƯƠNG CHÂU' },
  { id: 'HUONG_DAN_BYT', ten: '📖 HƯỚNG DẪN BỘ Y TẾ' },
  { id: 'QUY_TRINH_KT', ten: '⚙️ QUY TRÌNH KỸ THUẬT' },
  { id: 'TUONG_TAC_THUOC', ten: '💊 TƯƠNG TÁC THUỐC' },
];

const QuanLyChuyenMon = ({ navigation }) => {
  const [tabHienTai, setTabHienTai] = useState(PHAN_HE_CHUYEN_MON[0].id);

  // Khôi phục Tab khi F5
  useEffect(() => {
    const khoiTao = async () => {
      try {
        const tabLuu = await AsyncStorage.getItem('TAB_CHUYEN_MON_DANG_MO');
        if (tabLuu) setTabHienTai(tabLuu);
      } catch (error) {
        console.error("Lỗi phục hồi Tab:", error);
      }
    };
    khoiTao();
  }, []);

  // Đổi Tab và lưu trạng thái
  const handleChuyenTab = async (id) => {
    setTabHienTai(id);
    await AsyncStorage.setItem('TAB_CHUYEN_MON_DANG_MO', id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header gồm tiêu đề + các thẻ phân hệ (chuyên môn) */}
      <View style={styles.header}>
        <View style={styles.header_row_top}>
          <TouchableOpacity onPress={() => navigation.navigate('TongQuan')} style={styles.nut_quay_lai}>
            <Text style={styles.txt_back}>⬅ QUAY LẠI TỔNG QUAN</Text>
          </TouchableOpacity>
          <Text style={styles.txt_title} numberOfLines={2}>🧠 EBM: QUẢN LÝ TRI THỨC LÂM SÀNG</Text>
          <View style={styles.header_spacer} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tab_row_content}
          style={styles.tab_scroll}
        >
          {PHAN_HE_CHUYEN_MON.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleChuyenTab(tab.id)}
              style={[styles.tab_item, tabHienTai === tab.id && styles.tab_active]}
            >
              <Text style={[styles.txt_tab, tabHienTai === tab.id && styles.txt_tab_active]} numberOfLines={1}>
                {tab.ten}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {tabHienTai === 'PHAC_DO_BV' && <PhacDoBenhVien />}
        {tabHienTai === 'HUONG_DAN_BYT' && <HuongDanBoYTe />}
        {tabHienTai === 'QUY_TRINH_KT' && <QuyTrinhMauBYT />}
        {tabHienTai === 'TUONG_TAC_THUOC' && <TuongTacThuocChuyenMon />}
      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'web' ? 16 : 12,
    ...Platform.select({
      web: {
        backgroundImage: CD.web.gradient_header,
        backdropFilter: CD.web.blur_header,
        boxShadow: CD.web.shadow_header,
      },
    }),
  },

  header_row_top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  header_spacer: {
    width: 160,
    ...Platform.select({ default: {}, web: { minWidth: 160 } }),
  },

  tab_scroll: {
    maxHeight: 56,
  },

  tab_row_content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },

  nut_quay_lai: {
    padding: 10,
    backgroundColor: CD.bg.glass_input,
    borderWidth: 1,
    borderColor: CD.border.glass_md,
    borderRadius: 14,
  },
  txt_back: { color: CD.text.primary, fontWeight: 'bold', fontSize: 20, fontFamily: CD.font.family },
  txt_title: {
    color: CD.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: CD.font.family,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  tab_item: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: CD.bg.glass_card,
    borderWidth: 1,
    borderColor: CD.border.glass,
  },

  tab_active: {
    backgroundColor: CD.brand.mauChinh,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        backgroundImage: CD.web.gradient_primary,
        boxShadow: CD.web.shadow_btn,
      },
    }),
  },

  txt_tab: { fontWeight: 'bold', color: CD.text.secondary, fontSize: 17, fontFamily: CD.font.family },
  txt_tab_active: { color: CD.text.primary, fontSize: 17, fontFamily: CD.font.family, fontWeight: 'bold' },

  body: { flex: 1, minHeight: 0 },
});

export default QuanLyChuyenMon;
