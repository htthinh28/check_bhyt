import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CD } from '../tien_ich/chu_de_giao_dien';

const LOAI_NHAN = {
  quy_tac: { label: 'Quy tắc', mau: '#0D9488' },
  he_thong: { label: 'Hệ thống', mau: '#2563EB' },
  danh_muc: { label: 'Danh mục', mau: '#7C3AED' },
};

/**
 * Popup thông báo cập nhật quy tắc / hệ thống sau mỗi bản phát hành.
 */
export default function ModalCapNhatHeThong({
  visible = false,
  noiDung = null,
  onDong = () => {},
  onXemQuyTac = null,
}) {
  const animBackdrop = useRef(new Animated.Value(0)).current;
  const animPanel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      animBackdrop.setValue(0);
      animPanel.setValue(0);
      Animated.parallel([
        Animated.timing(animBackdrop, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(animPanel, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, animBackdrop, animPanel]);

  if (!noiDung) return null;

  const muc = Array.isArray(noiDung.muc) ? noiDung.muc : [];
  const seedApDung = Array.isArray(noiDung.seed_ap_dung) ? noiDung.seed_ap_dung : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDong}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDong}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: animBackdrop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.55],
                }),
              },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: animPanel,
              transform: [
                {
                  translateY: animPanel.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
                {
                  scale: animPanel.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.header_icon}>🔔</Text>
            <View style={styles.header_text}>
              <Text style={styles.title}>{noiDung.tieu_de || 'Cập nhật hệ thống'}</Text>
              <Text style={styles.meta}>
                {noiDung.ngay ? `Ngày ${noiDung.ngay}` : ''}
                {noiDung.phien_ban_ung_dung ? ` · v${noiDung.phien_ban_ung_dung}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onDong} style={styles.btn_close} accessibilityLabel="Đóng">
              <Text style={styles.btn_close_txt}>✕</Text>
            </TouchableOpacity>
          </View>

          {noiDung.tom_tat ? (
            <Text style={styles.tom_tat}>{noiDung.tom_tat}</Text>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scroll_content}
            showsVerticalScrollIndicator
          >
            {muc.map((item, idx) => {
              const loai = LOAI_NHAN[item.loai] || LOAI_NHAN.quy_tac;
              const chiTiet = Array.isArray(item.chi_tiet) ? item.chi_tiet : [];
              return (
                <View key={`${item.tieu_de}-${idx}`} style={[styles.muc, { borderLeftColor: loai.mau }]}>
                  <View style={styles.muc_head}>
                    <Text style={styles.muc_icon}>{item.icon || '📌'}</Text>
                    <View style={styles.muc_head_text}>
                      <Text style={styles.muc_loai}>{loai.label}</Text>
                      <Text style={styles.muc_tieu_de}>{item.tieu_de}</Text>
                    </View>
                  </View>
                  {chiTiet.map((dong, j) => (
                    <View key={j} style={styles.bullet_row}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bullet_txt}>{dong}</Text>
                    </View>
                  ))}
                </View>
              );
            })}

            {seedApDung.length > 0 ? (
              <View style={styles.seed_box}>
                <Text style={styles.seed_title}>Đã đồng bộ tự động trên thiết bị</Text>
                {seedApDung.map((s, i) => (
                  <Text key={i} style={styles.seed_line}>
                    {s.module}
                    {s.so_dong_cap_nhat > 0 ? ` — cập nhật ${s.so_dong_cap_nhat} quy tắc` : ''}
                    {s.so_dong_xoa > 0 ? `, gỡ ${s.so_dong_xoa} quy tắc cũ` : ''}
                    {s.phien_ban ? ` (${s.phien_ban})` : ''}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {typeof onXemQuyTac === 'function' ? (
              <TouchableOpacity style={styles.btn_secondary} onPress={onXemQuyTac}>
                <Text style={styles.btn_secondary_txt}>Xem quy tắc</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.btn_primary} onPress={onDong}>
              <Text style={styles.btn_primary_txt}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 20px 50px rgba(15, 23, 42, 0.22)' },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  header_icon: { fontSize: 28, marginTop: 2 },
  header_text: { flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: CD.mau_chinh || '#0f172a',
    fontFamily: 'Arial',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Arial',
  },
  btn_close: {
    padding: 6,
    marginTop: -4,
    marginRight: -6,
  },
  btn_close_txt: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  tom_tat: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
    fontFamily: 'Arial',
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scroll_content: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  muc: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 4,
    gap: 6,
  },
  muc_head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  muc_icon: { fontSize: 20 },
  muc_head_text: { flex: 1 },
  muc_loai: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Arial',
  },
  muc_tieu_de: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
    fontFamily: 'Arial',
  },
  bullet_row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    fontFamily: 'Arial',
  },
  bullet_txt: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
    fontFamily: 'Arial',
  },
  seed_box: {
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  seed_title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    fontFamily: 'Arial',
  },
  seed_line: {
    fontSize: 12,
    lineHeight: 18,
    color: '#15803D',
    fontFamily: 'Arial',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn_secondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btn_secondary_txt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Arial',
  },
  btn_primary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: CD.mau_chinh || '#0D9488',
  },
  btn_primary_txt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Arial',
  },
});
