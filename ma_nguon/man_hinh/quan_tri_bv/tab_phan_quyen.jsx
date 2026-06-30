import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { xacNhanQuanTri } from '../../tien_ich/quan_tri_hoi_thoai';
import { styles } from './quan_tri_theme';

const TabPhanQuyen = ({ taiKhoan, cfgRbac, bindings, onGanVaiTro }) => {
  const [loc, setLoc] = useState('');

  const filtered = useMemo(() => {
    const kw = loc.trim().toLowerCase();
    if (!kw) return taiKhoan;
    return taiKhoan.filter((tk) => tk.email.includes(kw)
      || (tk.hoTen || '').toLowerCase().includes(kw));
  }, [taiKhoan, loc]);

  const roleMap = useMemo(() => {
    const map = {};
    (cfgRbac.roles || []).forEach((r) => { map[r.id] = r; });
    return map;
  }, [cfgRbac.roles]);

  const layVaiTroHienTai = (email) => {
    const binding = bindings[email];
    const roleId = binding?.roleIds?.[0];
    return roleId ? roleMap[roleId] : null;
  };

  return (
    <>
      <View style={styles.sectionHead}>
        <Text style={styles.tieuDeTab}>Phân quyền RBAC</Text>
        <Text style={styles.moTaTab}>
          Gán vai trò chuẩn cho từng nhân viên. Vai trò đang chọn được đánh dấu màu hồng.
        </Text>
      </View>

      <TextInput
        style={styles.oNhap}
        placeholder="🔍 Tìm nhân viên…"
        value={loc}
        onChangeText={setLoc}
      />

      {(cfgRbac.roles || []).length > 0 ? (
        <View style={[styles.card, { backgroundColor: '#f8fafc' }]}>
          <Text style={styles.nhan}>Vai trò hệ thống</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(cfgRbac.roles || []).map((role) => (
              <View key={role.id} style={[styles.chipRole, { marginBottom: 0 }]}>
                <Text style={styles.chuChip}>{role.name}</Text>
                {role.description ? (
                  <Text style={[styles.meta, { marginTop: 2 }]}>{role.description}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <Text style={styles.rong}>
          Chưa có tài khoản để phân quyền. Tạo tài khoản tại tab «Tài khoản».
        </Text>
      ) : null}

      {filtered.map((row) => {
        const role = layVaiTroHienTai(row.email);
        return (
          <View key={row.email} style={styles.card}>
            <Text style={styles.tenCard}>{row.hoTen || row.email}</Text>
            <Text style={styles.meta}>{row.email}</Text>
            {role ? (
              <Text style={[styles.meta, { color: '#C2185B', fontWeight: '700' }]}>
                Vai trò hiện tại: {role.name}
              </Text>
            ) : (
              <Text style={[styles.meta, { color: '#d97706' }]}>Chưa gán vai trò RBAC</Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {(cfgRbac.roles || []).map((r) => {
                const active = role?.id === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.chipRole, active && styles.chipRoleActive]}
                    onPress={async () => {
                      if (await xacNhanQuanTri('Xác nhận', `Gán vai trò «${r.name}» cho ${row.email}?`)) {
                        await onGanVaiTro(row.email, r.id);
                      }
                    }}
                  >
                    <Text style={active ? styles.chuRoleActive : styles.chuChip}>{r.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </>
  );
};

export default TabPhanQuyen;
