# -*- coding: utf-8 -*-
"""Rà soát §2 Chỉ định / §3 Chống chỉ định từ PDF gốc → vá dataset quytrinhkt."""
from __future__ import annotations

import sys
from pathlib import Path

from _dvkt_data_io import DEFAULT_DATA_DIR, load_dataset, save_dataset
from _merge_qtkt_mapping import QTKT_COLUMNS, enrich_qtkt_rows, load_icd_catalog, update_manifest
from _parse_qtkt_pdf import discover_qtkt_files, parse_qtkt_pdf
from _reparse_qtkt_titles import FILE_ALIAS, _resolve_alias_path

BASE = Path(__file__).resolve().parent
SOURCE = BASE / "data" / "qtkt_source"


def _row_key(row: dict) -> tuple[str, str]:
    return (str(row.get("quyTrinhSo", "")).strip(), str(row.get("maKyThuat", "")).strip())


def _should_use_source(src_text: str, cur_text: str) -> bool:
    src = (src_text or "").strip()
    cur = (cur_text or "").strip()
    if not src:
        return False
    if not cur:
        return True
    if len(src) > len(cur) + 12:
        return True
    if cur in src and len(src) > len(cur):
        return True
    return False


def build_body_index(
    *,
    only_reference: bool = False,
) -> dict[tuple[str, str], dict]:
    available = {p.name: p for p in discover_qtkt_files(SOURCE)}
    if only_reference:
        names = {target for _, target in FILE_ALIAS if target in available}
        paths = [available[n] for n in sorted(names)]
    else:
        paths = sorted(available.values())
    by_key: dict[tuple[str, str], dict] = {}
    for path in paths:
        print(f"  Parse: {path.name}", flush=True)
        for row in parse_qtkt_pdf(path):
            key = _row_key(row)
            if not key[0]:
                continue
            prev = by_key.get(key)
            if not prev or len(row.get("chiDinh", "")) > len(prev.get("chiDinh", "")):
                by_key[key] = row
    return by_key


def _file_matches_alias(ten_file: str) -> bool:
    return any(pat.search(ten_file) for pat, _ in FILE_ALIAS)


def patch_indications(rows: list[dict], body_index: dict[tuple[str, str], dict], available: dict[str, Path]) -> tuple[int, int]:
    chi_fixed = cc_fixed = 0
    for row in rows:
        key = _row_key(row)
        ref = body_index.get(key)
        if not ref:
            src = row.get("tenFileNguon", "")
            if _file_matches_alias(src) or _resolve_alias_path(src, available):
                ref = body_index.get(key)
        if not ref:
            continue
        if _should_use_source(ref.get("chiDinh", ""), row.get("chiDinh", "")):
            row["chiDinh"] = ref["chiDinh"]
            chi_fixed += 1
        if _should_use_source(ref.get("chongChiDinh", ""), row.get("chongChiDinh", "")):
            row["chongChiDinh"] = ref["chongChiDinh"]
            cc_fixed += 1
        for fld in ("thoiGianThucHien", "nhanSuThucHien"):
            if ref.get(fld) and not row.get(fld):
                row[fld] = ref[fld]
    return chi_fixed, cc_fixed


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    print("=== Rà soát chỉ định / chống chỉ định QTKT ===", flush=True)
    pack = load_dataset("quytrinhkt", DEFAULT_DATA_DIR)
    if not pack or not pack.get("rows"):
        raise SystemExit("Không có quytrinhkt.json.gz")
    rows = list(pack["rows"])
    available = {p.name: p for p in discover_qtkt_files(SOURCE)}

    has_chi = sum(1 for r in rows if (r.get("chiDinh") or "").strip())
    has_cc = sum(1 for r in rows if (r.get("chongChiDinh") or "").strip())
    print(f"Bản ghi: {len(rows)} | chiDinh: {has_chi} | chongChiDinh: {has_cc}", flush=True)

    body_index = build_body_index(only_reference="--all" not in sys.argv)
    chi_fixed, cc_fixed = patch_indications(rows, body_index, available)
    print(f"Văn bản §2 vá thêm: {chi_fixed} | §3 vá thêm: {cc_fixed}", flush=True)

    catalog, children, long_names = load_icd_catalog()
    if not catalog:
        raise SystemExit("Không tải được danh mục ICD-10 TT06")
    print(f"Danh mục ICD-10: {len(catalog)} mã", flush=True)
    rows = enrich_qtkt_rows(rows, catalog, children, long_names)

    has_icd = sum(1 for r in rows if (r.get("maICDChiDinh") or "").strip())
    has_icd_cc = sum(1 for r in rows if (r.get("maICDChongChiDinh") or "").strip())
    has_chi2 = sum(1 for r in rows if (r.get("chiDinh") or "").strip())
    has_cc2 = sum(1 for r in rows if (r.get("chongChiDinh") or "").strip())
    print(f"Sau enrich — chiDinh: {has_chi2} | chongChiDinh: {has_cc2}", flush=True)
    print(f"  maICDChiDinh: {has_icd} | maICDChongChiDinh: {has_icd_cc}", flush=True)

    save_dataset("quytrinhkt", QTKT_COLUMNS, rows, DEFAULT_DATA_DIR)
    update_manifest(QTKT_COLUMNS, version=__import__("datetime").date.today().isoformat(), row_count=len(rows))
    print(f"Đã ghi {len(rows)} bản ghi", flush=True)


if __name__ == "__main__":
    main()
