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

# Chỉ định chung — không gán mã bệnh cụ thể (tránh map sai)
CHI_GENERIC_SKIP_RE = re.compile(
    r"^(tat ca|moi doi tuong|moi benh nhan|nguoi benh den kham|"
    r"khong can chi dinh dac biet|theo chi dinh cua bac si|"
    r"chi dinh theo pham vi chuyen mon)",
    re.I,
)

# Gợi ý bổ sung cho DVKT / QTKT (bổ sung PHRASE_HINTS gốc)
QTKT_PHRASE_HINTS: list[tuple[list[str], str]] = [
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
]

QTKT_CHONG_PHRASE_HINTS: list[tuple[list[str], str]] = [
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
]


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
        for entry in match_catalog_substring(cn, long_names):
            results[entry["ma"]] = entry

    return sorted(results.values(), key=lambda x: x["ma"])[:max_codes]


def map_qtkt_chong_chi_dinh(
    text: str,
    catalog: dict,
    children: dict,
    long_names: list[tuple[str, dict]] | None = None,
    *,
    max_codes: int = 15,
) -> list[dict]:
    if not text or not catalog:
        return []
    results: dict[str, dict] = {}

    for clause in split_clauses(text):
        cn = norm(clause)
        if not cn or RELATIVE_CONTRA_CLAUSE.search(cn):
            continue
        if not CHONG_CLAUSE_SIGNAL.search(cn):
            continue
        for entry in extract_explicit_icd_codes(clause, catalog):
            results[entry["ma"]] = entry

    for entry in map_chong_text_to_icds(text, catalog, children, max_codes=max_codes):
        results[entry["ma"]] = entry

    norms = [norm(c) for c in split_clauses(text) if c.strip()]
    for ma, entry in _apply_phrase_hints(norms, QTKT_CHONG_PHRASE_HINTS, catalog, children).items():
        results[ma] = entry

    if long_names is None:
        long_names = _build_long_name_index(catalog)
    for cn in norms:
        if not CHONG_CLAUSE_SIGNAL.search(cn):
            continue
        for entry in match_catalog_substring(cn, long_names):
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
    chi_text = row.get("chiDinh") or ""
    chong_text = row.get("chongChiDinh") or ""

    explicit_chi = len(extract_explicit_icd_codes(chi_text, catalog))
    chi_entries = map_qtkt_chi_dinh(chi_text, catalog, children, long_names)
    chong_entries = map_qtkt_chong_chi_dinh(chong_text, catalog, children, long_names)
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
