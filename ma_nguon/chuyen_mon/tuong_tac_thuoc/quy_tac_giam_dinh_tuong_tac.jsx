/**
 * Quy tắc giám định tương tác thuốc — đồng bộ với động cơ trong tien_ich/dong_co_giam_dinh.jsx
 * (giamDinhDanhMucNoiBo → XML2, MAP_TUONG_TAC_CAP, danhGiaDongThoiThuocABtrenXML2).
 */

/** Danh sách hiển thị trong module Chuyên môn → Tương tác thuốc */
export const NOI_DUNG_QUY_TAC_HIEN_THI = [
  {
    key: 'phan_vi',
    tieuDe: 'Phạm vi hồ sơ',
    dong: [
      'Một lượt KCB (cùng MA_LK, cùng tập XML2 trong hồ sơ đang giám định): ngoại trú, nội trú hoặc nội trú ban ngày đều dùng chung logic (mô tả loại đợt theo MA_LOAI_KCB / XML1).',
      'Chỉ xét các dòng XML2 thuốc mà động cơ xác định là BHYT thanh toán; các dòng bị loại khỏi nhánh BHYT (không thanh toán theo quy ước nội bộ) không vào tập so khớp tương tác.',
    ],
  },
  {
    key: 'danh_muc',
    tieuDe: 'Danh mục nội bộ (bảng này)',
    dong: [
      'Mỗi dòng là một cặp mã thuốc MA_THUOC_A và MA_THUOC_B (chuẩn hóa không phân biệt hoa thường khi so khớp).',
      'Chỉ các dòng TRANG_THAI = ON mới được nạp vào động cơ (dòng OFF không sinh cảnh báo).',
      'Hai mã phải đủ trong «Nội dung» hoặc hai cột mã — cặp thiếu một mã không tham gia so khớp tự động.',
    ],
  },
  {
    key: 'dong_thoi',
    tieuDe: 'Điều kiện «bác sĩ kê đồng thời A và B» trên XML2',
    dong: [
      'Trên XML2 phải xuất hiện cả hai mã thuốc (ít nhất một dòng BHYT cho mỗi mã) trong cùng đợt điều trị đang xét.',
      'Ưu tiên: có ít nhất một ngày trùng giữa hai thuốc — ngày lấy 8 ký tự YYYYMMDD từ NGAY_YL, nếu trống thì từ NGAY_TH_YL (theo QĐ 130 / 3176).',
      'Nếu cả hai thuốc đều có mốc ngày nhưng không có ngày trùng → không ghi nhận tương tác đồng thời (coi như kê khác ngày).',
      'Nếu thiếu mốc ngày trên một hoặc hai thuốc → ghi nhận theo cả đợt (cùng tập dòng XML2 BHYT trong hồ sơ), có ghi chú trong cảnh báo.',
    ],
  },
  {
    key: 'ket_qua',
    tieuDe: 'Kết quả giám định',
    dong: [
      'Mức độ: Warning (cảnh báo chuyên môn / dược lâm sàng).',
      'Mã quy tắc: lấy MA_TUONG_TAC trong bảng; nếu thiếu dùng CLN-TT-001.',
      'Tên quy tắc hiển thị: «Tương tác thuốc (XML2 — cùng đợt, đồng thời A và B)».',
      'Căn cứ pháp lý gắn vào bản ghi cảnh báo: khung chuyên môn KCB trong động cơ (Luật KCB, NĐ 96/2023, TT 32/2023, NĐ 188, QĐ 3618/BHXH, TT 12/2026 Điều 10). Nội dung hiển thị ưu tiên cột «Cảnh báo hệ thống», sau «Nội dung tương tác», rồi mới câu mặc định theo cặp mã.',
    ],
  },
];
