# -*- coding: utf-8 -*-
"""Chuẩn hóa bản ghi Quy trình kỹ thuật BYT — tên, chuyên khoa, QĐ."""
from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

ICD_RE = re.compile(r"^[A-TV-Z][0-9]{2}(?:\.[0-9]{1,2})?\*?$", re.I)


def _norm(s: str) -> str:
    text = unicodedata.normalize("NFD", (s or "").lower())
    text = text.replace("đ", "d").replace("Đ", "d")
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def dedupe_title(text: str) -> str:
    """Gỡ lặp cụm tên kỹ thuật do parse PDF."""
    t = re.sub(r"\s+", " ", (text or "").strip())
    if len(t) < 8:
        return t
    n = len(t)
    for size in range(min(n // 2, 120), 7, -1):
        a, b = t[:size].strip(), t[size : size + size].strip()
        if not b:
            continue
        if a == b or (_norm(a) == _norm(b) and len(_norm(a)) >= 12):
            rest = t[size + size :].strip()
            return (a + (" " + rest if rest else "")).strip()
    # Lặp nửa sau: "… Chụp mạch X Chụp mạch X"
    words = t.split()
    if len(words) >= 6:
        for block in range(len(words) // 2, 2, -1):
            tail = words[-block:]
            prev = words[-2 * block : -block]
            if tail == prev:
                return " ".join(words[:-block])
    mid = n // 2
    left, right = t[:mid].strip(), t[mid:].strip()
    if left and right and _norm(left) == _norm(right):
        return left
    return t


_QTKT_JUNK_PREFIX_RE = re.compile(
    r"^(?:x-quang tăng sáng|x quang tang sang)\s+",
    re.I,
)
_QTKT_CK_PREFIX_RE = re.compile(
    r"^-\s*(?:sinh\s*dục\s*nữ|sinh\s*vt\s*n\s*dục\s*nữ|sản\s*khoa)\s*[-–]?\s*",
    re.I,
)
_MA_IN_TITLE_RE = re.compile(r"^\d+\.\d+\s+")
_DOUBLE_QUANG_RE = re.compile(r"quang tăng sáng\s+quang tăng sáng", re.I)


def sanitize_qtkt_title(text: str) -> str:
    """Làm sạch tên quy trình parse lỗi (phụ lục / tiêu đề lẫn mã TT23)."""
    t = dedupe_title(text or "")
    t = _MA_IN_TITLE_RE.sub("", t)
    t = _DOUBLE_QUANG_RE.sub("X-quang tăng sáng", t)
    t = _QTKT_JUNK_PREFIX_RE.sub("", t)
    t = _QTKT_CK_PREFIX_RE.sub("", t)
    t = re.sub(r"\s+X-?\s*$", "", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip(" -–·")
    return dedupe_title(t)


_BOILERPLATE_CK = re.compile(
    r"bo truong|bo y te|quyet dinh|ban hanh kem theo|thu tuong|chinh phu",
    re.I,
)


def _match_chuyen_khoa(n: str) -> str | None:
    rules: list[tuple[tuple[str, ...], str]] = [
        (("vi sinh", "tap 1"), "Vi sinh y học — Tập 1"),
        (("vi sinh", "tap 2"), "Vi sinh y học — Tập 2"),
        (("di truyen", "sinh hoc phan tu", "tap 1"), "Di truyền & SHPT — Tập 1"),
        (("di truyen", "sinh hoc phan tu", "tap 2"), "Di truyền & SHPT — Tập 2"),
        (("dinh duong", "lam sang"), "Dinh dưỡng lâm sàng"),
        (("giai phau", "benh"), "Giải phẫu bệnh"),
        (("huyet hoc", "tap 1"), "Huyết học — Tập 1"),
        (("huyet hoc", "tap 2"), "Huyết học — Tập 2"),
        (("hoa sinh", "tap 2"), "Hóa sinh — Tập 2"),
        (("hoa tri", "tap 1"), "Hóa trị — Tập 1"),
        (("chan doan hinh anh",), "Chẩn đoán hình ảnh — Tập 1"),
        (("dien quang can thiep",), "Chẩn đoán hình ảnh — Can thiệp Tập 1"),
        (("mui", "hong"), "Tai Mũi Họng — Tập 1"),
        (("rh", "tap 1"), "Răng Hàm Mặt — Tập 1"),
        (("rh", "tap 2"), "Răng Hàm Mặt — Tập 2"),
        (("da", "lop bao phu", "tap 1"), "Da liễu — Tập 1"),
        (("da", "lop bao phu", "tap 2"), "Da liễu — Tập 2"),
        (("san phu", "tap 1"), "Sản phụ khoa — Tập 1"),
        (("phuc hoi chuc nang", "tap 1"), "PHCN — Tập 1"),
        (("phuc hoi chuc nang", "tap 2"), "PHCN — Tập 2"),
        (("phuc hoi chuc nang", "tap 3"), "PHCN — Tập 3"),
        (("tiet nieu",), "Tiết niệu"),
        (("tuan hoan", "tap 1.1"), "Tim mạch — Tập 1.1"),
        (("tuan hoan", "tap 1.2"), "Tim mạch — Tập 1.2"),
        (("ho hap", "tap 1.1"), "Hô hấp — Tập 1.1"),
        (("ho hap", "tap 1.2"), "Hô hấp — Tập 1.2"),
        (("noi tiet", "tap 1"), "Nội tiết — Tập 1"),
        (("noi tiet", "tap 2"), "Nội tiết — Tập 2"),
        (("tam than", "tap 1"), "Tâm thần — Tập 1"),
        (("tam than", "tap 2"), "Tâm thần — Tập 2"),
        (("tao mau", "lympho"), "Tạo máu & Lympho"),
        (("noi soi",), "Nội soi tiêu hóa"),
    ]
    for keys, label in rules:
        if all(k in n for k in keys):
            return label
    return None


def normalize_chuyen_khoa(row: dict) -> str:
    file_stem = re.sub(
        r"^\d{4}\.\s*",
        "",
        str(row.get("tenFileNguon", "")).replace(".signed", "").replace(".pdf", "").replace(".P", ""),
    )
    candidates = [file_stem, row.get("chuyenKhoa", ""), row.get("tenTaiLieu", "")]
    for raw in candidates:
        raw = re.sub(r"\s+", " ", (raw or "").strip())
        if not raw or len(raw) < 3:
            continue
        if _BOILERPLATE_CK.search(_norm(raw)):
            continue
        hit = _match_chuyen_khoa(_norm(raw))
        if hit:
            return hit
        cleaned = re.sub(r"(?i)QTKT\s*|_trinh ky|\(\d+\)|\.signed|\.pdf", " ", raw)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" -–·")
        if 4 <= len(cleaned) <= 80 and not _BOILERPLATE_CK.search(_norm(cleaned)):
            return cleaned.title() if cleaned.isupper() else cleaned
    hit = _match_chuyen_khoa(_norm(file_stem))
    return hit or "Chuyên khoa khác"


def normalize_so_quyet_dinh(so: str) -> str:
    s = re.sub(r"\s+", "", (so or "").strip())
    if not s:
        return ""
    if re.match(r"^\d+[/\-]QĐ[- ]?BYT$", s, re.I):
        return s.replace("-", "/").replace(" ", "").upper().replace("QĐBYT", "QĐ-BYT")
    m = re.search(r"(\d+)\s*[/\-]\s*QĐ\s*[-]?\s*BYT", s, re.I)
    if m:
        return f"{m.group(1)}/QĐ-BYT"
    return s


def normalize_qtkt_row(row: dict) -> dict:
    row = dict(row)
    row["tenKyThuat"] = sanitize_qtkt_title(row.get("tenKyThuat", ""))
    from _qtkt_dvkt_bridge import is_polluted_tt23_name

    tt23_raw = (row.get("tenKyThuatTT23") or "").strip()
    if is_polluted_tt23_name(tt23_raw):
        row["tenKyThuatTT23"] = ""
    elif tt23_raw:
        row["tenKyThuatTT23"] = dedupe_title(tt23_raw)
    row["chuyenKhoa"] = normalize_chuyen_khoa(row)
    row["soQuyetDinh"] = normalize_so_quyet_dinh(row.get("soQuyetDinh", ""))
    if row.get("chiDinh"):
        from _qtkt_icd_bridge import sanitize_qtkt_indication_text

        row["chiDinh"] = sanitize_qtkt_indication_text(row["chiDinh"])
        row["chiDinh"] = re.sub(r"\n{3,}", "\n\n", row["chiDinh"]).strip()
    if row.get("chongChiDinh"):
        from _qtkt_icd_bridge import sanitize_qtkt_indication_text

        row["chongChiDinh"] = sanitize_qtkt_indication_text(row["chongChiDinh"])
        row["chongChiDinh"] = re.sub(r"\n{3,}", "\n\n", row["chongChiDinh"]).strip()
    return row


_ICD_JS_ENTRY_RE = re.compile(r'\{"m":"([^"]+)","t":"((?:\\.|[^"\\])*)"', re.S)


def _parse_icd_js_entries(text: str) -> list[tuple[str, str, list[str]]]:
    """Trích (ma, ten, flags) từ chunk icd-*.js — tránh JSON.parse trên file lớn."""
    out: list[tuple[str, str, list[str]]] = []
    for m in _ICD_JS_ENTRY_RE.finditer(text):
        ma = m.group(1).strip().upper().rstrip("*")
        if not ma or not ICD_RE.match(ma):
            continue
        ten = m.group(2).strip()
        tail = text[m.end() : m.end() + 80]
        fm = re.search(r'"f":\[([^\]]*)\]', tail)
        flags = re.findall(r'"([^"]+)"', fm.group(1)) if fm else []
        out.append((ma, ten, flags))
    return out


def load_icd_from_duocthu_data(base: Path | None = None):
    """Tải ICD-10 từ thuvien/duocthu_data/icd-*.js (TT06 / tab ICD Thư viện tra cứu)."""
    from _update_icd_deep import norm

    root = base or Path(__file__).resolve().parent
    data_dir = root / "duocthu_data"
    if not data_dir.is_dir():
        return None, None, None
    catalog: dict[str, dict] = {}
    children: dict[str, list] = defaultdict(list)
    for js in sorted(data_dir.glob("icd-*.js")):
        text = js.read_text(encoding="utf-8", errors="replace")
        for ma, ten, flags in _parse_icd_js_entries(text):
            flag4 = "4" in flags
            entry = {"ma": ma, "ten": ten, "norm_ten": norm(ten), "flag4": flag4}
            prev = catalog.get(ma)
            if not prev or len(ten) > len(prev.get("ten", "")):
                catalog[ma] = entry
    if not catalog:
        return None, None, None
    for entry in catalog.values():
        children[entry["ma"].split(".")[0]].append(entry)
    from _qtkt_icd_bridge import _build_long_name_index

    return catalog, children, _build_long_name_index(catalog)
