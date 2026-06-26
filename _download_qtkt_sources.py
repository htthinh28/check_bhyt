# -*- coding: utf-8 -*-
"""Tải thư mục Quy trình kỹ thuật BYT từ Google Drive.

Nguồn: https://drive.google.com/drive/folders/1O7mPVW1EDzHLZk-pY8-4dd18dQtQtJt5
"""
from __future__ import annotations

import sys
from pathlib import Path

import gdown

BASE = Path(__file__).resolve().parent
OUT = BASE / "data" / "qtkt_source"
FOLDER_URL = "https://drive.google.com/drive/folders/1O7mPVW1EDzHLZk-pY8-4dd18dQtQtJt5"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Tải về: {OUT}")
    print(f"URL: {FOLDER_URL}?usp=sharing")
    gdown.download_folder(url=FOLDER_URL, output=str(OUT), quiet=False, remaining_ok=True)
    n = sum(1 for _ in OUT.rglob("*.pdf"))
    print(f"Hoàn tất — {n} file PDF")


if __name__ == "__main__":
    main()
