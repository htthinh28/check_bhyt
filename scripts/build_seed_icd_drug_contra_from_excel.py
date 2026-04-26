#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Đọc Excel danh mục chống chỉ định thuốc (BV) → sinh ma_nguon/tien_ich/seed_icd_drug_contra_bhyt.json
để gộp vào ICD_DRUG_CONTRA trong dong_co_giam_dinh.jsx.

Cột mẫu: Loai, Mã thuốc, Tên hoạt chất, tên thuốc , ICD-10 chống chỉ định, Tên bệnh chống chỉ định,
        Quy tắc giám định, Cảnh báo

Chạy:
  python scripts/build_seed_icd_drug_contra_from_excel.py
  python scripts/build_seed_icd_drug_contra_from_excel.py --input "C:\\path\\file.xlsx"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Cần cài: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = REPO_ROOT / "ma_nguon" / "tien_ich" / "seed_icd_drug_contra_bhyt.json"
DEFAULT_INPUT = Path(
    r"c:\Users\admin\Documents\Google Drive\BHYT\danh muc benh vien\thuoc chong chỉ dinh rhuoc.xlsx"
)


def tach_nhieu_ma(s: str) -> list[str]:
    t = str(s or "").strip()
    if not t:
        return []
    for ch in "|":
        t = t.replace(ch, ";")
    parts = re.split(r"[;,]", t)
    out: list[str] = []
    for p in parts:
        x = str(p or "").strip()
        if x:
            out.append(x)
    return out


def chuan_loai_mapping(loai_raw: str) -> str:
    u = str(loai_raw or "").strip().upper().replace(" ", "_")
    if u.startswith("ICD_DRUG_CONTRA"):
        return "ICD_DRUG_CONTRA"
    return u


def build_row(
    *,
    loai: str,
    ma_thuoc_cell: str,
    ten_hoat_chat_cell: str,
    ten_thuoc_cell: str,
    icd_cell: str,
    ten_benh_cell: str,
    quy_tac_cell: str,
    canh_bao_cell: str,
    line_no: int,
) -> dict | None:
    icds = tach_nhieu_ma(icd_cell)
    mas = tach_nhieu_ma(ma_thuoc_cell)
    if not icds or not mas:
        return None
    ten_aliases = [x for x in tach_nhieu_ma(ten_thuoc_cell) if x]
    hoat_aliases = [x for x in tach_nhieu_ma(ten_hoat_chat_cell) if x]
    mt = chuan_loai_mapping(loai)
    if mt != "ICD_DRUG_CONTRA":
        return None
    rid = f"SEED_ICD_CD_BHYT_L{line_no}"
    ts = datetime.now(timezone.utc).isoformat()
    md = {
        "rule_id": rid,
        "source_icd_codes": icds,
        "target_codes": mas,
        "khop_bang_ten_hoat_chat": True,
        "ten_thuoc_aliases": ten_aliases,
        "hoat_chat_aliases": hoat_aliases,
        "ten_benh_chong_chi_dinh": str(ten_benh_cell or "").strip(),
        "quy_tac_giam_dinh_excel": str(quy_tac_cell or "").strip(),
        "canh_bao_excel": str(canh_bao_cell or "").strip(),
        "excel_line": line_no,
    }
    return {
        "id": str(uuid.uuid4()),
        "mapping_type": "ICD_DRUG_CONTRA",
        "source_catalog": "icd10",
        "target_catalog": "drug_items",
        "source_id": 0,
        "target_id": 0,
        "source_code": ";".join(icds),
        "target_code": ";".join(mas),
        "effective_from": None,
        "effective_to": None,
        "priority": 0,
        "is_active": True,
        "metadata": md,
        "approval_status": "APPROVED",
        "created_at": ts,
        "updated_at": ts,
        "created_by": "build_seed_icd_drug_contra_from_excel.py",
        "updated_by": "",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()
    inp: Path = args.input
    out: Path = args.out
    if not inp.is_file():
        print(f"Không tìm thấy file: {inp}", file=sys.stderr)
        return 1
    wb = openpyxl.load_workbook(inp, read_only=True, data_only=True)
    sh = wb[wb.sheetnames[0]]
    rows_iter = sh.iter_rows(min_row=1, values_only=True)
    header = next(rows_iter, None)
    if not header:
        print("Sheet trống.", file=sys.stderr)
        return 1
    # map header index
    hmap = {str(c or "").strip(): i for i, c in enumerate(header)}
    def col(*names: str) -> int | None:
        for n in names:
            if n in hmap:
                return hmap[n]
        return None

    idx_loai = col("Loai", "Loại")
    idx_ma = col("Mã thuốc")
    idx_hoat = col("Tên hoạt chất")
    idx_ten_thuoc = col("tên thuốc ", "tên thuốc", "Tên thuốc")
    idx_icd = col("ICD-10 chống chỉ định")
    idx_ten_benh = col("Tên bệnh chống chỉ định")
    idx_qt = col("Quy tắc giám định")
    idx_cb = col("Cảnh báo")
    need = [idx_loai, idx_ma, idx_icd]
    if any(x is None for x in need):
        print(f"Thiếu cột bắt buộc trong header: {header}", file=sys.stderr)
        return 1

    out_rows: list[dict] = []
    line = 1
    for tup in rows_iter:
        line += 1
        if not tup or all(v is None or str(v).strip() == "" for v in tup):
            continue
        def gv(i: int | None) -> str:
            if i is None or i >= len(tup):
                return ""
            v = tup[i]
            return "" if v is None else str(v).strip()
        loai = gv(idx_loai)
        if not loai:
            continue
        r = build_row(
            loai=loai,
            ma_thuoc_cell=gv(idx_ma),
            ten_hoat_chat_cell=gv(idx_hoat),
            ten_thuoc_cell=gv(idx_ten_thuoc),
            icd_cell=gv(idx_icd),
            ten_benh_cell=gv(idx_ten_benh),
            quy_tac_cell=gv(idx_qt),
            canh_bao_cell=gv(idx_cb),
            line_no=line,
        )
        if r:
            out_rows.append(r)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as f:
        json.dump(out_rows, f, ensure_ascii=False, indent=2)
    print(f"Đã ghi {len(out_rows)} bản ghi → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
