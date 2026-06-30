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
import { VAI_TRO_TAI_KHOAN_BV } from '../../tien_ich/quan_tri_bv_constants';
import {
  KIEM_TRA_EMAIL_CDSS,
  taoMatKhauNgauNhien,
} from '../../tien_ich/dich_vu_tai_khoan_cdss';
import { hienThongBaoQuanTri } from '../../tien_ich/quan_tri_hoi_thoai';
import { styles } from './quan_tri_theme';

const FormTaiKhoan = ({ form, setForm, readOnlyEmail = false }) => (
  <ScrollView style={{ maxHeight: 400 }}>
    {[
      ['email', 'Email *', 'email@bv.vn', false, readOnlyEmail],
      ['hoTen', 'Họ tên *', 'Nguyễn Văn A', false, false],
      ['khoa', 'Khoa', 'Khoa Nội', false, false],
      ['phong', 'Phòng', 'Phòng CNTT', false, false],
      ['chucDanh', 'Chức danh', 'Bác sĩ', false, false],
      ['soDienThoai', 'SĐT', '090…', false, false],
      ...(readOnlyEmail ? [] : [['matKhau', 'Mật khẩu (trống = tự sinh)', '••••', true, false]]),
    ].map(([key, label, placeholder, secure, readOnly]) => (
      <View key={key}>
        <Text style={styles.nhan}>{label}</Text>
        <TextInput
          style={[styles.oNhap, readOnly && { backgroundColor: '#f1f5f9' }]}
          value={form[key]}
          onChangeText={(v) => setForm((s) => ({ ...s, [key]: v }))}
          placeholder={placeholder}
          secureTextEntry={secure}
          editable={!readOnly}
          autoCapitalize={key === 'email' ? 'none' : 'sentences'}
        />
      </View>
    ))}

    <Text style={styles.nhan}>Vai trò hệ thống</Text>
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
      {[
        [VAI_TRO_TAI_KHOAN_BV.ADMIN_BV, '👑 Admin BV'],
        [VAI_TRO_TAI_KHOAN_BV.NHAN_VIEN, '👤 Nhân viên'],
      ].map(([id, label]) => (
        <TouchableOpacity
          key={id}
          style={[styles.chipRole, form.vaiTro === id && styles.chipRoleActive]}
          onPress={() => setForm((s) => ({ ...s, vaiTro: id }))}
        >
          <Text style={form.vaiTro === id ? styles.chuRoleActive : styles.chuChip}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {readOnlyEmail ? null : (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={styles.nhan}>Bắt buộc đổi MK lần đầu</Text>
        <Switch
          value={form.buocDoiMatKhau}
          onValueChange={(v) => setForm((s) => ({ ...s, buocDoiMatKhau: v }))}
        />
      </View>
    )}
  </ScrollView>
);

const FORM_MAC_DINH = {
  email: '',
  hoTen: '',
  khoa: '',
  phong: '',
  chucDanh: '',
  soDienThoai: '',
  vaiTro: VAI_TRO_TAI_KHOAN_BV.ADMIN_BV,
  matKhau: '',
  buocDoiMatKhau: true,
};

const TabTaiKhoan = ({
  orgId,
  taiKhoan,
  tenantChon,
  onTaoTaiKhoan,
  onDatLaiMk,
  onKhoaMo,
  onXoa,
  onCapNhatHoSo,
}) => {
  const [loc, setLoc] = useState('');
  const [moTao, setMoTao] = useState(false);
  const [moSua, setMoSua] = useState(false);
  const [dangChon, setDangChon] = useState(null);
  const [form, setForm] = useState(FORM_MAC_DINH);
  const [dangLuu, setDangLuu] = useState(false);

  const filtered = useMemo(() => {
    const kw = loc.trim().toLowerCase();
    if (!kw) return taiKhoan;
    return taiKhoan.filter((tk) => tk.email.includes(kw)
      || (tk.hoTen || tk.ten || '').toLowerCase().includes(kw)
      || (tk.khoa || '').toLowerCase().includes(kw));
  }, [taiKhoan, loc]);

  const moFormSua = (row) => {
    setDangChon(row);
    setForm({
      email: row.email,
      hoTen: row.hoTen || row.ten || '',
      khoa: row.khoa || '',
      phong: row.phong || '',
      chucDanh: row.chucDanh || '',
      soDienThoai: row.soDienThoai || '',
      vaiTro: row.vaiTro === 'ADMIN' ? VAI_TRO_TAI_KHOAN_BV.ADMIN_BV : VAI_TRO_TAI_KHOAN_BV.NHAN_VIEN,
      matKhau: '',
      buocDoiMatKhau: true,
    });
    setMoSua(true);
  };

  const luuTao = async () => {
    if (dangLuu) return;
    setDangLuu(true);
    try {
      const mk = form.matKhau.trim() || taoMatKhauNgauNhien(12);
      await onTaoTaiKhoan({ ...form, matKhau: mk });
      setMoTao(false);
    } catch {
      /* onTaoTaiKhoan đã hiện lỗi */
    } finally {
      setDangLuu(false);
    }
  };

  const luuSua = async () => {
    if (!dangChon || dangLuu) return;
    if (!form.hoTen.trim()) {
      hienThongBaoQuanTri('Thiếu thông tin', 'Họ tên không được trống.');
      return;
    }
    setDangLuu(true);
    try {
      await onCapNhatHoSo(dangChon.email, {
        hoTen: form.hoTen,
        ten: form.hoTen,
        khoa: form.khoa,
        phong: form.phong,
        chucDanh: form.chucDanh,
        soDienThoai: form.soDienThoai,
        vaiTro: form.vaiTro === VAI_TRO_TAI_KHOAN_BV.ADMIN_BV ? 'ADMIN' : 'USER',
      });
      setMoSua(false);
      hienThongBaoQuanTri('Đã cập nhật', 'Hồ sơ tài khoản đã được lưu.');
    } catch (err) {
      hienThongBaoQuanTri('Lỗi', String(err?.message || err));
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <>
      <View style={styles.hangTieuDe}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tieuDeTab}>Tài khoản — {tenantChon?.displayName || '…'}</Text>
          <Text style={styles.moTaTab}>
            {taiKhoan.length} tài khoản · Admin BV đăng nhập luồng «Bệnh viện thành viên» và quản lý nhân viên tại 🔐 Phân quyền.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.nutChinh}
          disabled={!orgId}
          onPress={() => { setForm(FORM_MAC_DINH); setMoTao(true); }}
        >
          <Text style={styles.chuNutChinh}>＋ Tạo tài khoản</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.oNhap}
        placeholder="🔍 Tìm theo email, tên, khoa…"
        value={loc}
        onChangeText={setLoc}
      />

      {filtered.length === 0 ? (
        <Text style={styles.rong}>
          {taiKhoan.length === 0
            ? 'Chưa có tài khoản. Tạo Admin BV để bệnh viện bắt đầu sử dụng hệ thống.'
            : 'Không tìm thấy tài khoản phù hợp.'}
        </Text>
      ) : null}

      {filtered.map((row) => (
        <View key={row.email} style={styles.card}>
          <Text style={styles.tenCard}>{row.hoTen || row.ten || row.email}</Text>
          <Text style={styles.meta}>{row.email}</Text>
          <Text style={styles.meta}>
            {row.vaiTro === 'ADMIN' ? '👑 Admin BV' : '👤 Nhân viên'}
            {' · '}
            {row.trangThai === 'KHOA' ? '🔒 Khóa' : '✅ Hoạt động'}
            {row.khoa ? ` · ${row.khoa}` : ''}
            {row.chucDanh ? ` · ${row.chucDanh}` : ''}
          </Text>
          {row.lanDangNhapCuoi ? (
            <Text style={styles.meta}>
              Đăng nhập cuối: {row.lanDangNhapCuoi.slice(0, 19).replace('T', ' ')}
            </Text>
          ) : null}
          <View style={styles.hangNut}>
            <TouchableOpacity style={styles.nutPhu} onPress={() => moFormSua(row)}>
              <Text style={styles.chuNutPhu}>✏️ Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nutPhu} onPress={() => onDatLaiMk(row.email)}>
              <Text style={styles.chuNutPhu}>🔑 Đặt lại MK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nutPhu} onPress={() => onKhoaMo(row)}>
              <Text style={styles.chuNutPhu}>
                {row.trangThai === 'KHOA' ? '🔓 Mở khóa' : '🔒 Khóa'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nutNguyHiem} onPress={() => onXoa(row.email)}>
              <Text style={styles.chuNutNguyHiem}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={moTao} transparent animationType="slide" onRequestClose={() => setMoTao(false)}>
        <View style={styles.modalNen}>
          <View style={styles.modalCard}>
            <Text style={styles.tieuDeTab}>Tạo tài khoản mới</Text>
            <FormTaiKhoan form={form} setForm={setForm} />
            <View style={styles.hangModal}>
              <TouchableOpacity style={styles.nutPhu} onPress={() => setMoTao(false)}>
                <Text style={styles.chuNutPhu}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nutChinh, (!form.email || !form.hoTen || dangLuu) && { opacity: 0.5 }]}
                disabled={!form.email || !form.hoTen || !KIEM_TRA_EMAIL_CDSS.test(form.email.trim()) || dangLuu}
                onPress={luuTao}
              >
                {dangLuu ? <ActivityIndicator color="#fff" /> : <Text style={styles.chuNutChinh}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={moSua} transparent animationType="fade" onRequestClose={() => setMoSua(false)}>
        <View style={styles.modalNen}>
          <View style={styles.modalCard}>
            <Text style={styles.tieuDeTab}>Sửa hồ sơ</Text>
            <FormTaiKhoan form={form} setForm={setForm} readOnlyEmail />
            <View style={styles.hangModal}>
              <TouchableOpacity style={styles.nutPhu} onPress={() => setMoSua(false)}>
                <Text style={styles.chuNutPhu}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nutChinh} onPress={luuSua} disabled={dangLuu}>
                {dangLuu ? <ActivityIndicator color="#fff" /> : <Text style={styles.chuNutChinh}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default TabTaiKhoan;
