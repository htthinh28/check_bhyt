# -*- coding: utf-8 -*-
"""Đồng bộ Dược thư → dvkt_app/static/duocthu/index.html (đường dẫn ASCII cho Flask)."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC = BASE / "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html"
DST_DIR = BASE / "dvkt_app" / "static" / "duocthu"
DST = DST_DIR / "index.html"


def patch_for_flask_serve(html: str) -> str:
    """Đường dẫn tương đối → tuyệt đối từ gốc server khi mở /duocthu."""
    html = html.replace('src="chandoan-html/', 'src="/chandoan-html/')
    html = html.replace("src='chandoan-html/", "src='/chandoan-html/")
    if "_pc_crosslink.js" in html and '/static/js/_pc_crosslink.js' not in html:
        html = html.replace("src='_pc_crosslink.js'", "src='/static/js/_pc_crosslink.js'")
        html = html.replace('src="_pc_crosslink.js"', 'src="/static/js/_pc_crosslink.js"')
    return html


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    if not SRC.is_file():
        raise SystemExit(f"Không tìm thấy {SRC}")
    DST_DIR.mkdir(parents=True, exist_ok=True)
    text = SRC.read_text(encoding="utf-8")
    text = patch_for_flask_serve(text)
    DST.write_text(text, encoding="utf-8")
    kb = DST.stat().st_size / 1024
    print(f"Đồng bộ Dược thư → {DST.relative_to(BASE)} ({kb:.0f} KB)")


if __name__ == "__main__":
    main()
