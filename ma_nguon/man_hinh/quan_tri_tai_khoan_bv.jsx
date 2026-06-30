/**
 * Module quản trị đa BV — stub đồng bộ từ Vercel (màn hình đầy đủ sẽ bổ sung trong PR tiếp).
 */
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { xoaCheDoTruyCap } from '../tien_ich/che_do_truy_cap';
import { dongGateSession } from '../tien_ich/gate_session';
import { dieuHuongVaoModuleCauHinh } from '../tien_ich/gate_dieu_huong';

const QuanTriTaiKhoanBv = ({ navigation }) => {
  const thoat = useCallback(async () => {
    await dongGateSession();
    await xoaCheDoTruyCap();
    navigation.reset({ index: 0, routes: [{ name: 'ChonBenhVien' }] });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Quản trị hệ thống đa BV</Text>
        <Text style={styles.body}>
          Module cấu hình đã được đồng bộ phần cổng chọn bệnh viện. Giao diện quản trị chi tiết
          (tài khoản BV, RBAC, audit) đang được port từ bản Vercel.
        </Text>
        <TouchableOpacity style={styles.nut} onPress={thoat}>
          <Text style={styles.chuNut}>← Quay lại chọn bệnh viện</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export { dieuHuongVaoModuleCauHinh };
export default QuanTriTaiKhoanBv;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  body: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 20 },
  nut: { alignSelf: 'flex-start' },
  chuNut: { color: '#C2185B', fontWeight: '600', fontSize: 14 },
});
