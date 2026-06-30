/**
 * Hộp thoại xác nhận / thông báo cho module quản trị BV (web + native).
 */
import { Alert } from 'react-native';

const laWeb = () => typeof window !== 'undefined';

export const hienThongBaoQuanTri = (tieuDe, noiDung = '') => {
  const msg = noiDung ? `${tieuDe}\n\n${noiDung}` : String(tieuDe || '');
  if (laWeb() && typeof window.alert === 'function') {
    window.alert(msg);
    return;
  }
  Alert.alert(tieuDe, noiDung || undefined);
};

export const xacNhanQuanTri = (
  tieuDe,
  noiDung = '',
  { nutXacNhan = 'Xác nhận', nutHuy = 'Hủy' } = {},
) => {
  if (laWeb() && typeof window.confirm === 'function') {
    const msg = [tieuDe, noiDung].filter(Boolean).join('\n\n');
    return Promise.resolve(window.confirm(msg));
  }
  return new Promise((resolve) => {
    Alert.alert(
      tieuDe,
      noiDung || undefined,
      [
        { text: nutHuy, style: 'cancel', onPress: () => resolve(false) },
        { text: nutXacNhan, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
};

export const xacNhanXoaQuanTri = (tieuDe, noiDung = '') => (
  xacNhanQuanTri(tieuDe, noiDung, { nutXacNhan: 'Xóa', nutHuy: 'Hủy' })
);

export default {
  hienThongBaoQuanTri,
  xacNhanQuanTri,
  xacNhanXoaQuanTri,
};
