/**
 * Module quản trị hệ thống đa BV — port đầy đủ từ Vercel.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BREAKPOINTS, useLayoutMode } from '../tien_ich/diem_anh_man_hinh';
import { ADMIN_EMAIL_TOI_CAO } from '../tien_ich/admin_toi_cao';
import { coQuyenCauHinhHeThong } from '../tien_ich/quyen_quan_tri_bv';
import { taoRouteDangNhapCauHinh } from '../tien_ich/gate_dieu_huong';
import { dongGateSession } from '../tien_ich/gate_session';
import { xoaCheDoTruyCap } from '../tien_ich/che_do_truy_cap';
import { lamMoiDanhSachTenant } from '../tien_ich/tenant_registry';
import { damBaoTaiRegistryTuyChinh, xoaTenantTuyChinh } from '../tien_ich/tenant_registry_custom';
import { layThongKePlatform } from '../tien_ich/platform_benh_vien';
import {
  capNhatHoSoTaiKhoanBv,
  datLaiMatKhauBv,
  docBindingTaiKhoan,
  docTaiKhoanTheoOrg,
  ganPhanQuyenTaiKhoanBv,
  taoTaiKhoanBv,
  xoaTaiKhoanBv,
} from '../tien_ich/tai_khoan_bv_service';
import { taiRBAC } from '../tien_ich/rbac_engine';
import { voiNgungCanTenant } from '../tien_ich/tenant_context';
import { tomTatQuanTriOrg } from '../tien_ich/thong_ke_quan_tri_bv';
import { ghiAuditQuanTri, layAuditTongHop } from '../tien_ich/audit_quan_tri';
import {
  hienThongBaoQuanTri,
  xacNhanQuanTri,
  xacNhanXoaQuanTri,
} from '../tien_ich/quan_tri_hoi_thoai';
import { TAB_QUAN_TRI, VAI_TRO_TAI_KHOAN_BV } from '../tien_ich/quan_tri_bv_constants';
import { styles } from './quan_tri_bv/quan_tri_theme';
import TheThongKe from './quan_tri_bv/the_thong_ke';
import TabCoSo from './quan_tri_bv/tab_co_so';
import TabTaiKhoan from './quan_tri_bv/tab_tai_khoan';
import TabPhanQuyen from './quan_tri_bv/tab_phan_quyen';
import TabDuLieu from './quan_tri_bv/tab_du_lieu';
import TabAudit from './quan_tri_bv/tab_audit';
import ModalKhoiTaoBv from './quan_tri_bv/modal_khoi_tao_bv';

const DANH_SACH_TAB = [
  { id: TAB_QUAN_TRI.CO_SO, label: 'Cơ sở KCB', icon: '🏥' },
  { id: TAB_QUAN_TRI.TAI_KHOAN, label: 'Tài khoản', icon: '👥' },
  { id: TAB_QUAN_TRI.PHAN_QUYEN, label: 'Phân quyền', icon: '🛡️' },
  { id: TAB_QUAN_TRI.DU_LIEU, label: '4 hệ thống', icon: '📦' },
  { id: TAB_QUAN_TRI.AUDIT, label: 'Audit', icon: '📋' },
];

const taoBindingMacDinh = (vaiTro) => ({
  roleIds: vaiTro === 'ADMIN' || vaiTro === VAI_TRO_TAI_KHOAN_BV.ADMIN_BV
    ? ['ROLE_ADMIN']
    : ['ROLE_DOCTOR'],
  groupIds: [],
  overrides: { allow: [], deny: [] },
  dataScope: vaiTro === 'ADMIN' || vaiTro === VAI_TRO_TAI_KHOAN_BV.ADMIN_BV ? 'ALL' : 'SELF',
});

const QuanTriTaiKhoanBv = ({ navigation }) => {
  const { width } = useLayoutMode();
  const desktop = width >= BREAKPOINTS.lg;

  const [dangTai, setDangTai] = useState(true);
  const [tab, setTab] = useState(TAB_QUAN_TRI.CO_SO);
  const [actor, setActor] = useState(ADMIN_EMAIL_TOI_CAO);
  const [orgId, setOrgId] = useState('');
  const [danhSachBv, setDanhSachBv] = useState([]);
  const [taiKhoan, setTaiKhoan] = useState([]);
  const [cfgRbac, setCfgRbac] = useState({ roles: [] });
  const [bindings, setBindings] = useState({});
  const [tomTat, setTomTat] = useState(null);
  const [thongKePlatform, setThongKePlatform] = useState(null);
  const [auditRows, setAuditRows] = useState([]);
  const [loi, setLoi] = useState('');
  const [dangTaiOrg, setDangTaiOrg] = useState(false);
  const [locAudit, setLocAudit] = useState('');
  const [loaiLocAudit, setLoaiLocAudit] = useState('');
  const [moWizard, setMoWizard] = useState(false);

  const tenantChon = useMemo(
    () => danhSachBv.find((row) => row.orgId === orgId) || null,
    [danhSachBv, orgId],
  );

  const taiDanhSachBv = useCallback(async () => {
    await damBaoTaiRegistryTuyChinh();
    const list = lamMoiDanhSachTenant();
    setDanhSachBv(list);
    const stats = await layThongKePlatform().catch(() => null);
    if (stats) setThongKePlatform(stats);
    return list;
  }, []);

  const taiDuLieuOrg = useCallback(async (id) => {
    if (!id) return;
    setDangTaiOrg(true);
    setLoi('');
    try {
      const dsTk = await docTaiKhoanTheoOrg(id);
      const cfg = await voiNgungCanTenant(id, () => taiRBAC());
      const mapBindings = {};
      await Promise.all(dsTk.map(async (tk) => {
        mapBindings[tk.email] = await voiNgungCanTenant(id, () => docBindingTaiKhoan(tk.email));
      }));
      const [summary, audit] = await Promise.all([
        tomTatQuanTriOrg(id, dsTk.length),
        layAuditTongHop(id, { gioiHan: 150 }),
      ]);
      setTaiKhoan(dsTk);
      setCfgRbac(cfg);
      setBindings(mapBindings);
      setTomTat(summary);
      setAuditRows(audit);
    } catch (err) {
      setLoi(String(err?.message || err));
    } finally {
      setDangTaiOrg(false);
    }
  }, []);

  useEffect(() => {
    let huy = false;
    (async () => {
      try {
        const quyen = await coQuyenCauHinhHeThong();
        if (!quyen.ok) {
          if (huy) return;
          if (quyen.canDangNhap) {
            navigation.reset({ index: 0, routes: [taoRouteDangNhapCauHinh()] });
          } else {
            Alert.alert('Từ chối truy cập', quyen.lyDo, [{
              text: 'Quay lại',
              onPress: () => navigation.reset({ index: 0, routes: [{ name: 'ChonBenhVien' }] }),
            }]);
          }
          return;
        }
        if (huy) return;
        setActor(quyen.actor || ADMIN_EMAIL_TOI_CAO);
        const list = await taiDanhSachBv();
        const first = list[0]?.orgId || '';
        setOrgId(first);
        setDangTai(false);
        if (first) await taiDuLieuOrg(first);
      } catch (err) {
        if (!huy) {
          setLoi(String(err?.message || err));
          setDangTai(false);
        }
      }
    })();
    return () => { huy = true; };
  }, [navigation, taiDanhSachBv, taiDuLieuOrg]);

  const chonOrg = useCallback(async (id) => {
    setOrgId(id);
    await taiDuLieuOrg(id);
  }, [taiDuLieuOrg]);

  const sauKhoiTao = useCallback(async (id) => {
    await taiDanhSachBv();
    if (id) {
      setOrgId(id);
      setTab(TAB_QUAN_TRI.TAI_KHOAN);
      await taiDuLieuOrg(id);
    }
  }, [taiDanhSachBv, taiDuLieuOrg]);

  const taoTk = useCallback(async (payload) => {
    setDangTaiOrg(true);
    try {
      const ketQua = await taoTaiKhoanBv(orgId, { ...payload, binding: taoBindingMacDinh(payload.vaiTro) }, actor);
      await taiDuLieuOrg(orgId);
      hienThongBaoQuanTri(
        'Đã tạo tài khoản',
        `Email: ${ketQua.taiKhoan?.email}\nMật khẩu tạm: ${ketQua.matKhauTam}`,
      );
    } catch (err) {
      hienThongBaoQuanTri('Lỗi', String(err?.message || err));
      throw err;
    } finally {
      setDangTaiOrg(false);
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const datLaiMk = useCallback(async (email) => {
    if (!(await xacNhanQuanTri('Đặt lại mật khẩu', `Tạo mật khẩu mới cho ${email}?`))) return;
    try {
      const { matKhauMoi } = await datLaiMatKhauBv(orgId, email, '', actor);
      hienThongBaoQuanTri('Thành công', `Mật khẩu mới: ${matKhauMoi}`);
      await taiDuLieuOrg(orgId);
    } catch (err) {
      hienThongBaoQuanTri('Lỗi', String(err?.message || err));
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const xoaTk = useCallback(async (email) => {
    if (!(await xacNhanXoaQuanTri('Xóa tài khoản', `Xóa vĩnh viễn ${email}?`))) return;
    try {
      await xoaTaiKhoanBv(orgId, email, actor);
      await taiDuLieuOrg(orgId);
      hienThongBaoQuanTri('Đã xóa', `Tài khoản ${email} đã được xóa.`);
    } catch (err) {
      hienThongBaoQuanTri('Lỗi', String(err?.message || err));
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const khoaMo = useCallback(async (row) => {
    const trangThai = row.trangThai === 'KHOA' ? 'HOAT_DONG' : 'KHOA';
    try {
      await capNhatHoSoTaiKhoanBv(orgId, row.email, { trangThai }, actor);
      await taiDuLieuOrg(orgId);
    } catch (err) {
      hienThongBaoQuanTri('Lỗi', String(err?.message || err));
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const capNhatHoSo = useCallback(async (email, patch) => {
    if (!orgId) throw new Error('Chưa chọn cơ sở KCB.');
    await capNhatHoSoTaiKhoanBv(orgId, email, patch, actor);
    await taiDuLieuOrg(orgId);
  }, [actor, orgId, taiDuLieuOrg]);

  const ganVaiTro = useCallback(async (email, roleId) => {
    try {
      const binding = {
        roleIds: [roleId],
        groupIds: [],
        overrides: { allow: [], deny: [] },
        dataScope: roleId === 'ROLE_ADMIN' ? 'ALL' : 'SELF',
      };
      await ganPhanQuyenTaiKhoanBv(orgId, email, binding, actor);
      const laAdmin = roleId === 'ROLE_ADMIN';
      await capNhatHoSoTaiKhoanBv(orgId, email, {
        vaiTro: laAdmin ? VAI_TRO_TAI_KHOAN_BV.ADMIN_BV : VAI_TRO_TAI_KHOAN_BV.NHAN_VIEN,
      }, actor);
      await taiDuLieuOrg(orgId);
      hienThongBaoQuanTri('Đã cập nhật', 'Phân quyền RBAC đã được lưu.');
    } catch (err) {
      hienThongBaoQuanTri('Lỗi', String(err?.message || err));
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const xoaBv = useCallback(async (id, ten) => {
    if (!(await xacNhanXoaQuanTri('Xóa cơ sở', `Xóa «${ten}» (${id})?\nDữ liệu tenant trên thiết bị vẫn có thể còn.`))) return;
    try {
      await xoaTenantTuyChinh(id);
      await ghiAuditQuanTri({
        hanhDong: 'XOA_CO_SO_KCB',
        orgId: id,
        doiTuong: ten,
        taiKhoan: actor,
        heThong: 'TRUY_CAP',
      });
      const list = await taiDanhSachBv();
      if (orgId === id) {
        const next = list[0]?.orgId || '';
        setOrgId(next);
        if (next) await taiDuLieuOrg(next);
        else {
          setTaiKhoan([]);
          setTomTat(null);
        }
      }
      hienThongBaoQuanTri('Đã xóa', `Cơ sở «${ten}» đã được gỡ khỏi danh sách.`);
    } catch (err) {
      hienThongBaoQuanTri('Lỗi', String(err?.message || err));
    }
  }, [actor, orgId, taiDanhSachBv, taiDuLieuOrg]);

  const taiAudit = useCallback(async () => {
    const rows = await layAuditTongHop(orgId, { tuKhoa: locAudit, gioiHan: 200 });
    setAuditRows(rows);
  }, [orgId, locAudit]);

  const thoat = useCallback(async () => {
    await dongGateSession();
    await xoaCheDoTruyCap();
    navigation.reset({ index: 0, routes: [{ name: 'ChonBenhVien' }] });
  }, [navigation]);

  const renderNav = (sidebar) => DANH_SACH_TAB.map((item) => (
    <TouchableOpacity
      key={item.id}
      style={[sidebar ? styles.navItem : styles.tabMobile, tab === item.id && (sidebar ? styles.navItemActive : styles.tabMobileActive)]}
      onPress={() => setTab(item.id)}
    >
      {sidebar ? (
        <Text style={styles.navIcon}>{item.icon}</Text>
      ) : (
        <Text style={{ fontSize: 16 }}>{item.icon}</Text>
      )}
      <Text style={[
        sidebar ? styles.navLabel : { fontSize: 10, marginTop: 2 },
        tab === item.id && (sidebar ? styles.navLabelActive : { color: '#C2185B', fontWeight: '700' }),
      ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  ));

  const renderNoiDungTab = () => {
    switch (tab) {
      case TAB_QUAN_TRI.CO_SO:
        return (
          <TabCoSo
            danhSachBv={danhSachBv}
            orgId={orgId}
            actor={actor}
            onChonOrg={chonOrg}
            onMoWizard={() => setMoWizard(true)}
            onTaiLai={taiDanhSachBv}
            onXoaBv={xoaBv}
          />
        );
      case TAB_QUAN_TRI.TAI_KHOAN:
        return (
          <TabTaiKhoan
            orgId={orgId}
            taiKhoan={taiKhoan}
            tenantChon={tenantChon}
            onTaoTaiKhoan={taoTk}
            onDatLaiMk={datLaiMk}
            onKhoaMo={khoaMo}
            onXoa={xoaTk}
            onCapNhatHoSo={capNhatHoSo}
          />
        );
      case TAB_QUAN_TRI.PHAN_QUYEN:
        return (
          <TabPhanQuyen
            taiKhoan={taiKhoan}
            cfgRbac={cfgRbac}
            bindings={bindings}
            onGanVaiTro={ganVaiTro}
          />
        );
      case TAB_QUAN_TRI.DU_LIEU:
        return (
          <TabDuLieu
            tomTat={tomTat}
            onTaiLai={() => taiDuLieuOrg(orgId)}
            dangTai={dangTaiOrg}
          />
        );
      case TAB_QUAN_TRI.AUDIT:
        return (
          <TabAudit
            auditRows={auditRows}
            locAudit={locAudit}
            loaiLoc={loaiLocAudit}
            onDoiLoc={setLocAudit}
            onDoiLoai={setLoaiLocAudit}
            onTaiLai={taiAudit}
          />
        );
      default:
        return null;
    }
  };

  if (dangTai) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#C2185B" style={{ marginTop: 80 }} />
        <Text style={{ textAlign: 'center', marginTop: 12, color: '#64748b' }}>
          Đang tải module quản trị…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={desktop ? styles.layout : { flex: 1 }}>
        {desktop ? (
          <View style={styles.sidebar}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoTitle}>CDSS Quản trị</Text>
              <Text style={styles.logoSub}>Module cấu hình hệ thống · Admin tối cao</Text>
            </View>
            {renderNav(true)}
            <TouchableOpacity style={[styles.navItem, { marginTop: 24 }]} onPress={thoat}>
              <Text style={styles.navIcon}>🔒</Text>
              <Text style={styles.navLabel}>Khóa & thoát</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.main}>
          {desktop ? (
            <View style={styles.topBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.topTitle}>Quản trị hệ thống đa BV</Text>
                <Text style={styles.topSub}>Đăng nhập: {actor}</Text>
              </View>
              <TouchableOpacity style={styles.nutChinh} onPress={() => setMoWizard(true)}>
                <Text style={styles.chuNutChinh}>🚀 Khởi tạo BV</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.topBar}>
              <View>
                <Text style={styles.topTitle}>Module cấu hình</Text>
                <Text style={styles.topSub}>{actor}</Text>
              </View>
              <TouchableOpacity style={styles.nutPhu} onPress={thoat}>
                <Text style={styles.chuNutPhu}>🔒 Thoát</Text>
              </TouchableOpacity>
            </View>
          )}

          {thongKePlatform ? (
            <View style={styles.hangThongKe}>
              <TheThongKe icon="🏥" giaTri={thongKePlatform.soCoSo} nhan="Cơ sở KCB" />
              <TheThongKe icon="👥" giaTri={thongKePlatform.tongTaiKhoan} nhan="Tài khoản" />
              <TheThongKe
                icon="⚠️"
                giaTri={thongKePlatform.soCoSoChuaAdmin}
                nhan="BV chưa có Admin"
                mauGiaTri={thongKePlatform.soCoSoChuaAdmin > 0 ? '#d97706' : '#059669'}
              />
              <TheThongKe icon="📦" giaTri={thongKePlatform.soCoSoBundle} nhan="Bundle + tùy chỉnh" />
            </View>
          ) : null}

          {tab !== TAB_QUAN_TRI.CO_SO ? (
            <View style={styles.chonBvWrap}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', marginRight: 4 }}>Cơ sở:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {danhSachBv.map((row) => (
                  <TouchableOpacity
                    key={row.orgId}
                    style={[styles.chipBv, orgId === row.orgId && styles.chipBvActive]}
                    onPress={() => chonOrg(row.orgId)}
                  >
                    <Text style={[styles.chuChip, orgId === row.orgId && styles.chuChipActive]}>
                      {row.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {!desktop ? <View style={styles.mobileTabs}>{renderNav(false)}</View> : null}

          <ScrollView style={styles.noiDung} contentContainerStyle={styles.noiDungPad}>
            {loi ? <Text style={styles.loi}>{loi}</Text> : null}
            {dangTaiOrg ? <ActivityIndicator color="#C2185B" style={{ marginVertical: 8 }} /> : null}
            {renderNoiDungTab()}
          </ScrollView>
        </View>
      </View>

      <ModalKhoiTaoBv
        visible={moWizard}
        onDong={() => setMoWizard(false)}
        onThanhCong={sauKhoiTao}
        actor={actor}
      />
    </SafeAreaView>
  );
};

export { dieuHuongVaoModuleCauHinh } from '../tien_ich/gate_dieu_huong';
export default QuanTriTaiKhoanBv;
