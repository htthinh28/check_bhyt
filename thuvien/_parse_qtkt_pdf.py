# -*- coding: utf-8 -*-
"""Parse tài liệu Quy trình kỹ thuật BYT (PDF) — trích xuất trường mapping DVKT."""
from __future__ import annotations

import re
import unicodedata
from pathlib import Path

MA_KT_DECIMAL_RE = re.compile(r"\b(\d{1,2}\.\d{1,4})\b")
MA_KT_4DIGIT_RE = re.compile(r"\b(\d{4,5})\b")
SECTION_TITLE_BLACKLIST = frozenset(
    {
        "dai cuong",
        "dinh nghia",
        "chi dinh",
        "chong chi dinh",
        "than trong",
        "chuan bi",
        "cac buoc tien hanh",
        "cac buoc thuc hien",
        "cac buoc thuc hien quy trinh ky thuat",
        "tien hanh quy trinh ky thuat",
        "theo doi",
        "theo doi va xu tri tai bien",
        "ho so",
        "ket luan",
        "danh gia",
        "tai lieu tham khao",
        "noi dung",
        "trach nhiem",
    }
)
CHI_DINH_LINE_RE = re.compile(r"^2\.?\s*CH[IỈÍ]\s*ĐỊNH\b", re.I)
CHONG_CHI_DINH_LINE_RE = re.compile(r"^3\.?\s*CH[ỐO]NG\s*CH[IỈÍ]?\s*ĐỊNH\b", re.I)
TITLE_GARBAGE_RE = re.compile(
    r"(theo quy dinh|cua luat|nha xuat ban|\bet al\b|ban hanh|huong dan chuyen mon|"
    r"ky thuat .+ ky thuat|thu thuat .+ thu thuat|dieu tri xong|nen cat di|"
    r"^\d+\.\d+$)",
    re.I,
)
SECTION_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("chiDinh", re.compile(r"(?:^|\n)\s*2\.?\s*CH[IỈÍ]\s*ĐỊNH", re.I | re.M)),
    ("chongChiDinh", re.compile(r"(?:^|\n)\s*3\.?\s*CH[ỐO]NG\s*CH[IỈÍỐO]?\s*ĐỊNH", re.I | re.M)),
    ("thanTrong", re.compile(r"(?:^|\n)\s*4\.?\s*TH[ẬA]N\s*TR[ỌO]NG", re.I | re.M)),
    ("chuanBi", re.compile(r"(?:^|\n)\s*5\.?\s*CHU[ẨA]N\s*B[ỊI]", re.I | re.M)),
    ("cacBuoc", re.compile(r"(?:^|\n)\s*6\.?\s*(?:C[ÁA]C\s*B[ƯU]ỚC|TIẾN\s*HÀNH)", re.I | re.M)),
]
SECTION_PATTERNS_2012: list[tuple[str, re.Pattern[str]]] = [
    ("chiDinh", re.compile(r"(?:^|\n)\s*II\.?\s*CH[IỈÍ]\s*ĐỊNH", re.I | re.M)),
    ("chongChiDinh", re.compile(r"(?:^|\n)\s*III\.?\s*CH[ỐO]NG\s*CH[IỈÍỐO]?\s*ĐỊNH", re.I | re.M)),
]
SUB_PATTERNS = {
    "nhanSuThucHien": re.compile(
        r"5\.1\.?\s*Người thực hiện|5\.1\.?\s*Nhân lực|Người thực hiện\s*:",
        re.I,
    ),
    "thoiGianThucHien": re.compile(
        r"5\.6\.?\s*Thời gian thực hiện(?:\s*kỹ thuật)?\s*:?\s*(.+)",
        re.I,
    ),
}
APPENDIX_ROW_V2025 = re.compile(r"^(\d{1,3})\s+(\d{3,5})\s+(.+)$")
APPENDIX_ROW_V2016 = re.compile(r"^(\d{1,4})\s+(\d{1,4})\s+(.+)$")
PROCEDURE_START_V2025 = re.compile(r"^(\d{1,3})\.\s+([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ][^\n]{4,})$")
PROCEDURE_START_2012 = re.compile(
    r"^(KỸ THUẬT|Kỹ thuật|ĐIỀU TRỊ|PHẪU THUẬT|THỦ THUẬT|SINH THIẾT)\s+(.+)$",
    re.I,
)
TOC_ENTRY_RE = re.compile(r"^(\d{1,3})\.\s+(.+?)(?:\s*\.{2,}\s*\d+\s*)?$")
TOC_PHAN_RE = re.compile(r"^PHẦN\s+\d+", re.I)
TOC_SKIP_LINES = frozenset(
    {
        "muc luc",
        "loi noi dau",
        "phu luc",
        "nguyen tac ap dung huong dan quy trinh ky thuat",
        "phu luc danh muc ky thuat",
        "ban bien soan",
    }
)
DAI_CUONG_LINE_RE = re.compile(r"^1\.?\s*ĐẠI CƯƠNG\b", re.I)
BODY_PHAN_RE = re.compile(r"^PHẦN\s+\d+\s*:", re.I)


def _norm(s: str) -> str:
    text = unicodedata.normalize("NFD", (s or "").lower())
    text = text.replace("đ", "d").replace("Đ", "d")
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", (line or "").strip())


def is_valid_pdf(pdf_path: Path) -> bool:
    try:
        import pdfplumber

        with pdfplumber.open(pdf_path) as pdf:
            if not pdf.pages:
                return False
            for i in range(min(3, len(pdf.pages))):
                if (pdf.pages[i].extract_text() or "").strip():
                    return True
        return False
    except Exception:
        return False


def extract_pdf_text(pdf_path: Path, max_pages: int | None = None) -> list[str]:
    import os

    import pdfplumber

    limit_env = os.environ.get("QTKT_MAX_PAGES")
    if max_pages is None and limit_env:
        try:
            max_pages = int(limit_env)
        except ValueError:
            pass
    pages: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        limit = len(pdf.pages) if max_pages is None else min(len(pdf.pages), max_pages)
        for i in range(limit):
            pages.append(pdf.pages[i].extract_text() or "")
            if (i + 1) % 150 == 0:
                print(f"    ... {i + 1}/{limit} trang", flush=True)
    return pages


def detect_qtkt_format(pages: list[str]) -> str:
    blob = _norm("\n".join(pages[:25]))
    if "stt trong qtkt" in blob or ("stt ky" in blob and "tt23" in blob):
        return "v2025"
    if re.search(r"\d+\s+\d{4}\s+\w", "\n".join(pages[8:14])):
        return "v2025"
    if "nguyen tac ap dung huong dan quy trinh" in blob:
        return "v2025"
    if "phan 1" in blob and "phu luc" in blob and "danh muc ky thuat" in blob:
        return "v2016"
    if "muc luc" in blob or "ky thuat cham soc" in blob:
        return "v2012"
    return "v2016"


def parse_qd_metadata(pages: list[str], file_name: str) -> dict[str, str]:
    blob = "\n".join(pages[:12])
    so_qd = ""
    for pat in (
        r"Số[:\s]*(\d+\s*/\s*QĐ\s*-\s*BYT)",
        r"Quyết\s*định\s*số\s*(\d+\s*/\s*QĐ\s*-\s*BYT)",
        r"(\d{3,4}/QĐ-BYT)",
    ):
        m = re.search(pat, blob, re.I)
        if m:
            so_qd = re.sub(r"\s+", "", m.group(1))
            break
    ngay = ""
    m2 = re.search(r"ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})", blob, re.I)
    if m2:
        d, mo, y = m2.groups()
        ngay = f"{int(d):02d}/{int(mo):02d}/{y}"
    ten = ""
    for pat in (
        r"QUY TRÌNH KỸ THUẬT[^\n]*\n([^\n(]+)",
        r"HƯỚNG DẪN QUY TRÌNH KỸ THUẬT[^\n]*\n([^\n(]+)",
        r"Ban hành kèm theo Quyết định[^\n]*\n([^\n]+)",
    ):
        m3 = re.search(pat, blob, re.I)
        if m3:
            ten = _clean_line(m3.group(1))
            break
    if not ten:
        ten = re.sub(r"^\d{4}\.\s*", "", Path(file_name).stem).strip()
    chuyen_khoa = re.sub(r"^\d{4}\.\s*", "", Path(file_name).stem).strip()
    return {
        "soQuyetDinh": so_qd,
        "ngayBanHanh": ngay,
        "tenTaiLieu": ten,
        "chuyenKhoa": chuyen_khoa,
        "tenFileNguon": file_name,
    }


def _title_similar(a: str, b: str) -> float:
    a_n, b_n = _norm(a), _norm(b)
    if not a_n or not b_n:
        return 0.0
    if a_n in b_n or b_n in a_n:
        return 0.92
    aw = set(a_n.split())
    bw = set(b_n.split())
    if not aw or not bw:
        return 0.0
    return len(aw & bw) / max(len(aw), len(bw))


def _extract_ma_from_rest(rest: str) -> tuple[str, str, str]:
    """Trả về (maKyThuat, tenKyThuat, tenKyThuatTT23)."""
    dec = MA_KT_DECIMAL_RE.search(rest)
    if dec:
        ma = dec.group(1)
        parts = MA_KT_DECIMAL_RE.split(rest, maxsplit=1)
        ten_qt = parts[0].strip(" -–·")
        ten_tt = parts[1].strip(" -–·") if len(parts) > 1 else ""
        return ma, ten_qt or ten_tt or rest.strip(), ten_tt or ten_qt or rest.strip()
    dig = MA_KT_4DIGIT_RE.search(rest)
    if dig and len(dig.group(1)) >= 4:
        ma = dig.group(1)
        ten = rest.replace(ma, "", 1).strip(" -–·")
        return ma, ten or rest.strip(), ten or rest.strip()
    return "", rest.strip(), rest.strip()


def _strip_toc_dots(line: str) -> str:
    return re.sub(r"\s*\.{2,}.*$", "", (line or "")).strip()


def _is_valid_toc_title(title: str) -> bool:
    t = _normalize_article_title(title)
    if not t or len(t) < 8:
        return False
    if _is_section_heading(t):
        return False
    if TITLE_GARBAGE_RE.search(_norm(t)):
        return False
    if re.match(r"^[\d\.\s;]+$", t):
        return False
    return True


def parse_qtkt_toc(pages: list[str], fmt: str) -> dict[str, dict]:
    """Trích tiêu đề bài viết từ Mục lục (nguồn đúng cho tên quy trình)."""
    if fmt not in ("v2025", "v2016"):
        return {}
    by_qt: dict[str, dict] = {}
    in_toc = False
    current_num = ""
    current_parts: list[str] = []

    def flush() -> None:
        nonlocal current_num, current_parts
        if not current_num or not current_parts:
            current_num = ""
            current_parts = []
            return
        title = _clean_line(" ".join(current_parts))
        title = _strip_toc_dots(title)
        if _is_valid_toc_title(title):
            by_qt[current_num] = {
                "quyTrinhSo": current_num,
                "tenKyThuat": _normalize_article_title(title),
            }
        current_num = ""
        current_parts = []

    for text in pages[:120]:
        upper = text.upper()
        if "MỤC LỤC" in upper or "MUC LUC" in _norm(text):
            in_toc = True
        if not in_toc:
            continue
        if BODY_PHAN_RE.search(text) and not re.search(r"\.{4,}", text):
            flush()
            break
        if re.search(r"^1\.\s+ĐẠI CƯƠNG\b", text, re.I | re.M) and not re.search(r"\.{4,}", text):
            flush()
            break
        for raw in text.splitlines():
            line = _clean_line(raw)
            if not line:
                continue
            nline = _norm(line)
            if nline in TOC_SKIP_LINES:
                continue
            if TOC_PHAN_RE.match(line) and re.search(r"\.{2,}", line):
                flush()
                continue
            m = TOC_ENTRY_RE.match(line)
            if m:
                flush()
                current_num = m.group(1)
                part = _strip_toc_dots(m.group(2))
                if part:
                    current_parts = [part]
                continue
            if current_num and not re.match(r"^\d{1,3}\.\s+", line):
                part = _strip_toc_dots(line)
                if part and not TOC_PHAN_RE.match(part):
                    current_parts.append(part)
    flush()
    return by_qt


def _has_dai_cuong_ahead(lines: list[str], idx: int, *, window: int = 6) -> bool:
    for j in range(idx + 1, min(idx + window, len(lines))):
        if DAI_CUONG_LINE_RE.match(lines[j]):
            return True
    return False


def parse_article_titles_from_pages(pages: list[str], fmt: str) -> dict[str, dict]:
    """Tiêu đề bài viết trong thân tài liệu (sau Mục lục)."""
    if fmt not in ("v2025", "v2016"):
        return {}
    titles: dict[str, dict] = {}
    in_body = False
    all_lines: list[str] = []
    for text in pages:
        if not in_body:
            if BODY_PHAN_RE.search(text) and not re.search(r"\.{4,}", text):
                in_body = True
            elif re.search(r"^1\.\s+ĐẠI CƯƠNG\b", text, re.I | re.M) and not re.search(r"\.{4,}", text):
                in_body = True
        if not in_body:
            continue
        if "PHỤ LỤC" in text.upper() and "DANH MỤC KỸ THUẬT" in text.upper():
            break
        for raw in text.splitlines():
            line = _clean_line(raw)
            if line:
                all_lines.append(line)
    for idx, line in enumerate(all_lines):
        if re.search(r"\.{4,}", line):
            continue
        m = re.match(r"^(\d{1,3})\.\s+(.+)$", line)
        if not m or re.match(r"^\d+\.\d+", line):
            continue
        num, title = m.group(1), m.group(2).strip()
        if _is_section_heading(title):
            continue
        if not _has_dai_cuong_ahead(all_lines, idx):
            continue
        norm = _normalize_article_title(title)
        if _is_valid_article_title(norm):
            titles[num] = {"quyTrinhSo": num, "tenKyThuat": norm}
    return titles


def _parse_appendix_lines(lines: list[str], fmt: str) -> list[dict]:
    rows: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = None
        if fmt == "v2025":
            m = APPENDIX_ROW_V2025.match(line)
        if not m:
            m = APPENDIX_ROW_V2016.match(line)
        if not m:
            i += 1
            continue
        qt_so, col2, rest = m.group(1), m.group(2), m.group(3)
        ma, _, _ = _extract_ma_from_rest(rest)
        if not ma and col2.isdigit() and len(col2) >= 3:
            ma = col2
        # Phụ lục chỉ dùng cho mã/STT — không ghép dòng cột TT23 làm tên quy trình
        rows.append(
            {
                "quyTrinhSo": qt_so,
                "sttKyThuat": col2,
                "maKyThuat": ma,
                "tenKyThuat": "",
                "tenKyThuatTT23": "",
            }
        )
        i += 1
    return rows


def parse_appendix(pages: list[str], fmt: str) -> dict[str, dict]:
    by_qt: dict[str, dict] = {}
    in_table = False
    for text in pages:
        upper = text.upper()
        if "DANH MỤC KỸ THUẬT" in upper or "STT TRONG" in upper and "QTKT" in upper:
            in_table = True
        if not in_table and fmt != "v2016":
            continue
        if "PHẦN MỞ ĐẦU" in upper or "PHẦN 1" in upper and "NGUYÊN TẮC" in upper:
            in_table = False
        lines = [_clean_line(ln) for ln in text.splitlines() if _clean_line(ln)]
        for row in _parse_appendix_lines(lines, fmt):
            key = str(row["quyTrinhSo"])
            prev = by_qt.get(key)
            if not prev or len(row.get("maKyThuat", "")) >= len(prev.get("maKyThuat", "")):
                by_qt[key] = row
    return by_qt


def parse_muc_luc_2012(pages: list[str]) -> dict[str, dict]:
    """Mục lục tài liệu 2012 — gán STT tuần tự cho tên kỹ thuật."""
    by_qt: dict[str, dict] = {}
    stt = 0
    for text in pages[:15]:
        if "MỤC LỤC" not in text.upper() and "MUC LUC" not in _norm(text):
            continue
        for raw in text.splitlines():
            line = _clean_line(raw)
            if not line or len(line) < 8:
                continue
            if re.match(r"^\d+\.?$", line):
                continue
            if _norm(line) in {"loi noi dau", "muc luc", "phu luc"}:
                continue
            m = re.match(r"^(.+?)\s+(\d{1,3})\s*$", line)
            title = m.group(1).strip() if m else line
            if len(title) < 6:
                continue
            if any(x in _norm(title) for x in ("phu luc", "muc luc", "ban bien", "ban bien soan")):
                continue
            stt += 1
            by_qt[str(stt)] = {
                "quyTrinhSo": str(stt),
                "sttKyThuat": "",
                "maKyThuat": "",
                "tenKyThuat": title,
                "tenKyThuatTT23": title,
            }
    return by_qt


def _slice_section(text: str, start_pat: re.Pattern[str], end_pats: list[re.Pattern[str]]) -> str:
    m = start_pat.search(text)
    if not m:
        return ""
    start = m.end()
    end = len(text)
    for pat in end_pats:
        m2 = pat.search(text, start)
        if m2:
            end = min(end, m2.start())
    chunk = text[start:end].strip()
    chunk = re.sub(r"^[\s:–\-]+", "", chunk)
    return chunk.strip()


def _clean_indication_text(text: str) -> str:
    if not text:
        return ""
    t = text
    t = re.sub(r"^\s*\d+\.?\s*CH[ỐO]NG\s*CH[IỈÍỐO]?\s*ĐỊNH\s*", "", t, flags=re.I | re.M)
    m = re.search(r"(?:TAI LIEU THAM KHAO|tài liệu tham khảo)", t, re.I)
    if m:
        t = t[: m.start()]
    t = re.sub(r"\n\d+\.\s+[A-Z][a-z]+(?:\s+et al)?.*$", "", t, flags=re.M)
    return t.strip()


def _extract_procedure_body(text: str, fmt: str) -> dict[str, str]:
    out: dict[str, str] = {
        "chiDinh": "",
        "chongChiDinh": "",
        "nhanSuThucHien": "",
        "thoiGianThucHien": "",
    }
    patterns = SECTION_PATTERNS_2012 if fmt == "v2012" else SECTION_PATTERNS
    markers = [pat for _, pat in patterns]
    if markers:
        out["chiDinh"] = _slice_section(text, markers[0], markers[1:])
    if len(markers) > 1:
        out["chongChiDinh"] = _slice_section(text, markers[1], markers[2:])
    m_ns = SUB_PATTERNS["nhanSuThucHien"].search(text)
    if m_ns:
        chunk = text[m_ns.end() :]
        m_end = re.search(r"5\.2\.?\s", chunk)
        out["nhanSuThucHien"] = chunk[: m_end.start() if m_end else 800].strip()
    m_tg = SUB_PATTERNS["thoiGianThucHien"].search(text)
    if m_tg:
        val = m_tg.group(1) if m_tg.lastindex else ""
        out["thoiGianThucHien"] = _clean_line(val.split("\n")[0])
    else:
        m_tg2 = re.search(r"Thời gian thực hiện(?:\s*kỹ thuật)?\s*:?\s*([^\n]+)", text, re.I)
        if m_tg2:
            out["thoiGianThucHien"] = _clean_line(m_tg2.group(1))
    for key in ("chiDinh", "chongChiDinh", "nhanSuThucHien"):
        if out[key]:
            out[key] = _clean_indication_text(out[key])[:4000]
    return out


def _normalize_article_title(title: str) -> str:
    t = _clean_line(title)
    for _ in range(4):
        t2 = re.sub(r"^\d{1,3}[\.\s]+", "", t)
        if t2 == t:
            break
        t = t2
    t = re.sub(r"^(KỸ THUẬT|Kỹ thuật|ĐIỀU TRỊ|PHẪU THUẬT|THỦ THUẬT|SINH THIẾT)\s+", "", t, flags=re.I)
    return _clean_line(t)


def _is_section_heading(title: str) -> bool:
    t = _norm(_normalize_article_title(title))
    if not t:
        return True
    if t in SECTION_TITLE_BLACKLIST:
        return True
    if re.match(
        r"^(chi dinh|chong chi dinh|than trong|chuan bi|tien hanh|theo doi|dai cuong|dinh nghia|noi dung|trach nhiem)\b",
        t,
    ):
        return True
    return False


def _is_blacklisted_section(title: str) -> bool:
    return _is_section_heading(title)


def _is_valid_appendix_title(title: str) -> bool:
    t = _normalize_article_title(title)
    if not t or len(t) < 8:
        return False
    if re.match(r"^[\d\.\s;]+$", t):
        return False
    if re.match(r"^\d", t):
        return False
    if _is_section_heading(t):
        return False
    if TITLE_GARBAGE_RE.search(_norm(t)):
        return False
    if ";" in t and re.search(r"\b\d+\.\d+\b", t):
        return False
    return True


def _resolve_ten_ky_thuat(
    toc_ten: str,
    pr_ten: str,
    ap_ten: str,
    *,
    has_body: bool,
) -> str:
    """Ưu tiên: Mục lục / tiêu đề bài viết — không dùng phụ lục cột TT23."""
    for candidate in (_normalize_article_title(toc_ten), _normalize_article_title(pr_ten)):
        if not candidate:
            continue
        if _is_valid_article_title(candidate, ap_ten):
            return candidate
        if has_body and len(candidate) >= 12 and not _is_section_heading(candidate):
            letters = [c for c in candidate if c.isalpha()]
            if letters and sum(1 for c in letters if c.isupper()) / len(letters) >= 0.5:
                return candidate
    return ""


def _is_valid_article_title(title: str, appendix_title: str = "") -> bool:
    t = _normalize_article_title(title)
    if not t or len(t) < 10:
        return False
    n = _norm(t)
    if _is_section_heading(t):
        return False
    if re.match(r"^[\d\.\s]+$", t):
        return False
    if TITLE_GARBAGE_RE.search(n):
        return False
    if t[0].islower():
        return False
    if t.endswith(('"', "”", "'")) and len(t) < 50:
        return False
    if t.endswith(".") and len(t) < 45 and " " in t:
        return False
    if appendix_title:
        if _title_similar(t, appendix_title) >= 0.38:
            return True
    letters = [c for c in t if c.isalpha()]
    if letters:
        upper_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
        if upper_ratio >= 0.55 and len(t) >= 12:
            return True
    if t[0].isupper() and len(t) >= 16:
        return True
    return False


def _has_chi_dinh_ahead(
    lines: list[str],
    idx: int,
    appendix: dict[str, dict],
    proc_no: str,
    *,
    window: int = 18,
) -> bool:
    for j in range(idx + 1, min(idx + window, len(lines))):
        line = lines[j]
        if CHI_DINH_LINE_RE.match(line) or re.match(r"^II\.?\s*CH[IỈÍ]\s*ĐỊNH\b", line, re.I):
            return True
        if CHONG_CHI_DINH_LINE_RE.match(line):
            return True
        m = re.match(r"^(\d{1,3})\.\s+(.+)$", line)
        if not m or re.match(r"^\d+\.\d+", line):
            continue
        num, title = m.group(1), m.group(2).strip()
        if num != proc_no and num in appendix:
            ap_title = appendix[num].get("tenKyThuat", "")
            if _is_valid_article_title(title, ap_title) or _title_similar(title, ap_title) >= 0.45:
                return False
    return False


def _pick_article_title(line_title: str, appendix_title: str, *, has_body: bool) -> str:
    line_t = _normalize_article_title(line_title)
    ap_t = _clean_line(appendix_title)
    if has_body and _is_valid_article_title(line_t, ap_t):
        return line_t
    if _is_valid_article_title(line_t, ap_t):
        return line_t
    if ap_t and _is_valid_appendix_title(ap_t):
        return ap_t
    return ""


def _is_procedure_start(
    line: str, appendix: dict[str, dict], fmt: str, *, lines: list[str] | None = None, idx: int = 0
) -> re.Match[str] | None:
    line = _clean_line(line)
    if re.search(r"\.{4,}", line):
        return None
    if fmt == "v2012":
        m = PROCEDURE_START_2012.match(line)
        if m:
            title = _normalize_article_title(m.group(2))
            if _is_valid_article_title(title):
                return m
        return None
    m = re.match(r"^(\d{1,3})\.\s+(.+)$", line)
    if not m or re.match(r"^\d+\.\d+", line):
        return None
    num, title = m.group(1), m.group(2).strip()
    if num not in appendix:
        return None
    if _is_section_heading(title):
        return None
    ap_title = appendix[num].get("tenKyThuat", "")
    if not _is_valid_article_title(title, ap_title):
        sim = _title_similar(_norm(title), _norm(ap_title))
        if sim < 0.38 and not (title.isupper() and len(title) >= 18):
            return None
    if lines is not None and not _has_chi_dinh_ahead(lines, idx, appendix, num):
        return None
    return m


def parse_procedures_from_pages(
    pages: list[str], appendix: dict[str, dict], fmt: str
) -> dict[str, dict]:
    procedures: dict[str, dict] = {}
    current_no = ""
    current_title = ""
    buf: list[str] = []
    seq_2012 = 0

    def flush() -> None:
        nonlocal current_no, current_title, buf
        if not current_no and not buf:
            return
        body = "\n".join(buf)
        fields = _extract_procedure_body(body, fmt)
        has_body = bool(fields.get("chiDinh") or fields.get("chongChiDinh"))
        ap_title = appendix.get(current_no, {}).get("tenKyThuat", "")
        title = _pick_article_title(current_title, ap_title, has_body=has_body)
        if not title:
            buf = []
            return
        key = current_no or str(seq_2012)
        procedures[key] = {
            "quyTrinhSo": key,
            "tenKyThuat": title,
            **fields,
        }
        buf = []

    started = fmt == "v2025"
    catalog_done = fmt != "v2025"
    all_lines: list[str] = []
    for text in pages:
        upper = text.upper()
        if fmt == "v2025":
            if BODY_PHAN_RE.search(text) and not re.search(r"\.{4,}", text):
                catalog_done = True
            if re.search(r"^1\.\s+ĐẠI CƯƠNG\b", text, re.I | re.M) and not re.search(r"\.{4,}", text):
                catalog_done = True
        if not started and (
            "PHẦN 1" in upper
            or "NGUYÊN TẮC ÁP DỤNG" in upper
            or "QUY TRÌNH KỸ THUẬT" in upper
            or fmt == "v2012"
        ):
            started = True
        if "PHẦN MỞ ĐẦU" in upper or ("QUY TRÌNH KHÁM" in upper and "DINH DƯỠNG" in upper):
            catalog_done = True
        if not started:
            continue
        if "PHỤ LỤC" in upper and "DANH MỤC KỸ THUẬT" in upper:
            continue
        for raw in text.splitlines():
            line = _clean_line(raw)
            if line:
                all_lines.append(line)

    for idx, line in enumerate(all_lines):
        if fmt == "v2012":
            m12 = PROCEDURE_START_2012.match(line)
            if m12:
                flush()
                seq_2012 += 1
                current_no = str(seq_2012)
                current_title = _normalize_article_title(m12.group(2))
                buf = [line]
                continue
        m = _is_procedure_start(line, appendix, fmt, lines=all_lines, idx=idx)
        if m:
            if fmt == "v2025" and not catalog_done:
                continue
            new_no = m.group(1)
            new_title = _normalize_article_title(m.group(2) if m.lastindex and m.lastindex >= 2 else line)
            ap_title = appendix.get(new_no, {}).get("tenKyThuat", "")
            new_score = _title_similar(new_title, ap_title)
            cur_score = _title_similar(current_title, ap_title) if current_no == new_no else 0
            if new_no == current_no and new_score <= cur_score + 0.12:
                if current_no:
                    buf.append(line)
                continue
            flush()
            current_no = new_no
            current_title = new_title
            buf = [line]
            continue
        if current_no or (fmt == "v2012" and buf):
            buf.append(line)
    flush()
    return procedures


def merge_qtkt_records(
    meta: dict,
    appendix: dict[str, dict],
    procedures: dict[str, dict],
    toc: dict[str, dict] | None = None,
    article_titles: dict[str, dict] | None = None,
) -> list[dict]:
    toc = toc or {}
    article_titles = article_titles or {}
    keys = sorted(set(appendix) | set(procedures) | set(toc) | set(article_titles), key=lambda x: int(x) if str(x).isdigit() else 99999)
    rows: list[dict] = []
    for k in keys:
        ap = appendix.get(k, {})
        pr = procedures.get(k, {})
        toc_row = toc.get(k, {})
        art_row = article_titles.get(k, {})
        ap_ten = _clean_line(ap.get("tenKyThuat", ""))
        toc_ten = toc_row.get("tenKyThuat", "") or art_row.get("tenKyThuat", "")
        pr_ten = _normalize_article_title(pr.get("tenKyThuat", "") or art_row.get("tenKyThuat", ""))
        has_body = bool(pr.get("chiDinh") or pr.get("chongChiDinh"))
        ten = _resolve_ten_ky_thuat(toc_ten, pr_ten, ap_ten, has_body=has_body)
        if not ten:
            continue
        rows.append(
            {
                "quyTrinhSo": k,
                "maKyThuat": ap.get("maKyThuat", ""),
                "sttKyThuat": ap.get("sttKyThuat", ""),
                "tenKyThuat": ten,
                "tenKyThuatTT23": ap.get("tenKyThuatTT23", "") or ten,
                "chiDinh": pr.get("chiDinh", ""),
                "chongChiDinh": pr.get("chongChiDinh", ""),
                "thoiGianThucHien": pr.get("thoiGianThucHien", ""),
                "nhanSuThucHien": pr.get("nhanSuThucHien", ""),
                "soQuyetDinh": meta.get("soQuyetDinh", ""),
                "ngayBanHanh": meta.get("ngayBanHanh", ""),
                "tenTaiLieu": meta.get("tenTaiLieu", ""),
                "chuyenKhoa": meta.get("chuyenKhoa", ""),
                "tenFileNguon": meta.get("tenFileNguon", ""),
            }
        )
    return rows


def parse_qtkt_pdf(pdf_path: Path, max_pages: int | None = None) -> list[dict]:
    if not is_valid_pdf(pdf_path):
        print(f"  Bo qua (PDF loi): {pdf_path.name}", flush=True)
        return []
    print(f"  Parse PDF: {pdf_path.name}...", flush=True)
    pages = extract_pdf_text(pdf_path, max_pages=max_pages)
    print(f"    {len(pages)} trang", flush=True)
    meta = parse_qd_metadata(pages, pdf_path.name)
    fmt = detect_qtkt_format(pages)
    toc = parse_qtkt_toc(pages, fmt)
    appendix = parse_appendix(pages, fmt)
    if not appendix and fmt == "v2012":
        appendix = parse_muc_luc_2012(pages)
        if not toc:
            toc = {k: {"quyTrinhSo": k, "tenKyThuat": v.get("tenKyThuat", "")} for k, v in appendix.items()}
    article_titles = parse_article_titles_from_pages(pages, fmt)
    procedures = parse_procedures_from_pages(pages, appendix, fmt)
    rows = merge_qtkt_records(meta, appendix, procedures, toc, article_titles)
    print(f"    -> {len(appendix)} PL, {len(toc)} ML, {len(procedures)} QT, {len(rows)} dong", flush=True)
    return rows


def _should_include_pdf(path: Path) -> bool:
    if "Hết hiệu lực" in str(path.parent):
        return bool(re.search(r"20(25|26)", path.name))
    return True


def _pdf_size_limits() -> tuple[float, float]:
    import os

    min_kb = float(os.environ.get("QTKT_MIN_KB", "400") or "0")
    max_mb = float(os.environ.get("QTKT_MAX_MB", "45") or "0")
    return min_kb, max_mb


def _passes_size_filter(path: Path) -> bool:
    min_kb, max_mb = _pdf_size_limits()
    if re.search(r"20(25|26)", path.name):
        return True
    if min_kb > 0 and path.stat().st_size < min_kb * 1024:
        return False
    if max_mb > 0 and path.stat().st_size > max_mb * 1024 * 1024:
        return False
    return True


def audit_qtkt_sources(source_dir: Path) -> dict[str, list[dict]]:
    """Phân loại PDF: parse / bỏ qua (nặng, nhỏ, hết hiệu lực)."""
    import os

    min_kb, max_mb = _pdf_size_limits()
    out: dict[str, list[dict]] = {
        "parse": [],
        "skip_heavy": [],
        "skip_small": [],
        "skip_expired": [],
    }
    if not source_dir.is_dir():
        return out
    for p in sorted(source_dir.rglob("*.pdf")):
        if not p.is_file() or p.name.endswith(".crdownload"):
            continue
        mb = p.stat().st_size / 1024 / 1024
        entry = {"name": p.name, "mb": round(mb, 1), "path": str(p)}
        if "Hết hiệu lực" in str(p.parent) and not _should_include_pdf(p):
            out["skip_expired"].append(entry)
            continue
        if not _passes_size_filter(p):
            if min_kb > 0 and p.stat().st_size < min_kb * 1024:
                out["skip_small"].append(entry)
            else:
                out["skip_heavy"].append(entry)
            continue
        out["parse"].append(entry)
    return out


def discover_qtkt_files(source_dir: Path) -> list[Path]:
    import os

    max_files = int(os.environ.get("QTKT_MAX_FILES", "0") or "0")
    files: list[Path] = []
    if not source_dir.is_dir():
        return files
    for p in sorted(source_dir.rglob("*.pdf")):
        if not p.is_file() or p.name.endswith(".crdownload"):
            continue
        if "Hết hiệu lực" in str(p.parent) and not _should_include_pdf(p):
            continue
        if not _passes_size_filter(p):
            continue
        files.append(p)

    def _sort_key(path: Path) -> tuple:
        year = 0
        m = re.match(r"^(\d{4})", path.name)
        if m:
            year = int(m.group(1))
        return (-year, -path.stat().st_size, path.name)

    files.sort(key=_sort_key)
    if max_files > 0:
        files = files[:max_files]
    return files


def parse_all_qtkt_sources(source_dir: Path) -> list[dict]:
    all_rows: list[dict] = []
    files = discover_qtkt_files(source_dir)
    print(f"  {len(files)} PDF se parse", flush=True)
    for i, path in enumerate(files, start=1):
        try:
            print(f"  [{i}/{len(files)}]", flush=True)
            rows = parse_qtkt_pdf(path)
            all_rows.extend(rows)
            print(f"    Tong tich luy: {len(all_rows)} quy trinh", flush=True)
        except Exception as exc:
            print(f"  Loi parse {path.name}: {exc}", flush=True)
    return all_rows
