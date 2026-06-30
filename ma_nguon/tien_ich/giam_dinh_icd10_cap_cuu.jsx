/**
 * Đối chiếu hồ sơ nội trú cấp cứu (XML1) với danh mục nội bộ ICD-10 nhập viện cấp cứu.
 * Phạm vi: MA_LOAI_KCB nội trú (03/09) + MA_DOITUONG_KCB = 2 (Cấp cứu — PL10).
 * Khớp: Ma_ICD_Chinh + (Ten_ICD_Chinh trong chẩn đoán HOẶC LY_DO_VNT theo từ khóa Ly_Do_Nhap_Vien).
 */

const ICD_RG = /[A-TV-Z]\d{2}(?:\.\d+)?/gi;

const normalizeTextNoAccent = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();

const chuanHoaMaIcd = (raw) => String(raw || '').replace(/\s/g, '').replace(/\./g, '').toUpperCase();

const chuanHoaMaLoaiKcb = (raw) => {
    const s = String(raw ?? '').trim();
    if (!s) return '';
    if (s === '03') return '3';
    if (s === '09') return '9';
    return s.replace(/^0+/, '') || s;
};

export const trichMaIcdTuChuoiMoTa = (s) => {
    const out = [];
    const seen = new Set();
    const m = String(s || '').match(ICD_RG) || [];
    m.forEach((x) => {
        const k = chuanHoaMaIcd(x);
        if (k && !seen.has(k)) {
            seen.add(k);
            out.push(k);
        }
    });
    return out;
};

const khopMaIcd = (patientNorm, catalogNorm) => {
    if (!patientNorm || !catalogNorm) return false;
    if (patientNorm === catalogNorm) return true;
    if (patientNorm.startsWith(catalogNorm)) return true;
    if (catalogNorm.length >= 3 && patientNorm.startsWith(catalogNorm.slice(0, 3))) return true;
    return false;
};

const layChuoiMaIcdTuDong = (row, cotMoi, cotCu) =>
    String(row?.[cotMoi] || row?.[cotCu] || '');

/**
 * Chẩn đoán chính có xuất hiện trong chuỗi Ma_ICD_Chinh hoặc Ma_ICD_Kem_Theo của dòng danh mục (theo mã trích được).
 */
export const icdChinhPhuHopDongDanhMuc = (xml1, row) => {
    const maChinh = chuanHoaMaIcd(xml1?.MA_BENH_CHINH || xml1?.MA_BENH || '');
    if (!maChinh) return false;
    const pool = [
        ...trichMaIcdTuChuoiMoTa(layChuoiMaIcdTuDong(row, 'Ma_ICD_Chinh', 'ICD_Chinh')),
        ...trichMaIcdTuChuoiMoTa(layChuoiMaIcdTuDong(row, 'Ma_ICD_Kem_Theo', 'ICD_Kem_Theo')),
    ];
    return pool.some((c) => khopMaIcd(maChinh, c));
};

const trichTuKhoaTuDanhMuc = (row) => {
    const out = [];
    const seen = new Set();
    const push = (token) => {
        const t = normalizeTextNoAccent(token).trim();
        if (t.length >= 4 && !seen.has(t)) {
            seen.add(t);
            out.push(t);
        }
    };

    String(row?.Tu_Khoa || '')
        .split(/[,;|/]+/)
        .forEach((part) => push(part));

    normalizeTextNoAccent(`${row?.Ly_Do_Nhap_Vien || ''} ${row?.Tinh_Trang_Benh || ''}`)
        .split(/[\s,.;:()[\]"/]+/)
        .forEach((part) => push(part));

    return out;
};

/**
 * CHẨN ĐOÁN/ghi chú phản ánh ít nhất một cụm tên bệnh trong Ten_ICD_Chinh.
 */
export const chanDoanPhuHopTenIcdChinh = (hoSoNorm, row) => {
    const tenBlob = String(row?.Ten_ICD_Chinh || row?.ICD_Chinh || '');
    const segments = tenBlob
        .split(/[;]/)
        .map((s) => normalizeTextNoAccent(s.trim()))
        .filter((s) => s.length >= 4);
    if (segments.length === 0) return false;
    return segments.some((seg) => hoSoNorm.includes(seg));
};

/**
 * LY_DO_VNT (lý do nhập viện nội trú) chứa từ khóa từ Ly_Do_Nhap_Vien / Tu_Khoa của dòng danh mục.
 */
export const lyDoVntPhuHopDanhMuc = (xml1, row) => {
    const lyDoVntNorm = normalizeTextNoAccent(xml1?.LY_DO_VNT || '');
    if (!lyDoVntNorm) return false;
    const keywords = trichTuKhoaTuDanhMuc(row);
    return keywords.some((kw) => lyDoVntNorm.includes(kw));
};

/**
 * Có ít nhất một từ khóa đủ dài từ Tinh_Trang_Benh hoặc Ly_Do_Nhap_Vien xuất hiện trong văn bản hồ sơ.
 */
export const vanBanHoSoCoPhanAnhLyDoHoacTinhTrang = (hoSoNorm, row) => {
    const blob = `${row?.Tinh_Trang_Benh || ''} ${row?.Ly_Do_Nhap_Vien || ''}`;
    const tokens = normalizeTextNoAccent(blob)
        .split(/[\s,.;:()[\]"/]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 5);
    if (tokens.length === 0) return false;
    return tokens.some((t) => hoSoNorm.includes(t));
};

export const laCapCuuTheoXml1 = (xml1) => {
    const ly = String(xml1?.MA_LY_DO_VV ?? xml1?.LY_DO_VV ?? '').trim();
    if (ly === '2') return true;
    const lyVien = String(xml1?.MA_LY_DO_VVIEN ?? xml1?.MA_LYDO_VVIEN ?? xml1?.MA_LY_DO_VNT ?? '').trim();
    return lyVien === '2';
};

/** MA_DOITUONG_KCB = 2 — Cấp cứu (Phụ lục 10 QĐ 7603/BYT). */
export const laDoiTuongCapCuuTheoXml1 = (xml1) => {
    const raw = String(xml1?.MA_DOITUONG_KCB ?? '').trim();
    if (!raw) return false;
    if (raw === '2') return true;
    const num = Number(raw.replace(',', '.'));
    return Number.isFinite(num) && num === 2;
};

/** Điều trị nội trú theo QĐ 824 (mã 03 hoặc 09). */
export const laNoiTruTheoXml1 = (xml1) => {
    const maLoai = chuanHoaMaLoaiKcb(xml1?.MA_LOAI_KCB);
    if (maLoai === '3' || maLoai === '9') return true;
    return Boolean(String(xml1?.NGAY_VAO_NOI_TRU ?? '').trim());
};

/** Nội trú + đối tượng KCB cấp cứu (MA_DOITUONG_KCB = 2). */
export const laNoiTruCapCuuTheoXml1 = (xml1) =>
    laNoiTruTheoXml1(xml1) && laDoiTuongCapCuuTheoXml1(xml1);

export const laTreEmTheoXml1 = (xml1) => {
    const tn = Number(xml1?.TUOI_NAM);
    if (Number.isFinite(tn)) return tn < 16;
    const tng = Number(xml1?.TUOI_NGAY);
    if (Number.isFinite(tng)) return tng < 16 * 365;
    return null;
};

export const nhomIdLaNhi = (id) => /^NH\d+/i.test(String(id || ''));

export const nhomIdLaNguoiLon = (id) => /^NL\d+/i.test(String(id || ''));

export const nhomIdLaChuyenKhoa = (id) => /^HCQ\d+/i.test(String(id || ''));

export const locDongDanhMucTheoDoTuoi = (rows, laTre) => {
    if (!Array.isArray(rows)) return [];
    if (laTre === null) return rows;
    if (laTre) return rows.filter((r) => nhomIdLaNhi(r?.ID));
    return rows.filter((r) => nhomIdLaNguoiLon(r?.ID) || nhomIdLaChuyenKhoa(r?.ID));
};

export const ghepVanBanLamSangXml1 = (xml1) =>
    [xml1?.CHAN_DOAN_VAO, xml1?.CHAN_DOAN_RV, xml1?.GHI_CHU, xml1?.PP_DIEU_TRI, xml1?.LY_DO_VNT]
        .filter(Boolean)
        .join(' ');

const dongDanhMucPhuHopHoSo = (xml1, row, hoSoNorm) => {
    if (!icdChinhPhuHopDongDanhMuc(xml1, row)) return false;
    return (
        chanDoanPhuHopTenIcdChinh(hoSoNorm, row)
        || lyDoVntPhuHopDanhMuc(xml1, row)
    );
};

/**
 * @returns {boolean} true = vi phạm (cần cảnh báo XUẤT TOÁN)
 */
export const viPhamQuy_tacCapCuuIcd10 = (xml1, rowsCapCuu) => {
    if (!xml1 || !laNoiTruCapCuuTheoXml1(xml1)) return false;
    const rows = Array.isArray(rowsCapCuu) ? rowsCapCuu : [];
    if (rows.length === 0) return false;

    const laTre = laTreEmTheoXml1(xml1);
    const ds = locDongDanhMucTheoDoTuoi(rows, laTre);
    if (ds.length === 0) return false;

    const hoSoNorm = normalizeTextNoAccent(ghepVanBanLamSangXml1(xml1));

    for (let i = 0; i < ds.length; i += 1) {
        if (dongDanhMucPhuHopHoSo(xml1, ds[i], hoSoNorm)) return false;
    }
    return true;
};

export const CANH_BAO_HC_249_XUAT_TOAN =
    '⛔ [XUẤT TOÁN]: Chỉ định vào điều trị nội trú chưa phù hợp, đề nghị mô tả kỹ lý do vào viện và tình trạng vào viện theo Quyết định số 79/QĐ-BYT của Bộ Y tế ngày 09/01/2026.';
