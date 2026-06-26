# -*- coding: utf-8 -*-
"""Chỉ remap dữ liệu ICD trong HTML hiện tại (không đụng JS)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _update_icd_deep import (
    apply_icd_fields_to_drug,
    load_drugs_from_html,
    load_icd_from_html,
    patch_html_drug_chunks,
    try_load_xlsx,
    XLSX_DEFAULT,
)

sys.stdout.reconfigure(encoding="utf-8")

HTML = Path(__file__).resolve().parent / "Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html"


def main():
    html = HTML.read_text(encoding="utf-8")
    loaded = try_load_xlsx(XLSX_DEFAULT)
    if loaded:
        catalog, _, children = loaded
    else:
        catalog, _, children = load_icd_from_html(html)

    drugs = load_drugs_from_html(html)
    for d in drugs:
        apply_icd_fields_to_drug(d, catalog, children)

    overlap = sum(
        1
        for d in drugs
        if set((d.get("maICDChiDinh") or "").split(";")) - {""}
        & set((d.get("maICDChongChiDinh") or "").split(";")) - {""}
    )
    los = next(x for x in drugs if "Losartan" in (x.get("tenHoatChat") or ""))
    print(f"Thuoc: {len(drugs)} | Trung ma chi/chong: {overlap}")
    print("Losartan CHI:", los.get("maICDChiDinh"))
    print("Losartan CHONG:", los.get("maICDChongChiDinh"))

    new_html = patch_html_drug_chunks(html, drugs)
    if "</html>" not in new_html:
        raise SystemExit("HTML truncated!")
    HTML.write_text(new_html, encoding="utf-8")
    print("Da ghi:", HTML.name)


if __name__ == "__main__":
    main()
