import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from './dieu_khien_quan_tri_styles';
import { xacNhanQuanTri } from './ho_tro_hop_thoai';

export default function TabPhanQuyenBv({
  taiKhoan,
  cfgRbac,
  bindings,
  onGanVaiTro,
}) {
  const [loc, setLoc] = useState('');

  const dsLoc = useMemo(() => {
    const q = loc.trim().toLowerCase();
    if (!q) return taiKhoan;
    return taiKhoan.filter((u) => u.email.includes(q) || (u.hoTen || '').toLowerCase().includes(q));
  }, [taiKhoan, loc]);

  const roleMap = useMemo(() => {
    const m = {};
    (cfgRbac.roles || []).forEach((r) => { m[r.id] = r; });
    return m;
  }, [cfgRbac.roles]);

  const layRoleHienTai = (email) => {
    const b = bindings[email];
    const rid = b?.roleIds?.[0];
    return rid ? roleMap[rid] : null;
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
          {(cfgRbac.roles || []).map((r) => (
            <View key={r.id} style={[styles.chipRole, { marginBottom: 0 }]}>
              <Text style={styles.chuChip}>{r.name}</Text>
              {r.description ? <Text style={[styles.meta, { marginTop: 2 }]}>{r.description}</Text> : null}
            </View>
          ))}
        </ScrollView>
      </View>
    ) : null}

    {dsLoc.length === 0 ? (
      <Text style={styles.rong}>Chưa có tài khoản để phân quyền. Tạo tài khoản tại tab «Tài khoản».</Text>
    ) : null}

    {dsLoc.map((u) => {
      const roleHienTai = layRoleHienTai(u.email);
      return (
        <View key={u.email} style={styles.card}>
          <Text style={styles.tenCard}>{u.hoTen || u.email}</Text>
          <Text style={styles.meta}>{u.email}</Text>
          {roleHienTai ? (
            <Text style={[styles.meta, { color: '#C2185B', fontWeight: '700' }]}>
              Vai trò hiện tại: {roleHienTai.name}
            </Text>
          ) : (
            <Text style={[styles.meta, { color: '#d97706' }]}>Chưa gán vai trò RBAC</Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {(cfgRbac.roles || []).map((r) => {
              const active = roleHienTai?.id === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.chipRole, active && styles.chipRoleActive]}
                  onPress={async () => {
                    const ok = await xacNhanQuanTri('Xác nhận', `Gán vai trò «${r.name}» cho ${u.email}?`);
                    if (ok) onGanVaiTro(u.email, r.id);
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
}
