# -*- coding: utf-8 -*-
"""Làm mới toàn bộ dataset quytrinhkt: chuẩn hóa + ICD-10 + liên kết TT23/QĐ7603."""
from __future__ import annotations

import sys
from datetime import date

from _dvkt_data_io import DEFAULT_DATA_DIR, load_dataset, save_dataset
from _merge_qtkt_mapping import QTKT_COLUMNS, enrich_qtkt_rows, load_icd_catalog, update_manifest


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    pack = load_dataset("quytrinhkt", DEFAULT_DATA_DIR)
    if not pack or not pack.get("rows"):
        raise SystemExit("Không có dvkt_app/data/quytrinhkt.json.gz — chạy _merge_qtkt_mapping.py trước.")
    catalog, children, long_names = load_icd_catalog()
    if not catalog:
        raise SystemExit("Không tải được ICD-10 (duocthu_data / xlsx / HTML).")
    print(f"ICD-10: {len(catalog)} mã")
    rows = enrich_qtkt_rows(pack["rows"], catalog, children, long_names)
    version = date.today().isoformat()
    save_dataset("quytrinhkt", QTKT_COLUMNS, rows, DEFAULT_DATA_DIR)
    update_manifest(QTKT_COLUMNS, version=version, row_count=len(rows))
    linked_tt23 = sum(1 for r in rows if r.get("lienKetTT23"))
    linked_7603 = sum(1 for r in rows if r.get("lienKetQD7603"))
    has_icd = sum(1 for r in rows if r.get("maICDChiDinh"))
    has_icd_cc = sum(1 for r in rows if r.get("maICDChongChiDinh"))
    has_chi = sum(1 for r in rows if r.get("chiDinh"))
    print(f"Đã cập nhật {len(rows)} quy trình · manifest v{version}")
    print(f"  TT23: {linked_tt23} | QĐ7603: {linked_7603}")
    print(f"  §2 chỉ định (text): {has_chi} | ICD chỉ định: {has_icd} | ICD chống CĐ: {has_icd_cc}")


if __name__ == "__main__":
    main()
