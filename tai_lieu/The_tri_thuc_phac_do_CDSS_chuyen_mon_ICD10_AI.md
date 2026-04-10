# THẺ TRI THỨC: PHÁC ĐỒ CDSS CHUYÊN MÔN ↔ MÃ ICD-10 (HUẤN LUYỆN AI)

Phiên bản dữ liệu: đồng bộ `du_lieu_phac_do_cdss_guidelines.seed.json` (nguồn gộp file mẫu phác đồ + kho cũ, **một mã ICD một dòng**).  
Ngày cập nhật thẻ tri thức: 10/04/2026  

**Phạm vi:** hướng dẫn AI và giám định viên dùng **kho phác đồ nội bộ** (mục tiêu điều trị, điều trị đặc hiệu/triệu chứng, dự phòng, tái khám…) gắn với **mã ICD-10** trên hồ sơ. **Không** thay thế Phụ lục thanh toán DVKT (17/VBHN-BYT), danh mục thuốc BYT, hay hợp đồng KCB.

---

## 1. Vai trò trong CDSS BHYT

| Khía cạnh | Nội dung |
|-----------|----------|
| **Mục đích** | Gợi ý **chuyên môn lâm sàng** (phác đồ BV) khi tra cứu theo ICD: đối chiếu mục tiêu điều trị, theo dõi, dự phòng với thuốc/DVKT thực tế trên XML — phù hợp tinh thần **Điều 15 Luật BHYT** (chất lượng KCB), ở lớp **hỗ trợ quyết định**, không quyết định thay bác sĩ. |
| **Khác gì DM1/DM2 DVKT** | [The_tri_thuc_Danh_muc_1_DVKT_dieu_kien_ty_le_gia_VBHN17_AI.md](./The_tri_thuc_Danh_muc_1_DVKT_dieu_kien_ty_le_gia_VBHN17_AI.md) và DM2 xử lý **điều kiện thanh toán BHYT theo mã DVKT**. Phác đồ CDSS xử lý **nội dung chăm sóc theo bệnh (ICD)** — hai lớp có thể cùng một hồ sơ nhưng **câu hỏi khác nhau**. |
| **Nơi lưu trong app** | Bảng module **Chuyên môn → Phác đồ**; lưu cục bộ `CDSS_DATA_PHAC_DO_V3` / `CDSS_COLS_PHAC_DO_V3`. Seed mặc định nằm trong mã nguồn: `ma_nguon/chuyen_mon/phac_do_benh_vien/du_lieu_phac_do_cdss_guidelines.seed.json`. |

---

## 2. Ánh xạ ICD-10: hồ sơ XML ↔ bảng phác đồ

- **Trường trên XML1:** `MA_BENH_CHINH`, `MA_BENH_KT`, `MA_BENHKEM` — engine gom **token ICD** (regex chữ + số), **khử trùng** (cùng mã sau khi bỏ dấu chấm chỉ giữ một), rồi so với cột **`MÃ ICD-10`** trong bảng phác đồ.
- **Chuẩn hóa khớp kho:** `chuanHoaMaIcdPhacDoCdss`: bỏ ký tự `.`, `trim`, `UPPER` (cùng quy tắc trong `phac_do_cdss_columns.js` và `dong_co_giam_dinh.jsx`).
- **Lưu ý dữ liệu bảng:** một số ô `MÃ ICD-10` có thể ghi **dải mã** hoặc ký hiệu không phải một mã XML đơn (ví dụ mô tả khoảng). **So khớp tự động trong engine** dựa trên **mã đơn** lấy từ XML; khi ô bảng là dải/ký tự đặc biệt, AI và người cần **đọc diễn giải lâm sàng** trong dòng đó, không suy **đã khớp máy** nếu map không có key.

---

## 3. Cột nội dung (hướng dẫn suy luận cho AI)

Cột hiển thị chuẩn (tiếng Việt) tương ứng khóa import tiếng Anh trong `phac_do_cdss_columns.js`:

| Cột (VN) | Gợi ý cách dùng khi phản biện hồ sơ |
|----------|-------------------------------------|
| **MÃ ICD-10** | Khóa tra cứu; luôn đối chiếu với tập ICD đã gom từ XML1. |
| **TÊN BỆNH (CHẨN ĐOÁN)** | Đối chiếu mức độ nhất quán với văn bản chẩn đoán trên hồ sơ (không thay thế ICD chính thức). |
| **MỨC ĐỘ / THỂ BỆNH** | So với mức độ diễn tả trong XML5/XML6 nếu có. |
| **MỤC TIÊU ĐIỀU TRỊ** | Lớp “cần đạt gì” — so với chỉ định thuốc/DVKT có **cùng hướng** hay chỉ xử trí triệu chứng. |
| **TIÊN LƯỢNG** | Tham chiếu giải thích rủi ro/lợi ích, không dùng làm căn cứ từ chối thanh toán đơn thuần. |
| **ĐIỀU TRỊ ĐẶC HIỆU / TRIỆU CHỨNG** | So với XML2 (thuốc), XML3 (DVKT) — gợi ý **đối chiếu phác đồ** với thực tế kê đơn. |
| **CAN THIỆP / THỦ THUẬT-PT** | Liên hệ XML3/PTTT nếu có. |
| **LỐI SỐNG / HOẠT ĐỘNG**, **DINH DƯỠNG** | Giáo dục bệnh nhân; kiểm chứng khi có nội dung tương ứng trong hồ sơ. |
| **DỰ PHÒNG** (sơ cấp / biến chứng / di chứng) | Gợi ý kiểm soát chất lượng và tính đầy đủ tư vấn. |
| **THỜI GIAN TÁI KHÁM / THEO DÕI** | So `NGAY_HEN_TAI_KHAM` (XML1/XML6) nếu có. |
| **THEO DÕI LÂM SÀNG / CẬN LÂM SÀNG** | Gợi ý xét nghiệm/chỉ định có phù hợp tình trạng. |
| **GHI CHÚ ĐẶC BIỆT** | Tình huống đặc thù (thai kỳ, chống chỉ định…). |

---

## 4. Quy tắc giám định dữ liệu (LUẬT DỮ LIỆU — seed)

| Mã luật | Mặc định | Ý nghĩa |
|---------|----------|---------|
| **CDSS_CM_01** | ON (Info) | Có kho phác đồ và **ít nhất một** mã ICD (chính/kèm, đã khử trùng) **khớp** bảng — nhắc đối chiếu chuyên môn với thuốc/DVKT. |
| **CDSS_CM_02** | OFF (Warning) | Có kho nhưng **không mã ICD nào** trên XML1 khớp — gợi ý bổ sung dữ liệu phác đồ (dễ ồn nếu bật hàng loạt). |

**Hàm trong engine (No-Code):** `CO_KHO_TRI_THUC_PHAC_DO()`, `CO_PHAC_DO_CDSS_CHO_ICD(mã)`, `CO_PHAC_DO_CDSS_CHO_BAT_CU_ICD_TREN_XML1(XML1)`, `KHONG_CO_PHAC_DO_CDSS_CHO_MA_ICD_GOP_TREN_XML1(XML1)`.

**Meta:** `MAP_PHAC_DO_CDSS` chứa các **mã ICD đã chuẩn hóa** có trong kho; `SO_DONG_PHAC_DO_CDSS` = **số mã ICD duy nhất** (không tính trùng dòng).

---

## 5. Phân bổ mã ICD trong kho (theo chữ cái đầu — thống kê)

| Nhóm (ký tự đầu sau chuẩn hóa) | Số dòng gần đúng |
|--------------------------------|------------------|
| R | 24 |
| I | 23 |
| F | 23 |
| M | 19 |
| J | 14 |
| A | 13 |
| B | 12 |
| K | 9 |
| E | 8 |
| N | 8 |
| G | 7 |
| Các nhóm còn lại (H, Z, …) | từ 1–5 mỗi nhóm |

(Số liệu theo seed tại thời điểm ghép bản; khi import Excel mới có thể thay đổi — chạy lại thống kê trên file seed nếu cần chính xác tuyệt đối.)

---

## 6. Prompt mẫu (huấn luyện AI)

- *“Với `MA_BENH_CHINH` / kèm trên XML1 = …, tra phác đồ CDSS nội bộ: nêu **mục tiêu điều trị** và **hai hạng mục** cần đối chiếu với XML2/XML3 (không kết luận thanh toán).”*
- *“Phân biệt **thiếu mã trong kho phác đồ** (CDSS_CM_02) với **sai chỉ định thanh toán theo DM1** (VBHN 17) — từng lớp cần trường XML nào?”*

---

## 7. Liên kết

- Tóm tắt HTML (đồng bộ ý): [The_tri_thuc_phac_do_CDSS_chuyen_mon_giam_dinh_BHYT.html](./The_tri_thuc_phac_do_CDSS_chuyen_mon_giam_dinh_BHYT.html) (sau `npm run tai_lieu:prepare` nằm trong `public/tai_lieu/`).
- DVKT Danh mục 1 (tỷ lệ/giá): [The_tri_thuc_Danh_muc_1_DVKT_dieu_kien_ty_le_gia_VBHN17_AI.md](./The_tri_thuc_Danh_muc_1_DVKT_dieu_kien_ty_le_gia_VBHN17_AI.md).
- Đặc tả hệ thống: [Dac_ta_he_thong_CDSS_BHYT_20260405.md](./Dac_ta_he_thong_CDSS_BHYT_20260405.md).

---

## Phụ lục — Danh sách khóa `MÃ ICD-10` đã chuẩn hóa trong seed (tham chiếu nhanh)

> Dùng để tra cứu từ khóa; nội dung lâm sàng đầy đủ nằm trong từng dòng JSON/ứng dụng. Một số mục là ký hiệu dải/ghi chú từ nguồn bảng — khi so với XML chỉ các **mã đơn** trùng token mới khớp engine tự động.

```
A00, A01, A04, A05, A08, A09, A15 - A16, A36, A37, A39, A852, A90-A91, A91, B01, B05, B06, B08, B084, B16, B171 - B182, B18, B181, B20 - B24, B26, B88, D50, E039, E04, E05, E050, E101, E11, E271, E78, F063, F313, F320, F321, F322, F323, F332, F341, F432, F513, F514, F515, F520, F521, F522, F523, F524, F525, F526, F527, F528, F530, F65X, G2581 (G4761), G470 (F510), G471 (F511), G472, G473, G474, G4752, H60, H66, H81, I050, I099, I10, I209, I210, I25, I269, I309, I330, I340, I350, I409, I420, I421, I471, I472, I480, I50, I502, I503, I702, I802, I87, J00, J01, J02, J03, J04, J06, J18, J189, J20, J21, J30, J44, J449, J45, K21, K25, K279, K29, K30, K52, K59, K64, K74, L02, M100, M17, M329, M339, M340, M350, M353, M45, M47, M478, M512, M54, M653, M654, M722, M750, M797, M810, M86, N189, N30, N39, N64, N72, N76, N92, N93, O20, R002, R04, R040, R05, R060, R07, R074, R10, R109, R11, R13, R197, R252, R31, R32, R42, R470, R509, R51, R53, R55, R59, R609, R634, T78, U071, Z32, Z34, Z35, Z39, Z98
```

*Tài liệu này cố định **tư duy tri thức chuyên môn phác đồ CDSS theo ICD-10** trong repo; mọi kết luận pháp lý thanh toán vẫn căn cứ văn bản BYT/BHXH và hợp đồng KCB.*
