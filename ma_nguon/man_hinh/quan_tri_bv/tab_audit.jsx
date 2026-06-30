import { useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from './quan_tri_theme';

const MAU_HANH_DONG = {
  KHOI_TAO_BENH_VIEN: '#059669',
  TAO_TAI_KHOAN_BV: '#2563eb',
  GAN_PHAN_QUYEN_BV: '#7c3aed',
  DAT_LAI_MAT_KHAU_BV: '#d97706',
  XOA_TAI_KHOAN_BV: '#dc2626',
  THEM_CO_SO_KCB: '#059669',
  XOA_CO_SO_KCB: '#dc2626',
};

const LOAI_LOC = [
  { id: '', label: 'Tất cả' },
  { id: 'KHOI_TAO', label: 'Khởi tạo' },
  { id: 'TAI_KHOAN', label: 'Tài khoản' },
  { id: 'PHAN_QUYEN', label: 'Phân quyền' },
  { id: 'CO_SO', label: 'Cơ sở KCB' },
];

const TabAudit = ({
  auditRows,
  locAudit,
  loaiLoc,
  onDoiLoc,
  onDoiLoai,
  onTaiLai,
}) => {
  const filtered = useMemo(() => {
    let rows = auditRows;
    if (loaiLoc === 'KHOI_TAO') {
      rows = rows.filter((r) => r.hanhDong?.includes('KHOI_TAO') || r.hanhDong?.includes('THEM_CO_SO'));
    } else if (loaiLoc === 'TAI_KHOAN') {
      rows = rows.filter((r) => r.hanhDong?.includes('TAI_KHOAN') || r.hanhDong?.includes('MAT_KHAU'));
    } else if (loaiLoc === 'PHAN_QUYEN') {
      rows = rows.filter((r) => r.hanhDong?.includes('PHAN_QUYEN') || r.hanhDong?.includes('GAN_'));
    } else if (loaiLoc === 'CO_SO') {
      rows = rows.filter((r) => r.hanhDong?.includes('CO_SO'));
    }
    return rows;
  }, [auditRows, loaiLoc]);

  return (
    <>
      <View style={styles.sectionHead}>
        <Text style={styles.tieuDeTab}>Nhật ký & Audit</Text>
        <Text style={styles.moTaTab}>
          {filtered.length} bản ghi · Theo dõi thao tác quản trị trên cơ sở đang chọn
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <TextInput
          style={[styles.oNhap, { flex: 1, minWidth: 200, marginBottom: 0 }]}
          placeholder="🔍 Từ khóa, email, hành động…"
          value={locAudit}
          onChangeText={onDoiLoc}
        />
        <TouchableOpacity style={styles.nutPhu} onPress={onTaiLai}>
          <Text style={styles.chuNutPhu}>Lọc</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {LOAI_LOC.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.chipRole, loaiLoc === item.id && styles.chipRoleActive]}
            onPress={() => onDoiLoai(item.id)}
          >
            <Text style={loaiLoc === item.id ? styles.chuRoleActive : styles.chuChip}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.rong}>Chưa có bản ghi audit cho cơ sở này.</Text>
      ) : null}

      {filtered.map((row) => {
        const color = MAU_HANH_DONG[row.hanhDong] || '#C2185B';
        return (
          <View
            key={row.id || `${row.thoiGian}_${row.hanhDong}`}
            style={[styles.dongAudit, { borderLeftColor: color }]}
          >
            <Text style={styles.auditTime}>{row.thoiGian?.replace('T', ' ').slice(0, 19)}</Text>
            <Text style={styles.auditAction}>{row.hanhDong?.replace(/_/g, ' ')}</Text>
            <Text style={styles.meta}>
              {row.taiKhoan || '—'}
              {' · '}
              {row.doiTuong || '—'}
              {row.heThong ? ` · ${row.heThong}` : ''}
            </Text>
            {row.chiTiet ? (
              <Text style={[styles.meta, { marginTop: 4 }]}>{row.chiTiet}</Text>
            ) : null}
          </View>
        );
      })}
    </>
  );
};

export default TabAudit;
