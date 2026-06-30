/**
 * Dịch vụ tài khoản theo org (tenant-scoped) — đồng bộ từ Vercel.
 */
import {
  KIEM_TRA_EMAIL_CDSS,
  capNhatMatKhauTrongDanhSach,
  kiemTraDinhDangMatKhau,
  taoBanGhiTaiKhoanMoi,
  taoMatKhauNgauNhien,
} from './dich_vu_tai_khoan_cdss';
import {
  chuanHoaDanhSachTaiKhoan,
  docDanhSachTaiKhoan,
  luuDanhSachTaiKhoan,
} from './nhat_ky_he_thong';
import { laTaiKhoanAdminToiCao } from './admin_toi_cao';
import { voiNgungCanTenant } from './tenant_context';
import {
  luuRBAC,
  taiRBAC,
  xoaLegacyAclTheoEmail,
} from './rbac_engine';
import { ghiAuditQuanTri } from './audit_quan_tri';

export const docTaiKhoanTheoOrg = async (orgId) => (
  voiNgungCanTenant(orgId, docDanhSachTaiKhoan)
);

export const demAdminBvConLai = (danhSach, emailLoaiTru = '') => {
  const exclude = String(emailLoaiTru || '').trim().toLowerCase();
  return (Array.isArray(danhSach) ? danhSach : [])
    .filter((tk) => tk.vaiTro === 'ADMIN'
      && tk.trangThai !== 'KHOA'
      && tk.email !== exclude
      && !laTaiKhoanAdminToiCao(tk.email))
    .length;
};

export const docBindingTaiKhoan = async (email) => {
  const cfg = await taiRBAC();
  const token = String(email || '').trim().toLowerCase();
  return cfg.userBindings?.[token] || null;
};

const xoaBindingTaiKhoan = async (email) => {
  const cfg = await taiRBAC();
  const token = String(email || '').trim().toLowerCase();
  if (!cfg.userBindings?.[token]) {
    await xoaLegacyAclTheoEmail(token);
    return;
  }
  const { [token]: _removed, ...rest } = cfg.userBindings;
  await luuRBAC({ ...cfg, userBindings: rest });
  await xoaLegacyAclTheoEmail(token);
};

export const capNhatBindingTaiKhoan = async (email, binding) => {
  const cfg = await taiRBAC();
  const token = String(email || '').trim().toLowerCase();
  if (!token) throw new Error('Email binding không hợp lệ.');
  const next = {
    ...cfg,
    userBindings: {
      ...cfg.userBindings,
      [token]: binding,
    },
  };
  await luuRBAC(next);
  return next.userBindings[token];
};

export const damBaoRbacTenant = async (orgId) => (
  voiNgungCanTenant(orgId, async () => {
    await taiRBAC();
    return true;
  })
);

export const taoTaiKhoanBv = async (orgId, payload, actor = 'ADMIN') => {
  const email = String(payload?.email || '').trim().toLowerCase();
  if (!KIEM_TRA_EMAIL_CDSS.test(email)) throw new Error('Email không hợp lệ.');
  if (laTaiKhoanAdminToiCao(email)) {
    throw new Error('Không thể tạo tài khoản trùng email quản trị tối cao hệ thống.');
  }

  const matKhau = String(payload?.matKhau || taoMatKhauNgauNhien(12));
  const ktMk = kiemTraDinhDangMatKhau(matKhau);
  if (!ktMk.ok) throw new Error(ktMk.loi);

  return voiNgungCanTenant(orgId, async () => {
    const hienTai = await docDanhSachTaiKhoan();
    if (hienTai.some((tk) => tk.email === email)) {
      throw new Error(`Email ${email} đã tồn tại tại cơ sở này.`);
    }

    const banGhi = taoBanGhiTaiKhoanMoi({
      ...payload,
      email,
      matKhau,
      vaiTro: payload?.vaiTro === 'ADMIN' ? 'ADMIN' : 'USER',
      buocDoiMatKhau: payload?.buocDoiMatKhau !== false,
    });

    const saved = await luuDanhSachTaiKhoan([...hienTai, banGhi], actor);
    if (payload?.binding) await capNhatBindingTaiKhoan(email, payload.binding);

    const taiKhoan = saved.find((tk) => tk.email === email);
    if (!taiKhoan) throw new Error('Tài khoản không được lưu — vui lòng thử lại.');

    await ghiAuditQuanTri({
      hanhDong: 'TAO_TAI_KHOAN_BV',
      orgId,
      doiTuong: email,
      chiTiet: `Vai trò: ${banGhi.vaiTro} · ${banGhi.hoTen || banGhi.ten}`,
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });

    return { taiKhoan, matKhauTam: matKhau };
  });
};

export const capNhatHoSoTaiKhoanBv = async (orgId, email, patch, actor = 'ADMIN') => {
  const token = String(email || '').trim().toLowerCase();
  if (!token) throw new Error('Email không hợp lệ.');
  if (laTaiKhoanAdminToiCao(token)) {
    throw new Error('Không thể sửa tài khoản quản trị tối cao tại module BV.');
  }

  return voiNgungCanTenant(orgId, async () => {
    const hienTai = await docDanhSachTaiKhoan();
    const idx = hienTai.findIndex((tk) => tk.email === token);
    if (idx < 0) throw new Error('Tài khoản không tồn tại.');

    const updates = { ...patch };
    if (updates.vaiTro) updates.vaiTro = updates.vaiTro === 'ADMIN' ? 'ADMIN' : 'USER';

    if (updates.trangThai === 'KHOA' && hienTai[idx].vaiTro === 'ADMIN' && demAdminBvConLai(hienTai, token) < 1) {
      throw new Error('Không thể khóa admin BV cuối cùng của cơ sở.');
    }

    const next = [...hienTai];
    next[idx] = chuanHoaDanhSachTaiKhoan([{ ...hienTai[idx], ...updates, email: token }], actor)[0];
    const saved = await luuDanhSachTaiKhoan(next, actor);
    const row = saved.find((tk) => tk.email === token);

    await ghiAuditQuanTri({
      hanhDong: 'CAP_NHAT_TAI_KHOAN_BV',
      orgId,
      doiTuong: token,
      chiTiet: JSON.stringify(Object.keys(patch || {})),
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });

    return row;
  });
};

export const datLaiMatKhauBv = async (
  orgId,
  email,
  matKhauMoi = '',
  actor = 'ADMIN',
  { buocDoiMatKhau = true } = {},
) => {
  const token = String(email || '').trim().toLowerCase();
  const mk = String(matKhauMoi || taoMatKhauNgauNhien(12));
  const kt = kiemTraDinhDangMatKhau(mk);
  if (!kt.ok) throw new Error(kt.loi);

  return voiNgungCanTenant(orgId, async () => {
    const hienTai = await docDanhSachTaiKhoan();
    if (!hienTai.some((tk) => tk.email === token)) throw new Error('Tài khoản không tồn tại.');
    const next = capNhatMatKhauTrongDanhSach(hienTai, token, mk, { buocDoiMatKhau });
    await luuDanhSachTaiKhoan(next, actor);

    await ghiAuditQuanTri({
      hanhDong: 'DAT_LAI_MAT_KHAU_BV',
      orgId,
      doiTuong: token,
      chiTiet: buocDoiMatKhau ? 'Bắt buộc đổi mật khẩu lần đăng nhập sau' : 'Đặt lại mật khẩu',
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });

    return { matKhauMoi: mk };
  });
};

export const xoaTaiKhoanBv = async (orgId, email, actor = 'ADMIN') => {
  const token = String(email || '').trim().toLowerCase();
  if (!token) throw new Error('Email không hợp lệ.');
  if (laTaiKhoanAdminToiCao(token)) throw new Error('Không thể xóa tài khoản quản trị tối cao.');
  if (token === String(actor || '').trim().toLowerCase()) {
    throw new Error('Không thể xóa tài khoản đang đăng nhập.');
  }

  return voiNgungCanTenant(orgId, async () => {
    const hienTai = await docDanhSachTaiKhoan();
    const row = hienTai.find((tk) => tk.email === token);
    if (!row) throw new Error('Tài khoản không tồn tại.');
    if (row.vaiTro === 'ADMIN' && demAdminBvConLai(hienTai, token) < 1) {
      throw new Error('Không thể xóa admin BV cuối cùng của cơ sở.');
    }

    await luuDanhSachTaiKhoan(hienTai.filter((tk) => tk.email !== token), actor);
    await xoaBindingTaiKhoan(token);

    await ghiAuditQuanTri({
      hanhDong: 'XOA_TAI_KHOAN_BV',
      orgId,
      doiTuong: token,
      chiTiet: row.hoTen || row.ten || token,
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });

    return { ok: true };
  });
};

export const ganPhanQuyenTaiKhoanBv = async (orgId, email, binding, actor = 'ADMIN') => {
  const token = String(email || '').trim().toLowerCase();
  return voiNgungCanTenant(orgId, async () => {
    if (!(await docDanhSachTaiKhoan()).some((tk) => tk.email === token)) {
      throw new Error('Tài khoản không tồn tại.');
    }
    await capNhatBindingTaiKhoan(token, binding);
    await ghiAuditQuanTri({
      hanhDong: 'GAN_PHAN_QUYEN_BV',
      orgId,
      doiTuong: token,
      chiTiet: `roleIds=${(binding?.roleIds || []).join(',')}`,
      taiKhoan: actor,
      heThong: 'TRUY_CAP',
    });
    return binding;
  });
};

export { taiRBAC, luuRBAC, RBAC_KEYS } from './rbac_engine';

export default {
  docTaiKhoanTheoOrg,
  demAdminBvConLai,
  taoTaiKhoanBv,
  capNhatHoSoTaiKhoanBv,
  datLaiMatKhauBv,
  xoaTaiKhoanBv,
  docBindingTaiKhoan,
  ganPhanQuyenTaiKhoanBv,
  damBaoRbacTenant,
};
