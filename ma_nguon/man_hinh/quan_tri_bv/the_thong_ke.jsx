import { Text, View } from 'react-native';
import { styles } from './quan_tri_theme';

const TheThongKe = ({ icon, giaTri, nhan, mauGiaTri }) => (
  <View style={styles.theThongKe}>
    {icon ? <Text style={styles.iconThongKe}>{icon}</Text> : null}
    <Text style={[styles.soThongKe, mauGiaTri ? { color: mauGiaTri } : null]}>{giaTri}</Text>
    <Text style={styles.nhanThongKe}>{nhan}</Text>
  </View>
);

export default TheThongKe;
