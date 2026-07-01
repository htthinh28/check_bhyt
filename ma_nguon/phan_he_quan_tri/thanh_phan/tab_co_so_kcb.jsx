import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { capNhatTenantTuyChinh } from '../../tien_ich/tenant_registry_custom';
import { ghiAuditQuanTri } from '../dich_vu/audit_quan_tri_service';
import { docTaiKhoanTheoOrg } from '../dich_vu/tai_khoan_bv_service';
import { styles } from './dieu_khien_quan_tri_styles';
import { hienThongBaoQuanTri } from './ho_tro_hop_thoai';

export default function TabCoSoKcb({
  danhSachBv,
  orgId,
  actor,
  onChonOrg,
  onMoWizard,
  onTaiLai,
  onXoaBv,
}) {
  const [moSua, setMoSua] = useState(false);
  const [dangSua, setDangSua] = useState(null);
  const [formSua, setFormSua] = useState({ ten: '', maCskcb: '' });
  const [trangThaiBv, setTrangThaiBv] = useState({});
  const [dangLuu, setDangLuu] = useState(false);

  const taiTrangThai = async (oid) => {
    try {
      const ds = await docTaiKhoanTheoOrg(oid);
      const coAdmin = ds.some((u) => u.vaiTro === 'ADMIN' && u.trangThai !== 'KHOA');
      setTrangThaiBv((prev) => ({
        ...prev,
        [oid]: { soTk: ds.length, coAdmin },
      }));
    } catch {
      setTrangThaiBv((prev) => ({ ...prev, [oid]: { soTk: 0, coAdmin: false } }));
    }
  };

  const moFormSua = (t) => {
    setDangSua(t);
    setFormSua({ ten: t.displayName, maCskcb: t.maCskcb || '' });
    setMoSua(true);
    if (!trangThaiBv[t.orgId]) taiTrangThai(t.orgId);
  };

  const luuSua = async () => {
    if (!dangSua || dangLuu) return;
    if (!formSua.ten.trim()) {
      hienThongBaoQuanTri('Thiếu thông tin', 'Tên bệnh viện không được trống.');
      return;
    }
    setDangLuu(true);
    try {
      await capNhatTenantTuyChinh(dangSua.orgId, {
        displayName: formSua.ten,
        maCskcb: formSua.maCskcb,
      });
      await ghiAuditQuanTri({
        hanhDong: 'CAP_NHAT_CO_SO_KCB',
        orgId: dangSua.orgId,
        doiTuong: formSua.ten,
        taiKhoan: actor,
        heThong: 'TRUY_CAP',
      });
      setMoSua(false);
      await onTaiLai();
      hienThongBaoQuanTri('Đã cập nhật', 'Thông tin cơ sở KCB đã được lưu.');
    } catch (e) {
      hienThongBaoQuanTri('Lỗi', String(e?.message || e));
    } finally {
      setDangLuu(false);
    }
  };

  const xemChiTiet = (t) => {
    onChonOrg(t.orgId);
    if (!trangThaiBv[t.orgId]) taiTrangThai(t.orgId);
  };

  return (
  <>
    <View style={styles.hangTieuDe}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tieuDeTab}>Cơ sở khám chữa bệnh</Text>
        <Text style={styles.moTaTab}>
          Quản lý danh sách BV thành viên. Dùng «Khởi tạo BV» để thêm cơ sở mới kèm Admin BV trong một lần.
        </Text>
      </View>
      <TouchableOpacity style={styles.nutChinh} onPress={onMoWizard}>
        <Text style={styles.chuNutChinh}>🚀 Khởi tạo BV</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.cardGrid}>
      {danhSachBv.map((t) => {
        const tt = trangThaiBv[t.orgId];
        const dangChon = orgId === t.orgId;
        return (
          <View key={t.orgId} style={[styles.card, styles.cardBv, dangChon && { borderColor: '#C2185B', borderWidth: 2 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={styles.tenCard}>{t.displayName}</Text>
              <Text style={[styles.badgeNguon, t.source === 'custom' ? styles.badgeCustom : styles.badgeBundle]}>
                {t.source === 'custom' ? 'Tùy chỉnh' : 'Bundle'}
              </Text>
            </View>
            <Text style={styles.meta}>org: {t.orgId}</Text>
            <Text style={styles.meta}>Mã CSKCB: {t.maCskcb || '—'}</Text>
            <Text style={styles.meta}>
              {tt ? (
                tt.coAdmin
                  ? `✅ ${tt.soTk} tài khoản · Đã có Admin BV`
                  : `⚠️ ${tt.soTk} tài khoản · Chưa có Admin BV`
              ) : (
                'Bấm «Chi tiết» để kiểm tra tài khoản'
              )}
            </Text>
            <View style={styles.hangNut}>
              <TouchableOpacity style={styles.nutPhu} onPress={() => xemChiTiet(t)}>
                <Text style={styles.chuNutPhu}>{dangChon ? '✓ Đang chọn' : 'Chi tiết'}</Text>
              </TouchableOpacity>
              {t.source === 'custom' ? (
                <TouchableOpacity style={styles.nutPhu} onPress={() => moFormSua(t)}>
                  <Text style={styles.chuNutPhu}>✏️ Sửa</Text>
                </TouchableOpacity>
              ) : null}
              {!tt?.coAdmin ? (
                <TouchableOpacity
                  style={styles.nutChinh}
                  onPress={() => {
                    onChonOrg(t.orgId);
                    onMoWizard();
                  }}
                >
                  <Text style={styles.chuNutChinh}>+ Admin BV</Text>
                </TouchableOpacity>
              ) : null}
              {t.source === 'custom' ? (
                <TouchableOpacity style={styles.nutNguyHiem} onPress={() => onXoaBv(t.orgId, t.displayName)}>
                  <Text style={styles.chuNutNguyHiem}>Xóa</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>

    {danhSachBv.length === 0 ? (
      <Text style={styles.rong}>Chưa có cơ sở KCB. Bấm «Khởi tạo BV» để bắt đầu.</Text>
    ) : null}

    <Modal visible={moSua} transparent animationType="fade" onRequestClose={() => setMoSua(false)}>
      <View style={styles.modalNen}>
        <View style={styles.modalCard}>
          <Text style={styles.tieuDeTab}>Sửa cơ sở KCB</Text>
          <Text style={styles.nhan}>Tên hiển thị</Text>
          <TextInput style={styles.oNhap} value={formSua.ten} onChangeText={(v) => setFormSua((f) => ({ ...f, ten: v }))} />
          <Text style={styles.nhan}>Mã CSKCB</Text>
          <TextInput
            style={styles.oNhap}
            value={formSua.maCskcb}
            onChangeText={(v) => setFormSua((f) => ({ ...f, maCskcb: v }))}
            autoCapitalize="characters"
          />
          <View style={styles.hangModal}>
            <TouchableOpacity style={styles.nutPhu} onPress={() => setMoSua(false)}>
              <Text style={styles.chuNutPhu}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nutChinh} onPress={luuSua} disabled={dangLuu}>
              {dangLuu ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.chuNutChinh}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </>
  );
}
