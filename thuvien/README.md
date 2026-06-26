# Thư viện tra cứu — TĐYT Phương Châu

Danh mục DVKT (QĐ 7603, TT23, QTKT, ICD-10) và Dược thư Phương Châu.

## Chạy nhanh

```bat
run_dvkt.bat
```

Mở trình duyệt:

- DVKT: http://127.0.0.1:5050/
- Dược thư: http://127.0.0.1:5050/duocthu

## Dữ liệu QTKT (PDF)

Thư mục `data/qtkt_source/` không nằm trong git (dung lượng lớn). Sau khi clone:

```bat
python _download_qtkt_sources.py
python _merge_qtkt_mapping.py
```

## Cấu trúc chính

| Thư mục / file | Mô tả |
|----------------|--------|
| `dvkt_app/` | Ứng dụng Flask DVKT |
| `duocthu_data/` | Dữ liệu thuốc, ICD, JCI (tách từ HTML) |
| `chandoan-html/` | Kháng sinh BYT & vi sinh |
| `Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html` | Dược thư (mở trực tiếp hoặc qua Flask) |
