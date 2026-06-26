# -*- coding: utf-8 -*-
"""Cầu nối TT32 PVHN ↔ mã phạm vi BHXH (CV 2024) ↔ DVKT."""
from __future__ import annotations

import re
import unicodedata

# Mã BHXH → thẻ PVHN TT32 (nhiều mã có thể cùng tag)
BHXH_MA_TO_PVHN_TAG: dict[str, str] = {
    "101": "PVHN_BSCK_HSCC",
    "102": "PVHN_BSCK_NOI",
    "102.04": "PVHN_BSCK_NOI",
    "102.05": "PVHN_BSCK_NOI",
    "102.06": "PVHN_BSCK_NOI",
    "102.07": "PVHN_BSCK_NOI",
    "102.50": "PVHN_BSCK_NOI",
    "102.09": "PVHN_BSCK_NOI",
    "102.10": "PVHN_BSCK_HH",
    "102.11": "PVHN_BSCK_NOI",
    "102.14": "PVHN_BSCK_NOI",
    "103": "PVHN_BSCK_NOI",
    "104": "PVHN_BSCK_LAO",
    "105": "PVHN_BSCK_DALIEU",
    "106": "PVHN_BSCK_TAMTHAN",
    "107": "PVHN_BSCK_NOITIET",
    "108": "PVHN_BSYHCT",
    "109": "PVHN_BSCK_GMH",
    "110": "PVHN_BSCK_NGOAI",
    "110.20": "PVHN_BSCK_NGOAI",
    "110.21": "PVHN_BSCK_NGOAI",
    "110.22": "PVHN_BSCK_NGOAI",
    "110.23": "PVHN_BSCK_NGOAI",
    "110.24": "PVHN_BSCK_NGOAI",
    "111": "PVHN_BSCK_NGOAI",
    "112": "PVHN_BSCK_UB",
    "113": "PVHN_BSCK_PS",
    "114": "PVHN_BSCK_NOI",
    "115": "PVHN_BSCK_TMH",
    "116": "PVHN_BSRHM",
    "117": "PVHN_BSCK_PHCN",
    "118": "PVHN_BSCK_DQ",
    "119": "PVHN_BSCK_YHHN",
    "120": "PVHN_BSCK_NS",
    "121": "PVHN_BSCK_TDCN",
    "122": "PVHN_BSCK_HH",
    "123": "PVHN_BSCK_HOASINH",
    "124": "PVHN_BSCK_VS",
    "125": "PVHN_BSCK_GPB",
    "126": "PVHN_BSCK_VIPHAU",
    "127": "PVHN_BSCK_PTNS",
    "128": "PVHN_BSCK_THTM",
    "129": "PVHN_BSYK",
    "130": "PVHN_BSYHDP",
    "131": "PVHN_BSYHCT",
    "132": "PVHN_BSYK",
    "133": "PVHN_DDLS",
    "134": "PVHN_TLLS",
    "201": "PVHN_YSK",
    "202": "PVHN_YSYHCT",
    "301": "PVHN_DD",
    "302": "PVHN_DD",
    "303": "PVHN_DD",
    "304": "PVHN_DD",
    "305": "PVHN_DD",
    "306": "PVHN_DD",
    "307": "PVHN_DD",
    "308": "PVHN_DD",
    "309": "PVHN_DD",
    "310": "PVHN_DD",
    "311": "PVHN_DD",
    "312": "PVHN_DD",
    "313": "PVHN_HS",
    "314": "PVHN_DD",
    "315": "PVHN_DD",
    "316": "PVHN_DD",
    "317": "PVHN_DD",
    "318": "PVHN_DD",
    "319": "PVHN_DD",
    "401": "PVHN_HS",
    "402": "PVHN_HS",
    "501": "PVHN_KTY",
    "502": "PVHN_KTY",
    "503": "PVHN_KTY",
    "504": "PVHN_KTY",
    "505": "PVHN_KTY",
    "506": "PVHN_KTY",
    "507": "PVHN_KTY",
    "508": "PVHN_KTY",
    "509": "PVHN_KTY",
    "510": "PVHN_KTY",
    "511": "PVHN_KTY",
    "512": "PVHN_KTY",
    "513": "PVHN_KTY",
    "514": "PVHN_KTY",
    "515": "PVHN_KTY",
    "601": "PVHN_TLLS",
    "701": "PVHN_BSYHCT",
    "801": "PVHN_KTY",
    "802": "PVHN_KTY",
    "901": "PVHN_KTY",
    "902": "PVHN_KTY",
    "903": "PVHN_KTY",
    "904": "PVHN_KTY",
}

# PVHN tag TT32 → các mã BHXH (chức danh được phép theo danh mục CV)
TAG_TO_BHXH_MA: dict[str, list[str]] = {}
for _ma, _tag in BHXH_MA_TO_PVHN_TAG.items():
    TAG_TO_BHXH_MA.setdefault(_tag, []).append(_ma)

# TT32 PL XVIII — Cấp cứu ngoại viện (không có mã PHAMVI_CM riêng trong CV BHXH)
TAG_TO_BHXH_MA["PVHN_CCNV"] = ["101", "129", "132", "201", "303"]

# Tinh chỉnh theo chi tiết chuyên khoa BS CK (ưu tiên mã con)
CHUYEN_KHOA_HINT_TO_BHXH: list[tuple[str, str]] = [
    (r"tim\s*mạch", "102.04"),
    (r"tiêu\s*hóa", "102.05"),
    (r"cơ.*xương|khớp", "102.06"),
    (r"thận|tiết\s*niệu", "102.07"),
    (r"hô\s*hấp", "102.50"),
    (r"dị\s*ứng", "102.09"),
    (r"huyết\s*học", "102.10"),
    (r"truyền\s*nhiễm", "102.11"),
    (r"thần\s*kinh", "102.14"),
    (r"nhi\s*khoa", "103"),
    (r"ngoại\s*lao|lao", "104"),
    (r"da\s*liễu", "105"),
    (r"tâm\s*thần", "106"),
    (r"nội\s*tiết", "107"),
    (r"y\s*học\s*cổ\s*truyền", "108"),
    (r"gây\s*mê", "109"),
    (r"ngoại\s*thần\s*kinh", "110.20"),
    (r"lồng\s*ngực", "110.21"),
    (r"ngoại\s*tiêu", "110.22"),
    (r"ngoại\s*thận", "110.23"),
    (r"chấn\s*thương|chỉnh\s*hình", "110.24"),
    (r"bỏng", "111"),
    (r"ung\s*bướu", "112"),
    (r"phụ\s*sản", "113"),
    (r"\bmắt\b", "114"),
    (r"tai.*mũi|tmh", "115"),
    (r"răng.*hàm|rhm", "116"),
    (r"phục\s*hồi", "117"),
    (r"điện\s*quang|chẩn\s*đoán\s*hình", "118"),
    (r"hạt\s*nhân", "119"),
    (r"nội\s*soi", "120"),
    (r"thăm\s*dò", "121"),
    (r"hóa\s*sinh", "123"),
    (r"vi\s*sinh", "124"),
    (r"giải\s*phẫu", "125"),
    (r"vi\s*phẫu", "126"),
    (r"phẫu\s*thuật\s*nội\s*soi", "127"),
    (r"tạo\s*hình|thẩm\s*mỹ", "128"),
    (r"hồi\s*sức|cấp\s*cứu", "101"),
    (r"nội\s*khoa", "102"),
    (r"ngoại\s*khoa", "110"),
]

PL1_BHXH_COLUMNS = [
    {"key": "maPhamViBHXH", "label": "Mã PVHN BHXH (PHAMVI_CM)", "type": "text"},
    {"key": "tenChucDanhBHXH", "label": "Chức danh được phép (BHXH)", "type": "text"},
    {"key": "soChucDanhBHXH", "label": "Số chức danh BHXH", "type": "number"},
    {"key": "doTinCayBHXH", "label": "Độ tin cậy mapping BHXH", "type": "text"},
]

BHXH_PROPAGATE_KEYS = (
    "thePhamViHanhNghe",
    "tenPhamViHanhNghe",
    "chuyenKhoaPVHN",
    "chiTietChuyenKhoaPVHN",
    "maPhamViBHXH",
    "tenChucDanhBHXH",
    "soChucDanhBHXH",
    "doTinCayBHXH",
    "doTinCayPhamVi",
    "ghiChuPhamVi",
)


def copy_bhxh_fields(target: dict, source: dict) -> None:
    for key in BHXH_PROPAGATE_KEYS:
        default = 0 if key == "soChucDanhBHXH" else ""
        target[key] = source.get(key, default)


def bhxh_confidence(item: dict, codes: list[str]) -> str:
    if not codes:
        return ""
    if item.get("thePhamViHanhNghe") and item.get("chuyenKhoaPVHN"):
        return "Cao"
    if item.get("thePhamViHanhNghe"):
        return "Trung bình"
    return "Thấp"


def _norm(s: str) -> str:
    text = unicodedata.normalize("NFD", (s or "").lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def split_semicolon_field(value: str) -> list[str]:
    """Tách trường đa giá trị — bắt buộc phân cách bằng ';' (không khoảng trắng)."""
    return [part.strip() for part in str(value or "").split(";") if part.strip()]


def bhxh_code_sort_key(code: str) -> tuple[int, int]:
    parts = code.split(".")
    main = int(parts[0])
    sub = int(parts[1]) if len(parts) > 1 else 0
    return main, sub


def sort_bhxh_codes(codes: list[str]) -> list[str]:
    unique = list(dict.fromkeys(c.strip() for c in codes if c and c.strip()))
    return sorted(unique, key=bhxh_code_sort_key)


def format_ma_pham_vi_bhxh(codes: list[str]) -> str:
    """Nhiều mã PHAMVI_CM → nối bằng ';' (không khoảng trắng)."""
    return ";".join(sort_bhxh_codes(codes))


def hint_bhxh_from_chuyen_khoa(chuyen_khoa: str, chi_tiet: str) -> list[str]:
    segments = split_semicolon_field(chuyen_khoa) + split_semicolon_field(chi_tiet)
    blob = _norm(" ".join(segments) if segments else f"{chuyen_khoa} {chi_tiet}")
    found: list[str] = []
    seen: set[str] = set()
    for pattern, ma in CHUYEN_KHOA_HINT_TO_BHXH:
        if ma in seen:
            continue
        if re.search(pattern, blob):
            found.append(ma)
            seen.add(ma)
    return found


def resolve_bhxh_codes_for_item(item: dict) -> tuple[list[str], list[str]]:
    """Từ thẻ PVHN TT32 (+ chi tiết CK) → đủ mã PHAMVI_CM BHXH, nối bằng ';'."""
    tags = split_semicolon_field(item.get("thePhamViHanhNghe", ""))
    if not tags:
        return [], []

    ma_set: dict[str, None] = {}
    for tag in tags:
        for ma in TAG_TO_BHXH_MA.get(tag, []):
            ma_set[ma] = None

    for hint in hint_bhxh_from_chuyen_khoa(
        item.get("chuyenKhoaPVHN", ""),
        item.get("chiTietChuyenKhoaPVHN", ""),
    ):
        ma_set[hint] = None

    codes = sort_bhxh_codes(list(ma_set))
    return codes, codes


def validate_bhxh_mapping(rows: list[dict]) -> dict[str, list | int]:
    """QA: mọi DVKT có PVHN phải có đủ mã BHXH; định dạng chỉ dùng ';'."""
    report: dict[str, list | int] = {
        "total": len(rows),
        "has_pvhn": 0,
        "has_bhxh": 0,
        "pvhn_no_bhxh": [],
        "missing_codes": [],
        "bad_separator": [],
        "unknown_tags": [],
    }
    unknown: set[str] = set()
    for row in rows:
        tags = split_semicolon_field(row.get("thePhamViHanhNghe", ""))
        raw = str(row.get("maPhamViBHXH", ""))
        if tags:
            report["has_pvhn"] += 1
        if raw:
            report["has_bhxh"] += 1
        if "; " in raw or " ;" in raw or ", " in raw:
            report["bad_separator"].append(row.get("maTT43", ""))
        if tags and not raw:
            report["pvhn_no_bhxh"].append(
                {"maTT43": row.get("maTT43", ""), "tags": tags}
            )
        for tag in tags:
            if tag not in TAG_TO_BHXH_MA:
                unknown.add(tag)
        if not tags or not raw:
            continue
        expected: set[str] = set()
        for tag in tags:
            expected.update(TAG_TO_BHXH_MA.get(tag, []))
        for hint in hint_bhxh_from_chuyen_khoa(
            row.get("chuyenKhoaPVHN", ""),
            row.get("chiTietChuyenKhoaPVHN", ""),
        ):
            expected.add(hint)
        actual = set(split_semicolon_field(raw))
        missing = sorted(expected - actual, key=bhxh_code_sort_key)
        if missing:
            report["missing_codes"].append(
                {
                    "maTT43": row.get("maTT43", ""),
                    "tags": tags,
                    "missing": missing[:12],
                    "missing_count": len(missing),
                }
            )
    report["unknown_tags"] = sorted(unknown)
    return report


def enrich_catalog_with_tags(catalog: list[dict]) -> list[dict]:
    for row in catalog:
        row["pvhnTagTT32"] = BHXH_MA_TO_PVHN_TAG.get(row["maPhamVi"], "")
    return catalog


def build_bhxh_dvkt_index(pl1: list[dict]) -> dict[str, dict]:
    """maPhamVi BHXH → thống kê DVKT theo nguồn."""
    index: dict[str, dict] = {}
    for item in pl1:
        codes = split_semicolon_field(item.get("maPhamViBHXH", ""))
        if not codes:
            continue
        ma43 = item.get("maTT43", "")
        ma7603 = item.get("maTuongDuong", "")
        ten43 = item.get("tenTT43", "")
        has_tt23 = bool(item.get("theLienKetTT23"))
        bv_count = sum(1 for k in ("coTaiBV_PCST", "coTaiBV_PCCT", "coTaiBV_PSD") if item.get(k) == "Có")
        for code in codes:
            slot = index.setdefault(
                code,
                {
                    "count": 0,
                    "tt23": 0,
                    "bv": 0,
                    "maTT43": [],
                    "maTuongDuong": [],
                    "tenTT43": [],
                },
            )
            slot["count"] += 1
            if has_tt23:
                slot["tt23"] += 1
            if bv_count:
                slot["bv"] += bv_count
            if ma43 and ma43 not in slot["maTT43"] and len(slot["maTT43"]) < 8:
                slot["maTT43"].append(ma43)
            if ma7603 and ma7603 not in slot["maTuongDuong"] and len(slot["maTuongDuong"]) < 5:
                slot["maTuongDuong"].append(ma7603)
            if ten43 and ten43 not in slot["tenTT43"] and len(slot["tenTT43"]) < 3:
                slot["tenTT43"].append(ten43)
    return index


def attach_dvkt_counts_to_catalog(catalog: list[dict], index: dict[str, dict]) -> list[dict]:
    for row in catalog:
        ma = row["maPhamVi"]
        slot = index.get(ma, {})
        row["soDvktDuocPhep"] = slot.get("count", 0)
        row["soDvktTT23"] = slot.get("tt23", 0)
        row["soDvktTaiBV"] = slot.get("bv", 0)
        samples = slot.get("maTT43", [])
        row["maDvktMau"] = ", ".join(samples[:5])
        row["maTuongDuongMau"] = ", ".join(slot.get("maTuongDuong", [])[:3])
        row["tenDvktMau"] = " | ".join(slot.get("tenTT43", [])[:2])
        if not row.get("pvhnTagTT32"):
            row["pvhnTagTT32"] = BHXH_MA_TO_PVHN_TAG.get(ma, "")
    return catalog


def enrich_pl1_bhxh(pl1: list[dict], catalog_by_ma: dict[str, dict]) -> list[dict]:
    for item in pl1:
        codes, _ = resolve_bhxh_codes_for_item(item)
        if not codes:
            item["maPhamViBHXH"] = ""
            item["tenChucDanhBHXH"] = ""
            item["soChucDanhBHXH"] = 0
            item["doTinCayBHXH"] = ""
            continue
        labels = []
        for c in codes:
            lab = catalog_by_ma.get(c, {}).get("chucDanh", c)
            labels.append(f"{c} — {lab}")
        item["maPhamViBHXH"] = format_ma_pham_vi_bhxh(codes)
        item["tenChucDanhBHXH"] = " | ".join(labels)
        item["soChucDanhBHXH"] = len(codes)
        item["doTinCayBHXH"] = bhxh_confidence(item, codes)
    return pl1


def propagate_bhxh_from_pl1(
    rows: list[dict],
    pl1_by_ma: dict[str, dict],
    pl1_by_tt43: dict[str, dict],
    *,
    link_key: str = "lienKetQD7603",
    tt43_key: str = "maTT43",
) -> tuple[list[dict], int]:
    """Gắn BHXH + PVHN từ PL1 hub sang TT23 / BV / PL2 / PL3."""
    from _merge_tt23_mapping import norm_code

    linked = 0
    for row in rows:
        src = None
        link = row.get(link_key) or row.get("maTuongDuong") or ""
        if link and link in pl1_by_ma:
            src = pl1_by_ma[link]
        elif norm_code(row.get(tt43_key, "")) in pl1_by_tt43:
            src = pl1_by_tt43[norm_code(row.get(tt43_key, ""))]
        elif norm_code(row.get("maKyThuat", "")) in pl1_by_tt43:
            src = pl1_by_tt43[norm_code(row.get("maKyThuat", ""))]
        if src and src.get("maPhamViBHXH"):
            copy_bhxh_fields(row, src)
            linked += 1
        elif src:
            copy_bhxh_fields(row, src)
        else:
            copy_bhxh_fields(row, {})
    return rows, linked
