# -*- coding: utf-8 -*-
from pathlib import Path

base = Path(r"G:/My Drive/Thu vien (1)")
for name in [
    "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html",
    "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html.bak",
    "index thu vien.txt",
]:
    p = base / name
    if not p.exists():
        print(name, "NOT FOUND")
        continue
    text = p.read_text(encoding="utf-8", errors="replace")
    chunks = [i for i in range(1, 20) if f'data-chunk="{i}"' in text]
    print(name)
    print("  size=", len(text), "lines=", text.count("\n") + 1)
    print("  has </html>:", "</html>" in text)
    print("  has navigateToSection def:", "function navigateToSection" in text)
    print("  chunks:", chunks)
    print("  ends:", repr(text[-150:]))
    print()
