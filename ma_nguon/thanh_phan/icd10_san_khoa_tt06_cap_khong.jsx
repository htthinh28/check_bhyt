/**
 * Seed cặp ICD-10 sản khoa TT06 không được ghi cùng nhau.
 * Nguồn: Luu_y_ma_hoa_san_khoa_TT06_2026_ban_gop_ICD10 — tổng hợp cặp ICD-10 sản khoa không được ghi cùng (Thông tư 06/2026/TT-BYT, Chương 15 ICD-10)
 * Sinh bởi: scripts/build_icd10_san_khoa_tt06_seed.js — không sửa tay.
 */

export const PHIEN_BAN_ICD10_SAN_KHOA_TT06 = '2026-07-02-2026-06-30-san-khoa-tt06-ban-gop';

export const NGUON_ICD10_SAN_KHOA_TT06 = "Luu_y_ma_hoa_san_khoa_TT06_2026_ban_gop_ICD10 — tổng hợp cặp ICD-10 sản khoa không được ghi cùng (Thông tư 06/2026/TT-BYT, Chương 15 ICD-10)";

export const CAP_ICD10_SAN_KHOA_KHONG_DI_CUNG = [
  {
    "id": "SK-001",
    "ma_a": "O47",
    "ma_b": "O80",
    "noi_dung_sai": "cặp [O47] (chuyển dạ giả) và [O80] (đẻ thường) không được ghi cùng nhau"
  },
  {
    "id": "SK-002",
    "ma_a": "O47",
    "ma_b": "O81",
    "noi_dung_sai": "cặp [O47] (chuyển dạ giả) và [O81] (đẻ có hỗ trợ) không được ghi cùng nhau"
  },
  {
    "id": "SK-003",
    "ma_a": "O47",
    "ma_b": "O82",
    "noi_dung_sai": "cặp [O47] (chuyển dạ giả) và [O82] (mổ đẻ) không được ghi cùng nhau"
  },
  {
    "id": "SK-004",
    "ma_a": "O47",
    "ma_b": "O83",
    "noi_dung_sai": "cặp [O47] (chuyển dạ giả) và [O83] (đẻ khác) không được ghi cùng nhau"
  },
  {
    "id": "SK-005",
    "ma_a": "O47",
    "ma_b": "O84",
    "noi_dung_sai": "cặp [O47] (chuyển dạ giả) và [O84] (đẻ đa thai) không được ghi cùng nhau"
  },
  {
    "id": "SK-010",
    "ma_a": "O80",
    "ma_b": "O81",
    "noi_dung_sai": "cặp [O80] (đẻ thường) và [O81] (đẻ có hỗ trợ) không được ghi cùng nhau"
  },
  {
    "id": "SK-011",
    "ma_a": "O80",
    "ma_b": "O82",
    "noi_dung_sai": "cặp [O80] (đẻ thường) và [O82] (mổ đẻ) không được ghi cùng nhau"
  },
  {
    "id": "SK-012",
    "ma_a": "O80",
    "ma_b": "O83",
    "noi_dung_sai": "cặp [O80] (đẻ thường) và [O83] (đẻ khác) không được ghi cùng nhau"
  },
  {
    "id": "SK-013",
    "ma_a": "O80",
    "ma_b": "O84",
    "noi_dung_sai": "cặp [O80] (đẻ thường) và [O84] (đẻ đa thai) không được ghi cùng nhau"
  },
  {
    "id": "SK-014",
    "ma_a": "O81",
    "ma_b": "O82",
    "noi_dung_sai": "cặp [O81] (đẻ có hỗ trợ) và [O82] (mổ đẻ) không được ghi cùng nhau"
  },
  {
    "id": "SK-015",
    "ma_a": "O81",
    "ma_b": "O83",
    "noi_dung_sai": "cặp [O81] (đẻ có hỗ trợ) và [O83] (đẻ khác) không được ghi cùng nhau"
  },
  {
    "id": "SK-016",
    "ma_a": "O81",
    "ma_b": "O84",
    "noi_dung_sai": "cặp [O81] (đẻ có hỗ trợ) và [O84] (đẻ đa thai) không được ghi cùng nhau"
  },
  {
    "id": "SK-017",
    "ma_a": "O82",
    "ma_b": "O83",
    "noi_dung_sai": "cặp [O82] (mổ đẻ) và [O83] (đẻ khác) không được ghi cùng nhau"
  },
  {
    "id": "SK-018",
    "ma_a": "O82",
    "ma_b": "O84",
    "noi_dung_sai": "cặp [O82] (mổ đẻ) và [O84] (đẻ đa thai) không được ghi cùng nhau"
  },
  {
    "id": "SK-019",
    "ma_a": "O83",
    "ma_b": "O84",
    "noi_dung_sai": "cặp [O83] (đẻ khác) và [O84] (đẻ đa thai) không được ghi cùng nhau"
  },
  {
    "id": "SK-020",
    "ma_a": "Z34",
    "ma_b": "O80",
    "noi_dung_sai": "cặp [Z34] (theo dõi thai kỳ bình thường) và [O80] (đẻ thường) không được ghi cùng nhau"
  },
  {
    "id": "SK-021",
    "ma_a": "Z34",
    "ma_b": "O81",
    "noi_dung_sai": "cặp [Z34] (theo dõi thai kỳ bình thường) và [O81] (đẻ có hỗ trợ) không được ghi cùng nhau"
  },
  {
    "id": "SK-022",
    "ma_a": "Z34",
    "ma_b": "O82",
    "noi_dung_sai": "cặp [Z34] (theo dõi thai kỳ bình thường) và [O82] (mổ đẻ) không được ghi cùng nhau"
  },
  {
    "id": "SK-023",
    "ma_a": "Z34",
    "ma_b": "O83",
    "noi_dung_sai": "cặp [Z34] (theo dõi thai kỳ bình thường) và [O83] (đẻ khác) không được ghi cùng nhau"
  },
  {
    "id": "SK-024",
    "ma_a": "Z34",
    "ma_b": "O84",
    "noi_dung_sai": "cặp [Z34] (theo dõi thai kỳ bình thường) và [O84] (đẻ đa thai) không được ghi cùng nhau"
  },
  {
    "id": "SK-030",
    "ma_a": "O60",
    "ma_b": "O47",
    "noi_dung_sai": "cặp [O60] (chuyển dạ non) và [O47] (chuyển dạ giả) không được ghi cùng nhau"
  },
  {
    "id": "SK-031",
    "ma_a": "O80",
    "ma_b": "O60",
    "noi_dung_sai": "cặp [O80] (đẻ thường không biến chứng) và [O60] (chuyển dạ non) không được ghi cùng nhau"
  },
  {
    "id": "SK-032",
    "ma_a": "O80",
    "ma_b": "O30",
    "noi_dung_sai": "cặp [O80] (đẻ thường) và [O30] (đa thai) không được ghi cùng nhau — dùng mã đẻ phù hợp (vd. O84)"
  },
  {
    "id": "SK-033",
    "ma_a": "O80",
    "ma_b": "O42",
    "noi_dung_sai": "cặp [O80] (đẻ thường không biến chứng) và [O42] (vỡ ối) không được ghi cùng nhau"
  },
  {
    "id": "SK-034",
    "ma_a": "O80",
    "ma_b": "O44",
    "noi_dung_sai": "cặp [O80] (đẻ thường không biến chứng) và [O44] (nhau tiền đạo) không được ghi cùng nhau"
  },
  {
    "id": "SK-035",
    "ma_a": "O80",
    "ma_b": "O70",
    "noi_dung_sai": "cặp [O80] (đẻ thường không biến chứng) và [O70] (rách tầng sinh môn) không được ghi cùng nhau"
  },
  {
    "id": "SK-036",
    "ma_a": "O82",
    "ma_b": "O30",
    "noi_dung_sai": "cặp [O82] (mổ đẻ) và [O30] (đa thai) không được ghi cùng nhau — dùng mã đẻ phù hợp (vd. O84)"
  },
  {
    "id": "SK-037",
    "ma_a": "O82",
    "ma_b": "O44",
    "noi_dung_sai": "cặp [O82] (mổ đẻ) và [O44] (nhau tiền đạo) không được ghi cùng nhau — dùng mã O44.1/O44.2… kèm mã đẻ tương ứng"
  },
  {
    "id": "SK-040",
    "ma_a": "O94",
    "ma_b": "O80",
    "noi_dung_sai": "cặp [O94] (di chứng thai sản) và [O80] (đẻ thường cấp tính) không được ghi cùng nhau"
  },
  {
    "id": "SK-041",
    "ma_a": "O94",
    "ma_b": "O82",
    "noi_dung_sai": "cặp [O94] (di chứng thai sản) và [O82] (mổ đẻ cấp tính) không được ghi cùng nhau"
  },
  {
    "id": "SK-042",
    "ma_a": "O94",
    "ma_b": "O30",
    "noi_dung_sai": "cặp [O94] (di chứng thai sản) và [O30] (đa thai cấp tính) không được ghi cùng nhau"
  },
  {
    "id": "SK-043",
    "ma_a": "O94",
    "ma_b": "O44",
    "noi_dung_sai": "cặp [O94] (di chứng thai sản) và [O44] (nhau tiền đạo cấp tính) không được ghi cùng nhau"
  },
  {
    "id": "SK-050",
    "ma_a": "O00",
    "ma_b": "O80",
    "noi_dung_sai": "cặp [O00] (thai ngoài tử cung) và [O80] (đẻ thường) không được ghi cùng nhau"
  },
  {
    "id": "SK-051",
    "ma_a": "O03",
    "ma_b": "O80",
    "noi_dung_sai": "cặp [O03] (sẩy thai) và [O80] (đẻ thường) không được ghi cùng nhau"
  },
  {
    "id": "SK-052",
    "ma_a": "O04",
    "ma_b": "O80",
    "noi_dung_sai": "cặp [O04] (nạo hút thai) và [O80] (đẻ thường) không được ghi cùng nhau"
  },
  {
    "id": "SK-053",
    "ma_a": "Z33",
    "ma_b": "O80",
    "noi_dung_sai": "cặp [Z33] (mang thai) và [O80] (đẻ thường) không được ghi cùng nhau trên cùng hồ sơ đẻ"
  },
  {
    "id": "SK-054",
    "ma_a": "Z33",
    "ma_b": "O82",
    "noi_dung_sai": "cặp [Z33] (mang thai) và [O82] (mổ đẻ) không được ghi cùng nhau trên cùng hồ sơ đẻ"
  }
];
