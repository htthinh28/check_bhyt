# -*- coding: utf-8 -*-
"""Map danh mục DVKT bệnh viện vào QĐ7603 / TT23 / PVHN."""
from __future__ import annotations

import json
import re
from pathlib import Path

import openpyxl

from _merge_tt23_mapping import name_similarity, norm_code, norm_text, patch_block

BASE = Path(__file__).resolve().parent
HTML_PATH = BASE / "dich vụ kỹ thuật.html"
BV_EMBED_JS = BASE / "_bv_embed.js"

BV_COLUMNS = [
    {"key": "stt", "label": "STT", "type": "number"},
    {"key": "maDichVu", "label": "Mã dịch vụ BV", "type": "text"},
    {"key": "tenDichVu", "label": "Tên dịch vụ BV", "type": "text"},
    {"key": "tagsMapping", "label": "Thẻ mapping QĐ7603 · TT23 · PVHN", "type": "computed"},
    {"key": "lienKetQD7603", "label": "Liên kết QĐ7603", "type": "text"},
    {"key": "maTT43", "label": "Mã TT43", "type": "text"},
    {"key": "tenTT43", "label": "Tên TT43 (QĐ7603)", "type": "text"},
    {"key": "theLienKetTT23", "label": "Thẻ TT23", "type": "text"},
    {"key": "maKyThuatTT23", "label": "Mã TT23", "type": "text"},
    {"key": "tenKyThuatTT23", "label": "Tên TT23", "type": "text"},
    {"key": "thePhamViHanhNghe", "label": "Phạm vi hành nghề", "type": "text"},
    {"key": "tenPhamViHanhNghe", "label": "Tên phạm vi hành nghề", "type": "text"},
    {"key": "chuyenKhoaPVHN", "label": "Chuyên khoa (BS CK…)", "type": "text"},
    {"key": "chiTietChuyenKhoaPVHN", "label": "Chi tiết chuyên khoa", "type": "text"},
    {"key": "doTinCayMapping", "label": "Độ tin cậy mapping", "type": "text"},
    {"key": "ghiChuMapping", "label": "Ghi chú mapping", "type": "text"},
    {"key": "doTinCayPhamVi", "label": "Độ tin cậy PVHN", "type": "text"},
    {"key": "ghiChuPhamVi", "label": "Ghi chú PVHN", "type": "text"},
    {"key": "maPhamViBHXH", "label": "Mã PVHN BHXH", "type": "text"},
    {"key": "tenChucDanhBHXH", "label": "Chức danh BHXH", "type": "text"},
    {"key": "soChucDanhBHXH", "label": "Số chức danh BHXH", "type": "number"},
    {"key": "doTinCayBHXH", "label": "Độ tin cậy BHXH", "type": "text"},
    {"key": "donGia", "label": "Đơn giá BV", "type": "number"},
    {"key": "maGia", "label": "Mã giá", "type": "number"},
    {"key": "giaBhyt", "label": "Giá TT BHYT", "type": "number"},
    {"key": "phanLoaiPttt", "label": "Phân loại PTTT", "type": "text"},
    {"key": "tuNgay", "label": "Từ ngày", "type": "text"},
    {"key": "denNgay", "label": "Đến ngày", "type": "text"},
    {"key": "ghiChuBV", "label": "Ghi chú BV", "type": "text"},
    {"key": "quyetDinh", "label": "Quyết định giá", "type": "text"},
    {"key": "maCSKCB", "label": "Mã CSKCB", "type": "text"},
    {"key": "tenBenhVien", "label": "Bệnh viện", "type": "text"},
]

BV_HOSPITALS = [
    {
        "id": "bvpcst",
        "embedPrefix": "BVPCST",
        "label": "BV PC Sóc Trăng",
        "tenDayDu": "CSKCB Sóc Trăng (94170)",
        "theNguonGoc": "BV_PCST",
        "maCSKCB": "",
        "xlsx": Path(
            r"c:\Users\admin\Documents\Google Drive\BHYT\danh muc benh vien\DM\FileMau_DANH_MUC_DVKT_M05 (2).xlsx"
        ),
        "sheet": "Template",
        "format": "m05",
        "pl1Columns": [
            {"key": "coTaiBV_PCST", "label": "Có tại BV PCST", "type": "text"},
            {"key": "donGiaPCST", "label": "Đơn giá PCST", "type": "number"},
            {"key": "maGiaPCST", "label": "Mã giá PCST", "type": "number"},
            {"key": "ghiChuBV_PCST", "label": "Ghi chú BV PCST", "type": "text"},
        ],
        "pl1Fields": {
            "co": "coTaiBV_PCST",
            "donGia": "donGiaPCST",
            "maGia": "maGiaPCST",
            "ghiChu": "ghiChuBV_PCST",
        },
    },
    {
        "id": "bvpcct",
        "embedPrefix": "BVPCCT",
        "label": "BV PC Cần Thơ",
        "tenDayDu": "CSKCB Cần Thơ",
        "theNguonGoc": "BV_PCCT",
        "maCSKCB": "",
        "xlsx": Path(r"c:\Users\admin\Documents\Google Drive\BHYT\PC CT\FileDichVuBV (1).xlsx"),
        "sheet": "Sheet",
        "format": "pcct",
        "pl1Columns": [
            {"key": "coTaiBV_PCCT", "label": "Có tại BV PCCT", "type": "text"},
            {"key": "donGiaPCCT", "label": "Đơn giá PCCT", "type": "number"},
            {"key": "maGiaPCCT", "label": "Mã giá PCCT", "type": "number"},
            {"key": "ghiChuBV_PCCT", "label": "Ghi chú BV PCCT", "type": "text"},
        ],
        "pl1Fields": {
            "co": "coTaiBV_PCCT",
            "donGia": "donGiaPCCT",
            "maGia": "maGiaPCCT",
            "ghiChu": "ghiChuBV_PCCT",
        },
    },
    {
        "id": "bvpsd",
        "embedPrefix": "BVPSD",
        "label": "BV PC Sa Đéc",
        "tenDayDu": "BV Sa Đéc",
        "theNguonGoc": "BV_PSD",
        "maCSKCB": "",
        "xlsx": Path(r"c:\Users\admin\Downloads\DM cổng (1)\DM cổng\FileDichVuBV 15.06.xlsx"),
        "sheet": "Sheet",
        "format": "pcct",
        "pl1Columns": [
            {"key": "coTaiBV_PSD", "label": "Có tại BV Sa Đéc", "type": "text"},
            {"key": "donGiaPSD", "label": "Đơn giá Sa Đéc", "type": "number"},
            {"key": "maGiaPSD", "label": "Mã giá Sa Đéc", "type": "number"},
            {"key": "ghiChuBV_PSD", "label": "Ghi chú BV Sa Đéc", "type": "text"},
        ],
        "pl1Fields": {
            "co": "coTaiBV_PSD",
            "donGia": "donGiaPSD",
            "maGia": "maGiaPSD",
            "ghiChu": "ghiChuBV_PSD",
        },
    },
]

M05_HEADERS = [
    "STT",
    "MA_DICH_VU",
    "TEN_DICH_VU",
    "TEN_DVKT_GIA",
    "DON_GIA",
    "QUY_TRINH",
    "CS_THUCHIEN",
    "TINHTRANG_DV",
    "MA_GIA",
    "TEN_GIA",
    "GIA_TT_BHYT",
    "MA_PTTT",
    "TU_NGAY",
    "DEN_NGAY",
    "MA_CSKCB",
    "PHAN_LOAI_PTTT",
    "GHICHU",
    "QUYET_DINH",
]

PCCT_HEADERS = [
    "STT",
    "MA_TUONG_DUONG",
    "TEN_DVKT_PHEDUYET",
    "TEN_DVKT_GIA",
    "PHAN_LOAI_PTTT",
    "DON_GIA",
    "GHICHU",
    "QUYET_DINH",
    "TUNGAY",
    "DENNGAY",
    "CSKCB_CGKT",
    "CSKCB_CLS",
    "ID",
]


def load_json_block(html: str, name: str) -> list[dict]:
    m = re.search(rf"const {name} = (\[.*?\]);", html, re.S)
    if not m:
        raise SystemExit(f"Khong tim thay {name}")
    return json.loads(m.group(1))


def load_pl1_from_html(html: str) -> list[dict]:
    return load_json_block(html, "INITIAL_PL1_DATA")


def read_sheet_rows(xlsx_path: Path, sheet: str, headers: list[str], code_col: int = 1) -> list[dict]:
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb[sheet]
    rows: list[dict] = []
    for raw in ws.iter_rows(min_row=2, values_only=True):
        if not raw or raw[code_col] is None:
            continue
        rows.append({h: raw[i] if i < len(raw) else None for i, h in enumerate(headers)})
    return rows


def normalize_row_m05(row: dict) -> dict:
    return row


def normalize_row_pcct(row: dict) -> dict:
    return {
        "STT": row.get("STT"),
        "MA_DICH_VU": row.get("MA_TUONG_DUONG"),
        "TEN_DICH_VU": row.get("TEN_DVKT_PHEDUYET"),
        "TEN_DVKT_GIA": row.get("TEN_DVKT_GIA"),
        "DON_GIA": row.get("DON_GIA"),
        "MA_GIA": row.get("ID"),
        "GIA_TT_BHYT": row.get("DON_GIA"),
        "PHAN_LOAI_PTTT": row.get("PHAN_LOAI_PTTT"),
        "TU_NGAY": row.get("TUNGAY"),
        "DEN_NGAY": row.get("DENNGAY"),
        "GHICHU": row.get("GHICHU"),
        "QUYET_DINH": row.get("QUYET_DINH"),
        "MA_CSKCB": row.get("CSKCB_CLS") or row.get("CSKCB_CGKT"),
    }


def read_bv_rows(cfg: dict) -> list[dict]:
    fmt = cfg.get("format", "m05")
    if fmt == "pcct":
        raw = read_sheet_rows(cfg["xlsx"], cfg["sheet"], PCCT_HEADERS, code_col=1)
        return [normalize_row_pcct(r) for r in raw]
    raw = read_sheet_rows(cfg["xlsx"], cfg["sheet"], M05_HEADERS, code_col=1)
    return [normalize_row_m05(r) for r in raw]


def as_num(value) -> int | float | None:
    if value is None or value == "":
        return None
    try:
        n = float(value)
        return int(n) if n == int(n) else n
    except (TypeError, ValueError):
        return None


def as_str(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value == int(value):
        return str(int(value))
    return str(value).strip()


def normalize_bv_code(ma: str) -> str:
    ma = as_str(ma)
    if ma.endswith("_GT"):
        return ma[:-3]
    return ma


def index_pl1(pl1: list[dict]) -> tuple[dict[str, dict], dict[str, list[dict]], dict[str, list[dict]]]:
    by_ma: dict[str, dict] = {}
    by_tt43: dict[str, list[dict]] = {}
    by_ten: dict[str, list[dict]] = {}
    for row in pl1:
        ma = as_str(row.get("maTuongDuong", ""))
        if ma:
            by_ma[ma] = row
        code = norm_code(row.get("maTT43", ""))
        if code:
            by_tt43.setdefault(code, []).append(row)
        by_ten.setdefault(norm_text(row.get("tenTT43", "")), []).append(row)
    return by_ma, by_tt43, by_ten


def pick_best_tt43(candidates: list[dict], ten: str) -> tuple[dict, str, str]:
    if len(candidates) == 1:
        score = name_similarity(ten, candidates[0].get("tenTT43", ""))
        if score >= 0.55:
            return candidates[0], "mã TT43 + tên", "Cao" if score >= 0.85 else "Trung bình"
        return candidates[0], "mã TT43 (tên lệch)", "Thấp"
    scored = [(name_similarity(ten, c.get("tenTT43", "")), c) for c in candidates]
    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best = scored[0]
    if best_score >= 0.85:
        return best, "mã TT43 + tên", "Cao"
    if best_score >= 0.55:
        return best, "mã TT43 (ưu tiên tên gần đúng)", "Trung bình"
    if best_score >= 0.4:
        return best, "mã TT43 (nhiều mã trùng, tên yếu)", "Thấp"
    return best, "mã TT43 (nhiều mã trùng)", "Thấp"


def match_hospital_row(
    row: dict,
    by_ma: dict[str, dict],
    by_tt43: dict[str, list[dict]],
    by_ten: dict[str, list[dict]],
    pl1: list[dict],
) -> tuple[dict | None, str, str]:
    ma = normalize_bv_code(row.get("MA_DICH_VU", ""))
    ten = as_str(row.get("TEN_DICH_VU", ""))

    if ma and ma in by_ma:
        hit = by_ma[ma]
        score = name_similarity(ten, hit.get("tenTT43", ""))
        if score >= 0.85:
            return hit, "mã dịch vụ + tên", "Cao"
        if score >= 0.55:
            return hit, "mã dịch vụ (tên khác biệt nhẹ)", "Trung bình"
        return hit, "mã dịch vụ (tên lệch)", "Trung bình"

    code = norm_code(ma)
    if code and code in by_tt43:
        hit, method, conf = pick_best_tt43(by_tt43[code], ten)
        return hit, method, conf

    ten_n = norm_text(ten)
    if ten_n and ten_n in by_ten:
        cands = by_ten[ten_n]
        return cands[0], "tên chính xác", "Cao" if len(cands) == 1 else "Trung bình"

    best_score = 0.0
    best = None
    for cand in pl1:
        score = name_similarity(ten, cand.get("tenTT43", ""))
        if score > best_score:
            best_score = score
            best = cand
    if best and best_score >= 0.88:
        return best, "tên gần đúng", "Trung bình"
    if best and best_score >= 0.75:
        return best, "tên gần đúng (độ tin cậy thấp)", "Thấp"
    return None, "", "Không khớp"


def mapping_note_bv(method: str, ma_bv: str, ten_bv: str, pl1: dict) -> str:
    parts = [f"Liên kết QĐ7603 theo {method}"]
    parts.append(f"mã BV: {ma_bv}")
    parts.append(f"tên BV: «{ten_bv}»")
    parts.append(f"mã QĐ7603: {pl1.get('maTuongDuong', '')}")
    parts.append(f"tên QĐ7603: «{pl1.get('tenTT43', '')}»")
    if pl1.get("tenKyThuatTT23"):
        parts.append(f"TT23: «{pl1.get('tenKyThuatTT23', '')}»")
    return " · ".join(parts)


def build_bv_rows(rows: list[dict], pl1: list[dict], cfg: dict) -> tuple[list[dict], dict]:
    by_ma, by_tt43, by_ten = index_pl1(pl1)
    bv_rows: list[dict] = []
    stats = {"total": len(rows), "co_mapping": 0, "khong_mapping": 0, "cao": 0, "trung_binh": 0, "thap": 0}
    bv_id = cfg["id"]

    for row in rows:
        ma_bv = as_str(row.get("MA_DICH_VU", ""))
        ten_bv = as_str(row.get("TEN_DICH_VU", ""))
        pl1_hit, method, conf = match_hospital_row(row, by_ma, by_tt43, by_ten, pl1)

        item = {
            "_rowId": f"{bv_id}-{ma_bv or row.get('STT')}",
            "stt": as_num(row.get("STT")) or 0,
            "maDichVu": ma_bv,
            "tenDichVu": ten_bv,
            "tenDvktGia": as_str(row.get("TEN_DVKT_GIA", "")),
            "donGia": as_num(row.get("DON_GIA")) or 0,
            "maGia": as_num(row.get("MA_GIA")) or 0,
            "giaBhyt": as_num(row.get("GIA_TT_BHYT")) or 0,
            "phanLoaiPttt": as_str(row.get("PHAN_LOAI_PTTT", "")),
            "tuNgay": as_str(row.get("TU_NGAY", "")),
            "denNgay": as_str(row.get("DEN_NGAY", "")),
            "ghiChuBV": as_str(row.get("GHICHU", "")),
            "quyetDinh": as_str(row.get("QUYET_DINH", "")),
            "maCSKCB": as_str(row.get("MA_CSKCB", "")) or cfg.get("maCSKCB", ""),
            "tenBenhVien": cfg["tenDayDu"],
            "theNguonGoc": cfg["theNguonGoc"],
            "vanBanNguon": f"Danh mục DVKT — {cfg['tenDayDu']}",
        }

        if pl1_hit:
            item.update(
                {
                    "lienKetQD7603": pl1_hit.get("maTuongDuong", ""),
                    "maTT43": pl1_hit.get("maTT43", ""),
                    "tenTT43": pl1_hit.get("tenTT43", ""),
                    "theLienKetTT23": pl1_hit.get("theLienKetTT23", ""),
                    "maKyThuatTT23": pl1_hit.get("maKyThuatTT23", ""),
                    "tenKyThuatTT23": pl1_hit.get("tenKyThuatTT23", ""),
                    "thePhamViHanhNghe": pl1_hit.get("thePhamViHanhNghe", ""),
                    "tenPhamViHanhNghe": pl1_hit.get("tenPhamViHanhNghe", ""),
                    "chuyenKhoaPVHN": pl1_hit.get("chuyenKhoaPVHN", ""),
                    "chiTietChuyenKhoaPVHN": pl1_hit.get("chiTietChuyenKhoaPVHN", ""),
                    "doTinCayMapping": conf,
                    "ghiChuMapping": mapping_note_bv(method, ma_bv, ten_bv, pl1_hit),
                }
            )
            stats["co_mapping"] += 1
            if conf == "Cao":
                stats["cao"] += 1
            elif conf == "Trung bình":
                stats["trung_binh"] += 1
            else:
                stats["thap"] += 1
        else:
            item.update(
                {
                    "lienKetQD7603": "",
                    "maTT43": "",
                    "tenTT43": "",
                    "theLienKetTT23": "",
                    "maKyThuatTT23": "",
                    "tenKyThuatTT23": "",
                    "thePhamViHanhNghe": "",
                    "tenPhamViHanhNghe": "",
                    "chuyenKhoaPVHN": "",
                    "chiTietChuyenKhoaPVHN": "",
                    "doTinCayMapping": "Không khớp",
                    "ghiChuMapping": f"Chưa tìm thấy trong QĐ7603 — mã BV: {ma_bv} · «{ten_bv}»",
                }
            )
            stats["khong_mapping"] += 1

        bv_rows.append(item)

    return bv_rows, stats


def enrich_pl1_with_bv(pl1: list[dict], bv_rows: list[dict], cfg: dict) -> int:
    fields = cfg["pl1Fields"]
    by_ma: dict[str, dict] = {}
    for r in bv_rows:
        if r.get("maDichVu"):
            by_ma[r["maDichVu"]] = r
        base = normalize_bv_code(r.get("maDichVu", ""))
        if base and base not in by_ma:
            by_ma[base] = r

    linked = 0
    for row in pl1:
        ma = as_str(row.get("maTuongDuong", ""))
        bv = by_ma.get(ma)
        if bv and bv.get("lienKetQD7603"):
            row[fields["co"]] = "Có"
            row[fields["donGia"]] = bv.get("donGia", 0)
            row[fields["maGia"]] = bv.get("maGia", 0)
            row[fields["ghiChu"]] = bv.get("ghiChuBV", "")
            linked += 1
    return linked


def merge_columns(existing: list[dict], extras: list[dict]) -> list[dict]:
    by_key = {c["key"]: c for c in existing}
    for col in extras:
        if col["key"] not in by_key:
            by_key[col["key"]] = col
    return list(by_key.values())


def write_bv_embed(hospitals: list[tuple[dict, list[dict], list[dict]]]) -> None:
    parts: list[str] = []
    for cfg, columns, data in hospitals:
        prefix = cfg["embedPrefix"]
        cols_js = json.dumps(columns, ensure_ascii=False, indent=2)
        data_js = json.dumps(data, ensure_ascii=False, indent=2)
        parts.append(f"    const INITIAL_{prefix}_COLUMNS = {cols_js};")
        parts.append(f"    const INITIAL_{prefix}_DATA = {data_js};")
    BV_EMBED_JS.write_text("\n\n".join(parts) + "\n", encoding="utf-8")


def main() -> None:
    html = HTML_PATH.read_text(encoding="utf-8")
    pl1 = load_pl1_from_html(html)
    pl1_cols = load_json_block(html, "INITIAL_PL1_COLUMNS")

    embed_hospitals: list[tuple[dict, list[dict], list[dict]]] = []
    for cfg in BV_HOSPITALS:
        if not cfg["xlsx"].is_file():
            print(f"SKIP {cfg['id']}: khong tim thay {cfg['xlsx']}")
            continue
        rows = read_bv_rows(cfg)
        bv_rows, stats = build_bv_rows(rows, pl1, cfg)
        linked = enrich_pl1_with_bv(pl1, bv_rows, cfg)
        pl1_cols = merge_columns(pl1_cols, cfg["pl1Columns"])
        embed_hospitals.append((cfg, BV_COLUMNS, bv_rows))
        print(f"[{cfg['id']}] rows={stats['total']} mapping={stats} pl1_linked={linked}")

    if not embed_hospitals:
        raise SystemExit("Khong co BV nao duoc merge")

    write_bv_embed(embed_hospitals)
    html = patch_block(html, "INITIAL_PL1_COLUMNS", pl1_cols, "const INITIAL_PL1_DATA")
    html = patch_block(html, "INITIAL_PL1_DATA", pl1, "const INITIAL_PL2_COLUMNS")
    HTML_PATH.write_text(html, encoding="utf-8")
    print(f"Da cap nhat HTML + {BV_EMBED_JS.name}")
