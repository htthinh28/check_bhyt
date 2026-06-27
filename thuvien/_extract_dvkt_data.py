# -*- coding: utf-8 -*-
"""Trích xuất dữ liệu từ dich vụ kỹ thuật.html sang dvkt_app/data/*.json.gz"""
from __future__ import annotations

from pathlib import Path

from _dvkt_data_io import DEFAULT_DATA_DIR, extract_all_from_html, format_sizes, save_all

BASE = Path(__file__).resolve().parent
HTML_PATH = BASE / "dich vụ kỹ thuật.html"


def main() -> None:
    if not HTML_PATH.is_file():
        raise SystemExit(f"Không tìm thấy {HTML_PATH}")
    size_mb = HTML_PATH.stat().st_size / 1024 / 1024
    print(f"Reading HTML ({size_mb:.1f} MB)...")
    datasets = extract_all_from_html(HTML_PATH)
    for tab_id, pack in datasets.items():
        print(f"  {tab_id}: {len(pack['rows'])} rows, {len(pack['columns'])} cols")
    save_all(datasets, DEFAULT_DATA_DIR)
    print("\nWrote compressed data:")
    print(format_sizes(DEFAULT_DATA_DIR))


if __name__ == "__main__":
    main()
