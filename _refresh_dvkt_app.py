# -*- coding: utf-8 -*-
"""Cập nhật ứng dụng Python sau khi sửa HTML/dữ liệu."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, cwd=BASE)


def main() -> None:
    html = BASE / "dich vụ kỹ thuật.html"
    if html.is_file():
        run([sys.executable, "_extract_dvkt_data.py"])
    run([sys.executable, "_build_dvkt_web.py"])
    print("Done. Run: python dvkt_app/app.py  or  run_dvkt.bat")


if __name__ == "__main__":
    main()
