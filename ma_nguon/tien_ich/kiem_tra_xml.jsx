/**
 * FILE: ma_nguon/tien_ich/kiem_tra_xml.jsx
 * CHỨC NĂNG: Kiểm tra cấu trúc XML theo đặc tả dữ liệu BHYT hiện hành.
 * Cơ chế này kiểm tra đầy đủ cột, trường bắt buộc, định dạng, kiểu dữ liệu,
 * rang buoc lien truong, lien bang va cac moc thoi gian dieu tri.
 */

import { CAU_TRUC_DU_LIEU } from '../quy_tac/quyluat_cautrucdulieu/quyluat_cau_truc_du_lieu';

const DANH_SACH_BANG_XML = ['XML1', 'XML2', 'XML3', 'XML4', 'XML5', 'XML6'];
const TEN_QUY_TAC_CAU_TRUC = 'Kiểm tra cấu trúc XML theo QĐ3176';
const CO_SO_PHAP_LY_CAU_TRUC_XML =
  'QĐ 3176/QĐ-BYT + QĐ 130/QĐ-BYT (đặc tả bộ chỉ tiêu XML hiện hành).';

// Bo sung truong bat buoc de tranh bo sot khi file quy tac chua khai bao het.
const TRUONG_BAT_BUOC_BO_SUNG = {
  XML1: [
    'MA_LK',
    'MA_BN',
    'HO_TEN',
    'NGAY_SINH',
    'GIOI_TINH',
    'MA_THE_BHYT',
    'MA_DOITUONG_KCB',
    'MA_BENH_CHINH',
    'NGAY_VAO',
    'NGAY_RA',
    'MA_LOAI_KCB',
    'MA_CSKCB',
    'T_TONGCHI_BV',
    'T_TONGCHI_BH',
  ],
  XML2: [
    'MA_LK',
    'STT',
    'MA_THUOC',
    'TEN_THUOC',
    'MA_NHOM',
    'SO_LUONG',
    'DON_GIA',
    'THANH_TIEN_BV',
    'MA_KHOA',
    'MA_BAC_SI',
    'NGAY_YL',
  ],
  XML3: [
    'MA_LK',
    'STT',
    'MA_NHOM',
    'SO_LUONG',
    'DON_GIA_BV',
    'THANH_TIEN_BV',
    'MA_KHOA',
    'MA_BAC_SI',
    'NGAY_YL',
  ],
  XML4: ['MA_LK', 'STT', 'MA_DICH_VU', 'NGAY_KQ'],
  XML5: ['MA_LK', 'STT', 'NGAY_YL', 'MA_BAC_SI', 'MA_KHOA'],
  XML6: ['MA_LK', 'STT', 'MA_BN', 'HO_TEN', 'MA_BAC_SI', 'MA_KHOA', 'MA_CSKCB', 'MA_BENH_CHINH'],
};

const TAP_TRUONG_TY_LE = new Set(['MUC_HUONG', 'TYLE_TT_BH', 'TYLE_TT_DV']);
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

const layTapBatBuocTheoBang = (tenBang, cauTruc) => {
  const tap = new Set(TRUONG_BAT_BUOC_BO_SUNG[tenBang] || []);
  const quyTac = cauTruc?.quy_tac || {};
  Object.entries(quyTac).forEach(([field, rule]) => {
    if (rule?.required) tap.add(field);
  });
  return tap;
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

  if (tenBang === 'XML5' && laRong(row.DIEN_BIEN) && laRong(row.HOI_CHAN) && laRong(row.PHAU_THUAT)) {
    pushLoi(danhSachLoi, {
      phanHe: tenBang,
      index,
      truong: 'DIEN_BIEN',
      maLuat: `${tenBang}-CONTENT-EMPTY`,
      mucDo: 'Error',
      noiDung: 'Dòng XML5 không có nội dung DIEN_BIEN/HOI_CHAN/PHAU_THUAT.',
    });
  }
};

const kiemTraTheoQuyTacBang = (tenBang, rows, danhSachLoi, maLkGoc) => {
  const cauTruc = CAU_TRUC_DU_LIEU[tenBang];
  if (!cauTruc) return;

  const tapCotChuan = new Set(cauTruc.cot || []);
  const tapBatBuoc = layTapBatBuocTheoBang(tenBang, cauTruc);
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

    tapBatBuoc.forEach((field) => {
      if (laRong(row[field])) {
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
