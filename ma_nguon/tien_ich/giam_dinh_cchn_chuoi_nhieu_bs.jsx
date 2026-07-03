/**
 * Giám định chuỗi mã CCHN/bác sỹ nhiều người: không được có dấu ";" thừa ở cuối.
 * Mã quy tắc: CCHN-CHUOI-DU-CUOI (built-in LAYER 4).
 *
 * Đúng:  Lê Hoàng Thái (006084/ST-CCHN); Châu Thị Lam Thuyên (08105/AG-CCHN)
 * Sai:   ...Châu Thị Lam Thuyên (08105/AG-CCHN);
 */

export const MA_LUAT_CCHN_CHUOI_DU_CUOI = 'CCHN-CHUOI-DU-CUOI';

export const CANH_BAO_CCHN_CHUOI_DU_CUOI =
  '⚠️ Cảnh báo: Chuỗi mã CCHN dư ký tự cuối, đề nghị điều chỉnh đúng mã đã khai báo';

const CO_SO_PHAP_LY =
  'QĐ 130/QĐ-BYT — XML BHYT: trường mã bác sỹ/nhân viên y tế ghi nhiều người phân tách bằng dấu chấm phẩy, không kết thúc bằng dấu nối thừa';

/** Tách segment nhân sự theo dấu ; (bỏ qua segment rỗng). */
export const tachSegmentNhanVienYTe = (value) => {
  const raw = String(value ?? '');
  if (!raw.trim()) return [];
  return raw.split(';').map((s) => s.trim()).filter(Boolean);
};

/**
 * Chuỗi có ≥2 nhân viên y tế và kết thúc bằng dấu ";" (có thể kèm khoảng trắng).
 */
export const coChuoiCchnNhieuNguoiDuKyTuCuoi = (value) => {
  const raw = String(value ?? '');
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const segments = tachSegmentNhanVienYTe(raw);
  if (segments.length < 2) return false;
  return /;\s*$/.test(raw);
};

const TRUONG_BAC_SI_THEO_BANG = [
  { phan_he: 'XML1', truong: 'MA_TTDV' },
  { phan_he: 'XML2', truong: 'MA_BAC_SI' },
  { phan_he: 'XML3', truong: 'MA_BAC_SI' },
  { phan_he: 'XML3', truong: 'NGUOI_THUC_HIEN' },
  { phan_he: 'XML4', truong: 'MA_BS_DOC_KQ' },
  { phan_he: 'XML5', truong: 'MA_BAC_SI' },
  { phan_he: 'XML6', truong: 'MA_BAC_SI' },
];

const layMangTheoPhanHe = (hoSo, phanHe) => {
  const key = String(phanHe || '').toUpperCase();
  const lower = key.toLowerCase();
  if (key === 'XML1') {
    const x1 = hoSo?.XML1 || hoSo?.xml1;
    return x1 ? [x1] : [];
  }
  const arr = hoSo?.[key] || hoSo?.[lower];
  return Array.isArray(arr) ? arr : [];
};

const taoCanhBao = (payload) => ({
  phan_he: payload.phan_he,
  index: payload.index ?? -1,
  truong_loi: payload.truong_loi,
  canh_bao: CANH_BAO_CCHN_CHUOI_DU_CUOI,
  muc_do: 'Warning',
  ma_luat: MA_LUAT_CCHN_CHUOI_DU_CUOI,
  ten_quy_tac: 'Chuỗi mã CCHN nhiều người — dư ký tự cuối',
  dieu_kien: 'BUILT-IN',
  co_so_phap_ly: CO_SO_PHAP_LY,
});

/**
 * Quét các trường mã bác sỹ/nhân viên y tế trên XML1–XML6.
 * @param {object} hoSo
 */
export const giamDinhCchnChuoiNhieuBsDuKyTuCuoi = (hoSo) => {
  const ds = [];
  if (!hoSo) return ds;

  for (const { phan_he, truong } of TRUONG_BAC_SI_THEO_BANG) {
    const mang = layMangTheoPhanHe(hoSo, phan_he);
    mang.forEach((row, index) => {
      const giaTri = row?.[truong];
      if (!coChuoiCchnNhieuNguoiDuKyTuCuoi(giaTri)) return;
      ds.push(taoCanhBao({ phan_he, index, truong_loi: truong }));
    });
  }

  return ds;
};
