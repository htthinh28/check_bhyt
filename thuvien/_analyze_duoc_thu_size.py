# -*- coding: utf-8 -*-
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

BASE = Path(__file__).resolve().parent
HTML = BASE / "Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html"


def main() -> None:
    text = HTML.read_text(encoding="utf-8")
    total = len(text.encode("utf-8"))
    print(f"total_mb {total/1024/1024:.2f}")

    for cls in ("drugs-data-chunk", "jci-data-chunk", "icd-data-chunk"):
        pat = rf'<script type="application/json" class="{cls}"[^>]*>'
        matches = list(re.finditer(pat, text))
        if not matches:
            continue
        sizes = []
        for m in matches:
            end = text.find("</script>", m.start())
            sizes.append(end - m.start())
        print(f"{cls}: count={len(matches)} total_kb={sum(sizes)/1024:.1f} max_kb={max(sizes)/1024:.1f}")

    first = text.find('class="drugs-data-chunk"')
    if first > 0:
        print(f"shell_before_drugs_kb {first/1024:.1f}")
    tail_start = text.rfind("</script>", 0, text.find("</body>"))
    after_chunks = len(text[tail_start:].encode("utf-8"))
    print(f"tail_after_last_chunk_kb {after_chunks/1024:.1f}")


if __name__ == "__main__":
    main()
