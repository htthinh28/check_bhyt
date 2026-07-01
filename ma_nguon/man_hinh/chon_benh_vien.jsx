/**
 * Màn Chọn bệnh viện / Cổng triển khai — đồng bộ từ Vercel checkbhytdev.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CD } from '../tien_ich/chu_de_giao_dien';
import {
  CHE_DO_ADMIN_HE_THONG,
  CHE_DO_THANH_VIEN,
  docCheDoTruyCap,
  lockSourceTuCheDo,
  luuCheDoTruyCap,
  xoaCheDoTruyCap,
} from '../tien_ich/che_do_truy_cap';
import {
  coCanGateTrienKhai,
  coGateSessionHopLe,
  dongGateSession,
  moGateSession,
  xacThucMatKhauGate,
} from '../tien_ich/deploy_gate';
import { dieuHuongSauMoGate } from '../tien_ich/dieu_huong_admin_he_thong';
import { laCheDoBuildDonTenant } from '../tien_ich/tenant_context';
import { damBaoMigrationTenant } from '../tien_ich/tenant_migration';
import { layDanhSachTenant } from '../tien_ich/tenant_registry';
import { damBaoTaiRegistryTuyChinh } from '../tien_ich/tenant_registry_custom';
import { khoaTenantSession } from '../tien_ich/tenant_session';

const KhungNen = ({ children }) => (
  <View style={styles.nenDayDu}>
    <SafeAreaView style={styles.lopNoiDung}>
      <KeyboardAvoidingView behavior="height" style={styles.lopTranh}>
        <ScrollView
          contentContainerStyle={styles.scrollTrenNen}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
);

const ManHinhChonBenhVien = ({ navigation }) => {
  const [dangTai, setDangTai] = useState(true);
  const [cheDo, setCheDo] = useState(null);
  const [hienChonBv, setHienChonBv] = useState(false);
  const [matKhauGate, setMatKhauGate] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [dangXuLyGate, setDangXuLyGate] = useState(false);
  const [danhSachBv, setDanhSachBv] = useState([]);
  const [orgDangChon, setOrgDangChon] = useState('');
  const [loi, setLoi] = useState('');

  const taiDanhSach = useCallback(() => {
    setDanhSachBv(layDanhSachTenant());
  }, []);

  useEffect(() => {
    let huy = false;
    (async () => {
      try {
        await damBaoTaiRegistryTuyChinh();
        if (huy) return;
        taiDanhSach();
        const mode = await docCheDoTruyCap();
        if (!huy && mode) setCheDo(mode);

        if (coCanGateTrienKhai()) {
          if (mode === CHE_DO_THANH_VIEN) {
            if (!huy) setHienChonBv(true);
          } else if (mode === CHE_DO_ADMIN_HE_THONG) {
            const gateOk = await coGateSessionHopLe();
            if (!huy && gateOk) {
              dieuHuongSauMoGate(navigation);
              return;
            }
            if (!huy) setHienChonBv(false);
          } else if (!huy) {
            setHienChonBv(false);
          }
        } else if (!huy) {
          setHienChonBv(true);
        }
      } finally {
        if (!huy) setDangTai(false);
      }
    })();
    return () => { huy = true; };
  }, [navigation, taiDanhSach]);

  const chonCheDo = useCallback(async (mode) => {
    setLoi('');
    await luuCheDoTruyCap(mode);
    setCheDo(mode);
    if (mode !== CHE_DO_THANH_VIEN) {
      if (coCanGateTrienKhai()) {
        if (await coGateSessionHopLe()) {
          dieuHuongSauMoGate(navigation);
          return;
        }
        setHienChonBv(false);
      } else {
        setHienChonBv(true);
      }
    } else {
      setHienChonBv(true);
    }
  }, [navigation]);

  const doiVaiTro = useCallback(async () => {
    setLoi('');
    if (cheDo === CHE_DO_ADMIN_HE_THONG) {
      await dongGateSession();
    }
    await xoaCheDoTruyCap();
    setCheDo(null);
    setHienChonBv(false);
    setMatKhauGate('');
  }, [cheDo]);

  const xacThucGate = useCallback(async () => {
    setLoi('');
    setDangXuLyGate(true);
    try {
      const ketQua = await xacThucMatKhauGate(matKhauGate);
      if (!ketQua.ok) {
        setLoi(ketQua.loi || 'Mật khẩu không đúng.');
        return;
      }
      await moGateSession();
      setMatKhauGate('');
      dieuHuongSauMoGate(navigation);
    } catch (err) {
      setLoi(String(err?.message || err));
    } finally {
      setDangXuLyGate(false);
    }
  }, [matKhauGate, navigation]);

  const chonBenhVien = useCallback(async (orgId) => {
    setLoi('');
    setOrgDangChon(orgId);
    try {
      const lockSource = lockSourceTuCheDo(cheDo || CHE_DO_THANH_VIEN);
      await khoaTenantSession(orgId, lockSource);
      await damBaoMigrationTenant();
      navigation.reset({ index: 0, routes: [{ name: 'DangNhap' }] });
    } catch (err) {
      setLoi(String(err?.message || err));
    } finally {
      setOrgDangChon('');
    }
  }, [cheDo, navigation]);

  const hienManChonVaiTro = coCanGateTrienKhai() && !cheDo && !laCheDoBuildDonTenant();

  if (cheDo === CHE_DO_ADMIN_HE_THONG && hienChonBv) {
    return null;
  }

  if (dangTai) {
    return (
      <KhungNen>
        <View style={styles.trungTam}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.chuTaiNen}>Đang tải…</Text>
        </View>
      </KhungNen>
    );
  }

  if (hienManChonVaiTro) {
    return (
      <KhungNen>
        <View style={[styles.theKinh, styles.theKinhRong]}>
          <Text style={styles.tieuDeGate}>CDSS BHYT</Text>
          <Text style={styles.phuDeKinh}>
            Chọn vai trò truy cập phù hợp. Nhân viên đăng nhập tại bệnh viện; quản trị hệ thống dùng cổng triển khai.
          </Text>
          <View style={styles.vachMong} />
          <TouchableOpacity style={styles.theVaiTro} onPress={() => chonCheDo(CHE_DO_THANH_VIEN)}>
            <Text style={styles.iconVaiTro}>🏥</Text>
            <Text style={styles.tenVaiTro}>Bệnh viện thành viên</Text>
            <Text style={styles.moTaVaiTro}>
              Nhân viên, bác sĩ, điều dưỡng — chọn cơ sở và đăng nhập tài khoản được cấp.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.theVaiTro, styles.theVaiTroAdmin]}
            onPress={() => chonCheDo(CHE_DO_ADMIN_HE_THONG)}
          >
            <Text style={styles.iconVaiTro}>⚙️</Text>
            <Text style={styles.tenVaiTro}>Quản trị hệ thống</Text>
            <Text style={styles.moTaVaiTro}>
              Cấu hình đa BV, tạo tài khoản admin BV — chỉ admin tối cao sau cổng triển khai.
            </Text>
          </TouchableOpacity>
          {loi ? <Text style={styles.loiKinh}>{loi}</Text> : null}
        </View>
        <Text style={styles.chanTrangNen}>CDSS BHYT · Đa bệnh viện · Web</Text>
      </KhungNen>
    );
  }

  if (hienChonBv) {
    return (
      <KhungNen>
        <View style={[styles.theKinh, styles.theKinhRong]}>
          <TouchableOpacity style={styles.nutPhuKinh} onPress={doiVaiTro}>
            <Text style={styles.chuNutPhuKinh}>← Đổi vai trò</Text>
          </TouchableOpacity>
          <Text style={styles.tieuDeGate}>Chọn bệnh viện của bạn</Text>
          <Text style={styles.phuDeKinh}>
            Chọn cơ sở khám chữa bệnh để đăng nhập tài khoản do admin BV cấp (admin BV hoặc nhân viên).
          </Text>
          <View style={styles.vachMong} />
          <View style={styles.danhSach}>
            {danhSachBv.map((bv) => {
              const dangChon = orgDangChon === bv.orgId;
              return (
                <View key={bv.orgId} style={[styles.the, dangChon && styles.the_active]}>
                  <TouchableOpacity
                    onPress={() => chonBenhVien(bv.orgId)}
                    disabled={Boolean(orgDangChon)}
                  >
                    <View style={styles.hang}>
                      <Text style={styles.ten}>{bv.displayName}</Text>
                      {dangChon ? <ActivityIndicator size="small" color={CD.mau_chinh} /> : null}
                    </View>
                    <Text style={styles.meta}>Mã org: {bv.orgId}</Text>
                    <Text style={styles.meta}>Mã CSKCB: {bv.maCskcb || '—'}</Text>
                    <Text style={styles.metaChinhSach}>
                      {bv.source === 'custom' ? 'Tùy chỉnh · ' : 'Mẫu · '}
                      {bv.catalogPolicy === 'tenant_pack_only' ? 'Tenant pack' : 'Legacy bundle'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          {loi ? <Text style={styles.loiKinh}>{loi}</Text> : null}
        </View>
        <Text style={styles.chanTrangNen}>CDSS BHYT · Nhân viên bệnh viện thành viên · Web</Text>
      </KhungNen>
    );
  }

  return (
    <KhungNen>
      <View style={styles.theKinh}>
        <TouchableOpacity style={styles.nutPhuKinh} onPress={doiVaiTro}>
          <Text style={styles.chuNutPhuKinh}>← Đổi vai trò</Text>
        </TouchableOpacity>
        <Text style={styles.tieuDeGate}>Cổng triển khai CDSS</Text>
        <Text style={styles.phuDeKinh}>
          Nhập mật khẩu quản trị triển khai để vào Module cấu hình hệ thống (chỉ admin tối cao).
        </Text>
        <View style={styles.vachMong} />
        <Text style={styles.nhanKinh}>Mật khẩu triển khai</Text>
        <View style={styles.hangNhapMatKhau}>
          <TextInput
            style={styles.oNhapFlex}
            value={matKhauGate}
            onChangeText={setMatKhauGate}
            placeholder="Nhập mật khẩu admin"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!hienMatKhau}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={xacThucGate}
            editable={!dangXuLyGate}
          />
          <TouchableOpacity
            style={styles.nutMat}
            onPress={() => setHienMatKhau((v) => !v)}
            accessibilityLabel={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Text style={styles.iconMat}>{hienMatKhau ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.nutChinh, (dangXuLyGate || !matKhauGate.trim()) && styles.nutVoHieu]}
          onPress={xacThucGate}
          disabled={dangXuLyGate || !matKhauGate.trim()}
        >
          {dangXuLyGate ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.chuNutChinh, (dangXuLyGate || !matKhauGate.trim()) && styles.chuNutVoHieu]}>
              Tiếp theo — Đăng nhập admin
            </Text>
          )}
        </TouchableOpacity>
        {loi ? <Text style={styles.loiKinh}>{loi}</Text> : null}
      </View>
      <Text style={styles.chanTrangNen}>CDSS BHYT · Triển khai đa bệnh viện · Web</Text>
    </KhungNen>
  );
};

export default ManHinhChonBenhVien;

const webOnly = Platform.OS === 'web' ? { minHeight: '100vh', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)', cursor: 'pointer' } : {};

const styles = StyleSheet.create({
  nenDayDu: { flex: 1, backgroundColor: '#0f172a', ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}) },
  lopNoiDung: { flex: 1, zIndex: 1 },
  lopTranh: { flex: 1 },
  scrollTrenNen: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 16,
  },
  trungTam: { minHeight: 240, justifyContent: 'center', alignItems: 'center', gap: 12 },
  chuTaiNen: { fontFamily: 'Arial', fontSize: 14, color: '#f8fafc', fontWeight: '600' },
  theKinh: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    ...webOnly,
  },
  theKinhRong: { maxWidth: 560 },
  tieuDeGate: {
    fontFamily: "Georgia, 'Palatino Linotype', 'Times New Roman', serif",
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  phuDeKinh: { fontFamily: 'Arial', fontSize: 14, color: '#334155', marginTop: 10, lineHeight: 22 },
  vachMong: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 18 },
  nhanKinh: { fontFamily: 'Arial', fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  hangNhapMatKhau: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingRight: 4,
  },
  oNhapFlex: {
    flex: 1,
    fontFamily: 'Arial',
    fontSize: 15,
    color: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nutMat: { paddingHorizontal: 10, paddingVertical: 8 },
  iconMat: { fontSize: 18 },
  nutChinh: {
    marginTop: 16,
    backgroundColor: CD.mau_chinh,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  nutVoHieu: { opacity: 0.55 },
  chuNutVoHieu: { color: 'rgba(255,255,255,0.85)' },
  chuNutChinh: { fontFamily: 'Arial', fontWeight: '700', color: '#ffffff', fontSize: 15, letterSpacing: 0.3 },
  nutPhuKinh: { marginTop: 12, alignSelf: 'flex-start' },
  chuNutPhuKinh: { fontFamily: 'Arial', fontSize: 12, color: '#64748b', fontWeight: '600' },
  loiKinh: { fontFamily: 'Arial', fontSize: 13, color: '#b91c1c', marginTop: 12, fontWeight: '600' },
  chanTrangNen: {
    fontFamily: 'Arial',
    fontSize: 11,
    color: 'rgba(248, 250, 252, 0.92)',
    textAlign: 'center',
    paddingBottom: 8,
  },
  danhSach: { gap: 12, width: '100%' },
  the: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  the_active: { borderColor: CD.mau_chinh, backgroundColor: '#fdf2f8' },
  hang: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ten: { fontFamily: 'Arial', fontWeight: '700', fontSize: 16, color: '#0f172a', flex: 1 },
  meta: { fontFamily: 'Arial', fontSize: 12, color: '#475569', marginTop: 6 },
  metaChinhSach: { fontFamily: 'Arial', fontSize: 11, color: '#64748b', marginTop: 2 },
  theVaiTro: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginBottom: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  theVaiTroAdmin: { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  iconVaiTro: { fontSize: 28, marginBottom: 8 },
  tenVaiTro: { fontFamily: 'Arial', fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  moTaVaiTro: { fontFamily: 'Arial', fontSize: 13, color: '#475569', lineHeight: 20 },
});
