/**
 * Giám định cặp ICD-10 sản khoa không được ghi cùng nhau (Thông tư 06/2026/TT-BYT).
 * Nguồn: CAP_ICD10_SAN_KHOA_KHONG_DI_CUNG (tài liệu Lưu ý mã hóa sản khoa).
 */
import {
  CAP_ICD10_SAN_KHOA_KHONG_DI_CUNG,
  PHIEN_BAN_ICD10_SAN_KHOA_TT06,
} from '../thanh_phan/icd10_san_khoa_tt06_cap_khong';

const ICD_RG = /[A-TV-Z]\d{2}(?:\.[0-9A-Z]{1,2})?/gi;

export const MA_LUAT_ICD10_SAN_KHOA_CAP = 'ICD-TT06-SAN-KHOA-CAP';

export const CANH_BAO_ICD10_SAN_KHOA_TT06_PREFIX =
  '⚠️ Cảnh báo: Mã hóa ICD-10 chưa phù hợp với quy định tại Thông tư số 06/2026/TT-BYT của Bộ Y tế:';

const chuanHoaMaIcd = (raw) => String(raw || '')
  .replace(/[\u2020\u2021\u2022†‡*]/g, '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9.]/g, '')
  .replace(/\./g, '');

const hienThiMa = (key) => {
  const s = String(key || '').trim();
  if (!s) return '';
  if (s.length <= 3) return s;
  if (/^[OZ]\d{4,}$/.test(s)) return `${s.slice(0, 3)}.${s.slice(3)}`;
  return s;
};

/** Tách token ICD từ chuỗi MA_BENH (giữ mã duy nhất theo khóa chuẩn hóa). */
export const trichMaIcdTuChuoiHoSo = (value) => {
  const out = [];
  const seen = new Set();
  const raw = String(value || '');
  const re = new RegExp(ICD_RG.source, 'gi');
  let m;
  while ((m = re.exec(raw)) !== null) {
    const key = chuanHoaMaIcd(m[0]);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push({ raw: m[0], key });
    }
  }
  return out;
};

export const gomMaIcdTrenXml1 = (xml1) => {
  const chinh = trichMaIcdTuChuoiHoSo(xml1?.MA_BENH_CHINH || xml1?.MA_BENH || '');
  const kem = trichMaIcdTuChuoiHoSo(
    xml1?.MA_BENH_KT || xml1?.MA_BENHKEM || xml1?.MA_BENHKT || '',
  );
  const yhct = trichMaIcdTuChuoiHoSo(xml1?.MA_BENH_YHCT || '');
  return [...chinh, ...kem, ...yhct];
};

/** Khớp mã hồ sơ với mã quy tắc (tiền tố 3 ký tự hoặc khớp đầy đủ). */
export const khopMaIcdQuyTac = (maHoSo, maQuyTac) => {
  const a = chuanHoaMaIcd(maHoSo);
  const b = chuanHoaMaIcd(maQuyTac);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  if (b.length >= 3 && a.startsWith(b.slice(0, 3))) return true;
  if (a.length >= 3 && b.startsWith(a.slice(0, 3)) && b.length === 3) return true;
  return false;
};

const timTokenKhop = (tokens, maQuyTac) =>
  tokens.find((t) => khopMaIcdQuyTac(t.key, maQuyTac)) || null;

const dinhDangCanhBao = (noiDungSai, phienBan) => {
  const nd = String(noiDungSai || '').trim();
  const ghiPhu = phienBan ? ` (${phienBan})` : '';
  return `${CANH_BAO_ICD10_SAN_KHOA_TT06_PREFIX} ${nd}${ghiPhu}`;
};

/**
 * @returns {Array} danh sách cảnh báo vi phạm cặp ICD sản khoa
 */
export const giamDinhIcd10SanKhoaTT06 = (hoSo, capKhong = CAP_ICD10_SAN_KHOA_KHONG_DI_CUNG) => {
  const xml1 = hoSo?.xml1 || hoSo?.XML1 || hoSo;
  if (!xml1 || typeof xml1 !== 'object') return [];

  const rules = Array.isArray(capKhong) ? capKhong : [];
  if (rules.length === 0) return [];

  const tokens = gomMaIcdTrenXml1(xml1);
  if (tokens.length < 2) return [];

  const phienBan = String(PHIEN_BAN_ICD10_SAN_KHOA_TT06 || '').trim();
  const ds = [];
  const seenCap = new Set();

  rules.forEach((rule) => {
    const maA = rule?.ma_a;
    const maB = rule?.ma_b;
    if (!maA || !maB) return;

    const tokA = timTokenKhop(tokens, maA);
    const tokB = timTokenKhop(tokens, maB);
    if (!tokA || !tokB) return;
    if (tokA.key === tokB.key) return;

    const capKey = [tokA.key, tokB.key].sort().join('|');
    if (seenCap.has(capKey)) return;
    seenCap.add(capKey);

    const hienA = hienThiMa(tokA.key) || tokA.raw;
    const hienB = hienThiMa(tokB.key) || tokB.raw;
    let noiDung = String(rule?.noi_dung_sai || '').trim();
    if (!noiDung) {
      noiDung = `cặp [${hienA}] và [${hienB}] không được ghi cùng nhau`;
    }

    ds.push({
      phan_he: 'XML1',
      index: -1,
      truong_loi: 'MA_BENH_CHINH',
      canh_bao: dinhDangCanhBao(noiDung, phienBan),
      muc_do: 'Warning',
      ma_luat: MA_LUAT_ICD10_SAN_KHOA_CAP,
      ten_quy_tac: 'ICD-10 sản khoa — cặp mã không được đi cùng (TT 06)',
      dieu_kien: 'BUILT-IN',
      id_quy_tac_cap: String(rule?.id || '').trim() || undefined,
    });
  });

  return ds;
};
