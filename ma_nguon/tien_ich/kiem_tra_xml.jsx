/**
 * FILE: ma_nguon/tien_ich/kiem_tra_xml.jsx
 * CHỨC NĂNG: Kiểm tra cấu trúc XML theo đặc tả dữ liệu BHYT hiện hành.
 * Cơ chế này kiểm tra đầy đủ cột, trường bắt buộc, định dạng, kiểu dữ liệu,
 * rang buoc lien truong, lien bang va cac moc thoi gian dieu tri.
 */

import { CAU_TRUC_DU_LIEU } from '../quy_tac/quyluat_cautrucdulieu/quyluat_cau_truc_du_lieu';

const DANH_SACH_BANG_XML = [
  'XML1', 'XML2', 'XML3', 'XML4', 'XML5', 'XML6', 'XML7', 'XML8', 'XML9', 'XML10', 'XML11', 'XML12', 'XML13', 'XML14', 'XML15',
];
const TEN_QUY_TAC_CAU_TRUC = 'Kiểm tra cấu trúc XML theo QĐ3176';
const CO_SO_PHAP_LY_CAU_TRUC_XML =
  'QĐ 3176/QĐ-BYT (bảng trường bắt buộc đồng bộ file QD3176_Truong_Bat_Buoc_1.xlsx) + QĐ 130/QĐ-BYT.';

/**
 * Trường bắt buộc theo từng bảng — đồng bộ với phụ lục QĐ 3176/QĐ-BYT (file QD3176_Truong_Bat_Buoc_1.xlsx).
 * Không gộp thêm QUY_TAC.required từ xml1–6 để tránh lệch so với bảng chính thức.
 */
const TRUONG_BAT_BUOC_BO_SUNG = {
  XML1: [
    'MA_LK', 'STT', 'MA_BN', 'HO_TEN', 'NGAY_SINH', 'GIOI_TINH', 'MA_QUOCTICH', 'MA_DANTOC', 'MA_NGHE_NGHIEP', 'DIA_CHI',
    'MATINH_CU_TRU', 'MAHUYEN_CU_TRU', 'LY_DO_VV', 'CHAN_DOAN_VAO', 'CHAN_DOAN_RV', 'MA_BENH_CHINH', 'MA_DOITUONG_KCB',
    'NGAY_VAO', 'NGAY_RA', 'SO_NGAY_DTRI', 'PP_DIEU_TRI', 'KET_QUA_DTRI', 'MA_LOAI_RV', 'T_THUOC', 'T_VTYT', 'T_TONGCHI_BV',
    'T_TONGCHI_BH', 'T_BNTT', 'T_BNCCT', 'T_BHTT', 'T_NGUONKHAC', 'NAM_QT', 'THANG_QT', 'MA_LOAI_KCB', 'MA_KHOA', 'MA_CSKCB',
    'MA_KHUVUC', 'MA_TTDV',
  ],
  XML2: [
    'MA_LK', 'STT', 'MA_THUOC', 'MA_DICH_VU', 'TEN_THUOC', 'TEN_HOAT_CHAT', 'DUONG_DUNG', 'HAM_LUONG', 'DON_VI_TINH', 'SO_LUONG',
    'DON_GIA', 'TT_THAU', 'PHAM_VI', 'TYLE_TT', 'THANH_TIEN_BV', 'THANH_TIEN_BH', 'T_NGUONKHAC', 'T_BNTT', 'T_BNCCT', 'T_BHTT',
    'MA_PTTT', 'NGAY_YL',
  ],
  XML3: [
    'MA_LK', 'STT', 'MA_DICH_VU', 'MA_PTTT_QT', 'TEN_DICH_VU', 'DON_VI_TINH', 'SO_LUONG', 'DON_GIA_BV', 'DON_GIA_BH', 'TT_THAU',
    'PHAM_VI', 'TYLE_TT', 'THANH_TIEN_BV', 'THANH_TIEN_BH', 'T_NGUONKHAC', 'T_BNTT', 'T_BNCCT', 'T_BHTT', 'MA_PTTT', 'NGAY_YL',
    'NGAY_KQ',
  ],
  XML4: ['MA_LK', 'STT', 'MA_DICH_VU', 'TEN_DICH_VU'],
  XML5: ['MA_LK', 'STT', 'DIEN_BIEN_LS', 'NGAY_YL'],
  XML6: ['MA_LK', 'MA_BN', 'HO_TEN', 'NGAY_SINH', 'GIOI_TINH', 'DIA_CHI', 'MATINH_CU_TRU', 'MAHUYEN_CU_TRU', 'MAXA_CU_TRU'],
  XML7: ['MA_LK', 'SO_LUU_TRU', 'MA_YTE', 'MA_KHOA_RV'],
  XML8: ['MA_LK', 'SO_LUU_TRU', 'MA_YTE', 'MA_KHOA_RV'],
  XML9: ['MA_LK', 'HO_TEN_ME', 'NGAYSINH_ME'],
  XML10: ['MA_LK', 'HO_TEN', 'CHAN_DOAN', 'TU_NGAY', 'DEN_NGAY'],
  XML11: ['MA_LK', 'HO_TEN', 'CHAN_DOAN', 'PP_DIEU_TRI', 'TU_NGAY', 'DEN_NGAY'],
  XML12: ['MA_LK'],
  XML13: ['MA_LK', 'SO_HOSO'],
  XML14: ['MA_LK'],
  XML15: ['MA_LK'],
};

/** Một số hệ thống gửi tên cột khác với QĐ — coi là đủ nếu một trong các alias có giá trị. */
const ANH_XA_TRUONG_BAT_BUOC = {
  XML1: {
    MA_QUOCTICH: ['MA_QUOC_TICH'],
    MATINH_CU_TRU: ['MA_TINH_CU_TRU'],
    MAHUYEN_CU_TRU: ['MA_HUYEN_CU_TRU'],
    MAXA_CU_TRU: ['MA_XA_CU_TRU'],
  },
  XML2: { TYLE_TT: ['TYLE_TT_BH', 'TYLE_TT_DV'] },
  XML3: { TYLE_TT: ['TYLE_TT_BH', 'TYLE_TT_DV'] },
  XML5: { DIEN_BIEN_LS: ['DIEN_BIEN'] },
  XML6: {
    MATINH_CU_TRU: ['MA_TINH_CU_TRU'],
    MAHUYEN_CU_TRU: ['MA_HUYEN_CU_TRU'],
    MAXA_CU_TRU: ['MA_XA_CU_TRU'],
  },
};

const TAP_TRUONG_TY_LE = new Set(['MUC_HUONG', 'TYLE_TT', 'TYLE_TT_BH', 'TYLE_TT_DV']);
const TAP_TRUONG_SO_KHONG_AM = new Set([
  'SO_NGAY_DTRI',
  'SO_LUONG',
  'DON_GIA',
  'DON_GIA_BV',
  'DON_GIA_BH',
  'THANH_TIEN_BV',
  'THANH_TIEN_BH',
  'T_THUOC',
  'T_VTYT',
  'T_TONGCHI_BV',
  'T_TONGCHI_BH',
  'T_BNTT',
  'T_BNCCT',
  'T_BHTT',
  'T_NGUONKHAC',
]);
const TAP_GIOI_TINH_HOP_LE = new Set(['1', '2', '3']);

const TAP_NGAY_8_SO = new Set([
  'NGAY_SINH',
  'GT_THE_TU',
  'GT_THE_DEN',
  'NGAY_MIEN_CCT',
  'NGAY_TAI_KHAM',
  'NAM_NAM_LIEN_TUC',
  'NGAY_HEN_TAI_KHAM',
  'TU_NGAY',
  'DEN_NGAY',
  'NGAYSINH_ME',
]);

const TAP_NGAY_12_SO = new Set([
  'NGAY_VAO',
  'NGAY_VAO_NOI_TRU',
  'NGAY_RA',
  'NGAY_TTOAN',
  'NGAY_YL',
  'NGAY_TH_YL',
  'NGAY_KQ',
  'THOI_DIEM_XN_HIV',
  'NGAY_KQ_XN_TLVR',
  'NGAY_CD_BD',
  'NGAY_BAT_DAU_PHAC_DO',
  'NGAY_KET_THUC_PHAC_DO',
]);

const laRong = (val) => val === undefined || val === null || String(val).trim() === '';

const laGiaTriSo = (val) => {
  if (laRong(val)) return false;
  const raw = String(val).trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(raw);
};

const laNgayDungDinhDang = (val, doDai) =>
  new RegExp(`^\\d{${doDai}}$`).test(String(val || '').trim());

const parseNgay130 = (val) => {
  const digits = String(val || '').replace(/\D/g, '');
  if (digits.length < 8) return null;

  const nam = Number(digits.slice(0, 4));
  const thang = Number(digits.slice(4, 6)) - 1;
  const ngay = Number(digits.slice(6, 8));
  const gio = Number(digits.slice(8, 10) || '0');
  const phut = Number(digits.slice(10, 12) || '0');

  const parsed = new Date(nam, thang, ngay, gio, phut, 0, 0);
  if (Number.isNaN(parsed.getTime())) return null;

  // Chặn dữ liệu không hợp lệ kiểu 20230231.
  if (
    parsed.getFullYear() !== nam ||
    parsed.getMonth() !== thang ||
    parsed.getDate() !== ngay ||
    parsed.getHours() !== gio ||
    parsed.getMinutes() !== phut
  ) {
    return null;
  }

  return parsed;
};

const laNgay8HopLe = (val) => laNgayDungDinhDang(val, 8) && !!parseNgay130(String(val).trim());
const laNgay12HopLe = (val) => laNgayDungDinhDang(val, 12) && !!parseNgay130(String(val).trim());

const layGiaTriBang = (hoSo, tenBang) => hoSo?.[tenBang.toLowerCase()] ?? hoSo?.[tenBang];

const layDongXML1 = (hoSo) => {
  const raw = layGiaTriBang(hoSo, 'XML1');
  if (Array.isArray(raw)) return raw[0] || {};
  return raw && typeof raw === 'object' ? raw : null;
};

const layDanhSachDong = (hoSo, tenBang) => {
  if (tenBang === 'XML1') {
    const dong = layDongXML1(hoSo);
    return dong ? [dong] : [];
  }
  const raw = layGiaTriBang(hoSo, tenBang);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return [raw];
  return [];
};

const taoCanhBao = (phanHe, index, noiDung) =>
  `${phanHe}${index >= 0 ? `: Dong ${index + 1}` : ''}: ${noiDung}`;

const taoLoi = ({ phanHe, index = -1, truong = 'CAU_TRUC', maLuat, mucDo = 'Error', noiDung }) => ({
  phan_he: phanHe,
  index,
  truong_loi: truong,
  canh_bao: taoCanhBao(phanHe, index, noiDung),
  muc_do: mucDo,
  ma_luat: maLuat,
  ten_quy_tac: TEN_QUY_TAC_CAU_TRUC,
  dieu_kien: 'STATIC',
  co_so_phap_ly: CO_SO_PHAP_LY_CAU_TRUC_XML,
});

const taoKhoaLoi = ({ phanHe, index = -1, truong = 'CAU_TRUC', noiDung = '' }) =>
  `${phanHe}|${index}|${truong}|${noiDung}`;

const pushLoi = (ds, payload) => {
  if (!ds._khoa_loi) {
    Object.defineProperty(ds, '_khoa_loi', {
      value: new Set(),
      enumerable: false,
      configurable: false,
      writable: false,
    });
  }

  const key = taoKhoaLoi(payload);
  if (ds._khoa_loi.has(key)) return;
  ds._khoa_loi.add(key);
  ds.push(taoLoi(payload));
};

const kiemTraLoaiDuLieuBang = (hoSo, tenBang, danhSachLoi) => {
  const raw = layGiaTriBang(hoSo, tenBang);

  if (raw === undefined || raw === null) {
    if (tenBang !== 'XML1') {
      pushLoi(danhSachLoi, {
        phanHe: tenBang,
        maLuat: `${tenBang}-MISSING-TABLE`,
        mucDo: 'Warning',
        noiDung: `Không tìm thấy bảng ${tenBang} trong hồ sơ để kiểm tra cấu trúc.`,
      });
    }
    return;
  }

  if (tenBang === 'XML1') {
    const hopLe = (raw && typeof raw === 'object') || (Array.isArray(raw) && raw.length > 0);
    if (!hopLe) {
      pushLoi(danhSachLoi, {
        phanHe: tenBang,
        maLuat: `${tenBang}-TYPE`,
        mucDo: 'Critical',
        noiDung: 'Dữ liệu XML1 phải là object hoặc mảng có ít nhất 1 dòng.',
      });
    }
    return;
  }

  if (!Array.isArray(raw)) {
    pushLoi(danhSachLoi, {
      phanHe: tenBang,
      maLuat: `${tenBang}-TYPE`,
      mucDo: 'Error',
      noiDung: 'Dữ liệu phải là mảng dòng chi tiết.',
    });
  }
};

const layTapBatBuocTheoBang = (tenBang) => new Set(TRUONG_BAT_BUOC_BO_SUNG[tenBang] || []);

/** Trường bắt buộc có giá trị (kể cả qua tên cột thay thế trong ANH_XA_TRUONG_BAT_BUOC). */
const coGiaTriBatBuoc = (row, tenBang, field) => {
  if (!laRong(row[field])) return true;
  const alts = ANH_XA_TRUONG_BAT_BUOC[tenBang]?.[field];
  if (!alts || !Array.isArray(alts)) return false;
  return alts.some((k) => !laRong(row[k]));
};

const checkKhongAmVaTyLe = (tenBang, index, field, val, danhSachLoi) => {
  const canKiemTraGiaTriSo = TAP_TRUONG_SO_KHONG_AM.has(field) || TAP_TRUONG_TY_LE.has(field);
  if (!canKiemTraGiaTriSo) return;

  if (!laGiaTriSo(val)) {
    pushLoi(danhSachLoi, {
      phanHe: tenBang,
      index,
      truong: field,
      maLuat: `${tenBang}-TYPE-NUM-${field}`,
      mucDo: 'Error',
      noiDung: `Giá trị [${field}] phải là số.`,
    });
    return;
  }

  const so = Number(String(val).trim().replace(',', '.'));

  if (TAP_TRUONG_SO_KHONG_AM.has(field) && so < 0) {
    pushLoi(danhSachLoi, {
      phanHe: tenBang,
      index,
      truong: field,
      maLuat: `${tenBang}-NEG-${field}`,
      mucDo: 'Error',
      noiDung: `Giá trị [${field}] không được âm.`,
    });
  }

  if (TAP_TRUONG_TY_LE.has(field) && (so < 0 || so > 100)) {
    pushLoi(danhSachLoi, {
      phanHe: tenBang,
      index,
      truong: field,
      maLuat: `${tenBang}-RANGE-${field}`,
      mucDo: 'Error',
      noiDung: `Giá trị [${field}] phải nằm trong khoảng 0-100.`,
    });
  }
};

const kiemTraLienTruongTheoBang = (tenBang, row, index, danhSachLoi) => {
  if (tenBang === 'XML1') {
    const gioiTinh = String(row.GIOI_TINH || '').trim();
    if (gioiTinh && !TAP_GIOI_TINH_HOP_LE.has(gioiTinh)) {
      pushLoi(danhSachLoi, {
        phanHe: tenBang,
        index,
        truong: 'GIOI_TINH',
        maLuat: `${tenBang}-DOMAIN-GIOITINH`,
        mucDo: 'Warning',
        noiDung: `GIOI_TINH [${gioiTinh}] không thuộc tập giá trị hợp lệ (1/2/3).`,
      });
    }
  }

  if (tenBang === 'XML3' && laRong(row.MA_DICH_VU) && laRong(row.MA_VAT_TU)) {
    pushLoi(danhSachLoi, {
      phanHe: tenBang,
      index,
      truong: 'MA_DICH_VU',
      maLuat: `${tenBang}-EITHER-DVKT-VTYT`,
      mucDo: 'Critical',
      noiDung: 'Can co it nhat 1 truong MA_DICH_VU hoac MA_VAT_TU.',
    });
  }

  if (tenBang === 'XML4') {
    const coNoiDungKetQua = !laRong(row.GIA_TRI) || !laRong(row.KET_LUAN) || !laRong(row.MO_TA);
    const coChiSoCLS = !laRong(row.TEN_CHI_SO) || !laRong(row.MA_CHI_SO) || !laRong(row.DON_VI_DO);
    if (!coNoiDungKetQua && !coChiSoCLS) {
      pushLoi(danhSachLoi, {
        phanHe: tenBang,
        index,
        truong: 'GIA_TRI',
        maLuat: `${tenBang}-RESULT-EMPTY`,
        mucDo: 'Warning',
        noiDung: 'Dòng XML4 chưa có nội dung kết quả (GIA_TRI/KET_LUAN/MO_TA).',
      });
    }
  }

  if (tenBang === 'XML5') {
    const coDienBien = !laRong(row.DIEN_BIEN) || !laRong(row.DIEN_BIEN_LS);
    if (!coDienBien && laRong(row.HOI_CHAN) && laRong(row.PHAU_THUAT)) {
      pushLoi(danhSachLoi, {
        phanHe: tenBang,
        index,
        truong: 'DIEN_BIEN',
        maLuat: `${tenBang}-CONTENT-EMPTY`,
        mucDo: 'Error',
        noiDung: 'Dòng XML5 không có nội dung DIEN_BIEN/DIEN_BIEN_LS/HOI_CHAN/PHAU_THUAT.',
      });
    }
  }
};

const kiemTraTheoQuyTacBang = (tenBang, rows, danhSachLoi, maLkGoc) => {
  const cauTruc = CAU_TRUC_DU_LIEU[tenBang] || { cot: [], quy_tac: {} };
  const coCauHinhBang = CAU_TRUC_DU_LIEU[tenBang];
  const coTruongBatBuoc = (TRUONG_BAT_BUOC_BO_SUNG[tenBang] || []).length > 0;
  if (!coCauHinhBang && !coTruongBatBuoc) return;

  const tapCotChuan = new Set(cauTruc.cot || []);
  const tapBatBuoc = layTapBatBuocTheoBang(tenBang);
  const quyTac = cauTruc.quy_tac || {};
  const daGapSTT = new Set();

  rows.forEach((row, rawIndex) => {
    const index = tenBang === 'XML1' ? -1 : rawIndex;

    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      pushLoi(danhSachLoi, {
        phanHe: tenBang,
        index,
        truong: 'ROW',
        maLuat: `${tenBang}-ROW-INVALID`,
        mucDo: 'Critical',
        noiDung: 'Dòng dữ liệu không đúng định dạng object.',
      });
      return;
    }

    if (tapCotChuan.size > 0) {
      Object.keys(row).forEach((field) => {
        const fieldRaw = String(field || '');
        const fieldClean = fieldRaw.replace(/^\uFEFF/, '').trim();
        if (fieldClean === 'id' || fieldClean.startsWith('_')) return;
        if (tapCotChuan.has(fieldClean)) return;

        const laParserError = fieldClean.toLowerCase() === 'parsererror';
        const noiDung = laParserError
          ? 'Cột [parsererror] không nằm trong danh mục chỉ tiêu quy định. Xử lý: XML đầu vào sai cú pháp (thiếu thẻ đóng, lỗi ký tự đặc biệt, lỗi mã hóa). Cần sửa XML gốc rồi nạp lại.'
          : `Cột [${field}] không nằm trong danh mục chỉ tiêu quy định.`;

        const noiDungChuan = laParserError
          ? noiDung
          : String(noiDung).replace(`[${field}]`, `[${fieldClean}]`);

        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: fieldClean,
          maLuat: `${tenBang}-UNKNOWN-${fieldClean}`,
          mucDo: laParserError ? 'Critical' : 'Warning',
          noiDung: noiDungChuan,
        });
      });
    }

    tapBatBuoc.forEach((field) => {
      if (!coGiaTriBatBuoc(row, tenBang, field)) {
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: field,
          maLuat: `${tenBang}-REQ-${field}`,
          mucDo: tenBang === 'XML1' ? 'Critical' : 'Error',
          noiDung: `Thiếu trường bắt buộc [${field}] theo đặc tả XML hiện hành.`,
        });
      }
    });

    Object.entries(quyTac).forEach(([field, rule]) => {
      const val = row[field];
      const valueText = String(val ?? '').trim();
      if (laRong(val)) return;

      if (rule?.maxLength && valueText.length > rule.maxLength) {
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: field,
          maLuat: `${tenBang}-MAXLEN-${field}`,
          mucDo: 'Warning',
          noiDung: `Gia tri [${field}] vuot qua do dai toi da ${rule.maxLength}.`,
        });
      }

      if (rule?.type === 'number' && !laGiaTriSo(val)) {
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: field,
          maLuat: `${tenBang}-TYPE-NUM-${field}`,
          mucDo: 'Error',
          noiDung: `Giá trị [${field}] phải là số.`,
        });
        return;
      }

      checkKhongAmVaTyLe(tenBang, index, field, val, danhSachLoi);

      if (TAP_NGAY_8_SO.has(field) && !laNgay8HopLe(val)) {
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: field,
          maLuat: `${tenBang}-DATE8-${field}`,
          mucDo: 'Error',
          noiDung: `Giá trị [${field}] phải theo YYYYMMDD và là ngày hợp lệ.`,
        });
      }

      if (TAP_NGAY_12_SO.has(field) && !laNgay12HopLe(val)) {
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: field,
          maLuat: `${tenBang}-DATE12-${field}`,
          mucDo: 'Error',
          noiDung: `Giá trị [${field}] phải theo YYYYMMDDHHMM và là thời điểm hợp lệ.`,
        });
      }
    });

    kiemTraLienTruongTheoBang(tenBang, row, index, danhSachLoi);

    if (tenBang !== 'XML1') {
      const maLkDong = String(row.MA_LK || '').trim();
      if (!maLkDong) {
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: 'MA_LK',
          maLuat: `${tenBang}-MALK-EMPTY`,
          mucDo: 'Critical',
          noiDung: 'Thiếu MA_LK để liên kết với XML1.',
        });
      } else if (maLkGoc && maLkDong !== maLkGoc) {
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: 'MA_LK',
          maLuat: `${tenBang}-MALK-MISMATCH`,
          mucDo: 'Critical',
          noiDung: `MA_LK [${maLkDong}] không khớp XML1 [${maLkGoc}].`,
        });
      }

      if (!laRong(row.STT)) {
        const sttRaw = String(row.STT).trim();
        if (!/^\d+$/.test(sttRaw) || Number(sttRaw) <= 0) {
          pushLoi(danhSachLoi, {
            phanHe: tenBang,
            index,
            truong: 'STT',
            maLuat: `${tenBang}-STT-FORMAT`,
            mucDo: 'Error',
            noiDung: `STT [${row.STT}] không hợp lệ (chỉ nhận số nguyên dương).`,
          });
        } else if (daGapSTT.has(sttRaw)) {
          pushLoi(danhSachLoi, {
            phanHe: tenBang,
            index,
            truong: 'STT',
            maLuat: `${tenBang}-STT-DUP`,
            mucDo: 'Warning',
            noiDung: `STT [${sttRaw}] bi trung trong cung bang.`,
          });
        } else {
          daGapSTT.add(sttRaw);
        }
      }
    }
  });
};

const kiemTraLienBangXML1 = (xml1, danhSachLoi) => {
  if (!xml1 || typeof xml1 !== 'object') return;

  const maThe = String(xml1.MA_THE_BHYT || xml1.MA_THE || '')
    .trim()
    .toUpperCase();
  if (maThe && !/^[A-Z]{2}\d{13}$/.test(maThe)) {
    pushLoi(danhSachLoi, {
      phanHe: 'XML1',
      truong: 'MA_THE_BHYT',
      maLuat: 'XML1-MATHE-FORMAT',
      mucDo: 'Warning',
      noiDung: `MA_THE_BHYT [${maThe}] không đúng định dạng 2 chữ + 13 số.`,
    });
  }

  const gioiTinh = String(xml1.GIOI_TINH || '').trim();
  if (gioiTinh && !TAP_GIOI_TINH_HOP_LE.has(gioiTinh)) {
    pushLoi(danhSachLoi, {
      phanHe: 'XML1',
      truong: 'GIOI_TINH',
      maLuat: 'XML1-GIOITINH',
      mucDo: 'Warning',
      noiDung: `GIOI_TINH [${gioiTinh}] không nằm trong tập giá trị hợp lệ.`,
    });
  }

  const ngayVao = parseNgay130(xml1.NGAY_VAO);
  const ngayRa = parseNgay130(xml1.NGAY_RA);
  if (ngayVao && ngayRa && ngayRa < ngayVao) {
    pushLoi(danhSachLoi, {
      phanHe: 'XML1',
      truong: 'NGAY_RA',
      maLuat: 'XML1-NGAYRA-BEFORE',
      mucDo: 'Critical',
      noiDung: `NGAY_RA [${xml1.NGAY_RA}] nho hon NGAY_VAO [${xml1.NGAY_VAO}].`,
    });
  }
};

const parseNgayTuTruong = (row, field) => {
  const raw = String(row?.[field] ?? '').trim();
  if (!raw) return null;
  return parseNgay130(raw);
};

const kiemTraThoiGianDieuTriLienBang = (hoSo, danhSachLoi) => {
  const xml1 = layDongXML1(hoSo);
  if (!xml1 || typeof xml1 !== 'object') return;

  const ngayVao = parseNgay130(xml1.NGAY_VAO);
  const ngayRa = parseNgay130(xml1.NGAY_RA);
  const DUNG_SAI_TRUOC_Y_LENH_PHUT = 5;
  if (!ngayVao && !ngayRa) return;

  const cauHinhNgayTheoBang = {
    XML2: ['NGAY_YL', 'NGAY_TH_YL'],
    XML3: ['NGAY_YL', 'NGAY_TH_YL'],
    XML4: ['NGAY_YL', 'NGAY_TH_YL', 'NGAY_KQ'],
    XML5: ['NGAY_YL', 'NGAY_TH_YL'],
    XML6: ['NGAY_YL', 'NGAY_TH_YL', 'NGAY_KQ'],
  };

  Object.entries(cauHinhNgayTheoBang).forEach(([tenBang, dsTruongNgay]) => {
    const rows = layDanhSachDong(hoSo, tenBang);
    rows.forEach((row, index) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return;

      const ngayYLenh = parseNgayTuTruong(row, 'NGAY_YL');
      const ngayThYLenh = parseNgayTuTruong(row, 'NGAY_TH_YL');

      if (ngayYLenh && ngayThYLenh && ngayThYLenh < ngayYLenh) {
        const chenhlechPhut = Math.round((ngayYLenh.getTime() - ngayThYLenh.getTime()) / 60000);
        if (chenhlechPhut <= DUNG_SAI_TRUOC_Y_LENH_PHUT) return;
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: 'NGAY_TH_YL',
          maLuat: `${tenBang}-TIME-THYL-BEFORE-YL`,
          mucDo: 'Error',
          noiDung: `NGAY_TH_YL [${row.NGAY_TH_YL}] nho hon NGAY_YL [${row.NGAY_YL}].`,
        });
      }

      dsTruongNgay.forEach((field) => {
        const thoiDiem = parseNgayTuTruong(row, field);
        if (!thoiDiem) return;

        if (ngayVao && thoiDiem < ngayVao) {
          pushLoi(danhSachLoi, {
            phanHe: tenBang,
            index,
            truong: field,
            maLuat: `${tenBang}-TIME-${field}-BEFORE-IN`,
            mucDo: 'Warning',
            noiDung: `${field} [${row[field]}] som hon NGAY_VAO [${xml1.NGAY_VAO}].`,
          });
        }

        if (ngayRa && thoiDiem > ngayRa) {
          pushLoi(danhSachLoi, {
            phanHe: tenBang,
            index,
            truong: field,
            maLuat: `${tenBang}-TIME-${field}-AFTER-OUT`,
            mucDo: 'Warning',
            noiDung: `${field} [${row[field]}] muon hon NGAY_RA [${xml1.NGAY_RA}].`,
          });
        }
      });

      const ngayKq = parseNgayTuTruong(row, 'NGAY_KQ');
      if (ngayKq && ngayYLenh && ngayKq < ngayYLenh) {
        pushLoi(danhSachLoi, {
          phanHe: tenBang,
          index,
          truong: 'NGAY_KQ',
          maLuat: `${tenBang}-TIME-KQ-BEFORE-YL`,
          mucDo: 'Warning',
          noiDung: `NGAY_KQ [${row.NGAY_KQ}] nho hon NGAY_YL [${row.NGAY_YL}].`,
        });
      }
    });
  });
};

export const kiemTraDinhDangXML = (hoSo) => {
  const danhSachLoi = [];

  if (!hoSo || typeof hoSo !== 'object') {
    pushLoi(danhSachLoi, {
      phanHe: 'XML1',
      truong: 'HO_SO',
      maLuat: 'STRUCT-HOSO-EMPTY',
      mucDo: 'Critical',
      noiDung: 'Hồ sơ bị hỏng hoặc không thể đọc dữ liệu.',
    });

    return {
      hop_le: false,
      danh_sach_loi: danhSachLoi.map((item) => item.canh_bao),
      chi_tiet_loi: danhSachLoi,
    };
  }

  DANH_SACH_BANG_XML.forEach((tenBang) => {
    kiemTraLoaiDuLieuBang(hoSo, tenBang, danhSachLoi);
  });

  const xml1 = layDongXML1(hoSo);
  if (!xml1) {
    pushLoi(danhSachLoi, {
      phanHe: 'XML1',
      truong: 'XML1',
      maLuat: 'XML1-MISSING',
      mucDo: 'Critical',
      noiDung: 'Không tìm thấy bảng XML1 (tổng hợp hồ sơ).',
    });
  }

  const maLkGoc = String(xml1?.MA_LK || '').trim();
  DANH_SACH_BANG_XML.forEach((tenBang) => {
    const rows = layDanhSachDong(hoSo, tenBang);
    if (rows.length === 0) return;
    kiemTraTheoQuyTacBang(tenBang, rows, danhSachLoi, maLkGoc);
  });

  kiemTraLienBangXML1(xml1, danhSachLoi);
  kiemTraThoiGianDieuTriLienBang(hoSo, danhSachLoi);

  return {
    hop_le: danhSachLoi.length === 0,
    danh_sach_loi: danhSachLoi.map((item) => item.canh_bao),
    chi_tiet_loi: danhSachLoi,
  };
};
