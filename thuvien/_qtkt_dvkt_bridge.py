# -*- coding: utf-8 -*-
"""Liên kết Quy trình kỹ thuật ↔ TT23 / QĐ7603 / danh mục DVKT bệnh viện."""
from __future__ import annotations

import re
from collections import defaultdict

from _dvkt_data_io import DEFAULT_DATA_DIR, load_dataset
from _merge_tt23_mapping import name_similarity, norm_code, norm_text
from _qtkt_normalize import sanitize_qtkt_title

POLLUTED_TT23_RE = re.compile(
    r"(^\d{1,3}\s*[-–]\s+|^\d+\.\d+\s+quang|quang tăng sáng quang|"
    r"^\d+\.\d+\s+[a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])",
    re.I,
)
MA_BS_RE = re.compile(r"BS[_\s-]?(\d+(?:\.\d+)?)", re.I)
LATIN_MEDICAL_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 /().,\-+®™]*$")
JUNK_TT23_FRAGMENTS = frozenset(
    s.lower()
    for s in (
        "GH",
        "sáng",
        "phổi",
        "U đồ",
        "laser châm",
        "laser chiếu ngoài",
        "laser nội mạch",
        "Thụt tháo",
        "Thụt giữ",
        "Soi ối",
        "Giác hút",
        "Tập nuốt",
        "Hào châm",
    )
)

BV_DATASETS: list[tuple[str, str]] = [
    ("bvpcst", "BV PC Sóc Trăng"),
    ("bvpcct", "BV PC Cần Thơ"),
    ("bvpsd", "BV Phương Châu Sài Gòn"),
]

LABEL_TT23 = "Thông tư số 23/2024/TT-BYT"
LABEL_QD7603 = "Quyết định số 7603/QĐ-BYT"


def is_junk_tt23_catalog_name(name: str) -> bool:
    """Tên rác trong danh mục TT23 (phụ lục parse lỗi): GH, sáng, phổi…"""
    t = (name or "").strip()
    if not t:
        return True
    if t.lower() in JUNK_TT23_FRAGMENTS:
        return True
    if LATIN_MEDICAL_RE.match(t) and len(t) >= 6:
        return False
    if len(t) < 8:
        return True
    words = [w for w in re.split(r"\s+", t) if w]
    if len(words) <= 2 and len(t) < 18:
        if re.search(
            r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]",
            t,
            re.I,
        ):
            return True
    return False


def _min_title_overlap(qt_title: str, official_title: str) -> float:
    """Ngưỡng tối thiểu để coi là cùng dịch vụ — không match khi không có cơ sở."""
    qt_raw = (qt_title or "").strip()
    qt_n = norm_text(qt_raw)
    off_n = norm_text(official_title or "")
    if not qt_n or not off_n:
        return 1.0
    if ":" in qt_raw and ("dinh luong" in qt_n or "định lượng" in qt_raw.lower()):
        head_a = qt_n.split(":")[0].strip()
        head_b = off_n.split(":")[0].strip()
        if head_a and head_b and len(head_a) >= 4 and len(head_b) >= 4:
            return 0.72
        return 0.58
    if len(qt_n) >= 20 or len(off_n) >= 20:
        return 0.50
    return 0.55


def _has_match_basis(qt_title: str, official_title: str) -> bool:
    if is_junk_tt23_catalog_name(official_title):
        return False
    qt_raw = (qt_title or "").strip()
    qt_n = norm_text(qt_raw)
    off_n = norm_text(official_title or "")
    if not qt_n or len(qt_n) < 8:
        return False
    min_score = _min_title_overlap(qt_raw, official_title)
    sim = _title_similarity(qt_n, official_title)
    if ":" in qt_raw and ("dinh luong" in qt_n or "định lượng" in qt_raw.lower()):
        head_a = qt_n.split(":")[0].strip()
        head_b = off_n.split(":")[0].strip()
        if head_a and head_b and len(head_a) >= 3 and len(head_b) >= 3:
            head_sim = name_similarity(head_a, head_b)
            if head_sim < 0.72 and head_a != head_b:
                return False
    return sim >= min_score


def _acceptable_pl1_match(qt_title: str, pl1_row: dict) -> bool:
    tn = (pl1_row.get("tenTT43") or "").strip()
    return _has_match_basis(qt_title, tn)


def is_polluted_tt23_name(name: str) -> bool:
    t = (name or "").strip()
    if not t:
        return True
    if is_junk_tt23_catalog_name(t):
        return True
    if re.match(r"^\d+\.\d+\s", t):
        return True
    if "quang tăng sáng quang" in t.lower():
        return True
    if len(t) < 6:
        return True
    words = [w for w in re.split(r"\s+", t) if w]
    if len(words) >= 3 and len(t) >= 18 and not POLLUTED_TT23_RE.search(t):
        return False
    if POLLUTED_TT23_RE.search(t):
        return True
    if re.match(r"^\d+\.\d+\s", t) and " " in t[8:]:
        return True
    letters = [c for c in t if c.isalpha()]
    if letters:
        upper = sum(1 for c in letters if c.isupper()) / len(letters)
        if upper >= 0.55 and len(t) >= 14:
            return False
    if t[0].isupper() and len(t) >= 16:
        return False
    return bool(re.match(r"^[a-zàáảãạ]", t))


def ma_lookup_keys(raw_ma: str, qt_title: str = "") -> list[str]:
    """Sinh các biến thể mã tra cứu TT23 (kể cả BS_ trong tiêu đề)."""
    keys: list[str] = []
    ma = str(raw_ma or "").strip()
    if ma:
        if _looks_like_tt23_ma(ma):
            keys.append(ma)
        if not ma.upper().startswith("BS_"):
            keys.append(f"BS_{ma}")
        elif len(ma) > 3:
            keys.append(ma[3:])
    for m in MA_BS_RE.finditer(qt_title or ""):
        code = m.group(1)
        keys.extend([f"BS_{code}", code])
    seen: set[str] = set()
    out: list[str] = []
    for k in keys:
        k = k.strip()
        if k and k not in seen:
            seen.add(k)
            out.append(k)
    return out


def _looks_like_tt23_ma(ma: str) -> bool:
    """Mã kỹ thuật TT23 thật: dạng chương.mục (18.436) hoặc BS_."""
    s = str(ma or "").strip()
    if not s:
        return False
    if s.upper().startswith("BS_"):
        return True
    return bool(re.match(r"^\d+\.\d+", s))


def _title_similarity(qt_title: str, official_title: str) -> float:
    """So khớp tên — ưu tiên cụm trước dấu ':' (mẫu xét nghiệm TT23 PL2)."""
    na, nb = norm_text(qt_title), norm_text(official_title)
    if not na or not nb:
        return 0.0
    base = name_similarity(na, nb)
    head_a = na.split(":")[0].strip()
    head_b = nb.split(":")[0].strip()
    if head_a and head_b and len(head_a) >= 4 and len(head_b) >= 4:
        head_sim = name_similarity(head_a, head_b)
        if head_sim >= 0.72:
            return max(base, head_sim * 0.96, 0.52)
    return base


def _fuzzy_min_score(qt_raw: str, qt_norm: str) -> float:
    if ":" in (qt_raw or "") and ("dinh luong" in qt_norm or "định lượng" in (qt_raw or "").lower()):
        return 0.62
    if len(qt_norm) >= 20:
        return 0.58
    return 0.88


def _acceptable_ma_match(qt_title: str, tt23_row: dict) -> bool:
    official = (tt23_row.get("tenKyThuat") or "").strip()
    return _has_match_basis(qt_title, official)


def index_pl1(rows: list[dict]) -> dict[str, dict]:
    by_ma43: dict[str, dict] = {}
    by_ma7603: dict[str, dict] = {}
    by_ten: dict[str, dict] = {}
    for row in rows:
        m43 = norm_code(row.get("maTT43", ""))
        if m43:
            by_ma43[m43] = row
        m76 = str(row.get("maTuongDuong", "") or row.get("maTT43", "")).strip()
        if m76:
            by_ma7603[m76] = row
        tn = norm_text(row.get("tenTT43", ""))
        if tn:
            by_ten[tn] = row
    return {"by_ma43": by_ma43, "by_ma7603": by_ma7603, "by_ten": by_ten}


def index_tt23(rows: list[dict]) -> dict:
    by_ma: dict[str, list[dict]] = defaultdict(list)
    by_ten: dict[str, list[dict]] = defaultdict(list)
    by_stt: dict[str, list[dict]] = defaultdict(list)
    all_rows: list[dict] = []
    for row in rows:
        all_rows.append(row)
        ma = norm_code(row.get("maKyThuat", ""))
        if ma:
            by_ma[ma].append(row)
        stt = str(row.get("stt", "")).strip()
        if stt:
            by_stt[stt].append(row)
        tn = norm_text(row.get("tenKyThuat", ""))
        if tn:
            by_ten[tn].append(row)
    return {"by_ma": by_ma, "by_ten": by_ten, "by_stt": by_stt, "all": all_rows}


def _pick_tt23_catalog_row(candidates: list[dict], qt_raw: str, qt_norm: str) -> tuple[dict | None, float]:
    """Chọn dòng danh mục TT23 — tên chính thức khớp tên quy trình."""
    cands = [c for c in candidates if not is_junk_tt23_catalog_name((c.get("tenKyThuat") or ""))]
    if not cands:
        return None, 0.0
    if len(cands) == 1:
        sc = _title_similarity(qt_norm, cands[0].get("tenKyThuat", ""))
        return (cands[0], sc) if _has_match_basis(qt_raw, cands[0].get("tenKyThuat", "")) else (None, sc)
    scored = sorted(
        ((_title_similarity(qt_norm, c.get("tenKyThuat", "")), c) for c in cands),
        key=lambda x: x[0],
        reverse=True,
    )
    best_score, best = scored[0]
    if _has_match_basis(qt_raw, best.get("tenKyThuat", "")):
        return best, best_score
    return None, best_score


def _catalog_rows_by_ma(idx: dict, ma_key: str) -> list[dict]:
    return list(idx.get("by_ma", {}).get(ma_key, []))


def official_tt23_name(catalog_row: dict | None) -> str:
    """Tên kỹ thuật chính thức từ danh mục TT23."""
    if not catalog_row:
        return ""
    return (catalog_row.get("tenKyThuat") or "").strip()


def index_bv(rows: list[dict]) -> dict[str, dict]:
    by_ma_tt23: dict[str, list[dict]] = defaultdict(list)
    by_ma7603: dict[str, list[dict]] = defaultdict(list)
    by_ten: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        ma = norm_code(row.get("maKyThuatTT23", ""))
        if ma:
            by_ma_tt23[ma].append(row)
        m76 = str(row.get("lienKetQD7603", "") or row.get("maDichVu", "")).strip()
        if m76:
            by_ma7603[m76].append(row)
        tn = norm_text(row.get("tenKyThuatTT23", "") or row.get("tenDichVu", ""))
        if tn:
            by_ten[tn].append(row)
    return {"by_ma_tt23": by_ma_tt23, "by_ma7603": by_ma7603, "by_ten": by_ten}


def load_mapping_context(data_dir=None) -> dict:
    data_dir = data_dir or DEFAULT_DATA_DIR
    pl1_pack = load_dataset("pl1", data_dir)
    tt23_pl1_pack = load_dataset("tt23pl1", data_dir)
    tt23_pl2_pack = load_dataset("tt23pl2", data_dir)
    ctx: dict = {
        "pl1_idx": index_pl1(pl1_pack["rows"] if pl1_pack else []),
        "tt23_pl1": index_tt23(tt23_pl1_pack["rows"] if tt23_pl1_pack else []),
        "tt23_pl2": index_tt23(tt23_pl2_pack["rows"] if tt23_pl2_pack else []),
        "bv": {},
        "tt23_fuzzy_pool": [],
        "pl1_fuzzy_pool": [],
    }
    for idx, label in ((ctx["tt23_pl1"], "PL1"), (ctx["tt23_pl2"], "PL2")):
        for cand in idx.get("all", []):
            tn = (cand.get("tenKyThuat") or "").strip()
            if is_junk_tt23_catalog_name(tn):
                continue
            words = frozenset(w for w in norm_text(tn).split() if len(w) >= 3)
            ctx["tt23_fuzzy_pool"].append((norm_text(tn), words, cand, label))
    for cand in ctx["pl1_idx"]["by_ten"].values():
        tn = (cand.get("tenTT43") or "").strip()
        if is_junk_tt23_catalog_name(tn):
            continue
        words = frozenset(w for w in norm_text(tn).split() if len(w) >= 3)
        ctx["pl1_fuzzy_pool"].append((norm_text(tn), words, cand))
    for ds_id, label in BV_DATASETS:
        pack = load_dataset(ds_id, data_dir)
        if pack and pack.get("rows"):
            ctx["bv"][ds_id] = {"label": label, "idx": index_bv(pack["rows"])}
    return ctx


def _fuzzy_tt23_match(qt_title: str, ctx: dict, *, min_score: float) -> tuple[dict | None, str, float]:
    pool: list = ctx.get("tt23_fuzzy_pool") or []
    if not pool or not qt_title:
        return None, "", 0.0
    qt_words = {w for w in qt_title.split() if len(w) >= 3}
    best = None
    best_score = 0.0
    best_label = ""
    for tn, words, cand, label in pool:
        if qt_words and words:
            overlap = len(qt_words & words)
            if overlap < 2 and overlap / max(len(qt_words), 1) < 0.25:
                continue
        sc = _title_similarity(qt_title, tn)
        if sc > best_score:
            best_score = sc
            best = cand
            best_label = label
    if best and best_score >= min_score:
        return best, best_label, best_score
    return None, "", best_score


def _fuzzy_pl1_match(qt_title: str, ctx: dict, *, min_score: float = 0.82) -> dict | None:
    pool: list = ctx.get("pl1_fuzzy_pool") or []
    if not pool or not qt_title:
        return None
    qt_words = {w for w in qt_title.split() if len(w) >= 3}
    best = None
    best_score = 0.0
    for tn, words, cand in pool:
        if qt_words and words:
            overlap = len(qt_words & words)
            if overlap < 2 and overlap / max(len(qt_words), 1) < 0.25:
                continue
        sc = _title_similarity(qt_title, tn)
        if sc > best_score:
            best_score = sc
            best = cand
    if best and best_score >= min_score:
        return best
    return None


def find_tt23_match(row: dict, ctx: dict) -> tuple[dict | None, str, str]:
    """Tìm dòng danh mục TT23 — ưu tiên tên quy trình, không tin mã phụ lục."""
    qt_raw = sanitize_qtkt_title(row.get("tenKyThuat", "") or "")
    qt_title = norm_text(qt_raw)
    if not qt_raw or len(qt_raw) < 8:
        return None, "", ""

    # 1) Tên quy trình trùng danh mục TT23
    for idx, label in ((ctx["tt23_pl1"], "PL1"), (ctx["tt23_pl2"], "PL2")):
        for cand in idx.get("by_ten", {}).get(qt_title, []):
            if _has_match_basis(qt_raw, cand.get("tenKyThuat", "")):
                return cand, label, "tên QTKT = danh mục TT23"

    # 2) Tên gần đúng trong toàn bộ danh mục (trước mã phụ lục — mã TT23 không duy nhất)
    min_fuzzy = _fuzzy_min_score(qt_raw, qt_title)
    best, best_label, best_score = _fuzzy_tt23_match(qt_title, ctx, min_score=min_fuzzy)
    if best and _has_match_basis(qt_raw, best.get("tenKyThuat", "")):
        return best, best_label, f"tên danh mục TT23 ({best_score:.0%})"

    # 3) Mã gợi ý — chỉ khi tên quy trình khớp dòng catalog được chọn
    ma = norm_code(row.get("maKyThuat", ""))
    by_ma_hits: list[tuple[dict, str, str, float]] = []
    for key in ma_lookup_keys(str(row.get("maKyThuat", "") or ma), qt_raw):
        pooled: list[dict] = []
        labels: dict[int, str] = {}
        for idx, label in ((ctx["tt23_pl1"], "PL1"), (ctx["tt23_pl2"], "PL2")):
            for cand in _catalog_rows_by_ma(idx, key):
                pooled.append(cand)
                labels[id(cand)] = label
        if not pooled:
            continue
        pick, sc = _pick_tt23_catalog_row(pooled, qt_raw, qt_title)
        if pick:
            method = "mã TT23 + tên danh mục" if key == ma or not key.upper().startswith("BS_") else f"mã BS + tên ({key})"
            by_ma_hits.append((pick, labels.get(id(pick), "PL1"), method, sc))
    if by_ma_hits:
        by_ma_hits.sort(key=lambda x: x[3], reverse=True)
        best = by_ma_hits[0]
        return best[0], best[1], best[2]
    return None, "", ""


def _pick_best_bv(candidates: list[dict], ref_name: str) -> dict | None:
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]
    ref = norm_text(ref_name)
    scored = sorted(
        ((name_similarity(ref, norm_text(c.get("tenDichVu", "") or c.get("tenKyThuatTT23", ""))), c) for c in candidates),
        key=lambda x: x[0],
        reverse=True,
    )
    return scored[0][1]


def find_bv_match(row: dict, ctx: dict, official_tt23_name: str) -> tuple[dict | None, str, str]:
    """Chỉ map DM BV khi đã có tên TT23 chính thức — không suy TT23 từ BV."""
    if not (official_tt23_name or "").strip():
        return None, "", ""
    ma = norm_code(row.get("lienKetTT23", "") or row.get("maKyThuat", ""))
    m76 = str(row.get("lienKetQD7603", "") or row.get("maTuongDuong", "")).strip()
    ref = official_tt23_name

    best_row = None
    best_ds = ""
    best_method = ""
    best_score = 0.0

    for ds_id, meta in ctx.get("bv", {}).items():
        idx = meta["idx"]
        label = meta["label"]
        cands: list[dict] = []
        method = ""
        if ma and ma in idx["by_ma_tt23"]:
            cands = idx["by_ma_tt23"][ma]
            method = "mã TT23"
        elif m76 and m76 in idx["by_ma7603"]:
            cands = idx["by_ma7603"][m76]
            method = "mã QĐ7603"
        else:
            ref_n = norm_text(ref)
            if ref_n and ref_n in idx["by_ten"]:
                cands = idx["by_ten"][ref_n]
                method = "tên TT23"
        if not cands:
            continue
        pick = _pick_best_bv(cands, ref)
        if not pick:
            continue
        sc = _title_similarity(ref, pick.get("tenDichVu", "") or pick.get("tenKyThuatTT23", ""))
        if sc < 0.50:
            continue
        if sc >= best_score:
            best_score = sc
            best_row = pick
            best_ds = label
            best_method = method

    if not best_row:
        return None, "", ""
    conf = "Cao" if best_score >= 0.88 else ("Trung bình" if best_score >= 0.6 else "Thấp")
    return best_row, best_ds, f"{best_method} ({conf})"


def _mapping_confidence(qt_title: str, official_tt23: str, *, has_ma: bool, has_7603: bool) -> str:
    if not official_tt23:
        return ""
    sim = _title_similarity(qt_title, official_tt23)
    if has_ma and sim >= 0.75:
        return "Cao"
    if has_ma and sim >= 0.45:
        return "Trung bình"
    if has_ma or has_7603:
        return "Trung bình" if sim >= 0.5 else "Thấp"
    if sim >= 0.82:
        return "Trung bình"
    return "Thấp"


def link_qtkt_row(row: dict, ctx: dict | None = None) -> dict:
    """Gán tên/mã TT23, QĐ7603, DM BV theo văn bản pháp luật."""
    if ctx is None:
        ctx = load_mapping_context()
    row = dict(row)
    pl1_idx = ctx["pl1_idx"]
    pl1 = None
    for _k in (
        "tenKyThuatTT23",
        "lienKetTT23",
        "phuLucTT23",
        "chuongTT23",
        "lienKetQD7603",
        "maTT43",
        "maTuongDuong",
        "tenTT43",
        "maDichVuBV",
        "tenDichVuBV",
        "benhVienDVKT",
        "doTinCayMappingBV",
        "ghiChuMappingBV",
        "ghiChuMapping",
        "doTinCayMapping",
        "tagsMapping",
    ):
        row[_k] = ""

    tt23, pl_label, tt23_method = find_tt23_match(row, ctx)
    official_tt23 = ""
    if tt23:
        official_tt23 = official_tt23_name(tt23)
        ma_official = norm_code(tt23.get("maKyThuat", ""))
        if is_polluted_tt23_name(official_tt23):
            official_tt23 = ""
            tt23 = None
        elif not _has_match_basis(sanitize_qtkt_title(row.get("tenKyThuat", "")), official_tt23):
            official_tt23 = ""
            tt23 = None
        else:
            row["lienKetTT23"] = ma_official or row.get("lienKetTT23", "")
            row["tenKyThuatTT23"] = official_tt23
            row["phuLucTT23"] = tt23.get("phuLuc", "") or (f"PL0{1 if pl_label == 'PL1' else 2}")
            row["chuongTT23"] = tt23.get("chuong", "")
            if ma_official and official_tt23:
                row["maKyThuat"] = ma_official
            link76 = str(tt23.get("lienKetQD7603", "") or tt23.get("maTuongDuongQD7603", "")).strip()
            if link76 and link76 in pl1_idx["by_ma7603"]:
                cand = pl1_idx["by_ma7603"][link76]
                if _acceptable_pl1_match(row.get("tenKyThuat", ""), cand):
                    pl1 = cand
            elif norm_code(row.get("maKyThuat", "")) in pl1_idx["by_ma43"]:
                cand = pl1_idx["by_ma43"][norm_code(row.get("maKyThuat", ""))]
                if _acceptable_pl1_match(row.get("tenKyThuat", ""), cand):
                    pl1 = cand
            else:
                pl1 = None
    if tt23 and not pl1:
        pick = _fuzzy_pl1_match(norm_text(official_tt23), ctx, min_score=0.82)
        if pick and _acceptable_pl1_match(row.get("tenKyThuat", ""), pick):
            pl1 = pick
    if not tt23:
        official_tt23 = ""
        pl1 = None

    if pl1 and not _acceptable_pl1_match(row.get("tenKyThuat", ""), pl1):
        pl1 = None

    if pl1:
        row["lienKetQD7603"] = str(pl1.get("maTuongDuong", "") or pl1.get("maTT43", "")).strip()
        row["maTT43"] = str(pl1.get("maTT43", "")).strip()
        row["maTuongDuong"] = row["lienKetQD7603"]
        row["tenTT43"] = (pl1.get("tenTT43", "") or "").strip()

    bv, bv_label, bv_method = find_bv_match(row, ctx, official_tt23)
    if bv:
        row["maDichVuBV"] = str(bv.get("maDichVu", "")).strip()
        row["tenDichVuBV"] = (bv.get("tenDichVu", "") or bv.get("tenDvktGia", "")).strip()
        row["benhVienDVKT"] = bv_label
        row["doTinCayMappingBV"] = "Cao" if "Cao" in bv_method else ("Trung bình" if "Trung bình" in bv_method else "Thấp")
        row["ghiChuMappingBV"] = f"DM BV: {bv_method}"
    else:
        row.setdefault("maDichVuBV", "")
        row.setdefault("tenDichVuBV", "")
        row.setdefault("benhVienDVKT", "")
        row.setdefault("doTinCayMappingBV", "")
        row.setdefault("ghiChuMappingBV", "")

    has_ma = bool(row.get("lienKetTT23") or row.get("maKyThuat"))
    has_7603 = bool(row.get("lienKetQD7603"))
    conf = _mapping_confidence(row.get("tenKyThuat", ""), official_tt23, has_ma=has_ma, has_7603=has_7603)
    if tt23 and tt23_method.startswith("mã"):
        conf = "Cao" if conf != "Thấp" else "Trung bình"
    elif tt23 and tt23_method.startswith("tên gần"):
        conf = "Trung bình" if conf != "Cao" else conf
    row["doTinCayMapping"] = conf if (has_ma or has_7603) else ""

    notes = []
    if tt23:
        notes.append(f"{LABEL_TT23} ({pl_label}) — {tt23_method}")
    if row.get("tenTT43"):
        notes.append(f"{LABEL_QD7603}: «{row['tenTT43']}»")
    if bv_label:
        notes.append(f"DM {bv_label}")
    row["ghiChuMapping"] = " · ".join(notes)

    if not row.get("tenKyThuatTT23"):
        if is_junk_tt23_catalog_name(row.get("tenTT43", "")):
            row["tenTT43"] = ""
            row["lienKetQD7603"] = ""
            row["maTT43"] = ""
            row["maTuongDuong"] = ""
    elif not row.get("lienKetTT23"):
        row["tenKyThuatTT23"] = ""
        row["phuLucTT23"] = ""
        row["chuongTT23"] = ""
    elif not _has_match_basis(row.get("tenKyThuat", ""), row.get("tenKyThuatTT23", "")):
        row["tenKyThuatTT23"] = ""
        row["lienKetTT23"] = ""
        row["phuLucTT23"] = ""
        row["chuongTT23"] = ""
        row["tenTT43"] = ""
        row["lienKetQD7603"] = ""
        row["maTT43"] = ""
        row["maTuongDuong"] = ""
        row["maDichVuBV"] = ""
        row["tenDichVuBV"] = ""
        row["benhVienDVKT"] = ""
        row["doTinCayMappingBV"] = ""
        row["ghiChuMappingBV"] = ""
        row["doTinCayMapping"] = ""
        row["ghiChuMapping"] = ""

    if not row.get("tenKyThuatTT23") and not row.get("lienKetTT23"):
        row["tenTT43"] = ""
        row["lienKetQD7603"] = ""
        row["maTT43"] = ""
        row["maTuongDuong"] = ""

    tags = []
    if row.get("lienKetQD7603"):
        tags.append("QĐ7603")
    if row.get("lienKetTT23"):
        tags.append("TT23")
    if row.get("maDichVuBV"):
        tags.append("DM BV")
    if row.get("maICDChiDinh"):
        tags.append("ICD-10")
    if row.get("doTinCayMapping"):
        tags.append(row["doTinCayMapping"])
    row["tagsMapping"] = "; ".join(tags)
    return row
