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
import { hienThongBaoQuanTri } from '../../tien_ich/quan_tri_hoi_thoai';
import { khoiTaoBenhVien } from '../../tien_ich/platform_benh_vien';
import { KIEM_TRA_EMAIL_CDSS } from '../../tien_ich/dich_vu_tai_khoan_cdss';
import { styles } from './quan_tri_theme';

const BUOC_WIZARD = [
  { id: 1, label: '1. Cơ sở' },
  { id: 2, label: '2. Admin BV' },
  { id: 3, label: '3. Xác nhận' },
];

const slugTuTen = (raw) => String(raw || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\u0111/g, 'd')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

const ModalKhoiTaoBv = ({ visible, onDong, onThanhCong, actor }) => {
  const [buoc, setBuoc] = useState(1);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [form, setForm] = useState({
    orgId: '',
    displayName: '',
    maCskcb: '',
    catalogPolicy: 'legacy_bundle',
    taoAdminBv: true,
    adminEmail: '',
    adminHoTen: '',
    adminMatKhau: '',
    adminKhoa: 'Phòng Công nghệ thông tin',
    adminChucDanh: 'Quản trị viên BV',
  });

  const reset = () => {
    setBuoc(1);
    setForm({
      orgId: '',
      displayName: '',
      maCskcb: '',
      catalogPolicy: 'legacy_bundle',
      taoAdminBv: true,
      adminEmail: '',
      adminHoTen: '',
      adminMatKhau: '',
      adminKhoa: 'Phòng Công nghệ thông tin',
      adminChucDanh: 'Quản trị viên BV',
    });
    onDong();
  };

  const capNhat = (key, value) => {
    setForm((cur) => {
      const next = { ...cur, [key]: value };
      if (key === 'displayName' && !cur.orgId) next.orgId = slugTuTen(value);
      if (key === 'displayName' && !cur.adminHoTen) next.adminHoTen = `Admin ${value}`.trim();
      return next;
    });
  };

  const hopLeBuoc1 = form.displayName.trim().length >= 2 && form.orgId.trim().length >= 2;
  const hopLeBuoc2 = !form.taoAdminBv
    || (KIEM_TRA_EMAIL_CDSS.test(form.adminEmail.trim()) && form.adminHoTen.trim().length >= 2);

  const tomTat = useMemo(() => ({
    coSo: `${form.displayName} (${form.orgId})`,
    cskcb: form.maCskcb || '—',
    admin: form.taoAdminBv ? form.adminEmail : 'Không tạo — thêm sau tại tab Tài khoản',
  }), [form]);

  const tiepTheo = () => {
    if (buoc === 1 && !hopLeBuoc1) {
      hienThongBaoQuanTri('Thiếu thông tin', 'Nhập tên BV và mã org (slug) hợp lệ.');
      return;
    }
    if (buoc === 2 && !hopLeBuoc2) {
      hienThongBaoQuanTri('Thiếu thông tin', 'Nhập email và họ tên Admin BV hợp lệ.');
      return;
    }
    setBuoc((b) => Math.min(3, b + 1));
  };

  const khoiTao = async () => {
    setDangXuLy(true);
    try {
      const ketQua = await khoiTaoBenhVien({
        orgId: form.orgId,
        displayName: form.displayName,
        maCskcb: form.maCskcb,
        catalogPolicy: form.catalogPolicy,
        taoAdminBv: form.taoAdminBv,
        adminEmail: form.adminEmail,
        adminHoTen: form.adminHoTen,
        adminMatKhau: form.adminMatKhau,
        adminKhoa: form.adminKhoa,
        adminChucDanh: form.adminChucDanh,
      }, actor);

      let msg = `Đã khởi tạo: ${ketQua.tenant.displayName}\norg: ${ketQua.tenant.orgId}`;
      if (form.taoAdminBv) {
        if (ketQua.admin?.daTonTai) {
          msg += `\n\nAdmin BV đã tồn tại: ${form.adminEmail}`;
        } else if (ketQua.admin?.matKhauTam) {
          msg += `\n\nAdmin BV: ${form.adminEmail}\nMật khẩu tạm: ${ketQua.admin.matKhauTam}`;
        }
      }
      hienThongBaoQuanTri('Khởi tạo thành công', msg);
      onThanhCong(ketQua.tenant.orgId);
      reset();
    } catch (err) {
      hienThongBaoQuanTri('Lỗi khởi tạo', String(err?.message || err));
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={reset}>
      <View style={styles.modalNen}>
        <View style={styles.modalCard}>
          <Text style={styles.tieuDeTab}>🏥 Khởi tạo bệnh viện thành viên</Text>
          <Text style={styles.moTaTab}>
            Tạo cơ sở KCB mới, seed RBAC và (tuỳ chọn) tài khoản Admin BV để BV đăng nhập luồng «Bệnh viện thành viên».
          </Text>

          <View style={styles.buocWizard}>
            {BUOC_WIZARD.map((b) => (
              <View
                key={b.id}
                style={[
                  styles.buocItem,
                  buoc === b.id && styles.buocItemActive,
                  buoc > b.id && styles.buocItemDone,
                ]}
              >
                <Text style={styles.chuBuoc}>{b.label}</Text>
              </View>
            ))}
          </View>

          <ScrollView style={{ maxHeight: 380 }}>
            {buoc === 1 && (
              <>
                <Text style={styles.nhan}>Tên bệnh viện / CSKCB *</Text>
                <TextInput
                  style={styles.oNhap}
                  value={form.displayName}
                  onChangeText={(v) => capNhat('displayName', v)}
                  placeholder="Bệnh viện Đa khoa …"
                />
                <Text style={styles.nhan}>Mã org (slug) *</Text>
                <TextInput
                  style={styles.oNhap}
                  value={form.orgId}
                  onChangeText={(v) => capNhat('orgId', v)}
                  placeholder="benh_vien_abc"
                  autoCapitalize="none"
                />
                <Text style={styles.nhan}>Mã CSKCB (BYT)</Text>
                <TextInput
                  style={styles.oNhap}
                  value={form.maCskcb}
                  onChangeText={(v) => capNhat('maCskcb', v)}
                  placeholder="94170"
                  autoCapitalize="characters"
                />
                <Text style={styles.nhan}>Chính sách danh mục</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {[['legacy_bundle', 'Bundle mặc định'], ['tenant_pack_only', 'Tenant pack']].map(([id, label]) => (
                    <TouchableOpacity
                      key={id}
                      style={[styles.chipRole, form.catalogPolicy === id && styles.chipRoleActive]}
                      onPress={() => capNhat('catalogPolicy', id)}
                    >
                      <Text style={form.catalogPolicy === id ? styles.chuRoleActive : styles.chuChip}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {buoc === 2 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.nhan}>Tạo tài khoản Admin BV</Text>
                  <Switch value={form.taoAdminBv} onValueChange={(v) => capNhat('taoAdminBv', v)} />
                </View>
                {form.taoAdminBv ? (
                  <>
                    <Text style={styles.nhan}>Email Admin BV *</Text>
                    <TextInput
                      style={styles.oNhap}
                      value={form.adminEmail}
                      onChangeText={(v) => capNhat('adminEmail', v)}
                      placeholder="admin@bv.vn"
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <Text style={styles.nhan}>Họ tên *</Text>
                    <TextInput style={styles.oNhap} value={form.adminHoTen} onChangeText={(v) => capNhat('adminHoTen', v)} />
                    <Text style={styles.nhan}>Khoa / Phòng</Text>
                    <TextInput style={styles.oNhap} value={form.adminKhoa} onChangeText={(v) => capNhat('adminKhoa', v)} />
                    <Text style={styles.nhan}>Chức danh</Text>
                    <TextInput style={styles.oNhap} value={form.adminChucDanh} onChangeText={(v) => capNhat('adminChucDanh', v)} />
                    <Text style={styles.nhan}>Mật khẩu (để trống = tự sinh)</Text>
                    <TextInput
                      style={styles.oNhap}
                      value={form.adminMatKhau}
                      onChangeText={(v) => capNhat('adminMatKhau', v)}
                      secureTextEntry
                    />
                  </>
                ) : (
                  <Text style={styles.meta}>Bạn có thể tạo Admin BV sau tại tab «Tài khoản» khi đã chọn cơ sở.</Text>
                )}
              </>
            )}

            {buoc === 3 && (
              <View style={styles.card}>
                <Text style={styles.tenCard}>Xác nhận khởi tạo</Text>
                <Text style={styles.meta}>Cơ sở: {tomTat.coSo}</Text>
                <Text style={styles.meta}>Mã CSKCB: {tomTat.cskcb}</Text>
                <Text style={styles.meta}>Admin BV: {tomTat.admin}</Text>
                <Text style={[styles.meta, { marginTop: 12, color: '#059669' }]}>
                  ✓ Đăng ký tenant · ✓ Seed RBAC · {form.taoAdminBv ? '✓ Tạo Admin BV' : '○ Bỏ qua Admin BV'}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.hangModal}>
            <TouchableOpacity style={styles.nutPhu} onPress={buoc === 1 ? reset : () => setBuoc((b) => b - 1)}>
              <Text style={styles.chuNutPhu}>{buoc === 1 ? 'Hủy' : '← Quay lại'}</Text>
            </TouchableOpacity>
            {buoc < 3 ? (
              <TouchableOpacity style={styles.nutChinh} onPress={tiepTheo}>
                <Text style={styles.chuNutChinh}>Tiếp theo →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nutChinh} onPress={khoiTao} disabled={dangXuLy}>
                {dangXuLy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.chuNutChinh}>🚀 Khởi tạo ngay</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ModalKhoiTaoBv;
