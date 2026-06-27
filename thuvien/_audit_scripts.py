# -*- coding: utf-8 -*-
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

text = Path(r"G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html").read_text(encoding="utf-8")

issues = []
scripts = []
for m in re.finditer(r"<script\b([^>]*)>", text, re.I):
    attrs = m.group(1)
    typ_m = re.search(r'type=["\']([^"\']*)["\']', attrs, re.I)
    typ = typ_m.group(1).strip().lower() if typ_m else "text/javascript"
    src_m = re.search(r'src=["\']([^"\']*)["\']', attrs, re.I)
    src = src_m.group(1) if src_m else None
    start = m.end()
    close = text.lower().find("</script>", start)
    if close < 0:
        issues.append((m.start(), "UNCLOSED", typ, src))
        break
    content_len = close - start
    scripts.append((m.start(), typ, src, content_len, close))
    # For json scripts: validate parse
    if typ == "application/json" and content_len > 2:
        import json
        chunk = text[start:close].strip()
        try:
            json.loads(chunk)
        except Exception as e:
            issues.append((m.start(), f"JSON invalid: {e}", typ, content_len))

print("Total scripts:", len(scripts))
print("Issues:", len(issues))
for it in issues[:20]:
    print(" ", it)

# List scripts after chunk 14 area (> 9M) until main
print("\nScripts from 9MB to 25MB:")
for pos, typ, src, clen, close in scripts:
    if 9_000_000 <= pos <= 25_000_000:
        label = src or typ
        print(f"  pos={pos:,} type={typ} src={src} len={clen:,}")

main_scripts = [(pos, typ, src, clen) for pos, typ, src, clen, _ in scripts if typ in ("", "text/javascript") or "javascript" in typ]
print("\nJS scripts (inline):")
for pos, typ, src, clen in main_scripts:
    print(f"  pos={pos:,} len={clen:,} src={src}")

# Check external src existence
base = Path(r"G:/My Drive/Thu vien (1)")
for pos, typ, src, clen, _ in scripts:
    if src and not src.startswith("http"):
        p = base / src.replace("/", "\\")
        if not p.exists():
            print("MISSING external:", src)
