/**
 * Module cấu hình hệ thống — quản trị BV thành viên (admin tối cao).
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
import { dongGateSession } from '../tien_ich/deploy_gate';
import { xoaCheDoTruyCap } from '../tien_ich/che_do_truy_cap';
import { layDanhSachTenant, lamMoiDanhSachTenant } from '../tien_ich/tenant_registry';
import { damBaoTaiRegistryTuyChinh, xoaTenantTuyChinh } from '../tien_ich/tenant_registry_custom';
import { ADMIN_EMAIL_TOI_CAO } from '../tien_ich/tai_khoan_admin_he_thong';
import { taoRouteDangNhapCauHinh } from '../tien_ich/dieu_huong_admin_he_thong';
import { TAB_QUAN_TRI, VAI_TRO_TAI_KHOAN_BV } from '../phan_he_quan_tri/constants/bon_he_thong';
import { ghiAuditQuanTri, layAuditTongHop } from '../phan_he_quan_tri/dich_vu/audit_quan_tri_service';
import { layThongKePlatform } from '../phan_he_quan_tri/dich_vu/khoi_tao_benh_vien_service';
import { coQuyenCauHinhHeThong } from '../phan_he_quan_tri/dich_vu/quyen_quan_tri_service';
import { tomTatQuanTriOrg } from '../phan_he_quan_tri/dich_vu/thong_ke_du_lieu_service';
import {
  capNhatHoSoTaiKhoanBv,
  datLaiMatKhauBv,
  docBindingTaiKhoan,
  docTaiKhoanTheoOrg,
  ganPhanQuyenTaiKhoanBv,
  taoTaiKhoanBv,
  xoaTaiKhoanBv,
} from '../phan_he_quan_tri/dich_vu/tai_khoan_bv_service';
import { taiRBAC } from '../tien_ich/rbac_engine';
import { voiNgungCanTenant } from '../tien_ich/tenant_context';
import { styles } from '../phan_he_quan_tri/thanh_phan/dieu_khien_quan_tri_styles';
import TheThongKe from '../phan_he_quan_tri/thanh_phan/the_thong_ke';
import ModalKhoiTaoBenhVien from '../phan_he_quan_tri/thanh_phan/modal_khoi_tao_benh_vien';
import TabCoSoKcb from '../phan_he_quan_tri/thanh_phan/tab_co_so_kcb';
import TabTaiKhoanBv from '../phan_he_quan_tri/thanh_phan/tab_tai_khoan_bv';
import TabPhanQuyenBv from '../phan_he_quan_tri/thanh_phan/tab_phan_quyen_bv';
import TabBonHeThong from '../phan_he_quan_tri/thanh_phan/tab_bon_he_thong';
import TabAuditQuanTri from '../phan_he_quan_tri/thanh_phan/tab_audit_quan_tri';
import {
  hienThongBaoQuanTri,
  xacNhanQuanTri,
  xacNhanXoaQuanTri,
} from '../phan_he_quan_tri/thanh_phan/ho_tro_hop_thoai';

const TABS = [
  { id: TAB_QUAN_TRI.CO_SO, label: 'Cơ sở KCB', icon: '🏥' },
  { id: TAB_QUAN_TRI.TAI_KHOAN, label: 'Tài khoản', icon: '👥' },
  { id: TAB_QUAN_TRI.PHAN_QUYEN, label: 'Phân quyền', icon: '🛡️' },
  { id: TAB_QUAN_TRI.DU_LIEU, label: '4 hệ thống', icon: '📦' },
  { id: TAB_QUAN_TRI.AUDIT, label: 'Audit', icon: '📋' },
];

const taoBindingMacDinh = (vaiTro) => ({
  roleIds: vaiTro === 'ADMIN' || vaiTro === VAI_TRO_TAI_KHOAN_BV.ADMIN_BV ? ['ROLE_ADMIN'] : ['ROLE_DOCTOR'],
  groupIds: [],
  overrides: { allow: [], deny: [] },
  dataScope: vaiTro === 'ADMIN' || vaiTro === VAI_TRO_TAI_KHOAN_BV.ADMIN_BV ? 'ALL' : 'SELF',
});

export default function ManHinhQuanTriTaiKhoanBv({ navigation }) {
  const { width } = useLayoutMode();
  const dungSidebar = width >= BREAKPOINTS.lg;

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
  const [dangXuLy, setDangXuLy] = useState(false);
  const [locAudit, setLocAudit] = useState('');
  const [loaiLocAudit, setLoaiLocAudit] = useState('');
  const [moWizard, setMoWizard] = useState(false);

  const tenantChon = useMemo(
    () => danhSachBv.find((t) => t.orgId === orgId) || null,
    [danhSachBv, orgId],
  );

  const taiLaiDanhSachBv = useCallback(async () => {
    await damBaoTaiRegistryTuyChinh();
    const tenants = lamMoiDanhSachTenant();
    setDanhSachBv(tenants);
    const tk = await layThongKePlatform().catch(() => null);
    if (tk) setThongKePlatform(tk);
    return tenants;
  }, []);

  const taiDuLieuOrg = useCallback(async (oid) => {
    if (!oid) return;
    setDangXuLy(true);
    setLoi('');
    try {
      const ds = await docTaiKhoanTheoOrg(oid);
      const cfg = await voiNgungCanTenant(oid, () => taiRBAC());
      const bindingMap = {};
      await Promise.all(ds.map(async (u) => {
        bindingMap[u.email] = await voiNgungCanTenant(oid, () => docBindingTaiKhoan(u.email));
      }));
      const [tt, audit] = await Promise.all([
        tomTatQuanTriOrg(oid, ds.length),
        layAuditTongHop(oid, { gioiHan: 150 }),
      ]);
      setTaiKhoan(ds);
      setCfgRbac(cfg);
      setBindings(bindingMap);
      setTomTat(tt);
      setAuditRows(audit);
    } catch (e) {
      setLoi(String(e?.message || e));
    } finally {
      setDangXuLy(false);
    }
  }, []);

  useEffect(() => {
    let huy = false;
    (async () => {
      try {
        const quyen = await coQuyenCauHinhHeThong();
        if (!quyen.ok) {
          if (!huy) {
            if (quyen.canDangNhap) {
              navigation.reset({ index: 0, routes: [taoRouteDangNhapCauHinh()] });
            } else {
              Alert.alert('Từ chối truy cập', quyen.lyDo, [
                { text: 'Quay lại', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'ChonBenhVien' }] }) },
              ]);
            }
          }
          return;
        }
        if (huy) return;
        setActor(quyen.actor || ADMIN_EMAIL_TOI_CAO);
        await taiLaiDanhSachBv();
        const tenants = layDanhSachTenant();
        const oid = tenants[0]?.orgId || '';
        setOrgId(oid);
        setDangTai(false);
        if (oid) taiDuLieuOrg(oid).catch(() => {});
      } catch (e) {
        if (!huy) {
          setLoi(String(e?.message || e));
          setDangTai(false);
        }
      }
    })();
    return () => { huy = true; };
  }, [navigation, taiDuLieuOrg, taiLaiDanhSachBv]);

  const chonOrg = useCallback(async (oid) => {
    setOrgId(oid);
    await taiDuLieuOrg(oid);
  }, [taiDuLieuOrg]);

  const sauKhoiTao = useCallback(async (oidMoi) => {
    await taiLaiDanhSachBv();
    if (oidMoi) {
      setOrgId(oidMoi);
      setTab(TAB_QUAN_TRI.TAI_KHOAN);
      await taiDuLieuOrg(oidMoi);
    }
  }, [taiDuLieuOrg, taiLaiDanhSachBv]);

  const xuLyTaoTaiKhoan = useCallback(async (form) => {
    setDangXuLy(true);
    try {
      const ketQua = await taoTaiKhoanBv(orgId, {
        ...form,
        binding: taoBindingMacDinh(form.vaiTro),
      }, actor);
      await taiDuLieuOrg(orgId);
      hienThongBaoQuanTri(
        'Đã tạo tài khoản',
        `Email: ${ketQua.taiKhoan?.email}\nMật khẩu tạm: ${ketQua.matKhauTam}`,
      );
    } catch (e) {
      hienThongBaoQuanTri('Lỗi', String(e?.message || e));
      throw e;
    } finally {
      setDangXuLy(false);
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const xuLyDatLaiMk = useCallback(async (email) => {
    const ok = await xacNhanQuanTri('Đặt lại mật khẩu', `Tạo mật khẩu mới cho ${email}?`);
    if (!ok) return;
    try {
      const { matKhauMoi } = await datLaiMatKhauBv(orgId, email, '', actor);
      hienThongBaoQuanTri('Thành công', `Mật khẩu mới: ${matKhauMoi}`);
      await taiDuLieuOrg(orgId);
    } catch (e) {
      hienThongBaoQuanTri('Lỗi', String(e?.message || e));
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const xuLyXoa = useCallback(async (email) => {
    const ok = await xacNhanXoaQuanTri('Xóa tài khoản', `Xóa vĩnh viễn ${email}?`);
    if (!ok) return;
    try {
      await xoaTaiKhoanBv(orgId, email, actor);
      await taiDuLieuOrg(orgId);
      hienThongBaoQuanTri('Đã xóa', `Tài khoản ${email} đã được xóa.`);
    } catch (e) {
      hienThongBaoQuanTri('Lỗi', String(e?.message || e));
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const xuLyKhoaMo = useCallback(async (user) => {
    const moi = user.trangThai === 'KHOA' ? 'HOAT_DONG' : 'KHOA';
    try {
      await capNhatHoSoTaiKhoanBv(orgId, user.email, { trangThai: moi }, actor);
      await taiDuLieuOrg(orgId);
    } catch (e) {
      hienThongBaoQuanTri('Lỗi', String(e?.message || e));
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const xuLyCapNhatHoSo = useCallback(async (email, patch) => {
    if (!orgId) {
      throw new Error('Chưa chọn cơ sở KCB.');
    }
    await capNhatHoSoTaiKhoanBv(orgId, email, patch, actor);
    await taiDuLieuOrg(orgId);
  }, [actor, orgId, taiDuLieuOrg]);

  const xuLyGanVaiTro = useCallback(async (email, roleId) => {
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
    } catch (e) {
      hienThongBaoQuanTri('Lỗi', String(e?.message || e));
    }
  }, [actor, orgId, taiDuLieuOrg]);

  const xuLyXoaBv = useCallback(async (oid, ten) => {
    const ok = await xacNhanXoaQuanTri(
      'Xóa cơ sở',
      `Xóa «${ten}» (${oid})?\nDữ liệu tenant trên thiết bị vẫn có thể còn.`,
    );
    if (!ok) return;
    try {
      await xoaTenantTuyChinh(oid);
      await ghiAuditQuanTri({
        hanhDong: 'XOA_CO_SO_KCB',
        orgId: oid,
        doiTuong: ten,
        taiKhoan: actor,
        heThong: 'TRUY_CAP',
      });
      const con = await taiLaiDanhSachBv();
      if (orgId === oid) {
        const next = con[0]?.orgId || '';
        setOrgId(next);
        if (next) await taiDuLieuOrg(next);
        else {
          setTaiKhoan([]);
          setTomTat(null);
        }
      }
      hienThongBaoQuanTri('Đã xóa', `Cơ sở «${ten}» đã được gỡ khỏi danh sách.`);
    } catch (e) {
      hienThongBaoQuanTri('Lỗi', String(e?.message || e));
    }
  }, [actor, orgId, taiDuLieuOrg, taiLaiDanhSachBv]);

  const taiAudit = useCallback(async () => {
    const audit = await layAuditTongHop(orgId, { tuKhoa: locAudit, gioiHan: 200 });
    setAuditRows(audit);
  }, [orgId, locAudit]);

  const quayVeCuaGate = useCallback(async () => {
    await dongGateSession();
    await xoaCheDoTruyCap();
    navigation.reset({ index: 0, routes: [{ name: 'ChonBenhVien' }] });
  }, [navigation]);

  const renderTab = () => {
    switch (tab) {
      case TAB_QUAN_TRI.CO_SO:
        return (
          <TabCoSoKcb
            danhSachBv={danhSachBv}
            orgId={orgId}
            actor={actor}
            onChonOrg={chonOrg}
            onMoWizard={() => setMoWizard(true)}
            onTaiLai={taiLaiDanhSachBv}
            onXoaBv={xuLyXoaBv}
          />
        );
      case TAB_QUAN_TRI.TAI_KHOAN:
        return (
          <TabTaiKhoanBv
            orgId={orgId}
            taiKhoan={taiKhoan}
            tenantChon={tenantChon}
            onTaoTaiKhoan={xuLyTaoTaiKhoan}
            onDatLaiMk={xuLyDatLaiMk}
            onKhoaMo={xuLyKhoaMo}
            onXoa={xuLyXoa}
            onCapNhatHoSo={xuLyCapNhatHoSo}
          />
        );
      case TAB_QUAN_TRI.PHAN_QUYEN:
        return (
          <TabPhanQuyenBv
            taiKhoan={taiKhoan}
            cfgRbac={cfgRbac}
            bindings={bindings}
            onGanVaiTro={xuLyGanVaiTro}
          />
        );
      case TAB_QUAN_TRI.DU_LIEU:
        return (
          <TabBonHeThong
            tomTat={tomTat}
            onTaiLai={() => taiDuLieuOrg(orgId)}
            dangTai={dangXuLy}
          />
        );
      case TAB_QUAN_TRI.AUDIT:
        return (
          <TabAuditQuanTri
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

  const renderNav = (doc) => TABS.map((t) => (
    <TouchableOpacity
      key={t.id}
      style={[doc ? styles.navItem : styles.tabMobile, tab === t.id && (doc ? styles.navItemActive : styles.tabMobileActive)]}
      onPress={() => setTab(t.id)}
    >
      {doc ? <Text style={styles.navIcon}>{t.icon}</Text> : <Text style={{ fontSize: 16 }}>{t.icon}</Text>}
      <Text style={[doc ? styles.navLabel : { fontSize: 10, marginTop: 2 }, tab === t.id && (doc ? styles.navLabelActive : { color: '#C2185B', fontWeight: '700' })]}>
        {t.label}
      </Text>
    </TouchableOpacity>
  ));

  if (dangTai) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#C2185B" style={{ marginTop: 80 }} />
        <Text style={{ textAlign: 'center', marginTop: 12, color: '#64748b' }}>Đang tải module quản trị…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={dungSidebar ? styles.layout : { flex: 1 }}>
        {dungSidebar ? (
          <View style={styles.sidebar}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoTitle}>CDSS Quản trị</Text>
              <Text style={styles.logoSub}>Module cấu hình hệ thống · Admin tối cao</Text>
            </View>
            {renderNav(true)}
            <TouchableOpacity style={[styles.navItem, { marginTop: 24 }]} onPress={quayVeCuaGate}>
              <Text style={styles.navIcon}>🔒</Text>
              <Text style={styles.navLabel}>Khóa & thoát</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.main}>
          {!dungSidebar ? (
            <View style={styles.topBar}>
              <View>
                <Text style={styles.topTitle}>Module cấu hình</Text>
                <Text style={styles.topSub}>{actor}</Text>
              </View>
              <TouchableOpacity style={styles.nutPhu} onPress={quayVeCuaGate}>
                <Text style={styles.chuNutPhu}>🔒 Thoát</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.topBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.topTitle}>Quản trị hệ thống đa BV</Text>
                <Text style={styles.topSub}>Đăng nhập: {actor}</Text>
              </View>
              <TouchableOpacity style={styles.nutChinh} onPress={() => setMoWizard(true)}>
                <Text style={styles.chuNutChinh}>🚀 Khởi tạo BV</Text>
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
                {danhSachBv.map((t) => (
                  <TouchableOpacity
                    key={t.orgId}
                    style={[styles.chipBv, orgId === t.orgId && styles.chipBvActive]}
                    onPress={() => chonOrg(t.orgId)}
                  >
                    <Text style={[styles.chuChip, orgId === t.orgId && styles.chuChipActive]}>
                      {t.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {!dungSidebar ? <View style={styles.mobileTabs}>{renderNav(false)}</View> : null}

          <ScrollView style={styles.noiDung} contentContainerStyle={styles.noiDungPad}>
            {loi ? <Text style={styles.loi}>{loi}</Text> : null}
            {dangXuLy ? <ActivityIndicator color="#C2185B" style={{ marginVertical: 8 }} /> : null}
            {renderTab()}
          </ScrollView>
        </View>
      </View>

      <ModalKhoiTaoBenhVien
        visible={moWizard}
        onDong={() => setMoWizard(false)}
        onThanhCong={sauKhoiTao}
        actor={actor}
      />
    </SafeAreaView>
  );
}
