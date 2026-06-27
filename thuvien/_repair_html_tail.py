# -*- coding: utf-8 -*-
"""Repair truncated HTML by appending missing tail from index thu vien.txt"""
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

base = Path(r"G:/My Drive/Thu vien (1)")
html_path = base / "Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html"
src_path = base / "index thu vien.txt"
bak_path = html_path.with_suffix(html_path.suffix + ".pre-repair.bak")

MARKER = 'data-chunk="13"'

print("Reading files...")
html = html_path.read_text(encoding="utf-8")
src = src_path.read_text(encoding="utf-8")

print("HTML size:", len(html))
print("Has </html>:", "</html>" in html)
print("Has chunk 13:", MARKER in html)

idx13_src = src.find(MARKER)
if idx13_src < 0:
    raise SystemExit("chunk 13 not found in source")

# rewind to start of line containing chunk 13
line_start = src.rfind("\n", 0, idx13_src) + 1
tail = src[line_start:]

print("Tail from source starts with:", repr(tail[:80]))
print("Tail length:", len(tail))
print("Tail has </html>:", "</html>" in tail)

if MARKER in html:
    print("HTML already has chunk 13 — nothing to do")
    sys.exit(0)

# backup
if not bak_path.exists():
    print("Creating backup:", bak_path.name)
    bak_path.write_text(html, encoding="utf-8")

# cut html at chunk 13 boundary: keep through end of chunk 12 line
idx12_html = html.find('data-chunk="12"')
if idx12_html < 0:
    raise SystemExit("chunk 12 not found in html")

# find end of chunk 12 script tag
chunk12_line_end = html.find("\n", idx12_html)
if chunk12_line_end < 0:
    chunk12_line_end = len(html)
else:
    # include newline after chunk 12 line if present
    chunk12_line_end += 1

head = html[:chunk12_line_end]
if not head.rstrip().endswith("</script>"):
    print("WARNING: chunk 12 line may be incomplete in HTML file")
    # try to find closing </script> within truncated tail
    close = html.find("</script>", idx12_html)
    if close >= 0:
        head = html[: close + len("</script>")] + "\n"
        print("Recovered chunk 12 through </script>")

repaired = head + tail

# verify
for i in range(1, 15):
    m = f'data-chunk="{i}"'
    print(f"  chunk {i}:", m in repaired)
print("navigateToSection:", "function navigateToSection" in repaired)
print("</html>:", "</html>" in repaired)

html_path.write_text(repaired, encoding="utf-8")
print("Repaired file written:", html_path)
print("New size:", len(repaired))
