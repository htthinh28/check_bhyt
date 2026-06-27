# -*- coding: utf-8 -*-
"""Rà soát dung lượng: tách mã nguồn (<10 MB) vs dữ liệu nhúng / PDF."""
from __future__ import annotations

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
LIMIT_MB = 10.0

CODE_SUFFIXES = {".py", ".js", ".css", ".bat", ".json"}
CODE_DIRS = ("dvkt_app",)
SKIP_DIR_NAMES = {
    "data",
    "qtkt_source",
    "__pycache__",
    ".git",
    "node_modules",
    "static/js",
    "chandoan-html",
    "duocthu_data",
}
DATA_FILE_PATTERNS = ("*_embed.js", "*-meta.js", "_extracted_main.js", "_probe_drive.html")
DATA_PATTERNS = ("*.json.gz", "*.pdf", "*.xlsx", "*.xls")


def is_embed_data_file(path: Path) -> bool:
    name = path.name.lower()
    if name.endswith("_embed.js") or name.endswith("-meta.js"):
        return True
    if name in ("_extracted_main.js", "_probe_drive.html"):
        return True
    if path.suffix.lower() == ".json" and path.stat().st_size > 200_000:
        return True
    return False


def is_code_file(path: Path) -> bool:
    if is_embed_data_file(path):
        return False
    if path.suffix.lower() in CODE_SUFFIXES and path.name != "pc_apps.json":
        rel = path.relative_to(BASE)
        if rel.parts[0] == "dvkt_app" and rel.parts[1:2] == ("data",):
            return False
        if "qtkt_source" in rel.parts:
            return False
        if rel.parts[0] == "duocthu_data":
            return False
        return True
    if path.suffix.lower() == ".html":
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return False
        if 'class="drugs-data-chunk"' in text or "INITIAL_PL1_DATA" in text:
            return False
        if path.stat().st_size > 500_000 and "dvktDataPanel" not in text and "dvkt_app" not in text:
            return False
        if "Nghi dinh" in path.name or path.name.startswith("_probe"):
            return False
        if path.stat().st_size > 2_000_000:
            return False
        return True
    return False


def shell_html_size(path: Path) -> int:
    if not path.is_file():
        return 0
    raw = path.read_text(encoding="utf-8", errors="replace")
    for marker in ('class="drugs-data-chunk"', "const INITIAL_PL1_DATA", "const INITIAL_PL1_COLUMNS"):
        if marker in raw:
            return 0
    for marker in ("<!-- CORE JAVASCRIPT", "<!-- DVKT_RUNTIME_INJECT", '<script src="/static/js/'):
        idx = raw.find(marker)
        if idx != -1:
            return idx
    return len(raw.encode("utf-8"))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    code_bytes = 0
    data_bytes = 0
    code_files: list[tuple[int, Path]] = []

    for path in BASE.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(BASE)
        if any(p in SKIP_DIR_NAMES for p in rel.parts):
            if path.suffix.lower() in (".gz", ".pdf"):
                data_bytes += path.stat().st_size
            continue
        if path.suffix.lower() == ".html" and path.stat().st_size > 500_000:
            shell = shell_html_size(path)
            if shell:
                code_bytes += shell
                code_files.append((shell, rel))
            data_bytes += path.stat().st_size - shell
            continue
        if is_code_file(path):
            sz = path.stat().st_size
            code_bytes += sz
            code_files.append((sz, rel))
        elif path.suffix.lower() in (".gz", ".pdf", ".xlsx", ".xls", ".bak"):
            data_bytes += path.stat().st_size

    code_mb = code_bytes / 1024 / 1024
    data_mb = data_bytes / 1024 / 1024
    ok = code_mb <= LIMIT_MB

    print("=== Rà soát mã nguồn Phương Châu / DVKT ===")
    print(f"Mã nguồn (ước tính): {code_mb:.2f} MB  {'✓' if ok else '✗ VƯỢT ' + str(LIMIT_MB) + ' MB'}")
    print(f"Dữ liệu tách / PDF / HTML nhúng: {data_mb:.2f} MB")
    print(f"Giới hạn mã nguồn: {LIMIT_MB:.0f} MB")
    print("\nTop mã nguồn:")
    for sz, rel in sorted(code_files, reverse=True)[:15]:
        print(f"  {sz/1024:.1f} KB  {rel}")
    print("\nKhuyến nghị:")
    print("  • Chạy DVKT qua dvkt_app/ (Flask) + dvkt_app/data/*.json.gz — không mở dich vụ kỹ thuật.html đầy đủ.")
    print("  • Dược thư giữ file HTML lớn; liên kết qua _pc_crosslink.js + pc_apps.json.")
    if not ok:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
