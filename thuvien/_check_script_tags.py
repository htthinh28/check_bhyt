# -*- coding: utf-8 -*-
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

html_path = Path(r"G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html")
text = html_path.read_text(encoding="utf-8")

# Find all </script> positions
positions = [m.start() for m in re.finditer(r"</script>", text, re.I)]
print("Total </script> tags:", len(positions))

# For each drugs-data-chunk, check if inner content has premature </script>
for m in re.finditer(r'<script type="application/json" class="drugs-data-chunk"[^>]*>', text):
    chunk_num = re.search(r'data-chunk="(\d+)"', m.group(0))
    num = chunk_num.group(1) if chunk_num else "?"
    start = m.end()
    # naive: find next </script> from start
    end = text.lower().find("</script>", start)
    inner = text[start:end]
    inner_hits = len(re.findall(r"</script>", inner, re.I))
    if "</script>" in inner.lower() or "<script" in inner.lower():
        print(f"chunk {num}: PREMATURE tag in JSON! inner len={len(inner)}")
    # also check for </script> as substring in drug text (case insensitive)
    idx = inner.lower().find("</script>")
    if idx >= 0:
        print(f"  at {idx}: {repr(inner[max(0,idx-40):idx+20])}")

# Simulate HTML tokenizer: walk script tags in order
print("\nScript tag sequence (first 20):")
count = 0
for m in re.finditer(r"<script\b", text, re.I):
    tag_end = text.find(">", m.start())
    tag = text[m.start():tag_end+1]
    typ = re.search(r'type=["\']([^"\']*)["\']', tag, re.I)
    t = typ.group(1) if typ else "text/javascript"
    start = tag_end + 1
    close = text.lower().find("</script>", start)
    if close < 0:
        print("  UNCLOSED script at", m.start(), tag[:80])
        break
    count += 1
    if count <= 20:
        print(f"  {count}. pos={m.start()} type={t} content_len={close-start:,}")
    if t == "text/javascript" or "javascript" in t or not typ:
        snippet = text[start:start+80].replace("\n", " ")
        if "navigateToSection" in text[start:close]:
            print("     -> contains navigateToSection")

# Check if main script tag is properly closed
main_pos = text.find("function navigateToSection")
script_before = text.rfind("<script", 0, main_pos)
print("\nnavigateToSection at byte", main_pos)
print("preceding <script at", script_before)
print("script tag:", text[script_before:script_before+120].replace("\n", " "))
