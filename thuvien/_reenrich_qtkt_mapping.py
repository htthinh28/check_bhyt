# -*- coding: utf-8 -*-
"""Áp lại mapping TT23 / QĐ7603 / DM BV lên dataset quytrinhkt (không parse lại PDF)."""
from __future__ import annotations

import sys
from collections import Counter

from _dvkt_data_io import DEFAULT_DATA_DIR, load_dataset, save_dataset
from _merge_qtkt_mapping import QTKT_COLUMNS, enrich_qtkt_rows, load_icd_catalog, update_manifest
from _qtkt_dvkt_bridge import is_polluted_tt23_name


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    pack = load_dataset("quytrinhkt", DEFAULT_DATA_DIR)
    if not pack or not pack.get("rows"):
        raise SystemExit("Không có dữ liệu quytrinhkt.json.gz")
    catalog, children, long_names = load_icd_catalog()
    rows = enrich_qtkt_rows(pack["rows"], catalog, children, long_names)
    save_dataset("quytrinhkt", QTKT_COLUMNS, rows, DEFAULT_DATA_DIR)
    update_manifest(QTKT_COLUMNS, version=__import__("datetime").date.today().isoformat(), row_count=len(rows))

    conf = Counter(r.get("doTinCayMapping") or "—" for r in rows)
    conf_bv = Counter(r.get("doTinCayMappingBV") or "—" for r in rows)
    polluted = sum(1 for r in rows if is_polluted_tt23_name(r.get("tenKyThuatTT23", "")))

    print(f"Đã cập nhật {len(rows)} quy trình")
    print(f"  Liên kết TT23: {sum(1 for r in rows if r.get('lienKetTT23'))}")
    print(f"  Tên TT23 chính thức: {sum(1 for r in rows if r.get('tenKyThuatTT23') and not is_polluted_tt23_name(r.get('tenKyThuatTT23','')))}")
    print(f"  Tên TT23 nhiễu (còn lại): {polluted}")
    print(f"  Liên kết QĐ7603: {sum(1 for r in rows if r.get('lienKetQD7603'))}")
    print(f"  DM bệnh viện: {sum(1 for r in rows if r.get('maDichVuBV'))}")
    print(f"  Độ tin cậy mapping: {dict(conf)}")
    print(f"  Độ tin cậy DM BV: {dict(conf_bv)}")
    if catalog:
        print(f"  Mã ICD chỉ định: {sum(1 for r in rows if r.get('maICDChiDinh'))}")
        print(f"  Mã ICD chống chỉ định: {sum(1 for r in rows if r.get('maICDChongChiDinh'))}")


if __name__ == "__main__":
    main()
