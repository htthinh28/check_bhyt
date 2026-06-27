# Thư viện tra cứu — TĐYT Phương Châu

Danh mục DVKT (QĐ 7603, TT23, QTKT, ICD-10) và Dược thư Phương Châu.

Repo này được **nhúng trong** [`check_bhyt`](https://github.com/htthinh28/check_bhyt) tại thư mục `thuvien/`.

## Chạy từ repo CDSS (khuyến nghị)

```bash
npm run thuvien:install   # một lần
npm run thuvien:start     # Flask cổng 5050
npm run qa:thuvien        # smoke test
```

Trong app CDSS: **Tổng quan → 📖 TRA CỨU DVKT & DƯỢC THƯ** hoặc **📚 Thư viện → DVKT & Dược thư PC**.

Cấu hình URL (điện thoại thật / LAN): `app.json` → `expo.extra.thuvienTraCuu.baseUrl` (ví dụ `http://192.168.1.10:5050`).

Biến môi trường khi chạy Flask:

- `CDSS_THUVIEN_HOST` — mặc định `127.0.0.1`; đặt `0.0.0.0` để lắng nghe LAN
- `CDSS_THUVIEN_PORT` — mặc định `5050`

## Chạy nhanh (Windows)

```bat
run_dvkt.bat
```

Mở trình duyệt:

- DVKT: http://127.0.0.1:5050/
- Dược thư: http://127.0.0.1:5050/duocthu

## Dữ liệu QTKT (PDF)

Thư mục `data/qtkt_source/` không nằm trong git (dung lượng lớn). Sau khi clone:

```bash
cd thuvien
python3 _download_qtkt_sources.py
python3 _merge_qtkt_mapping.py
npm run qtkt:refresh          # từ repo gốc: chuẩn hóa + ICD + TT23/QĐ7603 (không cần PDF)
```

Web/Vercel: `npm run thuvien:prepare` copy `quytrinhkt` vào `/thuvien/api/data/`.

## Cấu trúc chính

| Thư mục / file | Mô tả |
|----------------|--------|
| `dvkt_app/` | Ứng dụng Flask DVKT |
| `duocthu_data/` | Dữ liệu thuốc, ICD, JCI (tách từ HTML) |
| `chandoan-html/` | Kháng sinh BYT & vi sinh |
| `Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html` | Dược thư (mở trực tiếp hoặc qua Flask) |
