/**
 * CRUD tài khoản bệnh viện thành viên — scoped theo org_id.
 */
import {
  KIEM_TRA_EMAIL_CDSS,
  capNhatMatKhauTrongDanhSach,
  kiemTraDinhDangMatKhau,
  taoBanGhiTaiKhoanMoi,
  taoMatKhauNgauNhien,
} from '../../tien_ich/dich_vu_tai_khoan_cdss';
import {
  chuanHoaDanhSachTaiKhoan,
  docDanhSachTaiKhoan,
  luuDanhSachTaiKhoan,
  themTaiKhoanMoi,
} from '../../tien_ich/nhat_ky_he_thong';
import { VAI_TRO_TAI_KHOAN_BV } from '../constants/bon_he_thong';
import {
  RBAC_KEYS,
  luuRBAC,
  taiRBAC,
  xoaLegacyAclTheoEmail,
} from '../../tien_ich/rbac_engine';
import { laTaiKhoanAdminToiCao } from '../../tien_ich/tai_khoan_admin_he_thong';
import { voiNgungCanTenant } from '../../tien_ich/tenant_context';
import { ghiAuditQuanTri } from './audit_quan_tri_service';

export const docTaiKhoanTheoOrg = async (orgId) => voiNgungCanTenant(orgId, docDanhSachTaiKhoan);

const chuanHoaVaiTroBv = (vaiTro) => (
  vaiTro === 'ADMIN' || vaiTro === VAI_TRO_TAI_KHOAN_BV.ADMIN_BV ? 'ADMIN' : 'USER'
);

export const demAdminBvConLai = (danhSach, emailLoaiTru = '') => {
  const loai = String(emailLoaiTru || '').trim().toLowerCase();
  return (Array.isArray(danhSach) ? danhSach : []).filter((u) => (
    u.vaiTro === 'ADMIN'
    && u.trangThai !== 'KHOA'
    && u.email !== loai
    && !laTaiKhoanAdminToiCao(u.email)
  )).length;
};

export const taoTaiKhoanBv = async (orgId, payload, actor = 'ADMIN') => {
  const email = String(payload?.email || '').trim().toLowerCase();
  if (!KIEM_TRA_EMAIL_CDSS.test(email)) {
    throw new Error('Email không hợp lệ.');
  }
  if (laTaiKhoanAdminToiCao(email)) {
    throw new Error('Không thể tạo tài khoản trùng email quản trị tối cao hệ thống.');
  }
  const matKhau = String(payload?.matKhau || taoMatKhauNgauNhien(12));
  const ktMk = kiemTraDinhDangMatKhau(matKhau);
  if (!ktMk.ok) throw new Error(ktMk.loi);

  return voiNgungCanTenant(orgId, async () => {
    const banGhi = taoBanGhiTaiKhoanMoi({
      ...payload,
      email,
      matKhau,
      vaiTro: chuanHoaVaiTroBv(payload?.vaiTro),
      buocDoiMatKhau: payload?.buocDoiMatKhau !== false,
    });
    const dsMoi = await themTaiKhoanMoi(banGhi, actor);

    if (payload?.binding) {
      await capNhatBindingTaiKhoan(email, payload.binding);
    }

    const daLuu = dsMoi.find((u) => u.email === email);
    if (!daLuu) {
      throw new Error('Tài khoản không được lưu — vui lòng thử lại.');
    }

    await ghiAuditQuanTri({
      hanhDong: 'TAO_TAI_KHOAN_BV',
      orgId,
      doiTuong: email,
      chiTiet: `Vai trò: ${banGhi.vaiTro} · ${banGhi.hoTen || banGhi.ten}`,
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });

    return { taiKhoan: daLuu, matKhauTam: matKhau };
  });
};

export const capNhatHoSoTaiKhoanBv = async (orgId, email, patch, actor = 'ADMIN') => {
  const em = String(email || '').trim().toLowerCase();
  if (!em) throw new Error('Email không hợp lệ.');
  if (laTaiKhoanAdminToiCao(em)) {
    throw new Error('Không thể sửa tài khoản quản trị tối cao tại module BV.');
  }

  return voiNgungCanTenant(orgId, async () => {
    const ds = await docDanhSachTaiKhoan();
    const idx = ds.findIndex((u) => u.email === em);
    if (idx < 0) throw new Error('Tài khoản không tồn tại.');

    const capNhat = { ...patch };
    if (capNhat.vaiTro) {
      capNhat.vaiTro = capNhat.vaiTro === 'ADMIN' ? 'ADMIN' : 'USER';
    }
    if (capNhat.trangThai === 'KHOA' && ds[idx].vaiTro === 'ADMIN') {
      if (demAdminBvConLai(ds, em) < 1) {
        throw new Error('Không thể khóa admin BV cuối cùng của cơ sở.');
      }
    }

    const dsCapNhat = [...ds];
    dsCapNhat[idx] = chuanHoaDanhSachTaiKhoan([{ ...ds[idx], ...capNhat, email: em }], actor)[0];
    const dsMoi = await luuDanhSachTaiKhoan(dsCapNhat, actor);
    const ketQua = dsMoi.find((u) => u.email === em);

    await ghiAuditQuanTri({
      hanhDong: 'CAP_NHAT_TAI_KHOAN_BV',
      orgId,
      doiTuong: em,
      chiTiet: JSON.stringify(Object.keys(patch || {})),
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });

    return ketQua;
  });
};

export const datLaiMatKhauBv = async (orgId, email, matKhauMoi, actor = 'ADMIN', { buocDoiMatKhau = true } = {}) => {
  const em = String(email || '').trim().toLowerCase();
  const mk = String(matKhauMoi || taoMatKhauNgauNhien(12));
  const kt = kiemTraDinhDangMatKhau(mk);
  if (!kt.ok) throw new Error(kt.loi);

  return voiNgungCanTenant(orgId, async () => {
    const ds = await docDanhSachTaiKhoan();
    if (!ds.some((u) => u.email === em)) throw new Error('Tài khoản không tồn tại.');
    const dsMoi = capNhatMatKhauTrongDanhSach(ds, em, mk, { buocDoiMatKhau });
    await luuDanhSachTaiKhoan(dsMoi, actor);

    await ghiAuditQuanTri({
      hanhDong: 'DAT_LAI_MAT_KHAU_BV',
      orgId,
      doiTuong: em,
      chiTiet: buocDoiMatKhau ? 'Bắt buộc đổi mật khẩu lần đăng nhập sau' : 'Đặt lại mật khẩu',
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });

    return { matKhauMoi: mk };
  });
};

export const xoaTaiKhoanBv = async (orgId, email, actor = 'ADMIN') => {
  const em = String(email || '').trim().toLowerCase();
  if (!em) throw new Error('Email không hợp lệ.');
  if (laTaiKhoanAdminToiCao(em)) {
    throw new Error('Không thể xóa tài khoản quản trị tối cao.');
  }
  if (em === String(actor || '').trim().toLowerCase()) {
    throw new Error('Không thể xóa tài khoản đang đăng nhập.');
  }

  return voiNgungCanTenant(orgId, async () => {
    const ds = await docDanhSachTaiKhoan();
    const user = ds.find((u) => u.email === em);
    if (!user) throw new Error('Tài khoản không tồn tại.');
    if (user.vaiTro === 'ADMIN' && demAdminBvConLai(ds, em) < 1) {
      throw new Error('Không thể xóa admin BV cuối cùng của cơ sở.');
    }

    const dsMoi = ds.filter((u) => u.email !== em);
    await luuDanhSachTaiKhoan(dsMoi, actor);
    await xoaBindingTaiKhoan(em);

    await ghiAuditQuanTri({
      hanhDong: 'XOA_TAI_KHOAN_BV',
      orgId,
      doiTuong: em,
      chiTiet: user.hoTen || user.ten || em,
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });

    return { ok: true };
  });
};

export const docBindingTaiKhoan = async (email) => {
  const cfg = await taiRBAC();
  const em = String(email || '').trim().toLowerCase();
  return cfg.userBindings?.[em] || null;
};

export const capNhatBindingTaiKhoan = async (email, binding) => {
  const cfg = await taiRBAC();
  const em = String(email || '').trim().toLowerCase();
  if (!em) throw new Error('Email binding không hợp lệ.');
  const moi = {
    ...cfg,
    userBindings: {
      ...cfg.userBindings,
      [em]: binding,
    },
  };
  await luuRBAC(moi);
  return moi.userBindings[em];
};

const xoaBindingTaiKhoan = async (email) => {
  const cfg = await taiRBAC();
  const em = String(email || '').trim().toLowerCase();
  if (!cfg.userBindings?.[em]) {
    await xoaLegacyAclTheoEmail(em);
    return;
  }
  const { [em]: _removed, ...conLai } = cfg.userBindings;
  await luuRBAC({ ...cfg, userBindings: conLai });
  await xoaLegacyAclTheoEmail(em);
};

export const ganPhanQuyenTaiKhoanBv = async (orgId, email, binding, actor = 'ADMIN') => {
  const em = String(email || '').trim().toLowerCase();
  return voiNgungCanTenant(orgId, async () => {
    const ds = await docDanhSachTaiKhoan();
    if (!ds.some((u) => u.email === em)) throw new Error('Tài khoản không tồn tại.');
    await capNhatBindingTaiKhoan(em, binding);
    await ghiAuditQuanTri({
      hanhDong: 'GAN_PHAN_QUYEN_BV',
      orgId,
      doiTuong: em,
      chiTiet: `roleIds=${(binding?.roleIds || []).join(',')}`,
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });
    return binding;
  });
};

export const damBaoRbacTenant = async (orgId) => voiNgungCanTenant(orgId, async () => {
  await taiRBAC();
  return true;
});

export { RBAC_KEYS, taiRBAC, luuRBAC };

export default {
  docTaiKhoanTheoOrg,
  taoTaiKhoanBv,
  capNhatHoSoTaiKhoanBv,
  datLaiMatKhauBv,
  xoaTaiKhoanBv,
  ganPhanQuyenTaiKhoanBv,
  docBindingTaiKhoan,
  demAdminBvConLai,
};
