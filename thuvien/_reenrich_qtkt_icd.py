# -*- coding: utf-8 -*-
"""Áp lại mapping ICD-10 + TT23/QĐ7603 lên dataset quytrinhkt hiện có (không parse lại PDF)."""
from __future__ import annotations

import sys

from _dvkt_data_io import DEFAULT_DATA_DIR, load_dataset, save_dataset
from _merge_qtkt_mapping import QTKT_COLUMNS, enrich_qtkt_rows, load_icd_catalog, update_manifest


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    pack = load_dataset("quytrinhkt", DEFAULT_DATA_DIR)
    if not pack or not pack.get("rows"):
        raise SystemExit("Không có dữ liệu quytrinhkt.json.gz")
    catalog, children, long_names = load_icd_catalog()
    if not catalog:
        raise SystemExit("Không tải được danh mục ICD-10")
    rows = enrich_qtkt_rows(pack["rows"], catalog, children, long_names)
    save_dataset("quytrinhkt", QTKT_COLUMNS, rows, DEFAULT_DATA_DIR)
    update_manifest(QTKT_COLUMNS, version=__import__("datetime").date.today().isoformat(), row_count=len(rows))
    has_cd = sum(1 for r in rows if r.get("maICDChiDinh"))
    has_cc = sum(1 for r in rows if r.get("maICDChongChiDinh"))
    has_text = sum(1 for r in rows if r.get("chiDinh"))
    print(f"Đã cập nhật {len(rows)} quy trình")
    print(f"  Văn bản chỉ định: {has_text} | Mã ICD chỉ định: {has_cd} | Mã ICD chống chỉ định: {has_cc}")


if __name__ == "__main__":
    main()
