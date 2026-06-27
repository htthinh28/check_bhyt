# -*- coding: utf-8 -*-
"""Đọc 13 phụ lục phạm vi hành nghề TT32/2023 từ file .docx."""
from __future__ import annotations

import re
import zipfile
from pathlib import Path

PVHN_DIR = Path(
    r"c:\Users\admin\Documents\Google Drive\BHYT\Danh muc phamvi hanh nghe"
)

LABEL_TT32 = "Thông tư số 32/2023/TT-BYT"

PVHN_FILES: dict[str, dict] = {
    "PVHN_BSYK": {
        "label": "Bác sỹ y khoa",
        "file": "5. Phu luc V - Bac sy y khoa.docx",
        "phuLuc": "PL V",
    },
    "PVHN_BSYHCT": {
        "label": "Bác sỹ YHCT",
        "file": "6. Phu luc VI - Bac sy YHCT.docx",
        "phuLuc": "PL VI",
    },
    "PVHN_BSYHDP": {
        "label": "Bác sỹ y học dự phòng",
        "file": "7. Phu luc VII - Bac sy y hoc du phong.docx",
        "phuLuc": "PL VII",
    },
    "PVHN_BSRHM": {
        "label": "Bác sỹ RHM",
        "file": "8. Phu luc VIII - Bac sy rang ham mat.docx",
        "phuLuc": "PL VIII",
        "name_only": True,
    },
    "PVHN_BSCK": {
        "label": "Bác sỹ chuyên khoa",
        "file": "9. Phu luc IX - Bac sy chuyen khoa.docx",
        "phuLuc": "PL IX",
        "name_only": True,
    },
    "PVHN_YSK": {
        "label": "Y sỹ đa khoa",
        "file": "10. Phu luc X - Y sy da khoa.docx",
        "phuLuc": "PL X",
    },
    "PVHN_YSYHCT": {
        "label": "Y sỹ YHCT",
        "file": "11. Phu luc XI - Y sy YHCT.docx",
        "phuLuc": "PL XI",
    },
    "PVHN_DD": {
        "label": "Điều dưỡng",
        "file": "12. Phu luc XII - Dieu duong.docx",
        "phuLuc": "PL XII",
        "flex": True,
    },
    "PVHN_HS": {
        "label": "Hộ sinh",
        "file": "13. Phu luc XIII - Ho sinh.docx",
        "phuLuc": "PL XIII",
        "flex": True,
    },
    "PVHN_KTY": {
        "label": "Kỹ thuật y",
        "file": "14. Phu luc XIV - Ky thuat y.docx",
        "phuLuc": "PL XIV",
        "name_only": True,
    },
    "PVHN_DDLS": {
        "label": "Dinh dưỡng lâm sàng",
        "file": "15. Phu luc XV - Dinh duong lam sang.docx",
        "phuLuc": "PL XV",
    },
    "PVHN_TLLS": {
        "label": "Tâm lý lâm sàng",
        "file": "16. Phu luc XVI - Tam ly lam sang .docx",
        "phuLuc": "PL XVI",
    },
    "PVHN_CCNV": {
        "label": "Cấp cứu ngoại viện",
        "file": "18. Phu luc XVIII - Cap cuu ngoai vien.docx",
        "phuLuc": "PL XVIII",
    },
}

MA_TT43_RE = re.compile(r"^\d{1,2}\.\d{1,4}$")
STT_RE = re.compile(r"^\d{1,5}\.?$")
SKIP_VALUES = frozenset({"X", "x", "+", "—", "-"})


def extract_paragraphs(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path) as zf:
        xml = zf.read("word/document.xml").decode("utf-8", errors="replace")
    paras = re.findall(r"<w:p[ >].*?</w:p>", xml, re.S)
    rows: list[str] = []
    for para in paras:
        texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", para)
        if texts:
            text = "".join(texts).strip()
            if text:
                rows.append(text)
    return rows


def is_skip(value: str) -> bool:
    return not value or value in SKIP_VALUES


def is_section_header(value: str) -> bool:
    if len(value) < 3:
        return False
    if re.match(r"^(PHỤ LỤC|DANH MỤC|STT|Số TT|TT\b|Mã TT)", value, re.I):
        return True
    if re.match(r"^[IVXLC]+\.\s", value):
        return True
    if re.match(r"^[A-ZĐ]\.\s", value) and value.isupper() is False:
        return True
  # Roman chapter like "I. Chương chung"
    if re.match(r"^[IVXLC]+\.\s", value):
        return True
    if value.isupper() and len(value) > 8 and not MA_TT43_RE.match(value):
        return True
    if re.match(r"^\d+\.\s+[A-ZĐ]", value) and not MA_TT43_RE.match(value.split()[0]):
        return True
    return False


ROMAN_HEADER_RE = re.compile(r"^[IVXLC]+\.\s+")
LETTER_HEADER_RE = re.compile(r"^[A-ZĐ]\.\s+")

# Chuyên khoa chính — Phụ lục IX (BS chuyên khoa)
BSCK_MAJOR_TAGS: dict[str, tuple[str, str]] = {
    "HỒI SỨC CẤP CỨU VÀ CHỐNG ĐỘC": ("PVHN_BSCK_HSCC", "Hồi sức cấp cứu"),
    "NỘI KHOA": ("PVHN_BSCK_NOI", "Nội khoa"),
    "NGOẠI KHOA": ("PVHN_BSCK_NGOAI", "Ngoại khoa"),
    "UNG BƯỚU": ("PVHN_BSCK_UB", "Ung bướu"),
    "ĐIỆN QUANG": ("PVHN_BSCK_DQ", "Điện quang"),
    "GÂY MÊ HỒI SỨC": ("PVHN_BSCK_GMH", "Gây mê hồi sức"),
    "HUYẾT HỌC - TRUYỀN MÁU": ("PVHN_BSCK_HH", "Huyết học - Truyền máu"),
    "PHỤ SẢN": ("PVHN_BSCK_PS", "Phụ sản"),
    "PHẪU THUẬT NỘI SOI": ("PVHN_BSCK_PTNS", "Phẫu thuật nội soi"),
    "TẠO HÌNH - THẨM MỸ": ("PVHN_BSCK_THTM", "Tạo hình - Thẩm mỹ"),
    "Y HỌC HẠT NHÂN": ("PVHN_BSCK_YHHN", "Y học hạt nhân"),
    "TAI - MŨI - HỌNG": ("PVHN_BSCK_TMH", "Tai - Mũi - Họng"),
    "VI SINH - KÝ SINH TRÙNG": ("PVHN_BSCK_VS", "Vi sinh - Ký sinh trùng"),
    "HÓA SINH": ("PVHN_BSCK_HOASINH", "Hóa sinh"),
    "PHỤC HỒI CHỨC NĂNG": ("PVHN_BSCK_PHCN", "Phục hồi chức năng"),
    "NỘI TIẾT": ("PVHN_BSCK_NOITIET", "Nội tiết"),
    "THĂM DÒ CHỨC NĂNG": ("PVHN_BSCK_TDCN", "Thăm dò chức năng"),
    "DA LIỄU": ("PVHN_BSCK_DALIEU", "Da liễu"),
    "GIẢI PHẪU BỆNH VÀ TẾ BÀO HỌC": ("PVHN_BSCK_GPB", "Giải phẫu bệnh"),
    "NỘI SOI CHẨN ĐOÁN, CAN THIỆP": ("PVHN_BSCK_NS", "Nội soi chẩn đoán"),
    "TÂM THẦN": ("PVHN_BSCK_TAMTHAN", "Tâm thần"),
    "VI PHẪU": ("PVHN_BSCK_VIPHAU", "Vi phẫu"),
    "LAO (NGOẠI LAO)": ("PVHN_BSCK_LAO", "Lao"),
}


def _norm_major_key(name: str) -> str:
    import unicodedata

    text = unicodedata.normalize("NFD", name.upper().strip())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text)


def resolve_bsck_major(major_raw: str) -> tuple[str, str, str]:
    """Trả về (tag_id, label_ngắn, label_đầy đủ BS CK)."""
    key = _norm_major_key(major_raw)
    for major_name, (tag_id, short_label) in BSCK_MAJOR_TAGS.items():
        if _norm_major_key(major_name) == key:
            return tag_id, short_label, f"BS CK — {short_label}"
    slug = re.sub(r"[^A-Z0-9]+", "_", key).strip("_")[:20] or "KHAC"
    return f"PVHN_BSCK_{slug}", major_raw.title(), f"BS CK — {major_raw.title()}"


def title_case_vn(name: str) -> str:
    if not name:
        return ""
    return name[0].upper() + name[1:].lower() if len(name) == 1 else name[:1].upper() + name[1:].lower()


def parse_bsck_rows(rows: list[str], meta: dict) -> list[dict]:
    """Parser riêng PL IX — gắn chuyên khoa cụ thể cho BS chuyên khoa."""
    records: list[dict] = []
    current_major_raw = ""
    current_major_tag = ""
    current_major_label = ""
    current_sub = ""
    started = False
    i = 0

    while i < len(rows):
        row = rows[i]
        low = row.lower()
        if not started:
            if "danh mục kỹ thuật" in low:
                started = True
            i += 1
            continue

        if ROMAN_HEADER_RE.match(row) and i + 1 < len(rows) and rows[i + 1] == "TT":
            current_major_raw = re.sub(r"^[IVXLC]+\.\s+", "", row).strip()
            current_major_tag, short_label, full_label = resolve_bsck_major(current_major_raw)
            current_major_label = short_label
            current_sub = ""
            i += 1
            continue

        if LETTER_HEADER_RE.match(row) and len(row) < 100:
            current_sub = re.sub(r"^[A-ZĐ]\.\s+", "", row).strip()
            i += 1
            continue

        if not STT_RE.match(row):
            i += 1
            continue

        stt = row
        i += 1
        while i < len(rows) and is_skip(rows[i]):
            i += 1

        ma_tt43 = ""
        if i < len(rows) and MA_TT43_RE.match(rows[i]):
            ma_tt43 = rows[i]
            i += 1
            while i < len(rows) and is_skip(rows[i]):
                i += 1

        ten = ""
        if i < len(rows):
            nxt = rows[i]
            if (
                not STT_RE.match(nxt)
                and not MA_TT43_RE.match(nxt)
                and not is_skip(nxt)
                and not ROMAN_HEADER_RE.match(nxt)
                and not (LETTER_HEADER_RE.match(nxt) and len(nxt) < 100)
            ):
                ten = clean_ten(nxt)
                i += 1

        if not ten or not current_major_tag:
            continue

        duong_dan = current_major_label
        if current_sub:
            sub_label = title_case_vn(current_sub)
            duong_dan = f"{current_major_label} › {sub_label}"

        _, _, full_label = resolve_bsck_major(current_major_raw)
        records.append(
            {
                "phamVi": current_major_tag,
                "phamViGoc": "PVHN_BSCK",
                "phamViLabel": full_label,
                "phuLuc": meta["phuLuc"],
                "vanBanNguon": LABEL_TT32,
                "stt": stt,
                "maTT43": ma_tt43,
                "tenKyThuat": ten,
                "chuyenKhoaChinh": current_major_raw,
                "chuyenKhoaLabel": current_major_label,
                "chuyenKhoaPhu": current_sub,
                "duongDanChuyenKhoa": duong_dan,
            }
        )

    return records


def clean_ten(value: str) -> str:
    return value.rstrip("+").rstrip("*").strip()


def parse_rows(rows: list[str], pham_vi: str, meta: dict) -> list[dict]:
    records: list[dict] = []
    section = ""
    i = 0
    started = False

    while i < len(rows):
        row = rows[i]
        low = row.lower()
        if not started:
            if "danh mục kỹ thuật" in low or "danh muc ky thuat" in low:
                started = True
            i += 1
            continue

        if is_section_header(row) and not STT_RE.match(row) and not MA_TT43_RE.match(row):
            section = row
            i += 1
            continue

        if not STT_RE.match(row):
            i += 1
            continue

        stt = row
        i += 1
        while i < len(rows) and is_skip(rows[i]):
            i += 1

        ma_tt43 = ""
        ten = ""

        if i < len(rows) and MA_TT43_RE.match(rows[i]):
            ma_tt43 = rows[i]
            i += 1
            while i < len(rows) and is_skip(rows[i]):
                i += 1

        if i < len(rows):
            nxt = rows[i]
            if not STT_RE.match(nxt) and not MA_TT43_RE.match(nxt) and not is_skip(nxt):
                if not is_section_header(nxt) or meta.get("flex"):
                    ten = clean_ten(nxt)
                    i += 1

        if not ten:
            continue

        records.append(
            {
                "phamVi": pham_vi,
                "phamViLabel": meta["label"],
                "phuLuc": meta["phuLuc"],
                "vanBanNguon": LABEL_TT32,
                "stt": stt,
                "maTT43": ma_tt43,
                "tenKyThuat": ten,
                "nhomHe": section,
            }
        )

    return records


def read_all_phamvi(base_dir: Path | None = None) -> tuple[list[dict], dict[str, int]]:
    base = base_dir or PVHN_DIR
    all_records: list[dict] = []
    stats: dict[str, int] = {}

    for pham_vi, meta in PVHN_FILES.items():
        path = base / meta["file"]
        if not path.is_file():
            raise FileNotFoundError(f"Khong tim thay: {path}")
        rows = extract_paragraphs(path)
        if pham_vi == "PVHN_BSCK":
            items = parse_bsck_rows(rows, meta)
        else:
            items = parse_rows(rows, pham_vi, meta)
        stats[pham_vi] = len(items)
        all_records.extend(items)

    return all_records, stats


if __name__ == "__main__":
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    records, stats = read_all_phamvi()
    print(f"Tong so muc PVHN: {len(records)}")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    with_ma = sum(1 for r in records if r["maTT43"])
    bsck = [r for r in records if r.get("phamViGoc") == "PVHN_BSCK" or str(r.get("phamVi", "")).startswith("PVHN_BSCK_")]
    print(f"Co ma TT43: {with_ma} | Chi ten: {len(records) - with_ma}")
    if bsck:
        from collections import Counter
        print("BSCK theo chuyen khoa:")
        for k, v in Counter(r.get("chuyenKhoaLabel", "?") for r in bsck).most_common(12):
            print(f"  {v:5} {k}")
