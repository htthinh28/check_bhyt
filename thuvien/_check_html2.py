# -*- coding: utf-8 -*-
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

base = Path(r"G:/My Drive/Thu vien (1)")

def tail_info(p):
    size = p.stat().st_size
    with p.open("rb") as f:
        f.seek(max(0, size - 500))
        tail = f.read().decode("utf-8", errors="replace")
    with p.open("r", encoding="utf-8", errors="replace") as f:
        head = f.read(5000)
    chunks = []
    for i in range(1, 20):
        if f'data-chunk="{i}"' in head or True:
            pass
    # scan chunks by streaming
    chunk_hits = set()
    with p.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if 'data-chunk="' in line:
                import re
                m = re.search(r'data-chunk="(\d+)"', line)
                if m:
                    chunk_hits.add(int(m.group(1)))
    return {
        "size": size,
        "tail": tail,
        "has_html_close": "</html>" in tail or "</html>" in open(p, encoding="utf-8", errors="replace").read()[-2000:],
        "chunks": sorted(chunk_hits),
    }

for name in [
    "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html",
    "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html.bak",
]:
    p = base / name
    if not p.exists():
        print(f"{name}: NOT FOUND")
        continue
    info = tail_info(p)
    print(f"=== {name} ===")
    print("size:", info["size"])
    print("chunks:", info["chunks"])
    print("has </html> near end:", "</html>" in info["tail"])
    print("tail:", info["tail"][-200:])
    print()
