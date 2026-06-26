# -*- coding: utf-8 -*-
"""Tái tạo toàn bộ dich vụ kỹ thuật.html: QĐ7603 + TT23 + PVHN + UI."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl
import xlrd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _import_dvkt_from_xls import read_pl1, read_pl2, read_pl3  # noqa: E402
from _merge_phamvi_hanhnghe import (  # noqa: E402
    PL1_COLUMN_ORDER,
    PVHN_EXTRA_COLUMNS,
    TAGS_MAPPING_COLUMN,
    TT23_PVHN_COLUMNS,
    enrich_pl1_phamvi,
    enrich_tt23_pvhn,
    reorder_columns,
)
from _merge_tt23_mapping import (  # noqa: E402
    build_tt23_datasets,
    enrich_pl1,
    index_tt23,
    load_pl1_from_html,
    read_tt23,
)
from _parse_phamvi_docx import read_all_phamvi  # noqa: E402

BASE = Path(__file__).resolve().parent
HTML_PATH = BASE / "dich vụ kỹ thuật.html"
SHELL_MARKER = "  <!-- CORE JAVASCRIPT STATE ENGINE -->"
XLS_7603 = Path(
    r"c:\Users\ITPC\OneDrive - TẬP ĐOÀN Y TẾ PHƯƠNG CHÂU\Documents\2026\KHTH\ICD-10\attachfile001\Phu luc 01.xls"
)
XLSX_TT23 = Path(r"d:\BHYT\Danh muc TT23\Danh muc theo thong tu 23.xlsx")
RUNTIME_JS = BASE / "_dvkt_runtime.js"
REPORT_JS = BASE / "_dvkt_report.js"

PL1_COLUMNS = reorder_columns(
    [
    {"key": "stt", "label": "STT", "type": "number", "required": True},
    {"key": "maTuongDuong", "label": "Mã Tương Đương", "type": "text", "required": True},
    {"key": "maTT43", "label": "Mã TT43/50/21", "type": "text"},
    {"key": "tenTT43", "label": "Tên theo Thông tư 43/50/21", "type": "text", "required": True},
    {"key": "phanTuyen", "label": "Phân Tuyến", "type": "select", "options": ["A", "B", "C", "D"]},
    {"key": "phanLoai", "label": "Phân Loại PTTT", "type": "text"},
    {"key": "sttTT39", "label": "STT TT39", "type": "text"},
    {"key": "tenTT39", "label": "Tên theo Danh mục giá TT39", "type": "text"},
    {"key": "giaTT39", "label": "Giá TT39 (VNĐ)", "type": "number"},
    {"key": "chuyenKhoa", "label": "Chuyên Khoa", "type": "text"},
    {"key": "maLienThong", "label": "Mã Giá Liên Thông BHYT", "type": "text"},
    {"key": "theNguonGoc", "label": "Thẻ nguồn gốc", "type": "text"},
    {"key": "theLienKetTT23", "label": "Thẻ liên kết TT23", "type": "text"},
    {"key": "vanBanNguon", "label": "Văn bản gốc", "type": "text"},
    {"key": "maKyThuatTT23", "label": "Mã kỹ thuật TT23", "type": "text"},
    {"key": "tenKyThuatTT23", "label": "Tên kỹ thuật TT23", "type": "text"},
    {"key": "doTinCayMapping", "label": "Độ tin cậy mapping", "type": "text"},
    {"key": "ghiChuMapping", "label": "Ghi chú mapping", "type": "text"},
    ],
    PL1_COLUMN_ORDER,
    [TAGS_MAPPING_COLUMN, *PVHN_EXTRA_COLUMNS],
)

PL2_COLUMNS = [
    {"key": "sttPl1", "label": "STT tại PL1", "type": "number", "required": True},
    {"key": "maTuongDuong", "label": "Mã Tương Đương", "type": "text", "required": True},
    {"key": "maTT43", "label": "Mã TT43/50/21", "type": "text"},
    {"key": "tenTT43", "label": "Tên theo Thông tư 43/50/21", "type": "text", "required": True},
    {"key": "phanTuyen", "label": "Phân Tuyến", "type": "select", "options": ["A", "B", "C", "D"]},
    {"key": "phanLoai", "label": "Phân Loại PTTT", "type": "text"},
    {"key": "tenTT39", "label": "Tên theo Danh mục giá TT39", "type": "text"},
    {"key": "lyDoThayDoi", "label": "Ghi chú thay đổi", "type": "text"},
    {"key": "giaTT39", "label": "Giá TT39 (VNĐ)", "type": "number"},
]

PL3_COLUMNS = [
    {"key": "stt", "label": "STT", "type": "number", "required": True},
    {"key": "maTuongDuong", "label": "Mã Tương Đương", "type": "text", "required": True},
    {"key": "maTT43", "label": "Mã TT43/50/21", "type": "text"},
    {"key": "tenTT43", "label": "Tên theo Thông tư 43/50/21", "type": "text", "required": True},
    {"key": "phanTuyen", "label": "Phân Tuyến", "type": "select", "options": ["A", "B", "C", "D"]},
    {"key": "phanLoai", "label": "Phân Loại PTTT", "type": "text"},
    {"key": "tenTT39", "label": "Tên theo Danh mục giá TT39", "type": "text"},
    {"key": "lyDoHuy", "label": "Lý Do Hủy", "type": "text", "required": True},
]

TT23_PL1_COLUMNS = [
    {"key": "stt", "label": "STT", "type": "number", "required": True},
    {"key": "maKyThuat", "label": "Mã kỹ thuật TT23", "type": "text", "required": True},
    {"key": "tenKyThuat", "label": "Tên kỹ thuật TT23", "type": "text", "required": True},
    {"key": "chuong", "label": "Chương/Chuyên khoa", "type": "text"},
    {"key": "theNguonGoc", "label": "Thẻ nguồn", "type": "text"},
    {"key": "vanBanNguon", "label": "Văn bản gốc", "type": "text"},
    {"key": "lienKetQD7603", "label": "Mã QĐ7603 liên kết", "type": "text"},
    {"key": "tenTT43QD7603", "label": "Tên QĐ7603 liên kết", "type": "text"},
    {"key": "doTinCayMapping", "label": "Độ tin cậy mapping", "type": "text"},
    {"key": "ghiChuMapping", "label": "Ghi chú mapping", "type": "text"},
]

TT23_PL2_COLUMNS = [
    {"key": "stt", "label": "STT PL2", "type": "number", "required": True},
    {"key": "maKyThuat", "label": "Mã kỹ thuật TT23", "type": "text", "required": True},
    {"key": "tenKyThuat", "label": "Tên phẫu thuật TT23", "type": "text", "required": True},
    {"key": "chuong", "label": "Chương", "type": "text"},
    {"key": "theNguonGoc", "label": "Thẻ nguồn", "type": "text"},
    {"key": "vanBanNguon", "label": "Văn bản gốc", "type": "text"},
    {"key": "lienKetQD7603", "label": "Mã QĐ7603 liên kết", "type": "text"},
    {"key": "tenTT43QD7603", "label": "Tên QĐ7603 liên kết", "type": "text"},
    {"key": "doTinCayMapping", "label": "Độ tin cậy mapping", "type": "text"},
    {"key": "ghiChuMapping", "label": "Ghi chú mapping", "type": "text"},
]

SCRIPT_HEADER = """
    const CATALOG_QD_LABEL = 'Quyết định số 7603/QĐ-BYT';
    const CATALOG_TT23_LABEL = 'Thông tư số 23/2024/TT-BYT';
    const SOURCE_TAGS = {
      QD_7603: { label: 'QĐ 7603', full: 'Quyết định số 7603/QĐ-BYT — Phụ lục 01 (TT39/TT43)', cls: 'bg-rose-100 text-rose-800 border border-rose-200' },
      TT23_PL1: { label: 'TT23-PL1', full: 'Thông tư số 23/2024/TT-BYT — Phụ lục 1 (Danh mục kỹ thuật)', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
      TT23_PL2: { label: 'TT23-PL2', full: 'Thông tư số 23/2024/TT-BYT — Phụ lục 2 (Danh mục phẫu thuật)', cls: 'bg-violet-100 text-violet-800 border border-violet-200' }
    };

    function getRowId(item) {
      return item.maTuongDuong || item._rowId || `${item.maKyThuat || 'row'}_${item.stt}`;
    }

    function renderSourceBadge(tag) {
      if (!tag) return '—';
      const info = SOURCE_TAGS[tag];
      if (!info) return tag;
      return `<span class="px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${info.cls}" title="${info.full}">${info.label}</span>`;
    }
"""


def load_shell() -> str:
    from _sync_dvkt_html import ensure_shell_patches

    text = HTML_PATH.read_text(encoding="utf-8")
    text = ensure_shell_patches(text)
    idx = text.find(SHELL_MARKER)
    if idx == -1:
        raise SystemExit("Khong tim thay shell marker trong HTML")
    return text[:idx].rstrip() + "\n\n"


def js_const(name: str, data) -> str:
    return f"    const {name} = {json.dumps(data, ensure_ascii=False, indent=2)};\n\n"


def load_json_block(html: str, name: str) -> list | None:
    m = re.search(rf"const {name} = (\[.*?\]);", html, re.S)
    if not m:
        return None
    return json.loads(m.group(1))


def main():
    html_existing = HTML_PATH.read_text(encoding="utf-8") if HTML_PATH.is_file() else ""

    if XLS_7603.is_file():
        wb = xlrd.open_workbook(str(XLS_7603))
        pl1 = read_pl1(wb)
        pl2 = read_pl2(wb)
        pl3 = read_pl3(wb)
        print("Nguon QD7603: file XLS")
    elif html_existing:
        pl1 = load_pl1_from_html(html_existing)
        pl2 = load_json_block(html_existing, "INITIAL_PL2_DATA") or []
        pl3 = load_json_block(html_existing, "INITIAL_PL3_DATA") or []
        print("Nguon QD7603: HTML hien co")
    else:
        raise SystemExit(f"Thieu file 7603 va HTML: {XLS_7603}")

    if XLSX_TT23.is_file():
        pl1_tt23, pl2_tt23 = read_tt23()
        print("Nguon TT23: file XLSX")
    elif html_existing:
        pl1_tt23 = load_json_block(html_existing, "INITIAL_TT23_PL1_DATA") or []
        pl2_tt23 = load_json_block(html_existing, "INITIAL_TT23_PL2_DATA") or []
        print("Nguon TT23: HTML hien co")
    else:
        raise SystemExit(f"Thieu file TT23 va HTML: {XLSX_TT23}")

    by_ma_pl1, by_ten_pl1, by_ma_pl2, by_ten_pl2 = index_tt23(pl1_tt23, pl2_tt23)
    pl1, stats_tt23, reverse = enrich_pl1(pl1, by_ma_pl1, by_ten_pl1, by_ma_pl2, by_ten_pl2)
    tt23_pl1, tt23_pl2 = build_tt23_datasets(
        pl1_tt23, pl2_tt23, reverse, by_ma_pl1, by_ten_pl1, by_ma_pl2, by_ten_pl2, pl1
    )

    pvhn_records, pvhn_parse_stats = read_all_phamvi()
    pl1, pvhn_stats = enrich_pl1_phamvi(pl1, pvhn_records)
    tt23_pl1, linked_pvhn1 = enrich_tt23_pvhn(pl1, tt23_pl1)
    tt23_pl2, linked_pvhn2 = enrich_tt23_pvhn(pl1, tt23_pl2)
    pl1_columns = PL1_COLUMNS
    tt23_pl1_columns = reorder_columns(
        TT23_PL1_COLUMNS,
        ["stt", "maKyThuat", "tenKyThuat", "tagsMapping", "thePhamViHanhNghe", "tenPhamViHanhNghe", "doTinCayPhamVi", "chuong", "lienKetQD7603", "tenTT43QD7603", "theNguonGoc", "vanBanNguon", "doTinCayMapping", "ghiChuMapping"],
        TT23_PVHN_COLUMNS,
    )
    tt23_pl2_columns = reorder_columns(
        TT23_PL2_COLUMNS,
        ["stt", "maKyThuat", "tenKyThuat", "tagsMapping", "thePhamViHanhNghe", "tenPhamViHanhNghe", "doTinCayPhamVi", "chuong", "lienKetQD7603", "tenTT43QD7603", "theNguonGoc", "vanBanNguon", "doTinCayMapping", "ghiChuMapping"],
        TT23_PVHN_COLUMNS,
    )

    shell = load_shell()
    runtime = RUNTIME_JS.read_text(encoding="utf-8")
    report = REPORT_JS.read_text(encoding="utf-8")

    parts = [
        shell,
        SHELL_MARKER,
        "\n  <script>",
        SCRIPT_HEADER,
        js_const("INITIAL_PL1_COLUMNS", pl1_columns),
        js_const("INITIAL_PL1_DATA", pl1),
        js_const("INITIAL_PL2_COLUMNS", PL2_COLUMNS),
        js_const("INITIAL_PL2_DATA", pl2),
        js_const("INITIAL_PL3_COLUMNS", PL3_COLUMNS),
        js_const("INITIAL_PL3_DATA", pl3),
        js_const("INITIAL_TT23_PL1_COLUMNS", tt23_pl1_columns),
        js_const("INITIAL_TT23_PL1_DATA", tt23_pl1),
        js_const("INITIAL_TT23_PL2_COLUMNS", tt23_pl2_columns),
        js_const("INITIAL_TT23_PL2_DATA", tt23_pl2),
        runtime,
        report,
        "  </script>\n</body>\n</html>\n",
    ]
    out = "".join(parts)
    HTML_PATH.write_text(out, encoding="utf-8")

    print(f"PL1 QD7603: {len(pl1)} | PL2: {len(pl2)} | PL3: {len(pl3)}")
    print(f"TT23 PL1: {len(tt23_pl1)} | TT23 PL2: {len(tt23_pl2)}")
    print("Mapping TT23:", stats_tt23)
    print("Parse PVHN:", pvhn_parse_stats)
    print("Enrich PVHN:", pvhn_stats)
    print(f"TT23 PVHN linked: PL1={linked_pvhn1} PL2={linked_pvhn2}")
    print(f"HTML rebuilt: {len(out) // 1024} KB")
    assert out.rstrip().endswith("</html>"), "HTML khong hop le"


if __name__ == "__main__":
    main()
