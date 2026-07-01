import { Text, View } from 'react-native';
import { styles } from './dieu_khien_quan_tri_styles';

export default function TheThongKe({ icon, giaTri, nhan, mauGiaTri }) {
  return (
    <View style={styles.theThongKe}>
      {icon ? <Text style={styles.iconThongKe}>{icon}</Text> : null}
      <Text style={[styles.soThongKe, mauGiaTri ? { color: mauGiaTri } : null]}>{giaTri}</Text>
      <Text style={styles.nhanThongKe}>{nhan}</Text>
    </View>
  );
}
