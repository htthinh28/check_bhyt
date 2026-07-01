import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KIEM_TRA_EMAIL_CDSS, taoMatKhauNgauNhien } from '../../tien_ich/dich_vu_tai_khoan_cdss';
import { VAI_TRO_TAI_KHOAN_BV } from '../constants/bon_he_thong';
import { styles } from './dieu_khien_quan_tri_styles';
import { hienThongBaoQuanTri } from './ho_tro_hop_thoai';

export default function TabTaiKhoanBv({
  orgId,
  taiKhoan,
  tenantChon,
  onTaoTaiKhoan,
  onDatLaiMk,
  onKhoaMo,
  onXoa,
  onCapNhatHoSo,
}) {
  const [loc, setLoc] = useState('');
  const [modalTao, setModalTao] = useState(false);
  const [modalSua, setModalSua] = useState(false);
  const [dangSua, setDangSua] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [form, setForm] = useState({
    email: '', hoTen: '', khoa: '', phong: '', chucDanh: '', soDienThoai: '',
    vaiTro: VAI_TRO_TAI_KHOAN_BV.ADMIN_BV, matKhau: '', buocDoiMatKhau: true,
  });

  const dsLoc = useMemo(() => {
    const q = loc.trim().toLowerCase();
    if (!q) return taiKhoan;
    return taiKhoan.filter((u) => (
      u.email.includes(q)
      || (u.hoTen || u.ten || '').toLowerCase().includes(q)
      || (u.khoa || '').toLowerCase().includes(q)
    ));
  }, [taiKhoan, loc]);

  const moTao = () => {
    setForm({
      email: '', hoTen: '', khoa: '', phong: '', chucDanh: '', soDienThoai: '',
      vaiTro: VAI_TRO_TAI_KHOAN_BV.ADMIN_BV, matKhau: '', buocDoiMatKhau: true,
    });
    setModalTao(true);
  };

  const moSua = (u) => {
    setDangSua(u);
    setForm({
      email: u.email,
      hoTen: u.hoTen || u.ten || '',
      khoa: u.khoa || '',
      phong: u.phong || '',
      chucDanh: u.chucDanh || '',
      soDienThoai: u.soDienThoai || '',
      vaiTro: u.vaiTro === 'ADMIN' ? VAI_TRO_TAI_KHOAN_BV.ADMIN_BV : VAI_TRO_TAI_KHOAN_BV.NHAN_VIEN,
    });
    setModalSua(true);
  };

  const kiemTraFormTao = () => {
    const email = form.email.trim().toLowerCase();
    if (!form.hoTen.trim()) {
      hienThongBaoQuanTri('Thiếu thông tin', 'Họ tên không được trống.');
      return null;
    }
    if (!email) {
      hienThongBaoQuanTri('Thiếu thông tin', 'Email không được trống.');
      return null;
    }
    if (!KIEM_TRA_EMAIL_CDSS.test(email)) {
      hienThongBaoQuanTri(
        'Email không hợp lệ',
        'Nhập email đầy đủ dạng ten@benhvien.vn (ví dụ: vinh@pccantho.vn).',
      );
      return null;
    }
    return email;
  };

  const xuLyTao = async () => {
    if (dangLuu) return;
    const email = kiemTraFormTao();
    if (!email) return;
    setDangLuu(true);
    try {
      const mk = form.matKhau.trim() || taoMatKhauNgauNhien(12);
      await onTaoTaiKhoan({
        ...form,
        email,
        matKhau: mk,
      });
      setModalTao(false);
    } catch {
      /* thông báo lỗi tại parent */
    } finally {
      setDangLuu(false);
    }
  };

  const xuLySua = async () => {
    if (!dangSua || dangLuu) return;
    if (!form.hoTen.trim()) {
      hienThongBaoQuanTri('Thiếu thông tin', 'Họ tên không được trống.');
      return;
    }
    setDangLuu(true);
    try {
      await onCapNhatHoSo(dangSua.email, {
        hoTen: form.hoTen,
        ten: form.hoTen,
        khoa: form.khoa,
        phong: form.phong,
        chucDanh: form.chucDanh,
        soDienThoai: form.soDienThoai,
        vaiTro: form.vaiTro === VAI_TRO_TAI_KHOAN_BV.ADMIN_BV ? 'ADMIN' : 'USER',
      });
      setModalSua(false);
      hienThongBaoQuanTri('Đã cập nhật', 'Hồ sơ tài khoản đã được lưu.');
    } catch (e) {
      hienThongBaoQuanTri('Lỗi', String(e?.message || e));
    } finally {
      setDangLuu(false);
    }
  };

  const emailChuan = form.email.trim().toLowerCase();
  const emailKhongHopLe = emailChuan.length > 0 && !KIEM_TRA_EMAIL_CDSS.test(emailChuan);

  const FormFields = ({ readOnlyEmail = false }) => (
    <ScrollView style={{ maxHeight: 400 }}>
      {[
        ['email', 'Email *', 'ten@benhvien.vn', false, readOnlyEmail],
        ['hoTen', 'Họ tên *', 'Nguyễn Văn A', false, false],
        ['khoa', 'Khoa', 'Khoa Nội', false, false],
        ['phong', 'Phòng', 'Phòng CNTT', false, false],
        ['chucDanh', 'Chức danh', 'Bác sĩ', false, false],
        ['soDienThoai', 'SĐT', '090…', false, false],
        ...(!readOnlyEmail ? [['matKhau', 'Mật khẩu (trống = tự sinh)', '••••', true, false]] : []),
      ].map(([key, label, ph, secure, ro]) => (
        <View key={key}>
          <Text style={styles.nhan}>{label}</Text>
          <TextInput
            style={[
              styles.oNhap,
              ro && { backgroundColor: '#f1f5f9' },
              key === 'email' && emailKhongHopLe && !readOnlyEmail && { borderColor: '#dc2626', borderWidth: 1 },
            ]}
            value={form[key]}
            onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
            placeholder={ph}
            secureTextEntry={secure}
            editable={!ro}
            autoCapitalize={key === 'email' ? 'none' : 'sentences'}
            keyboardType={key === 'email' ? 'email-address' : 'default'}
            autoCorrect={key !== 'email'}
          />
          {key === 'email' && emailKhongHopLe && !readOnlyEmail ? (
            <Text style={styles.loi}>Email phải có dạng ten@benhvien.vn</Text>
          ) : null}
        </View>
      ))}
      <Text style={styles.nhan}>Vai trò hệ thống</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[
          [VAI_TRO_TAI_KHOAN_BV.ADMIN_BV, '👑 Admin BV'],
          [VAI_TRO_TAI_KHOAN_BV.NHAN_VIEN, '👤 Nhân viên'],
        ].map(([v, label]) => (
          <TouchableOpacity
            key={v}
            style={[styles.chipRole, form.vaiTro === v && styles.chipRoleActive]}
            onPress={() => setForm((f) => ({ ...f, vaiTro: v }))}
          >
            <Text style={form.vaiTro === v ? styles.chuRoleActive : styles.chuChip}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!readOnlyEmail ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={styles.nhan}>Bắt buộc đổi MK lần đầu</Text>
          <Switch value={form.buocDoiMatKhau} onValueChange={(v) => setForm((f) => ({ ...f, buocDoiMatKhau: v }))} />
        </View>
      ) : null}
    </ScrollView>
  );

  return (
  <>
    <View style={styles.hangTieuDe}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tieuDeTab}>Tài khoản — {tenantChon?.displayName || '…'}</Text>
        <Text style={styles.moTaTab}>
          {taiKhoan.length} tài khoản · Admin BV đăng nhập luồng «Bệnh viện thành viên» và quản lý nhân viên tại 🔐 Phân quyền.
        </Text>
      </View>
      <TouchableOpacity style={styles.nutChinh} onPress={moTao} disabled={!orgId}>
        <Text style={styles.chuNutChinh}>＋ Tạo tài khoản</Text>
      </TouchableOpacity>
    </View>

    <TextInput
      style={styles.oNhap}
      placeholder="🔍 Tìm theo email, tên, khoa…"
      value={loc}
      onChangeText={setLoc}
    />

    {dsLoc.length === 0 ? (
      <Text style={styles.rong}>
        {taiKhoan.length === 0
          ? 'Chưa có tài khoản. Tạo Admin BV để bệnh viện bắt đầu sử dụng hệ thống.'
          : 'Không tìm thấy tài khoản phù hợp.'}
      </Text>
    ) : null}

    {dsLoc.map((u) => (
      <View key={u.email} style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tenCard}>{u.hoTen || u.ten || u.email}</Text>
            <Text style={styles.meta}>{u.email}</Text>
            <Text style={styles.meta}>
              {u.vaiTro === 'ADMIN' ? '👑 Admin BV' : '👤 Nhân viên'}
              {' · '}{u.trangThai === 'KHOA' ? '🔒 Khóa' : '✅ Hoạt động'}
              {u.khoa ? ` · ${u.khoa}` : ''}
              {u.chucDanh ? ` · ${u.chucDanh}` : ''}
            </Text>
            {u.lanDangNhapCuoi ? (
              <Text style={styles.meta}>Đăng nhập cuối: {u.lanDangNhapCuoi.slice(0, 19).replace('T', ' ')}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.hangNut}>
          <TouchableOpacity style={styles.nutPhu} onPress={() => moSua(u)}>
            <Text style={styles.chuNutPhu}>✏️ Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nutPhu} onPress={() => onDatLaiMk(u.email)}>
            <Text style={styles.chuNutPhu}>🔑 Đặt lại MK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nutPhu} onPress={() => onKhoaMo(u)}>
            <Text style={styles.chuNutPhu}>{u.trangThai === 'KHOA' ? '🔓 Mở khóa' : '🔒 Khóa'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nutNguyHiem} onPress={() => onXoa(u.email)}>
            <Text style={styles.chuNutNguyHiem}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    ))}

    <Modal visible={modalTao} transparent animationType="slide" onRequestClose={() => setModalTao(false)}>
      <View style={styles.modalNen}>
        <View style={styles.modalCard}>
          <Text style={styles.tieuDeTab}>Tạo tài khoản mới</Text>
          <FormFields />
          <View style={styles.hangModal}>
            <TouchableOpacity style={styles.nutPhu} onPress={() => setModalTao(false)}>
              <Text style={styles.chuNutPhu}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nutChinh, (dangLuu || !form.email.trim() || !form.hoTen.trim()) && { opacity: 0.5 }]}
              disabled={dangLuu || !form.email.trim() || !form.hoTen.trim()}
              onPress={xuLyTao}
            >
              {dangLuu ? <ActivityIndicator color="#fff" /> : <Text style={styles.chuNutChinh}>Lưu</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={modalSua} transparent animationType="fade" onRequestClose={() => setModalSua(false)}>
      <View style={styles.modalNen}>
        <View style={styles.modalCard}>
          <Text style={styles.tieuDeTab}>Sửa hồ sơ</Text>
          <FormFields readOnlyEmail />
          <View style={styles.hangModal}>
            <TouchableOpacity style={styles.nutPhu} onPress={() => setModalSua(false)}>
              <Text style={styles.chuNutPhu}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nutChinh} onPress={xuLySua} disabled={dangLuu}>
              {dangLuu ? <ActivityIndicator color="#fff" /> : <Text style={styles.chuNutChinh}>Lưu</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </>
  );
}
