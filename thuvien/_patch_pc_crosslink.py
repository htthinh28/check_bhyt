# -*- coding: utf-8 -*-
"""Gắn liên kết DVKT ↔ Dược thư vào file HTML Dược thư (patch tối thiểu)."""
from __future__ import annotations

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
DUOC_HTML = BASE / "Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html"
CROSSLINK_SNIPPET = BASE / "_pc_crosslink_snippet.html"


def patch_duoc_thu_html(html: str) -> str:
    nav_btn = (
        '<button type="button" class="lib-nav-tab" data-section="dvkt" '
        'onclick="navigateToDvktApp({tab:\'quytrinhkt\'})" title="Mở Danh mục DVKT">'
        "DVKT</button>"
    )
    anchor = '<button type="button" class="lib-nav-tab" data-section="promt"'
    if nav_btn not in html and anchor in html:
        html = html.replace(anchor, nav_btn + "\n            " + anchor, 1)

    home_card = """
                    <button type="button" class="lib-home-card w-full touch-manipulation" onclick="navigateToDvktApp({tab:'pl1'})">
                        <span class="inline-flex p-2.5 rounded-xl bg-rose-100 text-rose-700 mb-3"><i data-lucide="stethoscope" class="w-7 h-7"></i></span>
                        <span class="text-lg font-bold text-gray-800 mb-1">Danh mục DVKT</span>
                        <span class="text-sm text-gray-500 leading-snug">QĐ 7603 · TT23 · Quy trình kỹ thuật · ICD-10</span>
                    </button>"""
    duocthu_btn = """<button type="button" class="lib-home-card w-full touch-manipulation" onclick="navigateToSection('duocthu')">"""
    if "navigateToDvktApp({tab:'pl1'})" not in html and duocthu_btn in html:
        html = html.replace(duocthu_btn, home_card + "\n                    " + duocthu_btn, 1)

    inject = CROSSLINK_SNIPPET.read_text(encoding="utf-8") if CROSSLINK_SNIPPET.is_file() else ""
    marker = "</body>"
    if inject and inject not in html and marker in html:
        html = html.replace(marker, inject + "\n" + marker, 1)
    return html


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    if not DUOC_HTML.is_file():
        raise SystemExit(f"Không tìm thấy {DUOC_HTML}")
    text = DUOC_HTML.read_text(encoding="utf-8")
    new_text = patch_duoc_thu_html(text)
    if new_text == text:
        print("Không có thay đổi (đã patch trước đó?).")
        return
    DUOC_HTML.write_text(new_text, encoding="utf-8")
    print(f"Đã patch liên kết DVKT → {DUOC_HTML.name}")


if __name__ == "__main__":
    main()
