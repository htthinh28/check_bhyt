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
import { ghiAuditQuanTri } from '../../tien_ich/audit_quan_tri';
import { docTaiKhoanTheoOrg } from '../../tien_ich/tai_khoan_bv_service';
import { hienThongBaoQuanTri } from '../../tien_ich/quan_tri_hoi_thoai';
import { styles } from './quan_tri_theme';

const TabCoSo = ({
  danhSachBv,
  orgId,
  actor,
  onChonOrg,
  onMoWizard,
  onTaiLai,
  onXoaBv,
}) => {
  const [moSua, setMoSua] = useState(false);
  const [dangChon, setDangChon] = useState(null);
  const [form, setForm] = useState({ ten: '', maCskcb: '' });
  const [thongKe, setThongKe] = useState({});
  const [dangLuu, setDangLuu] = useState(false);

  const taiThongKe = async (id) => {
    try {
      const ds = await docTaiKhoanTheoOrg(id);
      const coAdmin = ds.some((tk) => tk.vaiTro === 'ADMIN' && tk.trangThai !== 'KHOA');
      setThongKe((cur) => ({ ...cur, [id]: { soTk: ds.length, coAdmin } }));
    } catch {
      setThongKe((cur) => ({ ...cur, [id]: { soTk: 0, coAdmin: false } }));
    }
  };

  const moChiTiet = (row) => {
    onChonOrg(row.orgId);
    if (!thongKe[row.orgId]) taiThongKe(row.orgId);
  };

  const moFormSua = (row) => {
    setDangChon(row);
    setForm({ ten: row.displayName, maCskcb: row.maCskcb || '' });
    setMoSua(true);
    if (!thongKe[row.orgId]) taiThongKe(row.orgId);
  };

  const luuSua = async () => {
    if (!dangChon || dangLuu) return;
    if (!form.ten.trim()) {
      hienThongBaoQuanTri('Thiếu thông tin', 'Tên bệnh viện không được trống.');
      return;
    }
    setDangLuu(true);
    try {
      await capNhatTenantTuyChinh(dangChon.orgId, {
        displayName: form.ten,
        maCskcb: form.maCskcb,
      });
      await ghiAuditQuanTri({
        hanhDong: 'CAP_NHAT_CO_SO_KCB',
        orgId: dangChon.orgId,
        doiTuong: form.ten,
        taiKhoan: actor,
        heThong: 'TRUY_CAP',
      });
      setMoSua(false);
      await onTaiLai();
      hienThongBaoQuanTri('Đã cập nhật', 'Thông tin cơ sở KCB đã được lưu.');
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
        {danhSachBv.map((row) => {
          const tk = thongKe[row.orgId];
          const dangChonRow = orgId === row.orgId;
          return (
            <View
              key={row.orgId}
              style={[styles.card, styles.cardBv, dangChonRow && { borderColor: '#C2185B', borderWidth: 2 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={styles.tenCard}>{row.displayName}</Text>
                <Text style={[styles.badgeNguon, row.source === 'custom' ? styles.badgeCustom : styles.badgeBundle]}>
                  {row.source === 'custom' ? 'Tùy chỉnh' : 'Bundle'}
                </Text>
              </View>
              <Text style={styles.meta}>org: {row.orgId}</Text>
              <Text style={styles.meta}>Mã CSKCB: {row.maCskcb || '—'}</Text>
              <Text style={styles.meta}>
                {tk
                  ? (tk.coAdmin
                    ? `✅ ${tk.soTk} tài khoản · Đã có Admin BV`
                    : `⚠️ ${tk.soTk} tài khoản · Chưa có Admin BV`)
                  : 'Bấm «Chi tiết» để kiểm tra tài khoản'}
              </Text>
              <View style={styles.hangNut}>
                <TouchableOpacity style={styles.nutPhu} onPress={() => moChiTiet(row)}>
                  <Text style={styles.chuNutPhu}>{dangChonRow ? '✓ Đang chọn' : 'Chi tiết'}</Text>
                </TouchableOpacity>
                {row.source === 'custom' ? (
                  <TouchableOpacity style={styles.nutPhu} onPress={() => moFormSua(row)}>
                    <Text style={styles.chuNutPhu}>✏️ Sửa</Text>
                  </TouchableOpacity>
                ) : null}
                {tk?.coAdmin ? null : (
                  <TouchableOpacity
                    style={styles.nutChinh}
                    onPress={() => { onChonOrg(row.orgId); onMoWizard(); }}
                  >
                    <Text style={styles.chuNutChinh}>+ Admin BV</Text>
                  </TouchableOpacity>
                )}
                {row.source === 'custom' ? (
                  <TouchableOpacity
                    style={styles.nutNguyHiem}
                    onPress={() => onXoaBv(row.orgId, row.displayName)}
                  >
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
            <TextInput
              style={styles.oNhap}
              value={form.ten}
              onChangeText={(v) => setForm((s) => ({ ...s, ten: v }))}
            />
            <Text style={styles.nhan}>Mã CSKCB</Text>
            <TextInput
              style={styles.oNhap}
              value={form.maCskcb}
              onChangeText={(v) => setForm((s) => ({ ...s, maCskcb: v }))}
              autoCapitalize="characters"
            />
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

export default TabCoSo;
