# -*- coding: utf-8 -*-
"""Gắn mã PVHN BHXH (CV 2024) vào toàn bộ danh mục DVKT + tab chức danh."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from _bhxh_pvhn_bridge import (
    PL1_BHXH_COLUMNS,
    attach_dvkt_counts_to_catalog,
    build_bhxh_dvkt_index,
    enrich_catalog_with_tags,
    enrich_pl1_bhxh,
    propagate_bhxh_from_pl1,
    validate_bhxh_mapping,
)
from _dvkt_data_io import DATASET_IDS, DEFAULT_DATA_DIR, load_dataset, save_dataset
from _merge_phamvi_hanhnghe import (
    PL1_COLUMN_ORDER,
    PL2_BHXH_COLUMNS,
    PVHN_EXTRA_COLUMNS,
    TAGS_MAPPING_COLUMN,
    TT23_PVHN_COLUMNS,
    enrich_tt23_pvhn,
    reorder_columns,
)
from _merge_tt23_mapping import norm_code
from _parse_phamvi_bhxh_pdf import catalog_columns, read_bhxh_catalog

BASE = Path(__file__).resolve().parent
HTML_PATH = BASE / "dich vụ kỹ thuật.html"
EMBED_JS = BASE / "_pvhn_bhxh_embed.js"
PDF_PATH = Path(
    r"c:\Users\admin\Downloads\24_2148_PHULUC_CVHUONGDAN_02.7.24 (1).pdf"
)

BV_BHXH_EXTRA = [
    {"key": "tenPhamViHanhNghe", "label": "Tên phạm vi hành nghề", "type": "text"},
    {"key": "chiTietChuyenKhoaPVHN", "label": "Chi tiết chuyên khoa", "type": "text"},
    {"key": "doTinCayPhamVi", "label": "Độ tin cậy PVHN", "type": "text"},
    {"key": "ghiChuPhamVi", "label": "Ghi chú PVHN", "type": "text"},
] + PL1_BHXH_COLUMNS

PL2_COLUMN_ORDER = [
    "sttPl1", "maTuongDuong", "maTT43", "tenTT43",
    "thePhamViHanhNghe", "maPhamViBHXH", "tenChucDanhBHXH", "doTinCayBHXH",
    "phanTuyen", "phanLoai", "tenTT39", "lyDoThayDoi", "giaTT39",
]

PL3_COLUMN_ORDER = [
    "stt", "maTuongDuong", "maTT43", "tenTT43",
    "thePhamViHanhNghe", "maPhamViBHXH", "tenChucDanhBHXH", "doTinCayBHXH",
    "phanTuyen", "phanLoai", "tenTT39", "lyDoHuy",
]

TT23_COLUMN_ORDER = [
    "stt", "maKyThuat", "tenKyThuat", "tagsMapping",
    "thePhamViHanhNghe", "tenPhamViHanhNghe", "chuyenKhoaPVHN", "chiTietChuyenKhoaPVHN",
    "maPhamViBHXH", "tenChucDanhBHXH", "soChucDanhBHXH", "doTinCayBHXH",
    "doTinCayPhamVi", "ghiChuPhamVi", "chuong", "lienKetQD7603", "tenTT43QD7603",
    "theNguonGoc", "vanBanNguon", "doTinCayMapping", "ghiChuMapping",
]

BV_COLUMN_ORDER = [
    "stt", "maDichVu", "tenDichVu", "tagsMapping", "lienKetQD7603", "maTT43", "tenTT43",
    "theLienKetTT23", "maKyThuatTT23", "tenKyThuatTT23",
    "thePhamViHanhNghe", "tenPhamViHanhNghe", "chuyenKhoaPVHN", "chiTietChuyenKhoaPVHN",
    "maPhamViBHXH", "tenChucDanhBHXH", "soChucDanhBHXH", "doTinCayBHXH",
    "doTinCayPhamVi", "ghiChuPhamVi", "doTinCayMapping", "ghiChuMapping",
    "donGia", "maGia", "giaBhyt", "phanLoaiPttt", "tuNgay", "denNgay",
    "ghiChuBV", "quyetDinh", "maCSKCB", "tenBenhVien",
]


def load_pack(tab_id: str) -> dict | None:
    path = DEFAULT_DATA_DIR / f"{tab_id}.json.gz"
    if not path.is_file():
        return None
    return load_dataset(tab_id, DEFAULT_DATA_DIR)


def pl1_column_defs(existing: list[dict] | None = None) -> list[dict]:
    base = existing or []
    order = PL1_COLUMN_ORDER + [c["key"] for c in PL1_BHXH_COLUMNS if c["key"] not in PL1_COLUMN_ORDER]
    return reorder_columns(base, order, [TAGS_MAPPING_COLUMN, *PVHN_EXTRA_COLUMNS])


def write_bhxh_embed(cols: list, rows: list[dict]) -> None:
    cols_js = json.dumps(cols, ensure_ascii=False, indent=2)
    rows_js = json.dumps(rows, ensure_ascii=False, indent=2)
    EMBED_JS.write_text(
        f"    const INITIAL_PVHN_BHXH_COLUMNS = {cols_js};\n\n"
        f"    const INITIAL_PVHN_BHXH_DATA = {rows_js};\n",
        encoding="utf-8",
    )


def apply_bhxh_enrichment(pl1: list[dict], pdf_path: Path | None = None) -> tuple[list[dict], list[dict], list[dict]]:
    catalog = read_bhxh_catalog(pdf_path or PDF_PATH)
    catalog = enrich_catalog_with_tags(catalog)
    catalog_by_ma = {r["maPhamVi"]: r for r in catalog}
    pl1 = enrich_pl1_bhxh(pl1, catalog_by_ma)
    index = build_bhxh_dvkt_index(pl1)
    catalog = attach_dvkt_counts_to_catalog(catalog, index)
    return pl1, catalog, catalog_columns()


def build_pl1_indexes(pl1: list[dict]) -> tuple[dict[str, dict], dict[str, dict]]:
    by_ma = {r.get("maTuongDuong", ""): r for r in pl1 if r.get("maTuongDuong")}
    by_tt43 = {norm_code(r.get("maTT43", "")): r for r in pl1 if norm_code(r.get("maTT43", ""))}
    return by_ma, by_tt43


def merge_all_catalogs(pdf_path: Path | None = None) -> dict[str, dict]:
    packs: dict[str, dict] = {}
    pl1_pack = load_pack("pl1")
    if not pl1_pack:
        raise SystemExit("Thieu dvkt_app/data/pl1.json.gz — chay extract truoc")
    pl1 = pl1_pack["rows"]
    print("Enrich BHXH tren PL1...")
    pl1, catalog, bhxh_cols = apply_bhxh_enrichment(pl1, pdf_path)
    pl1_cols = pl1_column_defs(pl1_pack.get("columns"))
    packs["pl1"] = {"columns": pl1_cols, "rows": pl1}
    packs["pvhnbhxh"] = {"columns": bhxh_cols, "rows": catalog}

    by_ma, by_tt43 = build_pl1_indexes(pl1)

    for tab in ("tt23pl1", "tt23pl2"):
        pack = load_pack(tab)
        if not pack:
            continue
        rows, n = enrich_tt23_pvhn(pl1, pack["rows"])
        cols = reorder_columns(pack["columns"], TT23_COLUMN_ORDER, TT23_PVHN_COLUMNS)
        packs[tab] = {"columns": cols, "rows": rows}
        print(f"  {tab}: BHXH/PVHN linked {n}/{len(rows)}")

    for tab in ("bvpcst", "bvpcct", "bvpsd"):
        pack = load_pack(tab)
        if not pack:
            continue
        rows, n = propagate_bhxh_from_pl1(pack["rows"], by_ma, by_tt43)
        cols = reorder_columns(pack["columns"], BV_COLUMN_ORDER, BV_BHXH_EXTRA)
        packs[tab] = {"columns": cols, "rows": rows}
        print(f"  {tab}: BHXH linked {n}/{len(rows)}")

    for tab, order, extras in (
        ("pl2", PL2_COLUMN_ORDER, PL2_BHXH_COLUMNS),
        ("pl3", PL3_COLUMN_ORDER, PL2_BHXH_COLUMNS),
    ):
        pack = load_pack(tab)
        if not pack:
            continue
        rows, n = propagate_bhxh_from_pl1(pack["rows"], by_ma, by_tt43, link_key="maTuongDuong")
        cols = reorder_columns(pack["columns"], order, extras)
        packs[tab] = {"columns": cols, "rows": rows}
        print(f"  {tab}: BHXH linked {n}/{len(rows)}")

    for tab in DATASET_IDS:
        if tab not in packs:
            pack = load_pack(tab)
            if pack:
                packs[tab] = pack

    return packs


def save_all_packs(packs: dict[str, dict]) -> None:
    DEFAULT_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for tab_id, pack in packs.items():
        save_dataset(tab_id, pack["columns"], pack["rows"], DEFAULT_DATA_DIR)
    manifest = {
        "tabs": [t for t in DATASET_IDS if t in packs],
        "version": __import__("datetime").date.today().isoformat(),
        "columns": {tab_id: pack["columns"] for tab_id, pack in packs.items()},
    }
    (DEFAULT_DATA_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    print("=== Merge BHXH toan bo danh muc ===")
    packs = merge_all_catalogs()
    pl1 = packs["pl1"]["rows"]
    catalog = packs["pvhnbhxh"]["rows"]
    mapped = sum(1 for r in pl1 if r.get("maPhamViBHXH"))
    with_dvkt = sum(1 for r in catalog if r.get("soDvktDuocPhep", 0) > 0)
    print(f"PL1 co ma BHXH: {mapped}/{len(pl1)}")
    print(f"Chuc danh BHXH co DVKT: {with_dvkt}/{len(catalog)}")

    qa = validate_bhxh_mapping(pl1)
    multi = sum(1 for r in pl1 if ";" in str(r.get("maPhamViBHXH", "")))
    print(f"DVKT nhieu ma BHXH (;): {multi}")
    if qa["pvhn_no_bhxh"]:
        print(f"CANH BAO: {len(qa['pvhn_no_bhxh'])} DVKT co PVHN nhung chua co ma BHXH")
    if qa["missing_codes"]:
        print(f"CANH BAO: {len(qa['missing_codes'])} DVKT thieu ma BHXH so voi tag PVHN")
    if qa["bad_separator"]:
        print(f"CANH BAO: {len(qa['bad_separator'])} DVKT sai dinh dang phan cach (;)")
    if qa["unknown_tags"]:
        print(f"CANH BAO: tag PVHN chua map BHXH: {qa['unknown_tags']}")
    if not qa["pvhn_no_bhxh"] and not qa["missing_codes"] and not qa["bad_separator"]:
        print("QA mapping BHXH: OK — day du ma, dung dinh dang ';'")

    write_bhxh_embed(packs["pvhnbhxh"]["columns"], catalog)
    print(f"Da ghi {EMBED_JS.name}")
    save_all_packs(packs)
    print(f"Da cap nhat {len(packs)} dataset trong dvkt_app/data/")


if __name__ == "__main__":
    main()
