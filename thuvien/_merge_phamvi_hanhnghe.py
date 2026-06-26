# -*- coding: utf-8 -*-
"""Gắn thẻ phạm vi hành nghề TT32 vào PL1 QĐ7603."""
from __future__ import annotations

import json
import re
from pathlib import Path

from _merge_tt23_mapping import name_similarity, norm_code, norm_text, patch_block
from _parse_phamvi_docx import PVHN_FILES, read_all_phamvi

try:
    from _bhxh_pvhn_bridge import PL1_BHXH_COLUMNS
except ImportError:
    PL1_BHXH_COLUMNS = []

BASE = Path(__file__).resolve().parent
HTML_PATH = BASE / "dich vụ kỹ thuật.html"

TAGS_MAPPING_COLUMN = {
    "key": "tagsMapping",
    "label": "Thẻ mapping QĐ7603 · TT23 · PVHN",
    "type": "computed",
}

PVHN_EXTRA_COLUMNS = [
    {"key": "thePhamViHanhNghe", "label": "Phạm vi hành nghề (mã)", "type": "text"},
    {"key": "tenPhamViHanhNghe", "label": "Tên phạm vi hành nghề", "type": "text"},
    {"key": "chuyenKhoaPVHN", "label": "Chuyên khoa (BS CK…)", "type": "text"},
    {"key": "chiTietChuyenKhoaPVHN", "label": "Chi tiết chuyên khoa", "type": "text"},
    {"key": "doTinCayPhamVi", "label": "Độ tin cậy PVHN", "type": "text"},
    {"key": "ghiChuPhamVi", "label": "Ghi chú PVHN", "type": "text"},
] + list(PL1_BHXH_COLUMNS)

TT23_PVHN_COLUMNS = [
    TAGS_MAPPING_COLUMN,
    {"key": "thePhamViHanhNghe", "label": "Phạm vi hành nghề", "type": "text"},
    {"key": "tenPhamViHanhNghe", "label": "Tên phạm vi hành nghề", "type": "text"},
    {"key": "chuyenKhoaPVHN", "label": "Chuyên khoa (BS CK…)", "type": "text"},
    {"key": "chiTietChuyenKhoaPVHN", "label": "Chi tiết chuyên khoa", "type": "text"},
    {"key": "doTinCayPhamVi", "label": "Độ tin cậy PVHN", "type": "text"},
    {"key": "ghiChuPhamVi", "label": "Ghi chú PVHN", "type": "text"},
]

TT23_PVHN_COLUMNS = TT23_PVHN_COLUMNS + PL1_BHXH_COLUMNS

PL2_BHXH_COLUMNS = [
    {"key": "thePhamViHanhNghe", "label": "Phạm vi hành nghề (mã)", "type": "text"},
    {"key": "maPhamViBHXH", "label": "Mã PVHN BHXH", "type": "text"},
    {"key": "tenChucDanhBHXH", "label": "Chức danh BHXH", "type": "text"},
    {"key": "doTinCayBHXH", "label": "Độ tin cậy BHXH", "type": "text"},
]

PL1_COLUMN_ORDER = [
    "stt",
    "maTuongDuong",
    "maTT43",
    "tenTT43",
    "tagsMapping",
    "theNguonGoc",
    "theLienKetTT23",
    "thePhamViHanhNghe",
    "tenPhamViHanhNghe",
    "chuyenKhoaPVHN",
    "chiTietChuyenKhoaPVHN",
    "maPhamViBHXH",
    "tenChucDanhBHXH",
    "soChucDanhBHXH",
    "doTinCayBHXH",
    "doTinCayPhamVi",
    "maKyThuatTT23",
    "tenKyThuatTT23",
    "doTinCayMapping",
    "ghiChuMapping",
    "ghiChuPhamVi",
    "phanTuyen",
    "phanLoai",
    "sttTT39",
    "tenTT39",
    "giaTT39",
    "chuyenKhoa",
    "maLienThong",
    "vanBanNguon",
]


def load_pl1_from_html(html: str) -> list[dict]:
    m = re.search(
        r"const INITIAL_PL1_DATA = (\[.*?\]);\s*\n\n\s*const INITIAL_PL2_COLUMNS",
        html,
        re.S,
    )
    if not m:
        raise SystemExit("Khong tim thay INITIAL_PL1_DATA")
    return json.loads(m.group(1))


def load_json_block(html: str, name: str) -> list[dict]:
    m = re.search(rf"const {name} = (\[.*?\]);", html, re.S)
    if not m:
        raise SystemExit(f"Khong tim thay {name}")
    return json.loads(m.group(1))


def load_pl1_columns_from_html(html: str) -> list[dict]:
    m = re.search(
        r"const INITIAL_PL1_COLUMNS = (\[.*?\]);\s*\n\n\s*const INITIAL_PL1_DATA",
        html,
        re.S,
    )
    if not m:
        raise SystemExit("Khong tim thay INITIAL_PL1_COLUMNS")
    return json.loads(m.group(1))


def index_phamvi(records: list[dict]) -> tuple[dict, dict, dict]:
    by_ma: dict[str, list[dict]] = {}
    by_ten: dict[str, list[dict]] = {}
    by_token: dict[str, list[dict]] = {}
    for r in records:
        code = norm_code(r.get("maTT43", ""))
        if code:
            by_ma.setdefault(code, []).append(r)
        ten_n = norm_text(r.get("tenKyThuat", ""))
        if ten_n:
            by_ten.setdefault(ten_n, []).append(r)
            token = _first_token(ten_n)
            if token:
                by_token.setdefault(token, []).append(r)
    return by_ma, by_ten, by_token


def _first_token(ten_n: str) -> str:
    for word in ten_n.split():
        if len(word) >= 4:
            return word
    return ten_n[:8] if ten_n else ""


def match_phamvi_for_item(
    item: dict,
    by_ma: dict,
    by_ten: dict,
    by_token: dict,
    name_threshold: float = 0.88,
) -> list[dict]:
    ma43 = norm_code(item.get("maTT43", ""))
    ten = item.get("tenTT43", "") or item.get("tenKyThuatTT23", "")
    ten_n = norm_text(ten)
    hits: dict[str, dict] = {}

    if ma43 and ma43 in by_ma:
        for pv in by_ma[ma43]:
            score = name_similarity(ten, pv["tenKyThuat"])
            conf = "Cao" if score >= 0.85 else ("Trung bình" if score >= 0.55 else "Thấp")
            method = "mã TT43" if score >= 0.85 else "mã TT43 (tên gần đúng)"
            key = f"{pv['phamVi']}:{pv.get('chuyenKhoaChinh','')}:{pv['maTT43']}:{pv['tenKyThuat']}"
            hits[key] = {**pv, "doTinCay": conf, "method": method, "score": score}

    if ten_n and ten_n in by_ten:
        for pv in by_ten[ten_n]:
            key = f"{pv['phamVi']}:{pv.get('chuyenKhoaChinh','')}:{pv['maTT43']}:{pv['tenKyThuat']}"
            if key not in hits:
                hits[key] = {**pv, "doTinCay": "Cao", "method": "tên chính xác", "score": 1.0}

    if ten_n and not hits:
        candidates: list[dict] = []
        seen_ids: set[str] = set()
        token = _first_token(ten_n)
        for pv in by_token.get(token, []):
            pid = f"{pv['phamVi']}:{pv['tenKyThuat']}"
            if pid not in seen_ids:
                seen_ids.add(pid)
                candidates.append(pv)
        if len(candidates) < 5:
            for pv_list in by_ten.values():
                for pv in pv_list:
                    pid = f"{pv['phamVi']}:{pv['tenKyThuat']}"
                    if pid in seen_ids:
                        continue
                    n2 = norm_text(pv["tenKyThuat"])
                    if ten_n in n2 or n2 in ten_n:
                        seen_ids.add(pid)
                        candidates.append(pv)
        for pv in candidates:
            score = name_similarity(ten, pv["tenKyThuat"])
            if score >= name_threshold:
                key = f"{pv['phamVi']}:{pv.get('chuyenKhoaChinh','')}:{pv['maTT43']}:{pv['tenKyThuat']}"
                if key not in hits:
                    hits[key] = {
                        **pv,
                        "doTinCay": "Trung bình" if score < 0.95 else "Cao",
                        "method": "tên gần đúng",
                        "score": score,
                    }

    ordered = sorted(hits.values(), key=lambda x: (-x["score"], x["phamVi"]))
    return ordered


def enrich_pl1_phamvi(pl1: list[dict], pvhn_records: list[dict]) -> tuple[list[dict], dict]:
    by_ma, by_ten, by_token = index_phamvi(pvhn_records)
    stats = {
        "co_phamvi": 0,
        "khong_phamvi": 0,
        "nhieu_phamvi": 0,
        **{k: 0 for k in PVHN_FILES},
    }

    for item in pl1:
        matches = match_phamvi_for_item(item, by_ma, by_ten, by_token)
        if matches:
            tags = []
            labels = []
            notes = []
            confs = []
            chuyen_khoas = []
            chi_tiets = []
            for m in matches:
                tags.append(m["phamVi"])
                labels.append(m["phamViLabel"])
                confs.append(m["doTinCay"])
                note = m["phamViLabel"]
                if m.get("duongDanChuyenKhoa"):
                    note += f" [{m['duongDanChuyenKhoa']}]"
                note += f" ({m['method']}, {m['doTinCay']})"
                notes.append(note)
                if m.get("chuyenKhoaLabel"):
                    chuyen_khoas.append(m["chuyenKhoaLabel"])
                elif m.get("chuyenKhoaChinh"):
                    chuyen_khoas.append(m["chuyenKhoaChinh"])
                if m.get("duongDanChuyenKhoa"):
                    chi_tiets.append(m["duongDanChuyenKhoa"])
                stat_key = m.get("phamViGoc") or m["phamVi"]
                stats[stat_key] = stats.get(stat_key, 0) + 1
                if m["phamVi"].startswith("PVHN_BSCK_"):
                    stats["PVHN_BSCK"] = stats.get("PVHN_BSCK", 0) + 1
            item["thePhamViHanhNghe"] = ";".join(dict.fromkeys(tags))
            item["tenPhamViHanhNghe"] = "; ".join(dict.fromkeys(labels))
            item["chuyenKhoaPVHN"] = "; ".join(dict.fromkeys(chuyen_khoas))
            item["chiTietChuyenKhoaPVHN"] = "; ".join(dict.fromkeys(chi_tiets))
            best_conf = "Cao" if "Cao" in confs else ("Trung bình" if "Trung bình" in confs else "Thấp")
            item["doTinCayPhamVi"] = best_conf
            item["ghiChuPhamVi"] = " · ".join(notes[:5])
            if len(notes) > 5:
                item["ghiChuPhamVi"] += f" · (+{len(notes) - 5} PVHN khác)"
            stats["co_phamvi"] += 1
            if len(tags) > 1:
                stats["nhieu_phamvi"] += 1
        else:
            item["thePhamViHanhNghe"] = ""
            item["tenPhamViHanhNghe"] = ""
            item["chuyenKhoaPVHN"] = ""
            item["chiTietChuyenKhoaPVHN"] = ""
            item["doTinCayPhamVi"] = "Không khớp"
            item["ghiChuPhamVi"] = "Chưa tìm thấy trong danh mục phạm vi hành nghề TT32/2023"
            stats["khong_phamvi"] += 1

    return pl1, stats


def merge_columns(existing: list[dict], extras: list[dict]) -> list[dict]:
    by_key = {c["key"]: c for c in existing}
    for col in extras:
        if col["key"] not in by_key:
            by_key[col["key"]] = col
    return list(by_key.values())


def reorder_columns(columns: list[dict], order: list[str], ensure: list[dict]) -> list[dict]:
    merged = merge_columns(columns, ensure)
    by_key = {c["key"]: c for c in merged}
    seen: set[str] = set()
    ordered: list[dict] = []
    for k in order:
        if k in by_key and k not in seen:
            ordered.append(by_key[k])
            seen.add(k)
    for col in merged:
        if col["key"] not in seen:
            ordered.append(col)
            seen.add(col["key"])
    return ordered


def copy_pvhn_fields(target: dict, source: dict) -> None:
    from _bhxh_pvhn_bridge import copy_bhxh_fields

    copy_bhxh_fields(target, source)


def enrich_tt23_pvhn(pl1: list[dict], tt23_rows: list[dict]) -> tuple[list[dict], int]:
    by_ma = {r.get("maTuongDuong", ""): r for r in pl1 if r.get("maTuongDuong")}
    by_ma_tt43 = {norm_code(r.get("maTT43", "")): r for r in pl1 if norm_code(r.get("maTT43", ""))}
    linked = 0
    for row in tt23_rows:
        src = None
        link = row.get("lienKetQD7603") or row.get("maTuongDuongQD7603")
        if link and link in by_ma:
            src = by_ma[link]
        elif norm_code(row.get("maKyThuat", "")) in by_ma_tt43:
            src = by_ma_tt43[norm_code(row.get("maKyThuat", ""))]
        if src and src.get("thePhamViHanhNghe"):
            copy_pvhn_fields(row, src)
            linked += 1
        else:
            copy_pvhn_fields(row, {})
            if not row.get("ghiChuPhamVi"):
                row["ghiChuPhamVi"] = "Chưa liên kết PVHN từ QĐ7603"
    return tt23_rows, linked


def main():
    html = HTML_PATH.read_text(encoding="utf-8")
    pl1 = load_pl1_from_html(html)
    pl1_cols = load_pl1_columns_from_html(html)
    tt23_pl1 = load_json_block(html, "INITIAL_TT23_PL1_DATA")
    tt23_pl2 = load_json_block(html, "INITIAL_TT23_PL2_DATA")
    tt23_cols_pl1 = load_json_block(html, "INITIAL_TT23_PL1_COLUMNS")
    tt23_cols_pl2 = load_json_block(html, "INITIAL_TT23_PL2_COLUMNS")

    pvhn_records, parse_stats = read_all_phamvi()
    pl1, enrich_stats = enrich_pl1_phamvi(pl1, pvhn_records)
    tt23_pl1, linked1 = enrich_tt23_pvhn(pl1, tt23_pl1)
    tt23_pl2, linked2 = enrich_tt23_pvhn(pl1, tt23_pl2)

    pl1_cols = reorder_columns(
        pl1_cols,
        PL1_COLUMN_ORDER,
        [TAGS_MAPPING_COLUMN, *PVHN_EXTRA_COLUMNS],
    )
    tt23_cols_pl1 = reorder_columns(
        tt23_cols_pl1,
        ["stt", "maKyThuat", "tenKyThuat", "tagsMapping", "thePhamViHanhNghe", "tenPhamViHanhNghe",
         "chuyenKhoaPVHN", "chiTietChuyenKhoaPVHN", "maPhamViBHXH", "tenChucDanhBHXH", "soChucDanhBHXH",
         "doTinCayBHXH", "doTinCayPhamVi", "ghiChuPhamVi", "chuong", "lienKetQD7603", "tenTT43QD7603",
         "theNguonGoc", "vanBanNguon", "doTinCayMapping", "ghiChuMapping"],
        TT23_PVHN_COLUMNS,
    )
    tt23_cols_pl2 = reorder_columns(
        tt23_cols_pl2,
        ["stt", "maKyThuat", "tenKyThuat", "tagsMapping", "thePhamViHanhNghe", "tenPhamViHanhNghe",
         "chuyenKhoaPVHN", "chiTietChuyenKhoaPVHN", "maPhamViBHXH", "tenChucDanhBHXH", "soChucDanhBHXH",
         "doTinCayBHXH", "doTinCayPhamVi", "ghiChuPhamVi", "chuong", "lienKetQD7603", "tenTT43QD7603",
         "theNguonGoc", "vanBanNguon", "doTinCayMapping", "ghiChuMapping"],
        TT23_PVHN_COLUMNS,
    )

    html = patch_block(html, "INITIAL_PL1_COLUMNS", pl1_cols, "const INITIAL_PL1_DATA")
    html = patch_block(html, "INITIAL_PL1_DATA", pl1, "const INITIAL_PL2_COLUMNS")
    html = patch_block(html, "INITIAL_TT23_PL1_COLUMNS", tt23_cols_pl1, "const INITIAL_TT23_PL1_DATA")
    html = patch_block(html, "INITIAL_TT23_PL1_DATA", tt23_pl1, "const INITIAL_TT23_PL2_COLUMNS")
    html = patch_block(html, "INITIAL_TT23_PL2_COLUMNS", tt23_cols_pl2, "const INITIAL_TT23_PL2_DATA")
    html = patch_block(html, "INITIAL_TT23_PL2_DATA", tt23_pl2, "const CATALOG_TT32_LABEL")
    HTML_PATH.write_text(html, encoding="utf-8")

    print(f"PL1 rows: {len(pl1)}")
    print("Parse PVHN:", parse_stats)
    print("Enrich PVHN:", enrich_stats)
    print(f"TT23 PL1 PVHN linked: {linked1} | TT23 PL2 PVHN linked: {linked2}")
    print(f"Da cap nhat HTML ({len(html) // 1024} KB)")


if __name__ == "__main__":
    main()
