# -*- coding: utf-8 -*-
"""
Nhập danh mục DVKT từ Phu luc 01.xls vào dich vụ kỹ thuật.html
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import xlrd

sys.stdout.reconfigure(encoding="utf-8")

XLS_PATH = Path(
    r"c:\Users\ITPC\OneDrive - TẬP ĐOÀN Y TẾ PHƯƠNG CHÂU\Documents\2026\KHTH\ICD-10\attachfile001\Phu luc 01.xls"
)
HTML_PATH = Path(__file__).resolve().parent / "dich vụ kỹ thuật.html"


def clean_str(val) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    if s.endswith(".0") and s[:-2].replace(".", "").isdigit():
        # keep ma like 01.0009.0098 — only strip trailing .0 for pure integers
        parts = s.split(".")
        if len(parts) == 2 and parts[1] == "0" and parts[0].isdigit():
            return parts[0]
    return s


def clean_stt(val):
    if val is None or val == "":
        return ""
    if isinstance(val, float) and val == int(val):
        return int(val)
    if isinstance(val, str) and val.strip().endswith(".0"):
        try:
            return int(float(val))
        except ValueError:
            pass
    return val


def clean_num(val) -> float | int:
    if val is None or val == "":
        return 0
    try:
        n = float(val)
        return int(n) if n == int(n) else n
    except (TypeError, ValueError):
        return 0


def read_pl1(wb: xlrd.Book) -> list[dict]:
    sh = wb.sheet_by_name("PL 1 _ Danh mục đầy đủ")
    rows: list[dict] = []
    for r in range(2, sh.nrows):
        ma = clean_str(sh.cell_value(r, 1))
        if not ma:
            break
        rows.append(
            {
                "stt": clean_stt(sh.cell_value(r, 0)),
                "maTuongDuong": ma,
                "maTT43": clean_str(sh.cell_value(r, 2)),
                "tenTT43": clean_str(sh.cell_value(r, 3)),
                "phanTuyen": clean_str(sh.cell_value(r, 4)),
                "phanLoai": clean_str(sh.cell_value(r, 5)),
                "sttTT39": clean_str(sh.cell_value(r, 6)),
                "tenTT39": clean_str(sh.cell_value(r, 7)),
                "giaTT39": clean_num(sh.cell_value(r, 8)),
                "chuyenKhoa": clean_str(sh.cell_value(r, 11)),
                "maLienThong": clean_str(sh.cell_value(r, 20)),
            }
        )
    return rows


def read_pl2(wb: xlrd.Book) -> list[dict]:
    sh = wb.sheet_by_name("PL 2 _ Liệt kê thay đổi")
    rows: list[dict] = []
    for r in range(2, sh.nrows):
        ma = clean_str(sh.cell_value(r, 1))
        if not ma:
            continue
        ten = clean_str(sh.cell_value(r, 3))
        if not ten and not ma:
            continue
        rows.append(
            {
                "sttPl1": clean_stt(sh.cell_value(r, 0)),
                "maTuongDuong": ma,
                "maTT43": clean_str(sh.cell_value(r, 2)),
                "tenTT43": ten,
                "phanTuyen": clean_str(sh.cell_value(r, 4)),
                "phanLoai": clean_str(sh.cell_value(r, 5)),
                "tenTT39": clean_str(sh.cell_value(r, 7)),
                "lyDoThayDoi": clean_str(sh.cell_value(r, 8)),
                "giaTT39": clean_num(sh.cell_value(r, 9)),
            }
        )
    return rows


def read_pl3(wb: xlrd.Book) -> list[dict]:
    sh = wb.sheet_by_name("PL 3 _ Các mã huỷ")
    rows: list[dict] = []
    for r in range(2, sh.nrows):
        ma = clean_str(sh.cell_value(r, 1))
        if not ma:
            continue
        rows.append(
            {
                "stt": clean_stt(sh.cell_value(r, 0)),
                "maTuongDuong": ma,
                "maTT43": clean_str(sh.cell_value(r, 2)),
                "tenTT43": clean_str(sh.cell_value(r, 3)),
                "phanTuyen": clean_str(sh.cell_value(r, 4)),
                "phanLoai": clean_str(sh.cell_value(r, 5)),
                "tenTT39": clean_str(sh.cell_value(r, 7)),
                "lyDoHuy": clean_str(sh.cell_value(r, 8)),
            }
        )
    return rows


def patch_html_data(html: str, pl1: list, pl2: list, pl3: list) -> str:
    def repl_block(name: str, data: list, text: str, next_marker: str) -> str:
        js = json.dumps(data, ensure_ascii=False, indent=2)
        pat = rf"const {name} = \[.*?\];\s*(?=\s*{re.escape(next_marker)})"
        repl = f"const {name} = {js};\n\n    "
        new_text, n = re.subn(pat, repl, text, count=1, flags=re.S)
        if n != 1:
            raise SystemExit(f"Khong patch duoc {name} (matches={n})")
        return new_text

    out = repl_block("INITIAL_PL1_DATA", pl1, html, "const INITIAL_PL2_COLUMNS")
    out = repl_block("INITIAL_PL2_DATA", pl2, out, "const INITIAL_PL3_COLUMNS")
    out = repl_block("INITIAL_PL3_DATA", pl3, out, "// === HỆ THỐNG TRẠNG THÁI")
    return out


def main():
    if not XLS_PATH.is_file():
        raise SystemExit(f"Khong tim thay file: {XLS_PATH}")
    if not HTML_PATH.is_file():
        raise SystemExit(f"Khong tim thay HTML: {HTML_PATH}")

    wb = xlrd.open_workbook(str(XLS_PATH))
    pl1 = read_pl1(wb)
    pl2 = read_pl2(wb)
    pl3 = read_pl3(wb)
    print(f"PL1: {len(pl1)} | PL2: {len(pl2)} | PL3: {len(pl3)}")
    print("PL1[0]:", pl1[0])
    print("PL1[-1]:", pl1[-1]["maTuongDuong"], pl1[-1]["tenTT43"][:50])

    html = HTML_PATH.read_text(encoding="utf-8")
    new_html = patch_html_data(html, pl1, pl2, pl3)
    HTML_PATH.write_text(new_html, encoding="utf-8")
    print(f"Da cap nhat: {HTML_PATH.name} ({len(new_html)//1024} KB)")


if __name__ == "__main__":
    main()
