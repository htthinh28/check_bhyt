# -*- coding: utf-8 -*-
"""Rà soát và sửa tên quy trình kỹ thuật — lấy từ Mục lục/tiêu đề bài viết."""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

from _dvkt_data_io import DEFAULT_DATA_DIR, load_dataset, save_dataset
from _merge_qtkt_mapping import QTKT_COLUMNS, enrich_qtkt_rows, load_icd_catalog, update_manifest
from _parse_qtkt_pdf import discover_qtkt_files, parse_qtkt_pdf

BASE = Path(__file__).resolve().parent
SOURCE = BASE / "data" / "qtkt_source"

BAD_TITLE_RE = re.compile(
    r"(quang tăng sáng quang|^\d+\.\d+\s|^\d{4,5}\s|"
    r"^dưới\)|^dưới x-quang|^quang tăng|^x-quang tăng sáng tăng|"
    r"khoa chẩn đoán hình ảnh|bệnh viện hữu nghị|ts\.\s*nguyễn)",
    re.I,
)

# Ánh xạ tên file dataset (thiếu PDF local) → PDF nguồn tham chiếu trên Drive
FILE_ALIAS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(r"dien\s*quang|điện\s*quang", re.I),
        "2025. CHẨN ĐOÁN HÌNH ẢNH THUỘC CHƯƠNG ĐIỆN QUANG 2776.pdf",
    ),
    (
        re.compile(r"chan\s*doan\s*hinh\s*anh|chẩn\s*đoán\s*hình\s*ảnh", re.I),
        "2025. CHẨN ĐOÁN HÌNH ẢNH THUỘC CHƯƠNG ĐIỆN QUANG.pdf",
    ),
]


def _norm(s: str) -> str:
    text = unicodedata.normalize("NFD", (s or "").lower())
    text = text.replace("đ", "d").replace("Đ", "d")
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def is_bad_title(title: str) -> bool:
    t = (title or "").strip()
    if len(t) < 10:
        return True
    if BAD_TITLE_RE.search(t):
        return True
    if t[0].islower():
        return True
    letters = [c for c in t if c.isalpha()]
    if letters:
        upper = sum(1 for c in letters if c.isupper()) / len(letters)
        if upper >= 0.55 and len(t) >= 14:
            return False
    if t[0].isupper() and len(t) >= 18:
        return False
    return True


def _resolve_alias_path(name: str, available: dict[str, Path]) -> Path | None:
    if name in available:
        return available[name]
    for pat, target in FILE_ALIAS:
        if pat.search(name) and target in available:
            return available[target]
    return None


def build_title_index(
    source_dir: Path | None = None,
    *,
    only_reference: bool = False,
) -> tuple[dict[tuple[str, str], dict], dict[str, dict[str, dict]]]:
    src = source_dir or SOURCE
    by_key: dict[tuple[str, str], dict] = {}
    by_ma: dict[str, dict] = {}
    by_file: dict[str, list[dict]] = {}
    available = {p.name: p for p in discover_qtkt_files(src)}
    if only_reference:
        names = {target for _, target in FILE_ALIAS if target in available}
        paths = [available[n] for n in sorted(names)]
    else:
        paths = sorted(available.values())
    for path in paths:
        print(f"  Parse: {path.name}", flush=True)
        rows = parse_qtkt_pdf(path)
        by_file[path.name] = rows
        for row in rows:
            key = (str(row.get("quyTrinhSo", "")).strip(), str(row.get("maKyThuat", "")).strip())
            ma = str(row.get("maKyThuat", "")).strip()
            if row.get("tenKyThuat") and not is_bad_title(row["tenKyThuat"]):
                by_key[key] = row
                if ma:
                    by_ma[ma] = row
    return by_key, by_ma, by_file


def _apply_ref(row: dict, ref: dict) -> None:
    row["tenKyThuat"] = ref["tenKyThuat"]
    for fld in ("chiDinh", "chongChiDinh", "thoiGianThucHien", "nhanSuThucHien"):
        if ref.get(fld):
            row[fld] = ref[fld]


def patch_rows(
    rows: list[dict],
    title_index: dict[tuple[str, str], dict],
    title_by_ma: dict[str, dict],
    available: dict[str, Path],
) -> tuple[list[dict], int]:
    fixed = 0
    for row in rows:
        title = row.get("tenKyThuat", "")
        if not is_bad_title(title):
            continue
        src = row.get("tenFileNguon", "")
        use_alias = any(pat.search(src) for pat, _ in FILE_ALIAS) or _resolve_alias_path(src, available) is not None
        key = (str(row.get("quyTrinhSo", "")).strip(), str(row.get("maKyThuat", "")).strip())
        ma = str(row.get("maKyThuat", "")).strip()
        ref = title_index.get(key)
        if not ref and use_alias and ma:
            ref = title_by_ma.get(ma)
        if ref and ref.get("tenKyThuat"):
            _apply_ref(row, ref)
            fixed += 1
    return rows, fixed


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    print("=== Rà soát tiêu đề QTKT ===", flush=True)
    pack = load_dataset("quytrinhkt", DEFAULT_DATA_DIR)
    rows = list(pack["rows"]) if pack else []
    if not rows:
        print("Không có dữ liệu quytrinhkt", flush=True)
        return

    available = {p.name: p for p in discover_qtkt_files(SOURCE)}
    print(f"PDF local: {len(available)} | Bản ghi hiện tại: {len(rows)}", flush=True)
    bad_before = sum(1 for r in rows if is_bad_title(r.get("tenKyThuat", "")))
    print(f"Tiêu đề nghi vấn trước: {bad_before}", flush=True)

    title_index, title_by_ma, _ = build_title_index(only_reference="--all" not in sys.argv)
    rows, fixed = patch_rows(rows, title_index, title_by_ma, available)
    bad_after = sum(1 for r in rows if is_bad_title(r.get("tenKyThuat", "")))
    print(f"Đã sửa: {fixed} | Còn nghi vấn: {bad_after}", flush=True)

    catalog, children, long_names = load_icd_catalog()
    rows = enrich_qtkt_rows(rows, catalog, children, long_names)
    save_dataset("quytrinhkt", QTKT_COLUMNS, rows, DEFAULT_DATA_DIR)
    update_manifest(QTKT_COLUMNS, version=__import__("datetime").date.today().isoformat(), row_count=len(rows))
    print(f"Đã ghi {len(rows)} bản ghi", flush=True)


if __name__ == "__main__":
    main()
