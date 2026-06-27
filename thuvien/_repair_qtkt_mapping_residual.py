# -*- coding: utf-8 -*-
"""Sửa nhanh các bản ghi QTKT còn mapping TT23 trống/nhiễu (không quét lại toàn bộ)."""
from __future__ import annotations

import sys

from _dvkt_data_io import DEFAULT_DATA_DIR, load_dataset, save_dataset
from _merge_qtkt_mapping import QTKT_COLUMNS, load_icd_catalog, update_manifest
from _qtkt_dvkt_bridge import is_polluted_tt23_name, link_qtkt_row, load_mapping_context
from _qtkt_icd_bridge import apply_qtkt_icd_fields
from _qtkt_normalize import normalize_qtkt_row


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    pack = load_dataset("quytrinhkt", DEFAULT_DATA_DIR)
    if not pack or not pack.get("rows"):
        raise SystemExit("Không có dữ liệu quytrinhkt.json.gz")
    rows = pack["rows"]
    ctx = load_mapping_context()
    catalog, children, long_names = load_icd_catalog()
    targets = [
        i
        for i, r in enumerate(rows)
        if is_polluted_tt23_name(r.get("tenKyThuatTT23", ""))
        or (not (r.get("tenKyThuatTT23") or "").strip() and r.get("maKyThuat"))
    ]
    print(f"Sửa {len(targets)} bản ghi còn mapping TT23 lệch/trống…")
    fixed = 0
    for i in targets:
        row = normalize_qtkt_row(dict(rows[i]))
        if catalog and children:
            apply_qtkt_icd_fields(row, catalog, children, long_names)
        row = link_qtkt_row(row, ctx)
        before = rows[i].get("tenKyThuatTT23", "")
        after = row.get("tenKyThuatTT23", "")
        if after and not is_polluted_tt23_name(after):
            fixed += 1
        rows[i] = row
    save_dataset("quytrinhkt", QTKT_COLUMNS, rows, DEFAULT_DATA_DIR)
    update_manifest(QTKT_COLUMNS, version=__import__("datetime").date.today().isoformat(), row_count=len(rows))
    polluted = sum(1 for r in rows if is_polluted_tt23_name(r.get("tenKyThuatTT23", "")))
    official = sum(1 for r in rows if r.get("tenKyThuatTT23") and not is_polluted_tt23_name(r.get("tenKyThuatTT23", "")))
    print(f"Đã bổ sung tên TT23 cho {fixed} bản ghi")
    print(f"Tổng tên TT23 chính thức: {official} | Còn trống/nhiễu: {polluted}")


if __name__ == "__main__":
    main()
