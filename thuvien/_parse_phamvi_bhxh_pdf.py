# -*- coding: utf-8 -*-
"""Parse Phụ lục mã phạm vi hành nghề — Công văn BHXH 2024 (PDF)."""
from __future__ import annotations

import re
from pathlib import Path

from pypdf import PdfReader

DEFAULT_PDF = Path(
    r"c:\Users\admin\Downloads\24_2148_PHULUC_CVHUONGDAN_02.7.24 (1).pdf"
)
VAN_BAN_NGUON = "Công văn BHXH — Phụ lục mã phạm vi hành nghề (07/2024)"

MA_PHAMVI_RE = re.compile(r"(\d{3}(?:\.\d{2})?)\s*(Bổ sung mới)?\s*$")
SECTION_I_RE = re.compile(r"^I\s+Hệ thống", re.I)
SECTION_II_RE = re.compile(r"^II\s+BHXH", re.I)
HEADER_SKIP = re.compile(
    r"^(TT\b|Chức danh|Mã phạm vi|hành nghề|BẢO HIỂM|PHỤ LỤC|Ban hành|Ghi chú:)",
    re.I,
)


def extract_pdf_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n".join(parts)


def _flush_buffer(buf: list[str], section: str, records: list[dict]) -> None:
    if not buf:
        return
    text = " ".join(buf).strip()
    buf.clear()
    m = MA_PHAMVI_RE.search(text)
    if not m:
        return
    ma = m.group(1)
    ghi_chu = (m.group(2) or "").strip()
    left = text[: m.start()].strip()
    stt_m = re.match(r"^(\d+)\s+(.+)$", left)
    if not stt_m:
        return
    records.append(
        {
            "stt": int(stt_m.group(1)),
            "chucDanh": stt_m.group(2).strip(),
            "maPhamVi": ma,
            "nhomCapNhat": section,
            "ghiChu": ghi_chu or ("Bổ sung mới" if section == "II" and ma in _SECTION_II_NEW else ""),
            "vanBanNguon": VAN_BAN_NGUON,
            "heThong": "BHXH chủ động" if section == "I" else "BHXH tỉnh phối hợp",
        }
    )


# Mã chỉ có ở nhóm II với ghi chú bổ sung (theo PDF)
_SECTION_II_NEW = frozenset(
    {
        "132", "133", "134", "303", "304", "305", "306", "307", "308", "309", "310", "311",
        "312", "313", "314", "315", "316", "317", "318", "319", "401", "509", "510", "513",
        "514", "601", "901", "902", "903", "904",
    }
)


def parse_bhxh_catalog(text: str) -> list[dict]:
    records: list[dict] = []
    section = "I"
    buf: list[str] = []

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if HEADER_SKIP.match(line):
            continue
        if SECTION_I_RE.match(line):
            _flush_buffer(buf, section, records)
            section = "I"
            continue
        if SECTION_II_RE.match(line):
            _flush_buffer(buf, section, records)
            section = "II"
            continue

        if re.match(r"^\d+\s+", line):
            _flush_buffer(buf, section, records)
            buf.append(line)
            if MA_PHAMVI_RE.search(line):
                _flush_buffer(buf, section, records)
        elif buf:
            buf.append(line)
            if MA_PHAMVI_RE.search(line):
                _flush_buffer(buf, section, records)

    _flush_buffer(buf, section, records)

    # Sắp xếp lại STT theo nhóm (PDF đánh số lại từ 1 ở nhóm II)
    for i, r in enumerate(records):
        r["_idx"] = i
    return records


def read_bhxh_catalog(pdf_path: Path | None = None) -> list[dict]:
    path = pdf_path or DEFAULT_PDF
    if not path.is_file():
        raise FileNotFoundError(f"Khong tim thay PDF BHXH: {path}")
    return parse_bhxh_catalog(extract_pdf_text(path))


def catalog_columns() -> list[dict]:
    return [
        {"key": "stt", "label": "STT", "type": "number"},
        {"key": "maPhamVi", "label": "Mã PHAMVI_CM (BHXH)", "type": "text"},
        {"key": "chucDanh", "label": "Chức danh chuyên môn", "type": "text"},
        {"key": "nhomCapNhat", "label": "Nhóm cập nhật", "type": "text"},
        {"key": "heThong", "label": "Hệ thống cập nhật", "type": "text"},
        {"key": "ghiChu", "label": "Ghi chú", "type": "text"},
        {"key": "pvhnTagTT32", "label": "Thẻ PVHN TT32 tương ứng", "type": "text"},
        {"key": "soDvktDuocPhep", "label": "Số DVKT QĐ7603 được phép", "type": "number"},
        {"key": "soDvktTT23", "label": "Số DVKT có liên kết TT23", "type": "number"},
        {"key": "soDvktTaiBV", "label": "Số lượt DVKT tại BV (3 cơ sở)", "type": "number"},
        {"key": "maDvktMau", "label": "Mã DVKT mẫu (TT43)", "type": "text"},
        {"key": "maTuongDuongMau", "label": "Mã QĐ7603 mẫu", "type": "text"},
        {"key": "tenDvktMau", "label": "Tên DVKT mẫu", "type": "text"},
        {"key": "vanBanNguon", "label": "Văn bản gốc", "type": "text"},
    ]


if __name__ == "__main__":
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    items = read_bhxh_catalog()
    print(f"Parsed {len(items)} chuc danh BHXH")
    for r in items[:5]:
        print(f"  {r['maPhamVi']:7} {r['chucDanh'][:50]}")
    print("  ...")
    for r in items[-3:]:
        print(f"  {r['maPhamVi']:7} {r['chucDanh'][:50]}")
