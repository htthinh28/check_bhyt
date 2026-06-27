# -*- coding: utf-8 -*-
"""Mapping ICD-10 cho Quy trình kỹ thuật BYT — mã chỉ định & chống chỉ định."""
from __future__ import annotations

import re

from _update_icd_deep import (
    CHI_EXCLUDED_TARGETS,
    CHONG_CLAUSE_SIGNAL,
    ICD_RE,
    RELATIVE_CONTRA_CLAUSE,
    map_chong_text_to_icds,
    map_text_to_icds,
    norm,
    remove_chong_overlap_with_chi,
    resolve_targets,
    score_match,
    split_clauses,
)

ICD_INLINE_RE = re.compile(r"\b([A-TV-Z][0-9]{2}(?:\.[0-9]{1,2})?\*?)\b", re.I)

# Chỉ định chung / nhiễu parse PDF — không gán mã bệnh cụ thể (tránh map sai)
CHI_GENERIC_SKIP_RE = re.compile(
    r"^(tat ca|moi doi tuong|moi benh nhan|nguoi benh den kham|"
    r"khong can chi dinh dac biet|theo chi dinh cua bac si|"
    r"chi dinh theo pham vi chuyen mon|"
    r"chong chi dinh|khong co chong chi dinh|"
    r"mot so chi dinh khac theo huong dan|"
    r"theo yeu cau chuyen mon cua bac sy|"
    r"chup mach de phuc vu cho dien quang|"
    r"theo doi sau dieu tri|kiem tra sau phau thuat|"
    r"sieu am he tiet nieu hien nay duoc su dung|"
    r"nguoi benh mang cac thiet bi dien tu|"
    r"cay ghep oc tai thiet bi bom thuoc|"
    r"cac kep phau thuat bang kim loai)",
    re.I,
)

_SECTION_HEADER_RE = re.compile(
    r"^\s*\d+\.\s*(chi dinh|chong chi dinh|thoi gian|nhan su|tien hanh|theo doi|"
    r"dai cuong|than trong|tai lieu)\b",
    re.I,
)

# Gợi ý bổ sung cho DVKT / QTKT (bổ sung PHRASE_HINTS gốc)
QTKT_NO_CHONG_RE = re.compile(
    r"^(khong co chong chi dinh|khong co chong chi dinh tuyet doi|"
    r"chua co chong chi dinh|chong chi dinh\s*:?\s*khong)\.?$",
    re.I,
)

QTKT_PHRASE_HINTS: list[tuple[list[str], str]] = [
    (["huyet khoi", "huyết khối", "cum mau dong", "vte", "tinh mach sau"], "I82"),
    (["hoi chung cuong aldosteron", "cường aldosteron"], "E26"),
    (["u co tron tu cung", "u cơ trơn tử cung", "leiomyoma"], "D25"),
    (["gian tinh mach tinh", "giãn tĩnh mạch tinh", "varicocele"], "I86"),
    (["bat thuong dong mach phoi", "bất thường động mạch phổi"], "Q25"),
    (["hep tac cau noi", "hẹp tắc cầu nối"], "I77"),
    (["xung huyet tieu khung", "xung huyết tiểu khung"], "I86"),
    (["hep dong mach", "hẹp động mạch", "stenosis"], "I70"),
    (["phinh mach", "phình mạch", "aneurysm"], "I72"),
    (["u nao", "u não", "khoi u nao", "khối u não"], "D43"),
    (["ung thu", "ung thư", "ac tinh", "carcinoma", "neoplasm"], "C80"),
    (["viem tuyen giap", "nhan tuyen giap", "nang tuyen giap"], "E04"),
    (["suy dinh duong", "sdd", "malnutrition", "nang luong kem"], "E46"),
    (["benh nhiem khuan tiet nieu", "nhiem trung tiet nieu", "viem duong tiet nieu"], "N39"),
    (["suy dinh duong tre em", "suy dd tre"], "E43"),
    (["beo phi", "obesity", "bmi >= 30", "chi so khoi co the"], "E66"),
    (["thieu mau", "anemia", "hemoglobin thap"], "D64"),
    (["suy dinh duong nang", "suy dd nang"], "E43"),
    (["viem da", "dermatitis", "eczema"], "L30"),
    (["loet tinh mach", "varicose ulcer"], "I83"),
    (["gãy xuong", "gay xuong", "fracture"], "S72"),
    (["chan thuong so nao", "chan thuong dau"], "S06"),
    (["polyp dai trang", "polyp dai truc trang"], "K63"),
    (["viem dai trang", "colitis"], "K52"),
    (["tang nhan ap", "glaucoma"], "H40"),
    (["cataract", "đục thủy tinh thể", "duc thuy tinh the"], "H26"),
    (["ret detachment", "bong vomng mac", "bong vong mac"], "H33"),
    (["suy tim man", "heart failure"], "I50"),
    (["viem khop thoai hoa", "thoai hoa khop"], "M19"),
    (["thoai hoa cot song", "thoat vi dia dem"], "M51"),
    (["benh mach vanh", "coronary artery"], "I25"),
    (["xơ gan", "xo gan", "cirrhosis"], "K74"),
    (["viem gan virus", "viem gan b", "viem gan c"], "B18"),
    (["nhiem khuan phoi", "viem phoi do vi khuan"], "J15"),
    (["lao phoi", "lao khang thuoc"], "A15"),
    (["benh copd", "giai doan copd", "giai doan gold"], "J44"),
    (["suy than man giai doan", "ckd stage"], "N18"),
    (["benh than man"], "N18"),
    (["ung thu", "carcinoma", "neoplasm", "u ac tinh"], "C80"),
    (["polyp tu cung", "u xo tu cung"], "D25"),
    (["thai ngoai tu cung", "ectopic pregnancy"], "O00"),
    (["de non", "de som", "premature"], "P07"),
    (["sot xuat huyet", "dengue"], "A90"),
    (["sot ret", "malaria"], "B50"),
    (["viem mang nao do vi khuan"], "G00"),
    (["viem nao", "encephalitis"], "G04"),
    (["dau that nguc", "dau nguc"], "R07"),
    (["choang", "shock"], "R57"),
    (["mat mau cap", "chay mau nang"], "R58"),
    # Chẩn đoán hình ảnh / can thiệp mạch / cơ xương khớp (QTKT BYT)
    (["dong cung khop vai", "dckv", "viem cung khop vai", "dong cung vai"], "M75"),
    (["ho mau nang", "ho mau keo dai", " ho mau"], "R04"),
    (["chay mau mui", "u xo mui hong", "khoi u xo mui hong"], "D14"),
    (["gian dam roi tinh mach thung tinh", "gian tinh mach thung tinh"], "I86"),
    (["he mach phoi", "hep tac dong mach phoi", "teo hay gian dong mach phoi", "thong dong tinh mach phoi"], "Q25"),
    (["doan tan dong mach chu bung", "dong mach chau goc", "dong mach chau trong"], "I77"),
    (["di dang tinh mach", "venous malformation", "di dang mach mau vung"], "Q27"),
    (["di dang dong tinh mach", "di dang dong tinh mach than", "dich dong tinh mach"], "Q28"),
    (["chan thuong vung canh tay", "khao sat benh ly xuong o canh tay"], "S49"),
    (["chan thuong ban ngon tay", "benh ly xuong vung ban ngon tay", "dau ban ngon tay"], "S68"),
    (["chan thuong vung xuong duoi", "khao sat benh ly xuong o xuong duoi"], "S79"),
    (["chan thuong vung xuong cang chan", "xuong cang chan o tre em"], "S82"),
    (["chan thuong vung chau", "ton thuong mach chau", "khoi u vung tieu khung"], "S32"),
    (["chan thuong vung nguc", "ton thuong mach phoi", "khoi u o phoi trung that"], "S29"),
    (["u xuong", "khao sat benh ly xuong", "benh ly xuong"], "D16"),
    (["viem xuong", "viem nhiem xuong"], "M86"),
    (["hoai tu xuong"], "M87"),
    (["dau khop vai", "dau khop keo dai", "dau khop thong thuong"], "M25"),
    (["thoat vi dia dem", "thoat vi dia"], "M51"),
    (["cong gu cot song", "veo cot song", "khiem khuyet phan eo dot song"], "M41"),
    (["danh gia hinh thai va chuc nang tim", "danh gia chuc nang tim"], "I51"),
    (["ap xe", "o dich ap xe", "ap xe o cac tang"], "L02"),
    (["danh gia chan thuong duong vat"], "S31"),
    (["benh ly chan thuong cac khoi u viem cua xuong va phan mem cot song"], "M54"),
    (["tham kham dai trang", "noi soi khong thu duoc do vuong"], "K63"),
    (["danh gia truc xuong", "lam khop gia"], "M21"),
    (["benh mach mau nao", "chup dong mach nao"], "I67"),
    (["ton thuong u", "khoi u co chi dinh dieu tri"], "D48"),
    (["hoa tri lieu keo dai"], "Z51"),
]

QTKT_CHONG_PHRASE_HINTS: list[tuple[list[str], str]] = [
    (["di ung iod", "di ung thuoc can quang", "mau cam iod", "mau cam thuoc can quang"], "T78"),
    (["mang thai", "thai ky", "phu nu co thai"], "Z33"),
    (["tre so sinh", "so sinh du thang", "tre duoi 28 ngay"], "P96"),
    (["suy dinh duong nang chua dieu tri"], "E43"),
    (["rối loạn đông máu", "roi loan dong mau", "chay mau bat thuong"], "D68"),
    (["suy gan nang", "child pu c", "meld >"], "K72"),
    (["suy than nang", "loc mau", "creatinin cao nang"], "N18"),
    (["suy tim nang", "nyha iv", "nyha iii"], "I50"),
    (["nhiem trung toan than", "nhiem khuan huyet"], "A41"),
    (["hen phan ung", "co that phe quan cap"], "J46"),
    (["mat tri nho", "mat thi luc"], "H54"),
    (["rối loạn tâm thần", "tam than phan liet", "tam than cap"], "F29"),
    (["huyet khoi tm canh", "huyet khoi tinh mach chu tren", "tm canh trong", "tm chu tren", "tm gan"], "I82"),
    (["viem da hoai tu", "viem nhiem hoai tu da"], "L98"),
    (["roi loan nuot muc do nang", "roi loan nuot"], "R13"),
    (["child pugh c", "chuc nang gan kem", "pts 1"], "K72"),
    (["tre co chong chi dinh nuoi duong qua duong tieu hoa"], "P92"),
    (["nuoi duong tinh mach hoan toan"], "Z93"),
    (["benh nhi trong tinh trang cap cuu"], "R57"),
    (["thung tang rong"], "K63"),
    (["hep tac tm chu duoi", "benh ly tm chu duoi"], "I82"),
    (["ton thuong dong mach lan toa"], "I77"),
]


def sanitize_qtkt_indication_text(text: str) -> str:
    """Gỡ tiêu đề mục §2/§3 và dòng nhiễu trước khi map ICD."""
    if not text:
        return ""
    lines: list[str] = []
    for raw in re.split(r"[\r\n]+", str(text)):
        line = re.sub(r"^[•\-\*·▪–—]\s*", "", raw.strip())
        line = re.sub(r"^\d+[.)]\s*", "", line)
        if not line:
            continue
        if _SECTION_HEADER_RE.match(line):
            continue
        cn = norm(line)
        if not cn or CHI_GENERIC_SKIP_RE.match(cn):
            continue
        lines.append(line)
    out = "\n".join(lines).strip()
    # Cắt phần §3 lẫn vào §2
    m = re.search(r"(?i)\n\s*3\.\s*chong\s*chi\s*dinh\b", out)
    if m:
        out = out[: m.start()].strip()
    return out


def _any_hint(cn: str, patterns: list[str]) -> bool:
    return any(norm(p) in cn for p in patterns)


def _build_long_name_index(catalog: dict) -> list[tuple[str, dict]]:
    items = [(e["norm_ten"], e) for e in catalog.values() if len(e.get("norm_ten", "")) >= 10]
    return sorted(items, key=lambda x: -len(x[0]))


def extract_explicit_icd_codes(text: str, catalog: dict) -> list[dict]:
    out: dict[str, dict] = {}
    for m in ICD_INLINE_RE.finditer(text or ""):
        raw = m.group(1).upper().rstrip("*")
        if raw in catalog:
            out[raw] = catalog[raw]
            continue
        base = raw.split(".")[0]
        if base in catalog:
            out[base] = catalog[base]
    return sorted(out.values(), key=lambda x: x["ma"])


def match_catalog_substring(clause_norm: str, long_names: list[tuple[str, dict]], *, min_score: float = 95) -> list[dict]:
    if len(clause_norm) < 10:
        return []
    hits: dict[str, dict] = {}
    for ten, entry in long_names:
        if len(ten) < 12:
            continue
        if ten in clause_norm:
            sc = score_match(clause_norm, entry)
            if sc >= min_score and len(ten) >= max(12, len(clause_norm) * 0.25):
                hits[entry["ma"]] = entry
                if len(hits) >= 8:
                    break
    return sorted(hits.values(), key=lambda x: x["ma"])


def _apply_phrase_hints(
    text_norms: list[str],
    hints: list[tuple[list[str], str]],
    catalog: dict,
    children: dict,
    *,
    exclude_bases: frozenset[str] | None = None,
) -> dict[str, dict]:
    results: dict[str, dict] = {}
    exclude = exclude_bases or frozenset()
    for cn in text_norms:
        if not cn:
            continue
        for patterns, target in hints:
            base = target.split(".")[0]
            if base in exclude:
                continue
            if _any_hint(cn, patterns):
                for entry in resolve_targets(target, cn, catalog, children):
                    if entry:
                        results[entry["ma"]] = entry
    return results


def _clause_norms(text: str) -> list[str]:
    clauses = split_clauses(text)
    norms = [norm(c) for c in clauses if c.strip()]
    if not norms:
        norms = [norm(text)]
    return [n for n in norms if n and not CHI_GENERIC_SKIP_RE.match(n)]


def map_qtkt_chi_dinh(
    text: str,
    catalog: dict,
    children: dict,
    long_names: list[tuple[str, dict]] | None = None,
    *,
    max_codes: int = 25,
) -> list[dict]:
    if not text or not catalog:
        return []
    results: dict[str, dict] = {}

    for entry in extract_explicit_icd_codes(text, catalog):
        results[entry["ma"]] = entry

    norms = _clause_norms(text)
    work_norm = " ".join(norms)
    if re.search(r"khong (co|duoc) (tac dung|dung|chi dinh)", work_norm):
        for seg in re.split(r"[.;:\n]", work_norm):
            if re.search(r"khong (co|duoc) (tac dung|dung|chi dinh)", seg):
                work_norm = work_norm.replace(seg, " ")
    search_norms = norms + ([work_norm] if work_norm else [])

    for entry in map_text_to_icds(text, catalog, children, max_codes=max_codes):
        results[entry["ma"]] = entry

    for ma, entry in _apply_phrase_hints(
        search_norms, QTKT_PHRASE_HINTS, catalog, children, exclude_bases=CHI_EXCLUDED_TARGETS
    ).items():
        results[ma] = entry

    if long_names is None:
        long_names = _build_long_name_index(catalog)
    for cn in search_norms:
        for entry in match_catalog_substring(cn, long_names, min_score=85):
            results[entry["ma"]] = entry

    return sorted(results.values(), key=lambda x: x["ma"])[:max_codes]


def _is_qtkt_no_chong(text: str) -> bool:
    cn = norm(text)
    if not cn:
        return True
    if QTKT_NO_CHONG_RE.match(cn):
        return True
    clauses = [norm(c) for c in split_clauses(text) if c.strip()]
    return bool(clauses) and all(QTKT_NO_CHONG_RE.match(c) or not c for c in clauses)


def map_qtkt_chong_chi_dinh(
    text: str,
    catalog: dict,
    children: dict,
    long_names: list[tuple[str, dict]] | None = None,
    *,
    max_codes: int = 15,
    qtkt_section: bool = True,
) -> list[dict]:
    if not text or not catalog or _is_qtkt_no_chong(text):
        return []
    results: dict[str, dict] = {}
    clauses = split_clauses(text)
    norms = [norm(c) for c in clauses if c.strip()]

    for clause in clauses:
        cn = norm(clause)
        if not cn or RELATIVE_CONTRA_CLAUSE.search(cn) or QTKT_NO_CHONG_RE.match(cn):
            continue
        if not qtkt_section and not CHONG_CLAUSE_SIGNAL.search(cn):
            continue
        for entry in extract_explicit_icd_codes(clause, catalog):
            results[entry["ma"]] = entry

    if not qtkt_section:
        for entry in map_chong_text_to_icds(text, catalog, children, max_codes=max_codes):
            results[entry["ma"]] = entry

    for cn in norms:
        if RELATIVE_CONTRA_CLAUSE.search(cn) or QTKT_NO_CHONG_RE.match(cn):
            continue
        if not qtkt_section and not CHONG_CLAUSE_SIGNAL.search(cn):
            continue
        for ma, entry in _apply_phrase_hints([cn], QTKT_CHONG_PHRASE_HINTS, catalog, children).items():
            results[ma] = entry

    if long_names is None:
        long_names = _build_long_name_index(catalog)
    for cn in norms:
        if RELATIVE_CONTRA_CLAUSE.search(cn) or QTKT_NO_CHONG_RE.match(cn):
            continue
        if not qtkt_section and not CHONG_CLAUSE_SIGNAL.search(cn):
            continue
        for entry in match_catalog_substring(cn, long_names, min_score=88):
            results[entry["ma"]] = entry

    return sorted(results.values(), key=lambda x: x["ma"])[:max_codes]


def icd_confidence(entries: list[dict], *, explicit_count: int = 0) -> str:
    if not entries:
        return ""
    if explicit_count >= 1:
        return "Cao"
    detailed = sum(1 for e in entries if "." in e.get("ma", ""))
    if detailed >= 2 or (len(entries) >= 2 and detailed >= 1):
        return "Cao"
    if len(entries) >= 1:
        return "Trung bình"
    return "Thấp"


def apply_qtkt_icd_fields(row: dict, catalog: dict, children: dict, long_names: list[tuple[str, dict]] | None = None) -> dict:
    chi_text = sanitize_qtkt_indication_text(row.get("chiDinh") or "")
    chong_text = sanitize_qtkt_indication_text(row.get("chongChiDinh") or "")
    # Chỉ map ICD từ nguyên văn §2/§3 — không suy từ tên kỹ thuật (tránh map sai)
    if len(chi_text) < 8:
        chi_text = ""

    explicit_chi = len(extract_explicit_icd_codes(chi_text, catalog)) if chi_text else 0
    chi_entries = map_qtkt_chi_dinh(chi_text, catalog, children, long_names) if chi_text else []
    chong_entries = (
        map_qtkt_chong_chi_dinh(chong_text, catalog, children, long_names, qtkt_section=True)
        if chong_text
        else []
    )
    chong_entries = remove_chong_overlap_with_chi(chi_entries, chong_entries)

    row["maICDChiDinh"] = ";".join(e["ma"] for e in chi_entries)
    row["tenBenhICDChiDinh"] = ";".join(e["ten"] for e in chi_entries)
    row["maICDChongChiDinh"] = ";".join(e["ma"] for e in chong_entries)
    row["tenBenhICDChongChiDinh"] = ";".join(e["ten"] for e in chong_entries)
    row["doTinCayICDChiDinh"] = icd_confidence(chi_entries, explicit_count=explicit_chi)
    row["doTinCayICDChongChiDinh"] = icd_confidence(chong_entries)
    return row


def validate_icd_fields(row: dict, catalog: dict) -> list[str]:
    issues: list[str] = []
    for key, label in (("maICDChiDinh", "chỉ định"), ("maICDChongChiDinh", "chống chỉ định")):
        for ma in (row.get(key) or "").split(";"):
            ma = ma.strip()
            if not ma:
                continue
            if not ICD_RE.match(ma):
                issues.append(f"Mã ICD {label} không hợp lệ: {ma}")
            elif ma.rstrip("*") not in catalog and ma.split(".")[0] not in catalog:
                issues.append(f"Mã ICD {label} không có trong danh mục: {ma}")
    chi_set = set((row.get("maICDChiDinh") or "").split(";")) - {""}
    chong_set = set((row.get("maICDChongChiDinh") or "").split(";")) - {""}
    overlap = chi_set & chong_set
    if overlap:
        issues.append(f"Trùng mã chỉ định/chống chỉ định: {', '.join(sorted(overlap))}")
    return issues
