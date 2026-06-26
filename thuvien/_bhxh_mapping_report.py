# -*- coding: utf-8 -*-
"""Báo cáo nhanh mapping BHXH ↔ DVKT."""
from __future__ import annotations

import gzip
import json
import sys
from pathlib import Path

from _bhxh_pvhn_bridge import validate_bhxh_mapping

BASE = Path(__file__).resolve().parent
DATA = BASE / "dvkt_app" / "data"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    pl1 = json.loads(gzip.open(DATA / "pl1.json.gz", "rt", encoding="utf-8").read())
    bhxh = json.loads(gzip.open(DATA / "pvhnbhxh.json.gz", "rt", encoding="utf-8").read())
    rows = pl1["rows"]
    cat = bhxh["rows"]
    no_bhxh = [r for r in rows if not r.get("maPhamViBHXH")]
    no_dvkt = [r for r in cat if not r.get("soDvktDuocPhep")]

    print("=== TONG KET MAPPING BHXH 2024 ===")
    print(f"PL1: {len(rows)} DVKT | co ma BHXH: {len(rows) - len(no_bhxh)} | chua co: {len(no_bhxh)}")
    print(f"Catalog BHXH: {len(cat)} chuc danh | co DVKT map: {len(cat) - len(no_dvkt)} | chua co: {len(no_dvkt)}")
    if no_dvkt:
        print("\nChuc danh BHXH chua co DVKT:")
        for r in no_dvkt:
            print(f"  {r['maPhamVi']}: {r.get('chucDanh', r.get('tenChucDanh', ''))}")
    if no_bhxh:
        print(f"\nMau 10 DVKT chua co ma BHXH:")
        for r in no_bhxh[:10]:
            print(f"  {r.get('maTT43')} | {r.get('tenTT43', '')[:55]} | PVHN: {r.get('thePhamViHanhNghe', '')}")
    top = sorted(cat, key=lambda r: r.get("soDvktDuocPhep", 0), reverse=True)[:8]
    print("\nTop chuc danh nhieu DVKT:")
    for r in top:
        print(f"  {r['maPhamVi']}: {r['soDvktDuocPhep']:4d} — {r.get('chucDanh', '')[:55]}")

    qa = validate_bhxh_mapping(rows)
    multi = sum(1 for r in rows if ";" in str(r.get("maPhamViBHXH", "")))
    print("\n=== QA PHAMVI_CM (BHXH) ===")
    print(f"Co PVHN TT32: {qa['has_pvhn']} | co ma BHXH: {qa['has_bhxh']} | nhieu ma (;): {multi}")
    if qa["pvhn_no_bhxh"]:
        print(f"Thieu hoan toan ({len(qa['pvhn_no_bhxh'])}):")
        for item in qa["pvhn_no_bhxh"][:10]:
            print(f"  {item['maTT43']} | tags: {';'.join(item['tags'])}")
    if qa["missing_codes"]:
        print(f"Thieu mot phan ma ({len(qa['missing_codes'])}):")
        for item in qa["missing_codes"][:5]:
            print(f"  {item['maTT43']} | thieu {item['missing_count']}: {';'.join(item['missing'])}")
    if qa["bad_separator"]:
        print(f"Sai phan cach (;): {qa['bad_separator'][:10]}")
    if not qa["pvhn_no_bhxh"] and not qa["missing_codes"] and not qa["bad_separator"]:
        print("Ket luan: day du ma BHXH theo PVHN, dinh dang ';' dung.")


if __name__ == "__main__":
    main()
